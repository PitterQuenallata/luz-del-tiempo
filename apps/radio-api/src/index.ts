import { timingSafeEqual } from 'node:crypto';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { config } from './config.js';
import { radioApiOpenApi } from './openapi.js';
import { estadoApagado, estadoIcecast } from './icecast.js';
import {
  estacionEntradaSchema,
  guardarEstacion,
  enCola,
  guardarEstaciones,
  leerEstaciones,
  quitarEstacion,
  sinSecretos,
  slugSchema,
} from './stations.js';
import { borrarAudio, espacioUsado, EXTENSIONES, guardarAudio, listarAudios, nombreSeguro, rutaAudio } from './tracks.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { guardarPlaylists, leerPistasDePlaylist, pistasFaltantes, playlistsSchema } from './playlists.js';

/**
 * API 2 (radio-api). Solo la API 1 le habla, con un token interno.
 * Maneja la configuración de Liquidsoap, los audios del AutoDJ y lee los oyentes de Icecast.
 */
const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

// Documentación (Swagger UI). Pública porque no tiene datos sensibles; la API solo es alcanzable desde la red interna.
app.get('/openapi.json', (c) => c.json(radioApiOpenApi));
app.get('/docs', (c) =>
  c.html(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>radio-api · Documentación</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui', deepLinking: true });
  </script>
</body>
</html>`),
);

// --- Token interno -------------------------------------------------------
const tokenEsperado = Buffer.from(config.token);
app.use('/v1/*', async (c, next) => {
  const recibido = Buffer.from((c.req.header('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (recibido.length !== tokenEsperado.length || !timingSafeEqual(recibido, tokenEsperado)) {
    return c.json({ error: 'no_autorizado' }, 401);
  }
  await next();
});

// Valida el :slug de todas las rutas de estación
app.use('/v1/stations/:slug/*', async (c, next) => {
  if (!slugSchema.safeParse(c.req.param('slug')).success) return c.json({ error: 'slug_invalido' }, 400);
  await next();
});

// --- Estaciones ----------------------------------------------------------
app.get('/v1/stations', async (c) => {
  const [estaciones, estado] = await Promise.all([leerEstaciones(), estadoIcecast().catch(() => null)]);
  return c.json({
    icecastOnline: estado !== null,
    stations: estaciones.map((e) => ({
      ...sinSecretos(e),
      status: estado?.get(e.mount) ?? estadoApagado(e.mount),
    })),
  });
});

app.get('/v1/stations/:slug', async (c) => {
  const e = (await leerEstaciones()).find((s) => s.slug === c.req.param('slug'));
  if (!e) return c.json({ error: 'no_existe' }, 404);
  const estado = await estadoIcecast().catch(() => null);
  return c.json({
    ...sinSecretos(e),
    status: estado?.get(e.mount) ?? estadoApagado(e.mount),
    storageUsedBytes: await espacioUsado(e.slug),
  });
});

app.put('/v1/stations/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (!slugSchema.safeParse(slug).success) return c.json({ error: 'slug_invalido' }, 400);
  const datos = estacionEntradaSchema.safeParse(await c.req.json().catch(() => null));
  if (!datos.success) return c.json({ error: 'datos_invalidos', issues: datos.error.issues }, 400);

  const r = await guardarEstacion(slug, datos.data);
  if ('error' in r) return c.json({ error: r.error, message: `El mount ya lo usa la estación ${r.slug}` }, 409);
  return c.json(sinSecretos(r.estacion), r.creada ? 201 : 200);
});

app.delete('/v1/stations/:slug', async (c) => {
  const ok = await quitarEstacion(c.req.param('slug'));
  return ok ? c.body(null, 204) : c.json({ error: 'no_existe' }, 404);
});

// Solo oyentes, para que la API 1 guarde muestras cada 1–5 minutos
app.get('/v1/listeners', async (c) => {
  const [estaciones, estado] = await Promise.all([leerEstaciones(), estadoIcecast()]);
  return c.json({
    sampledAt: new Date().toISOString(),
    stations: estaciones.map((e) => ({ slug: e.slug, listeners: estado.get(e.mount)?.listeners ?? 0 })),
  });
});

// --- Audios del AutoDJ ---------------------------------------------------
app.get('/v1/stations/:slug/tracks', async (c) => {
  const slug = c.req.param('slug');
  const e = (await leerEstaciones()).find((s) => s.slug === slug);
  if (!e) return c.json({ error: 'no_existe' }, 404);
  const tracks = await listarAudios(slug);
  return c.json({
    tracks,
    storageUsedBytes: tracks.reduce((t, a) => t + a.sizeBytes, 0),
    storageQuotaBytes: e.storage_quota_mb * 1024 * 1024,
  });
});

app.post(
  '/v1/stations/:slug/tracks',
  bodyLimit({ maxSize: config.maxUploadBytes, onError: (c) => c.json({ error: 'archivo_muy_grande' }, 413) }),
  async (c) => {
    const slug = c.req.param('slug');
    const e = (await leerEstaciones()).find((s) => s.slug === slug);
    if (!e) return c.json({ error: 'no_existe' }, 404);

    const cuerpo = await c.req.parseBody();
    const archivo = cuerpo.file;
    if (!(archivo instanceof File)) return c.json({ error: 'falta_archivo', message: 'Envía el audio en el campo "file"' }, 400);

    const nombre = nombreSeguro(archivo.name);
    if (!nombre) return c.json({ error: 'formato_no_permitido', permitidos: EXTENSIONES }, 400);

    const cuota = e.storage_quota_mb * 1024 * 1024;
    if ((await espacioUsado(slug)) + archivo.size > cuota) return c.json({ error: 'cuota_excedida' }, 409);

    const guardado = await guardarAudio(slug, nombre, await archivo.arrayBuffer());
    return c.json({ file: guardado, sizeBytes: archivo.size }, 201);
  },
);

// Lee un audio guardado: la API 1 usa esto para leer sus etiquetas (título, artista, álbum…)
// Ahora suena: lo escribe Liquidsoap al cambiar de pista (ahora/<slug>.txt: título, artista, lista, inicio en unix)
app.get('/v1/stations/:slug/ahora', async (c) => {
  const slug = c.req.param('slug');
  const e = (await leerEstaciones()).find((s) => s.slug === slug);
  if (!e) return c.json({ error: 'no_existe' }, 404);
  try {
    const [titulo = '', artista = '', lista = '', inicio = ''] = (await readFile(path.join(config.configDir, 'ahora', `${slug}.txt`), 'utf8')).split('\n');
    if (!titulo && !artista) return c.json({ ahora: null });
    const segundos = Number(inicio);
    return c.json({ ahora: { titulo, artista, lista, inicio: Number.isFinite(segundos) && segundos > 0 ? segundos : null } });
  } catch {
    return c.json({ ahora: null });
  }
});

// Saltar canción: se escribe un pedido nuevo; Liquidsoap salta una vez por cada pedido.
app.post('/v1/stations/:slug/saltar', async (c) => {
  const slug = c.req.param('slug');
  const e = (await leerEstaciones()).find((s) => s.slug === slug);
  if (!e) return c.json({ error: 'no_existe' }, 404);
  const carpeta = path.join(config.configDir, 'saltar');
  await mkdir(carpeta, { recursive: true });
  await writeFile(path.join(carpeta, `${slug}.txt`), `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return c.json({ ok: true });
});

app.get('/v1/stations/:slug/tracks/:file', async (c) => {
  const ruta = rutaAudio(c.req.param('slug'), c.req.param('file'));
  if (!ruta) return c.json({ error: 'no_existe' }, 404);
  try {
    const datos = await readFile(ruta);
    return c.body(datos, 200, { 'Content-Type': 'application/octet-stream', 'Content-Length': String(datos.byteLength) });
  } catch {
    return c.json({ error: 'no_existe' }, 404);
  }
});

app.delete('/v1/stations/:slug/tracks/:file', async (c) => {
  const ok = await borrarAudio(c.req.param('slug'), c.req.param('file'));
  return ok ? c.body(null, 204) : c.json({ error: 'no_existe' }, 404);
});

// --- Playlists del AutoDJ --------------------------------------------------
// Reemplazo completo: la API 1 manda todas las playlists de la estación.
app.get('/v1/stations/:slug/playlists', async (c) => {
  const slug = c.req.param('slug');
  const e = (await leerEstaciones()).find((s) => s.slug === slug);
  if (!e) return c.json({ error: 'no_existe' }, 404);
  const playlists = await Promise.all(
    (e.playlists ?? []).map(async (p) => ({ ...p, tracks: (await leerPistasDePlaylist(slug, p.id)) ?? [] })),
  );
  return c.json({ playlists });
});

app.put('/v1/stations/:slug/playlists', async (c) => {
  const slug = c.req.param('slug');
  const e = (await leerEstaciones()).find((s) => s.slug === slug);
  if (!e) return c.json({ error: 'no_existe' }, 404);
  const datos = playlistsSchema.safeParse(await c.req.json().catch(() => null));
  if (!datos.success) return c.json({ error: 'datos_invalidos', issues: datos.error.issues }, 400);

  const ids = datos.data.playlists.map((p) => p.id);
  if (new Set(ids).size !== ids.length) return c.json({ error: 'id_repetido' }, 400);

  const faltantes = await pistasFaltantes(slug, datos.data.playlists);
  if (faltantes.length) return c.json({ error: 'pistas_no_existen', faltantes }, 422);

  const r = await guardarPlaylists(slug, datos.data.playlists);
  if ('error' in r) return c.json({ error: r.error }, 404);
  return c.json({ playlists: r.playlists, liquidsoapReiniciado: r.cambioConfig }, 200);
});

app.onError((err, c) => {
  console.error(`[radio-api] ${c.req.method} ${c.req.path}`, err);
  return c.json({ error: 'error_interno' }, 500);
});

// Al arrancar: stations.json siempre con la lista de playlists (Liquidsoap la necesita)
const estacionesIniciales = await leerEstaciones();
if (estacionesIniciales.length) await enCola(() => guardarEstaciones(estacionesIniciales));

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`radio-api en http://localhost:${info.port}`);
});

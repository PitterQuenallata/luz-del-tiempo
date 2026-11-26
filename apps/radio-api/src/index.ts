import { timingSafeEqual } from 'node:crypto';
import { serve } from '@hono/node-server';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { config } from './config.js';
import { radioApiOpenApi } from './openapi.js';
import { estadoApagado, estadoIcecastDe } from './icecast.js';
import {
  estacionEntradaSchema,
  guardarEstacion,
  enCola,
  guardarEstaciones,
  leerEstaciones,
  leerProceso,
  reservarEstacion,
  quitarEstacion,
  sinSecretos,
  slugSchema,
} from './stations.js';
import { borrarAudio, espacioUsado, EXTENSIONES, guardarAudio, listarAudios, nombreSeguro, rutaAudio } from './tracks.js';
import { mkdir, readFile, statfs, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ControlError, comandoEmisora } from './control.js';
import { guardarPlaylists, leerListas, leerPistasDePlaylist, migrarListas, pistasFaltantes, playlistsSchema } from './playlists.js';

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
  const estaciones = await leerEstaciones();
  const { mapa: estado, respondio } = await estadoIcecastDe(estaciones);
  return c.json({
    icecastOnline: respondio || estaciones.length === 0,
    stations: estaciones.map((e) => ({
      ...sinSecretos(e),
      status: estado.get(e.mount) ?? estadoApagado(e.mount),
    })),
  });
});

app.get('/v1/stations/:slug', async (c) => {
  const e = (await leerEstaciones()).find((s) => s.slug === c.req.param('slug'));
  if (!e) return c.json({ error: 'no_existe' }, 404);
  const { mapa: estado } = await estadoIcecastDe([e]);
  return c.json({
    ...sinSecretos(e),
    status: estado.get(e.mount) ?? estadoApagado(e.mount),
    storageUsedBytes: await espacioUsado(e.slug),
    proceso: await leerProceso(e.slug),
  });
});

app.put('/v1/stations/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (!slugSchema.safeParse(slug).success) return c.json({ error: 'slug_invalido' }, 400);
  const datos = estacionEntradaSchema.safeParse(await c.req.json().catch(() => null));
  if (!datos.success) return c.json({ error: 'datos_invalidos', issues: datos.error.issues }, 400);

  const r = await guardarEstacion(slug, datos.data);
  if ('error' in r) {
    if (r.error === 'sin_puerto_libre') {
      return c.json({ error: r.error, message: 'No quedan puertos de locutores libres en el rango de la radio' }, 409);
    }
    return c.json({ error: r.error, message: `El mount ya lo usa la estación ${r.slug}` }, 409);
  }
  return c.json(sinSecretos(r.estacion), r.creada ? 201 : 200);
});

app.delete('/v1/stations/:slug', async (c) => {
  const ok = await quitarEstacion(c.req.param('slug'));
  return ok ? c.body(null, 204) : c.json({ error: 'no_existe' }, 404);
});

// Solo oyentes, para que la API 1 guarde muestras cada 1–5 minutos
app.get('/v1/listeners', async (c) => {
  const estaciones = await leerEstaciones();
  const { mapa: estado } = await estadoIcecastDe(estaciones);
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
// Siguiente lista de la rotación: Liquidsoap pone cada lista completa en su turno, de arriba abajo.
// Solo cuentan las listas con audios y que no sean programadas (esas suenan en su hora, fuera de la rotación).
async function siguienteDeRotacion(e: { slug: string; playlists?: { id: string }[] }, listaActual: string): Promise<string | null> {
  const programadas = new Set<string>();
  try {
    for (const linea of (await readFile(path.join(config.configDir, 'programas.txt'), 'utf8')).split('\n')) {
      const [clave, modo] = linea.split(';');
      if (clave?.startsWith(`${e.slug}/`) && modo === 'programada') programadas.add(clave.slice(e.slug.length + 1));
    }
  } catch { /* sin programas.txt: todas en rotación */ }
  // Nombre y número de audios van en listas.txt (en vivo); el orden de la rotación es el de stations.json
  const listas = await leerListas();
  const rotacion = (e.playlists ?? [])
    .map((p) => ({ ...listas.get(`${e.slug}/${p.id}`), id: p.id }))
    .filter((p) => (p.pistas ?? 0) > 0 && !programadas.has(p.id));
  const nombres = rotacion.map((p) => p.nombre ?? '');
  const i = nombres.indexOf(listaActual);
  if (i < 0 || nombres.length < 2) return null;
  return nombres[(i + 1) % nombres.length] ?? null;
}

// Ahora suena: lo escribe Liquidsoap al cambiar de pista (ahora/<slug>.txt: título, artista, lista, inicio en unix)
// HLS público (lo leen la web y la app): listas maestras y variantes. Sin token; solo nombres válidos.
const TIPOS_HLS: Record<string, string> = { '.m3u8': 'application/vnd.apple.mpegurl', '.ts': 'video/mp2t' };
app.get('/hls/:slug/:archivo', async (c) => {
  const slug = c.req.param('slug');
  const archivo = c.req.param('archivo');
  const ext = path.extname(archivo);
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(slug) || !/^[A-Za-z0-9_.-]+$/.test(archivo) || !TIPOS_HLS[ext]) return c.json({ error: 'no_existe' }, 404);
  try {
    const datos = await readFile(path.join(config.hlsDir, slug, archivo));
    return c.body(datos, 200, {
      'Content-Type': TIPOS_HLS[ext],
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': ext === '.m3u8' ? 'no-cache' : 'max-age=60',
    });
  } catch {
    return c.json({ error: 'no_existe' }, 404);
  }
});

// Disco donde están los audios: total y libre (para calcular el espacio que se puede dar a cada emisora)
app.get('/v1/disco', async (c) => {
  const s = await statfs(config.musicDir);
  return c.json({ totalBytes: Number(s.blocks) * Number(s.bsize), libreBytes: Number(s.bavail) * Number(s.bsize) });
});

app.get('/v1/stations/:slug/ahora', async (c) => {
  const slug = c.req.param('slug');
  const e = (await leerEstaciones()).find((s) => s.slug === slug);
  if (!e) return c.json({ error: 'no_existe' }, 404);
  try {
    const [titulo = '', artista = '', lista = '', inicio = '', archivo = ''] = (await readFile(path.join(config.configDir, 'ahora', `${slug}.txt`), 'utf8')).split('\n');
    // Sin título ni artista (audios sin etiquetas) todavía se sabe qué lista suena
    if (!titulo && !artista && !lista) return c.json({ ahora: null });
    const segundos = Number(inicio);
    const siguienteLista = await siguienteDeRotacion(e, lista);
    return c.json({ ahora: { titulo, artista, lista, inicio: Number.isFinite(segundos) && segundos > 0 ? segundos : null, archivo: archivo.split('/').pop() ?? '', siguienteLista } });
  } catch {
    return c.json({ ahora: null });
  }
});

// Saltar canción y siguiente lista: comandos en caliente al proceso de la emisora (sin archivos ni sondeo).
async function comandoDeEmisora(c: Context, comando: string) {
  const slug = c.req.param('slug');
  const e = (await leerEstaciones()).find((s) => s.slug === slug);
  if (!e) return c.json({ error: 'no_existe' }, 404);
  try {
    await comandoEmisora(e.slug, e.control_port ?? 0, comando);
    return c.json({ ok: true });
  } catch (err) {
    // Sin proceso (emisora apagada o Liquidsoap caído): la radio no puede obedecer ahora
    if (err instanceof ControlError) return c.json({ error: 'radio_no_responde', motivo: err.motivo }, 503);
    throw err;
  }
}
app.post('/v1/stations/:slug/saltar', (c) => comandoDeEmisora(c, 'saltar'));
app.post('/v1/stations/:slug/saltar-lista', (c) => comandoDeEmisora(c, 'siguiente_lista'));

// Reserva de puertos al crear la estación (la deja apagada; sin transmisión no arranca nada)
app.post('/v1/stations/:slug/reservar', async (c) => {
  const slug = c.req.param('slug');
  const cuerpo = (await c.req.json().catch(() => ({}))) as { name?: string; mount?: string };
  const r = await reservarEstacion(slug, cuerpo.name?.trim() || slug, cuerpo.mount || `/${slug}`);
  if ('error' in r) return c.json({ error: r.error, message: 'No quedan bloques de puertos libres en el rango de la radio' }, 409);
  const e = r.estacion;
  return c.json({ icecast_port: e.icecast_port, control_port: e.control_port, harbor_port: e.harbor_port, creada: r.creada }, r.creada ? 201 : 200);
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
  const listas = await leerListas();
  const playlists = await Promise.all(
    (e.playlists ?? []).map(async (p) => ({
      ...p,
      name: listas.get(`${slug}/${p.id}`)?.nombre ?? '',
      pistas: listas.get(`${slug}/${p.id}`)?.pistas ?? 0,
      tracks: (await leerPistasDePlaylist(slug, p.id)) ?? [],
    })),
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
// Primero, nombres y pistas antiguos pasan a listas.txt; luego stations.json queda solo con lo estructural
if (estacionesIniciales.length)
  await enCola(async () => {
    await migrarListas(estacionesIniciales);
    await guardarEstaciones(estacionesIniciales);
  });

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`radio-api en http://localhost:${info.port}`);
});

// Registros de la radio (supervisord): últimas líneas de un proceso. proceso = slug de la emisora, o "sistema".
app.get('/v1/registros/:proceso', async (c) => {
  const proceso = c.req.param('proceso');
  const lineas = Math.min(Math.max(Number(c.req.query('lineas') ?? 200), 1), 1000);
  const nombres = proceso === 'sistema' ? ['supervisord', 'sincronizador'] : slugSchema.safeParse(proceso).success ? [`${proceso}-liquidsoap`, `${proceso}-icecast`] : null;
  if (!nombres) return c.json({ error: 'slug_invalido' }, 400);
  const salida: { archivo: string; lineas: string[] }[] = [];
  for (const nombre of nombres) {
    try {
      const texto = await readFile(path.join(config.logsDir, `${nombre}.log`), 'utf8');
      salida.push({ archivo: nombre, lineas: texto.split('\n').filter((l) => l.trim()).slice(-lineas) });
    } catch {
      salida.push({ archivo: nombre, lineas: [] });
    }
  }
  return c.json({ registros: salida });
});

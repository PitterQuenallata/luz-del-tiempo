import { timingSafeEqual } from 'node:crypto';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { config } from './config.js';
import { estadoApagado, estadoIcecast } from './icecast.js';
import {
  estacionEntradaSchema,
  guardarEstacion,
  leerEstaciones,
  quitarEstacion,
  sinSecretos,
  slugSchema,
} from './stations.js';
import { borrarAudio, espacioUsado, EXTENSIONES, guardarAudio, listarAudios, nombreSeguro } from './tracks.js';

/**
 * API 2 (radio-api). Solo la API 1 le habla, con un token interno.
 * Maneja la configuración de Liquidsoap, los audios del AutoDJ y lee los oyentes de Icecast.
 */
const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

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

app.delete('/v1/stations/:slug/tracks/:file', async (c) => {
  const ok = await borrarAudio(c.req.param('slug'), c.req.param('file'));
  return ok ? c.body(null, 204) : c.json({ error: 'no_existe' }, 404);
});

app.onError((err, c) => {
  console.error(`[radio-api] ${c.req.method} ${c.req.path}`, err);
  return c.json({ error: 'error_interno' }, 500);
});

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`radio-api en http://localhost:${info.port}`);
});

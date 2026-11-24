import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { asc, eq, inArray } from 'drizzle-orm';
import { emisionSchema, pistaEditarSchema, playlistSchema, type PlaylistInput } from '@luz/shared';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { errorValidacion } from '../../lib/validar.js';
import { cifrar } from '../../lib/cifrado.js';
import { db } from '../../db/index.js';
import { playlistSchedules, playlistTracks, stationPlaylists, stationTracks, stations } from '../../db/schema.js';
import {
  borrarAudioRadio,
  RadioApiError,
  radioApi,
  sincronizarPlaylists,
  sincronizarTodo,
  sincronizarTransmision,
  subirAudio,
  type EstadoSync,
} from './radio-sync.js';

// Transmisión, AutoDJ (pistas y playlists) de cada emisora.
// Fuente de verdad: esta API. Cada cambio se empuja a la radio-api (API 2).
export const radioMusicaRoutes = new Hono();
const PERMISO = 'estaciones:todas';
const MAX_AUDIO = 300 * 1024 * 1024;

async function emisora(id: string) {
  const [e] = await db.select().from(stations).where(eq(stations.id, id));
  return e ?? null;
}

/** Lo que el panel puede ver de la transmisión: nunca la contraseña. */
function vistaTransmision(e: typeof stations.$inferSelect) {
  return {
    mountPoint: e.mountPoint,
    livePasswordConfigurada: Boolean(e.livePasswordEnc),
    bitrateKbps: e.bitrateKbps,
    autodjEnabled: e.autodjEnabled,
    maxListeners: e.maxListeners,
    storageQuotaMb: e.storageQuotaMb,
    streamUrl: e.mountPoint ? `${process.env.PUBLIC_STREAM_BASE ?? 'http://localhost:8000'}${e.mountPoint}` : null,
    // Datos para el locutor (BUTT, OBS o la app de transmisión)
    locutor: {
      servidor: process.env.RADIO_HARBOR_HOST ?? 'localhost',
      puerto: Number(process.env.RADIO_HARBOR_PORT ?? 8005),
      mount: e.mountPoint,
    },
  };
}

// Estado del servicio de radio (para la sección de configuración)
radioMusicaRoutes.get('/servicio', requirePermission(PERMISO), async (c) => {
  try {
    const r = await radioApi<{ icecastOnline: boolean; stations: unknown[] }>('/v1/stations');
    return c.json({ radioApi: 'ok', icecastOnline: r.icecastOnline, emisorasEnRadio: r.stations.length });
  } catch (err) {
    return c.json({ radioApi: 'sin_conexion', icecastOnline: false, emisorasEnRadio: 0, detalle: err instanceof Error ? err.message : null });
  }
});

// ---------- Transmisión ----------

radioMusicaRoutes.get('/emisoras/:id/transmision', requirePermission(PERMISO), async (c) => {
  const e = await emisora(c.req.param('id') as string);
  if (!e) return c.json({ error: 'no_encontrado' }, 404);
  let estado: unknown = null;
  if (e.mountPoint) {
    try {
      estado = await radioApi(`/v1/stations/${e.slug}`);
    } catch (err) {
      estado = { error: err instanceof RadioApiError ? err.status : 'sin_conexion' };
    }
  }
  return c.json({ transmision: vistaTransmision(e), radio: estado });
});

radioMusicaRoutes.put('/emisoras/:id/transmision', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = emisionSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const actual = await emisora(id);
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  if (!actual.livePasswordEnc && !parsed.data.livePassword) {
    return c.json({ error: 'validacion', campo: 'livePassword', message: 'Falta la contraseña del locutor.' }, 422);
  }

  const otra = await db.select({ id: stations.id }).from(stations).where(eq(stations.mountPoint, parsed.data.mountPoint));
  if (otra.some((o) => o.id !== id)) {
    return c.json({ error: 'validacion', campo: 'mountPoint', message: 'Ese mount ya lo usa otra emisora.' }, 422);
  }

  const cambios = {
    mountPoint: parsed.data.mountPoint,
    bitrateKbps: parsed.data.bitrateKbps,
    autodjEnabled: parsed.data.autodjEnabled,
    maxListeners: parsed.data.maxListeners,
    storageQuotaMb: parsed.data.storageQuotaMb,
    ...(parsed.data.livePassword ? { livePasswordEnc: cifrar(parsed.data.livePassword) } : {}),
    updatedAt: new Date(),
  };
  const [fila] = await db.update(stations).set(cambios).where(eq(stations.id, id)).returning();
  await registrarAuditoria({
    userId: caller?.id ?? null,
    accion: 'transmision.editar',
    entidad: 'emisora',
    entidadId: id,
    detalle: `${fila.name}: mount ${fila.mountPoint}${parsed.data.livePassword ? ' (contraseña cambiada)' : ''}`,
  });

  const sync = await sincronizarTransmision(fila);
  return c.json({ transmision: vistaTransmision(fila), sincronizado: sync });
});

radioMusicaRoutes.post('/emisoras/:id/sincronizar', requirePermission(PERMISO), async (c) => {
  const e = await emisora(c.req.param('id') as string);
  if (!e) return c.json({ error: 'no_encontrado' }, 404);
  return c.json(await sincronizarTodo(e));
});

// ---------- Pistas (audios del AutoDJ) ----------

radioMusicaRoutes.get('/emisoras/:id/pistas', requirePermission(PERMISO), async (c) => {
  const id = c.req.param('id') as string;
  const pistas = await db
    .select()
    .from(stationTracks)
    .where(eq(stationTracks.stationId, id))
    .orderBy(asc(stationTracks.title));
  const usado = pistas.reduce((t, p) => t + p.sizeBytes, 0);
  const e = await emisora(id);
  return c.json({ pistas, espacioUsadoBytes: usado, espacioCuotaBytes: (e?.storageQuotaMb ?? 0) * 1024 * 1024 });
});

radioMusicaRoutes.post(
  '/emisoras/:id/pistas',
  bodyLimit({ maxSize: MAX_AUDIO, onError: (c) => c.json({ error: 'archivo_muy_grande' }, 413) }),
  requirePermission(PERMISO),
  async (c) => {
    const caller = await loadCurrentUser(c.req.raw.headers);
    const id = c.req.param('id') as string;
    const e = await emisora(id);
    if (!e) return c.json({ error: 'no_encontrado' }, 404);
    if (!e.mountPoint) return c.json({ error: 'sin_transmision', message: 'Primero configura la transmisión de la emisora.' }, 409);

    // La radio-api necesita la estación al día para aceptar audios
    const sync = await sincronizarTransmision(e);
    if (sync.estado !== 'ok') return c.json({ error: 'radio_no_lista', sincronizado: sync }, 409);

    const cuerpo = await c.req.parseBody();
    const archivo = cuerpo.file;
    if (!(archivo instanceof File)) return c.json({ error: 'falta_archivo', message: 'Envía el audio en el campo "file".' }, 400);

    let guardado: { file: string; sizeBytes: number };
    try {
      guardado = await subirAudio(e.slug, archivo);
    } catch (err) {
      if (err instanceof RadioApiError && err.status === 409) return c.json({ error: 'cuota_excedida', message: 'La emisora ya usó todo su espacio.' }, 409);
      if (err instanceof RadioApiError && err.status === 400) return c.json({ error: 'formato_no_permitido', detalle: err.body }, 400);
      throw err;
    }

    const titulo = guardado.file.replace(/\.[^.]+$/, '');
    const [fila] = await db
      .insert(stationTracks)
      .values({ stationId: id, storageKey: guardado.file, title: titulo, sizeBytes: guardado.sizeBytes })
      .returning();
    await registrarAuditoria({ userId: caller?.id ?? null, accion: 'pista.subir', entidad: 'pista', entidadId: fila.id, detalle: `${e.name}: ${guardado.file}` });
    return c.json({ pista: fila }, 201);
  },
);

// Trae a la base los audios que ya están en la radio (p. ej. subidos antes de existir esta API)
radioMusicaRoutes.post('/emisoras/:id/pistas/importar', requirePermission(PERMISO), async (c) => {
  const id = c.req.param('id') as string;
  const e = await emisora(id);
  if (!e) return c.json({ error: 'no_encontrado' }, 404);
  if (!e.mountPoint) return c.json({ error: 'sin_transmision', message: 'Primero configura la transmisión de la emisora.' }, 409);
  const radio = await radioApi<{ tracks: { file: string; sizeBytes: number }[] }>(`/v1/stations/${e.slug}/tracks`);
  const conocidas = new Set(
    (await db.select({ k: stationTracks.storageKey }).from(stationTracks).where(eq(stationTracks.stationId, id))).map((r) => r.k),
  );
  const nuevas = radio.tracks
    .filter((t) => !conocidas.has(t.file))
    .map((t) => ({ stationId: id, storageKey: t.file, title: t.file.replace(/\.[^.]+$/, ''), sizeBytes: t.sizeBytes }));
  if (nuevas.length) await db.insert(stationTracks).values(nuevas);
  return c.json({ importadas: nuevas.length, total: radio.tracks.length });
});

radioMusicaRoutes.patch('/pistas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = pistaEditarSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [fila] = await db
    .update(stationTracks)
    .set({ title: parsed.data.title, artist: parsed.data.artist })
    .where(eq(stationTracks.id, id))
    .returning();
  if (!fila) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'pista.editar', entidad: 'pista', entidadId: id, detalle: fila.title });
  return c.json({ pista: fila });
});

radioMusicaRoutes.delete('/pistas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [pista] = await db.select().from(stationTracks).where(eq(stationTracks.id, id));
  if (!pista) return c.json({ error: 'no_encontrado' }, 404);
  const e = await emisora(pista.stationId);
  if (!e) return c.json({ error: 'no_encontrado' }, 404);

  // Primero quitar de la radio, luego de la base; las playlists se actualizan después.
  if (e.mountPoint) {
    try {
      await borrarAudioRadio(e.slug, pista.storageKey);
    } catch (err) {
      return c.json({ error: 'radio_no_disponible', message: 'No se pudo borrar el audio en la radio.' }, 502);
    }
  }
  await db.delete(stationTracks).where(eq(stationTracks.id, id));
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'pista.eliminar', entidad: 'pista', entidadId: id, detalle: `${e.name}: ${pista.storageKey}` });
  const playlists: EstadoSync = await sincronizarPlaylists(e);
  return c.json({ ok: true, playlists });
});

// ---------- Playlists ----------

async function cargarPlaylists(stationId: string) {
  const ps = await db.select().from(stationPlaylists).where(eq(stationPlaylists.stationId, stationId)).orderBy(asc(stationPlaylists.createdAt));
  const ids = ps.map((p) => p.id);
  const pistas = ids.length
    ? await db.select().from(playlistTracks).where(inArray(playlistTracks.playlistId, ids)).orderBy(asc(playlistTracks.position))
    : [];
  const horarios = ids.length ? await db.select().from(playlistSchedules).where(inArray(playlistSchedules.playlistId, ids)) : [];
  return ps.map((p) => ({
    ...p,
    trackIds: pistas.filter((t) => t.playlistId === p.id).map((t) => t.trackId),
    schedules: horarios
      .filter((h) => h.playlistId === p.id)
      .map((h) => ({ dayOfWeek: h.dayOfWeek, startTime: h.startTime.slice(0, 5), endTime: h.endTime.slice(0, 5) })),
  }));
}

radioMusicaRoutes.get('/emisoras/:id/playlists', requirePermission(PERMISO), async (c) => {
  return c.json({ playlists: await cargarPlaylists(c.req.param('id') as string) });
});

/** Valida que todas las pistas pertenezcan a la misma emisora. */
async function pistasDeLaEmisora(stationId: string, trackIds: string[]) {
  if (!trackIds.length) return true;
  const filas = await db
    .select({ id: stationTracks.id })
    .from(stationTracks)
    .where(eq(stationTracks.stationId, stationId));
  const propias = new Set(filas.map((f) => f.id));
  return trackIds.every((t) => propias.has(t));
}

async function guardarPlaylist(playlistId: string, datos: PlaylistInput) {
  await db
    .update(stationPlaylists)
    .set({
      name: datos.name,
      description: datos.description ?? null,
      mode: datos.mode,
      weight: datos.weight,
      shuffle: datos.mode !== 'secuencial', // rotación y programadas: aleatorio; secuencial: en orden
      isActive: datos.isActive,
      updatedAt: new Date(),
    })
    .where(eq(stationPlaylists.id, playlistId));
  await db.delete(playlistTracks).where(eq(playlistTracks.playlistId, playlistId));
  await db.delete(playlistSchedules).where(eq(playlistSchedules.playlistId, playlistId));
  if (datos.trackIds.length) {
    await db.insert(playlistTracks).values(datos.trackIds.map((trackId, position) => ({ playlistId, trackId, position })));
  }
  if (datos.schedules.length) {
    await db.insert(playlistSchedules).values(
      datos.schedules.map((h) => ({
        playlistId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
      })),
    );
  }
}

radioMusicaRoutes.post('/emisoras/:id/playlists', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const stationId = c.req.param('id') as string;
  const e = await emisora(stationId);
  if (!e) return c.json({ error: 'no_encontrado' }, 404);
  const parsed = playlistSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  if (!(await pistasDeLaEmisora(stationId, parsed.data.trackIds))) {
    return c.json({ error: 'validacion', campo: 'trackIds', message: 'Alguna pista no pertenece a esta emisora.' }, 422);
  }
  const [nueva] = await db
    .insert(stationPlaylists)
    .values({ stationId, name: parsed.data.name, mode: parsed.data.mode, weight: parsed.data.weight, shuffle: parsed.data.mode !== 'secuencial', isActive: parsed.data.isActive, description: parsed.data.description ?? null })
    .returning();
  await guardarPlaylist(nueva.id, parsed.data);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'playlist.crear', entidad: 'playlist', entidadId: nueva.id, detalle: `${e.name}: ${nueva.name}` });
  const sync = await sincronizarPlaylists(e);
  return c.json({ playlist: (await cargarPlaylists(stationId)).find((p) => p.id === nueva.id), sincronizado: sync }, 201);
});

radioMusicaRoutes.put('/playlists/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [actual] = await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  const e = await emisora(actual.stationId);
  if (!e) return c.json({ error: 'no_encontrado' }, 404);
  const parsed = playlistSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  if (!(await pistasDeLaEmisora(actual.stationId, parsed.data.trackIds))) {
    return c.json({ error: 'validacion', campo: 'trackIds', message: 'Alguna pista no pertenece a esta emisora.' }, 422);
  }
  await guardarPlaylist(id, parsed.data);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'playlist.editar', entidad: 'playlist', entidadId: id, detalle: `${e.name}: ${parsed.data.name}` });
  const sync = await sincronizarPlaylists(e);
  return c.json({ playlist: (await cargarPlaylists(actual.stationId)).find((p) => p.id === id), sincronizado: sync });
});

radioMusicaRoutes.delete('/playlists/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [actual] = await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  const e = await emisora(actual.stationId);
  await db.delete(stationPlaylists).where(eq(stationPlaylists.id, id));
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'playlist.eliminar', entidad: 'playlist', entidadId: id, detalle: actual.name });
  const sync = e ? await sincronizarPlaylists(e) : ({ estado: 'sin_transmision' } as EstadoSync);
  return c.json({ ok: true, sincronizado: sync });
});


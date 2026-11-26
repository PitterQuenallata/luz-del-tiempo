import { urlEscucha } from '../../lib/escucha.js';
import { Context, Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { and, asc, eq, inArray, or } from 'drizzle-orm';
import { ambitoSchema, emisionSchema, interruptorSchema, pistaEditarSchema, pistasCarpetaSchema, playlistSchema, usoPlaylistSchema, type PlaylistInput } from '@luz/shared';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { errorValidacion } from '../../lib/validar.js';
import { cifrar } from '../../lib/cifrado.js';
import { db } from '../../db/index.js';
import { playlistSchedules, playlistTracks, radios, stationPlaylistLinks, stationPlaylists, stationTracks, stations } from '../../db/schema.js';
import { archivoRadio, filtroArchivoEmisora, filtroArchivoEstacion } from './archivo.js';
import { leerEtiquetas, releerEtiquetas } from './etiquetas.js';
import { esAdmin, estacionParaRuta, puedeGestionarEmisora, requireEstacionesAcceso } from './acceso.js';
import {
  asegurarArchivo,
  borrarAudioRadio,
  emisoraDe,
  enAirePorSlugRadio,
  estacionesDePlaylists,
  nombreSalida,
  radioApi,
  radioApiRaw,
  radioEncendida,
  RadioApiError,
  sincronizarEstacionesDePlaylists,
  sincronizarPlaylists,
  sincronizarTransmision,
  subirAudio,
  type EstadoSync,
} from './radio-sync.js';

// Transmisión, archivos (pistas) y playlists de cada ESTACIÓN.
// Cada estación tiene su archivo; la emisora tiene un archivo y listas compartidas que sus estaciones pueden usar.
// Quien gestiona la emisora (admin, o el responsable de un tercero) puede tocar sus estaciones.
export const radioMusicaRoutes = new Hono();
const PERMISO = 'estaciones:todas';
const ACCESO = requireEstacionesAcceso();
const MAX_AUDIO = 300 * 1024 * 1024;
type Estacion = typeof stations.$inferSelect;
type Pista = typeof stationTracks.$inferSelect;

async function estacionPorId(id: string) {
  const [e] = await db.select().from(stations).where(eq(stations.id, id));
  return e ?? null;
}

/** Lo que el panel puede ver de la transmisión: nunca la contraseña. */
function vistaTransmision(e: Estacion) {
  return {
    mountPoint: e.mountPoint,
    livePasswordConfigurada: Boolean(e.livePasswordEnc),
    encendida: e.encendida,
    bitrateKbps: e.bitrateKbps,
    calidadBajaKbps: e.calidadBajaKbps,
    autodjEnabled: e.autodjEnabled,
    // Límite real: el del servidor (Icecast), compartido por todas las estaciones
    limiteServidorOyentes: Number(process.env.ICECAST_MAX_CLIENTS ?? 500),
    streamName: e.streamName ?? '',
    streamNameEfectivo: nombreSalida(e),
    streamUrl: urlEscucha(e),
    // HLS adaptable: el reproductor elige la calidad según la señal (la web y la app lo usan)
    hlsUrl: e.mountPoint ? `${process.env.PUBLIC_HLS_BASE ?? 'http://localhost:4100/hls'}/${e.slug}/live.m3u8` : null,
    locutor: {
      servidor: process.env.RADIO_HARBOR_HOST ?? 'localhost',
      // Puerto de locutores de ESTA estación (cada una tiene el suyo; sin sincronizar aún, 8005)
      puerto: e.harborPort ?? 8005,
      mount: e.mountPoint,
    },
  };
}

/** Sincroniza transmisión y playlists de una estación. */
async function sincronizarTodo(e: Estacion) {
  const transmision = await sincronizarTransmision(e);
  if (transmision.estado !== 'ok') return { transmision, playlists: transmision };
  return { transmision, playlists: await sincronizarPlaylists(e) };
}

// Estado del servicio de radio (para la sección de configuración)
radioMusicaRoutes.get('/servicio', ACCESO, async (c) => {
  try {
    const r = await radioApi<{ icecastOnline: boolean; stations: unknown[] }>('/v1/stations');
    return c.json({ radioApi: 'ok', icecastOnline: r.icecastOnline, emisorasEnRadio: r.stations.length, encendida: await radioEncendida(), limiteOyentes: Number(process.env.ICECAST_MAX_CLIENTS ?? 500) });
  } catch (err) {
    return c.json({ radioApi: 'sin_conexion', icecastOnline: false, emisorasEnRadio: 0, encendida: await radioEncendida(), detalle: err instanceof Error ? err.message : null });
  }
});

// ---------- Transmisión ----------

radioMusicaRoutes.get('/estaciones/:id/transmision', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
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

radioMusicaRoutes.put('/estaciones/:id/transmision', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const parsed = emisionSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const actual = acceso.estacion;
  if (!actual.livePasswordEnc && !parsed.data.livePassword) {
    return c.json({ error: 'validacion', campo: 'livePassword', message: 'Falta la contraseña del locutor.' }, 422);
  }
  // El AutoDJ se elige al crear la estación: si ya está encendido, no se puede apagar.
  if (actual.autodjEnabled && parsed.data.autodjEnabled === false) {
    return c.json({ error: 'validacion', campo: 'autodjEnabled', message: 'El AutoDJ se eligió al crear la estación y no se puede apagar.' }, 422);
  }
  const otra = await db.select({ id: stations.id }).from(stations).where(eq(stations.mountPoint, parsed.data.mountPoint));
  if (otra.some((o) => o.id !== actual.id)) {
    return c.json({ error: 'validacion', campo: 'mountPoint', message: 'Ese punto de transmisión ya lo usa otra estación.' }, 422);
  }
  const cambios = {
    mountPoint: parsed.data.mountPoint,
    bitrateKbps: parsed.data.bitrateKbps,
    ...(parsed.data.calidadBaja !== undefined ? { calidadBajaKbps: parsed.data.calidadBaja } : {}),
    autodjEnabled: parsed.data.autodjEnabled,
    ...(parsed.data.maxListeners !== undefined ? { maxListeners: parsed.data.maxListeners } : {}),
    ...(parsed.data.storageQuotaMb !== undefined ? { storageQuotaMb: parsed.data.storageQuotaMb } : {}),
    ...(parsed.data.streamName !== undefined ? { streamName: parsed.data.streamName || null } : {}),
    ...(parsed.data.livePassword ? { livePasswordEnc: cifrar(parsed.data.livePassword) } : {}),
    updatedAt: new Date(),
  };
  const [fila] = await db.update(stations).set(cambios).where(eq(stations.id, actual.id)).returning();
  await registrarAuditoria({
    userId: acceso.user.id,
    accion: 'transmision.editar',
    entidad: 'estacion',
    entidadId: actual.id,
    detalle: `${fila.name}: punto ${fila.mountPoint}${parsed.data.livePassword ? ' (contraseña cambiada)' : ''}`,
  });
  const sincronizado = await sincronizarTransmision(fila);
  return c.json({ transmision: vistaTransmision(fila), sincronizado });
});

// Encender o apagar una estación (no toca las demás)
radioMusicaRoutes.put('/estaciones/:id/encendida', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const parsed = interruptorSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [fila] = await db.update(stations).set({ encendida: parsed.data.encendida, updatedAt: new Date() }).where(eq(stations.id, acceso.estacion.id)).returning();
  await registrarAuditoria({ userId: acceso.user.id, accion: parsed.data.encendida ? 'estacion.encender' : 'estacion.apagar', entidad: 'estacion', entidadId: fila.id, detalle: fila.name });
  const sincronizado = await sincronizarTransmision(fila);
  return c.json({ transmision: vistaTransmision(fila), sincronizado });
});

// Encender o apagar toda la radio: ninguna estación suena mientras esté apagada (solo admin)
radioMusicaRoutes.put('/encendida', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = interruptorSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const { radioAjustes } = await import('../../db/schema.js');
  await db
    .insert(radioAjustes)
    .values({ id: 'global', encendida: parsed.data.encendida, updatedAt: new Date() })
    .onConflictDoUpdate({ target: radioAjustes.id, set: { encendida: parsed.data.encendida, updatedAt: new Date() } });
  await registrarAuditoria({ userId: caller?.id ?? null, accion: parsed.data.encendida ? 'radio.encender' : 'radio.apagar', entidad: 'radio', entidadId: 'global', detalle: parsed.data.encendida ? 'Radio encendida' : 'Radio apagada' });
  const { sincronizarTodasLasEstaciones } = await import('./radio-sync.js');
  const sincronizado = await sincronizarTodasLasEstaciones();
  return c.json({ encendida: parsed.data.encendida, sincronizado });
});

radioMusicaRoutes.post('/estaciones/:id/sincronizar', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  return c.json(await sincronizarTodo(acceso.estacion));
});

// ---------- Archivos (pistas) ----------

/** Carpeta de la radio-api que recibe los audios: la de la estación, o el archivo de la emisora. */
async function destinoDeArchivo(estacion: Estacion, destino: string) {
  if (destino === 'emisora') {
    const emisora = await emisoraDe(estacion);
    return { slug: await asegurarArchivo(emisora), radioId: emisora.id, stationId: null as string | null, emisora };
  }
  return { slug: estacion.slug, radioId: null as string | null, stationId: estacion.id, emisora: null };
}

/** Quién puede tocar un audio: la estación dueña, o la emisora dueña del archivo de la emisora. */
async function accesoAPista(c: Context, pista: Pista) {
  if (pista.stationId) return estacionParaRuta(c, pista.stationId);
  const user = await loadCurrentUser(c.req.raw.headers);
  if (!user) return c.json({ error: 'no_autenticado' }, 401) as unknown as Response;
  if (!pista.radioId || !(await puedeGestionarEmisora(user, pista.radioId))) return c.json({ error: 'sin_permiso' }, 403) as unknown as Response;
  return { user };
}

radioMusicaRoutes.get('/estaciones/:id/pistas', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  const propias = await db.select().from(stationTracks).where(filtroArchivoEstacion(e.id)).orderBy(asc(stationTracks.title));
  const deEmisora = await db.select().from(stationTracks).where(filtroArchivoEmisora(e.radioId)).orderBy(asc(stationTracks.title));
  const [emisora] = await db.select().from(radios).where(eq(radios.id, e.radioId));
  return c.json({
    pistas: propias,
    archivoEmisora: deEmisora,
    espacioUsadoBytes: propias.reduce((t, p) => t + p.sizeBytes, 0),
    espacioCuotaBytes: e.storageQuotaMb * 1024 * 1024,
    espacioEmisoraUsadoBytes: deEmisora.reduce((t, p) => t + p.sizeBytes, 0),
    espacioEmisoraCuotaBytes: (emisora?.storageQuotaMb ?? 10240) * 1024 * 1024,
  });
});

radioMusicaRoutes.post(
  '/estaciones/:id/pistas',
  bodyLimit({ maxSize: MAX_AUDIO, onError: (c) => c.json({ error: 'archivo_muy_grande' }, 413) }),
  ACCESO,
  async (c) => {
    const acceso = await estacionParaRuta(c, c.req.param('id') as string);
    if (acceso instanceof Response) return acceso;
    const e = acceso.estacion;
    // Los audios son de la EMISORA: se suben a su archivo, no al de la estación.
    const destino = 'emisora' as const;
    const cuerpo = await c.req.parseBody();
    const archivo = cuerpo.file;
    if (!(archivo instanceof File)) return c.json({ error: 'falta_archivo', message: 'Envía el audio en el campo "file".' }, 400);
    const dest = await destinoDeArchivo(e, destino);
    let guardado: { file: string; sizeBytes: number };
    try {
      guardado = await subirAudio(dest.slug, archivo);
    } catch (err) {
      if (err instanceof RadioApiError && err.status === 409) return c.json({ error: 'cuota_excedida', message: 'Ya se usó todo el espacio disponible.' }, 409);
      if (err instanceof RadioApiError && err.status === 400) return c.json({ error: 'formato_no_permitido', detalle: err.body }, 400);
      throw err;
    }
    const etiquetas = await leerEtiquetas(new Uint8Array(await archivo.arrayBuffer()), archivo.type);
    const [fila] = await db
      .insert(stationTracks)
      .values({
        stationId: dest.stationId,
        radioId: dest.radioId,
        storageKey: guardado.file,
        title: etiquetas.title ?? guardado.file.replace(/\.[^.]+$/, ''),
        artist: etiquetas.artist,
        album: etiquetas.album,
        year: etiquetas.year,
        genre: etiquetas.genre,
        durationSec: etiquetas.durationSec,
        sizeBytes: guardado.sizeBytes,
      })
      .returning();
    await registrarAuditoria({ userId: acceso.user.id, accion: 'pista.subir', entidad: 'pista', entidadId: fila.id, detalle: `${destino === 'emisora' ? `Archivo de ${dest.emisora?.name}` : e.name}: ${guardado.file}` });
    return c.json({ pista: fila }, 201);
  },
);

// Trae a la base los audios que ya están en la carpeta de la radio (estación o emisora)
radioMusicaRoutes.post('/estaciones/:id/pistas/importar', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  const dest = await destinoDeArchivo(e, 'emisora');
  const radio = await radioApi<{ tracks: { file: string; sizeBytes: number }[] }>(`/v1/stations/${dest.slug}/tracks`);
  const filtro = dest.stationId ? filtroArchivoEstacion(dest.stationId) : filtroArchivoEmisora(dest.radioId!);
  const conocidas = new Set((await db.select({ k: stationTracks.storageKey }).from(stationTracks).where(filtro)).map((r) => r.k));
  const nuevas = radio.tracks
    .filter((t) => !conocidas.has(t.file))
    .map((t) => ({ stationId: dest.stationId, radioId: dest.radioId, storageKey: t.file, title: t.file.replace(/\.[^.]+$/, ''), sizeBytes: t.sizeBytes }));
  if (nuevas.length) {
    const filas = await db.insert(stationTracks).values(nuevas).returning();
    await releerEtiquetas(dest.slug, filas);
  }
  return c.json({ importadas: nuevas.length, total: radio.tracks.length });
});

// Vuelve a leer las etiquetas de los audios (completa solo lo que falta)
radioMusicaRoutes.post('/estaciones/:id/pistas/releer', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  const destino = c.req.query('destino') === 'emisora' ? 'emisora' : 'estacion';
  const dest = await destinoDeArchivo(e, destino);
  const pistas = await db.select().from(stationTracks).where(dest.stationId ? filtroArchivoEstacion(dest.stationId) : filtroArchivoEmisora(dest.radioId!));
  const resultado = await releerEtiquetas(dest.slug, pistas);
  await registrarAuditoria({ userId: acceso.user.id, accion: 'pista.releer', entidad: 'estacion', entidadId: e.id, detalle: `${e.name}: ${resultado.actualizadas} actualizadas` });
  return c.json(resultado);
});

// Mueve audios a una carpeta del panel (solo organización; la radio no se entera)
radioMusicaRoutes.post('/estaciones/:id/pistas/carpeta', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const parsed = pistasCarpetaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const carpeta = parsed.data.folder.replace(/^\/+|\/+$/g, '');
  const e = acceso.estacion;
  const movidas = await db
    .update(stationTracks)
    .set({ folder: carpeta })
    .where(and(or(filtroArchivoEstacion(e.id), filtroArchivoEmisora(e.radioId)), inArray(stationTracks.id, parsed.data.ids)))
    .returning({ id: stationTracks.id });
  await registrarAuditoria({ userId: acceso.user.id, accion: 'pista.carpeta', entidad: 'pista', entidadId: e.id, detalle: `${movidas.length} audios → ${carpeta || 'sin carpeta'}` });
  return c.json({ movidas: movidas.length });
});

radioMusicaRoutes.patch('/pistas/:id', ACCESO, async (c) => {
  const id = c.req.param('id') as string;
  const [pista] = await db.select().from(stationTracks).where(eq(stationTracks.id, id));
  if (!pista) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await accesoAPista(c, pista);
  if (acceso instanceof Response) return acceso;
  const parsed = pistaEditarSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [fila] = await db
    .update(stationTracks)
    .set({
      title: d.title,
      artist: d.artist ?? null,
      album: d.album ?? null,
      year: d.year ?? null,
      genre: d.genre ?? null,
      ...(d.folder !== undefined ? { folder: d.folder.replace(/^\/+|\/+$/g, '') } : {}),
    })
    .where(eq(stationTracks.id, id))
    .returning();
  await registrarAuditoria({ userId: (acceso as { user: { id: string } }).user.id, accion: 'pista.editar', entidad: 'pista', entidadId: id, detalle: fila.title });
  return c.json({ pista: fila });
});

radioMusicaRoutes.delete('/pistas/:id', ACCESO, async (c) => {
  const id = c.req.param('id') as string;
  const [pista] = await db.select().from(stationTracks).where(eq(stationTracks.id, id));
  if (!pista) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await accesoAPista(c, pista);
  if (acceso instanceof Response) return acceso;
  // Carpeta de la radio-api donde está el audio
  let slug: string;
  let dueno: string;
  if (pista.stationId) {
    const e = await estacionPorId(pista.stationId);
    slug = e?.slug ?? '';
    dueno = e?.name ?? '';
  } else {
    const [r] = await db.select().from(radios).where(eq(radios.id, pista.radioId!));
    slug = archivoRadio(r);
    dueno = `Archivo de ${r.name}`;
  }
  // Las estaciones que usan este audio, para actualizar sus playlists después
  const enPlaylists = (await db.select({ p: playlistTracks.playlistId }).from(playlistTracks).where(eq(playlistTracks.trackId, id))).map((r) => r.p);
  const afectadas = await estacionesDePlaylists(enPlaylists);
  try {
    await borrarAudioRadio(slug, pista.storageKey);
  } catch {
    return c.json({ error: 'radio_no_disponible', message: 'No se pudo borrar el audio en la radio.' }, 502);
  }
  await db.delete(stationTracks).where(eq(stationTracks.id, id));
  await registrarAuditoria({ userId: (acceso as { user: { id: string } }).user.id, accion: 'pista.eliminar', entidad: 'pista', entidadId: id, detalle: `${dueno}: ${pista.storageKey}` });
  const playlists: EstadoSync[] = [];
  for (const e of afectadas) if (e.mountPoint) playlists.push(await sincronizarPlaylists(e));
  return c.json({ ok: true, playlists });
});

// ---------- Playlists ----------
// Una playlist es de la ESTACIÓN (solo ella la usa) o de la EMISORA (sus estaciones la activan con «Suena aquí»).

async function conDatos(ps: (typeof stationPlaylists.$inferSelect)[]) {
  const ids = ps.map((p) => p.id);
  const pistas = ids.length ? await db.select().from(playlistTracks).where(inArray(playlistTracks.playlistId, ids)).orderBy(asc(playlistTracks.position)) : [];
  const horarios = ids.length ? await db.select().from(playlistSchedules).where(inArray(playlistSchedules.playlistId, ids)) : [];
  const enlaces = ids.length ? await db.select().from(stationPlaylistLinks).where(inArray(stationPlaylistLinks.playlistId, ids)) : [];
  return ps.map((p) => ({
    ...p,
    ambito: p.stationId ? ('estacion' as const) : ('emisora' as const),
    trackIds: pistas.filter((t) => t.playlistId === p.id).map((t) => t.trackId),
    schedules: horarios.filter((h) => h.playlistId === p.id).map((h) => ({ dayOfWeek: h.dayOfWeek, startTime: h.startTime.slice(0, 5), endTime: h.endTime.slice(0, 5) })),
    estacionesIds: enlaces.filter((l) => l.playlistId === p.id).map((l) => l.stationId),
  }));
}

/** Playlists que usa una estación: las suyas y las de su emisora (con si las tiene activadas). */
radioMusicaRoutes.get('/estaciones/:id/playlists', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  const propias = await db.select().from(stationPlaylists).where(eq(stationPlaylists.stationId, e.id)).orderBy(asc(stationPlaylists.createdAt));
  const deEmisora = await db.select().from(stationPlaylists).where(eq(stationPlaylists.radioId, e.radioId)).orderBy(asc(stationPlaylists.createdAt));
  const enlaces = await db.select().from(stationPlaylistLinks).where(eq(stationPlaylistLinks.stationId, e.id));
  const activadas = new Map(enlaces.map((x) => [x.playlistId, x.position]));
  const todas = await conDatos([...propias, ...deEmisora]);
  const lista = todas.map((p) => ({ ...p, activa: p.stationId ? true : activadas.has(p.id), orden: p.stationId ? -1 : (activadas.get(p.id) ?? 9999) }));
  // De arriba abajo: primero las activas en su orden, luego el resto
  lista.sort((a, b) => Number(b.activa) - Number(a.activa) || a.orden - b.orden);
  return c.json({ playlists: lista });
});

/** Audios que puede usar una playlist: los de la estación (si es suya) y los del archivo de la emisora. */
async function pistasPermitidas(trackIds: string[], radioId: string, stationId: string | null) {
  if (!trackIds.length) return true;
  const condicion = stationId ? or(filtroArchivoEstacion(stationId), filtroArchivoEmisora(radioId)) : filtroArchivoEmisora(radioId);
  const filas = await db.select({ id: stationTracks.id }).from(stationTracks).where(and(inArray(stationTracks.id, trackIds), condicion));
  return filas.length === new Set(trackIds).size;
}

async function guardarPlaylist(playlistId: string, datos: PlaylistInput) {
  await db
    .update(stationPlaylists)
    .set({
      name: datos.name,
      description: datos.description ?? null,
      mode: datos.mode,
      weight: datos.weight,
      isActive: datos.isActive,
      updatedAt: new Date(),
    })
    .where(eq(stationPlaylists.id, playlistId));
  await db.delete(playlistTracks).where(eq(playlistTracks.playlistId, playlistId));
  await db.delete(playlistSchedules).where(eq(playlistSchedules.playlistId, playlistId));
  if (datos.trackIds.length) await db.insert(playlistTracks).values(datos.trackIds.map((trackId, position) => ({ playlistId, trackId, position })));
  if (datos.schedules.length) {
    await db.insert(playlistSchedules).values(datos.schedules.map((h) => ({ playlistId, dayOfWeek: h.dayOfWeek, startTime: h.startTime, endTime: h.endTime })));
  }
}

radioMusicaRoutes.post('/estaciones/:id/playlists', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  const cuerpo = await c.req.json().catch(() => ({}));
  const parsed = playlistSchema.safeParse(cuerpo);
  if (!parsed.success) return errorValidacion(c, parsed.error);
  // Las playlists son de la EMISORA: cualquier estación puede vincularlas (ver /uso). El campo ambito ya no se usa.
  if (!(await pistasPermitidas(parsed.data.trackIds, e.radioId, null))) {
    return c.json({ error: 'validacion', campo: 'trackIds', message: 'Alguno de los audios no está disponible para esta playlist.' }, 422);
  }
  const [nueva] = await db
    .insert(stationPlaylists)
    .values({
      stationId: null,
      radioId: e.radioId,
      name: parsed.data.name,
      mode: parsed.data.mode,
      weight: parsed.data.weight,
      shuffle: parsed.data.mode !== 'secuencial',
      isActive: parsed.data.isActive,
      description: parsed.data.description ?? null,
    })
    .returning();
  // Una lista de la emisora la activa la estación que la crea
  await db.insert(stationPlaylistLinks).values({ stationId: e.id, playlistId: nueva.id });
  await guardarPlaylist(nueva.id, parsed.data);
  await registrarAuditoria({ userId: acceso.user.id, accion: 'playlist.crear', entidad: 'playlist', entidadId: nueva.id, detalle: `${e.radioId ? 'Emisora' : e.name}: ${nueva.name}` });
  const sincronizado = await sincronizarEstacionesDePlaylists([nueva.id]);
  const [creada] = await conDatos([nueva]);
  return c.json({ playlist: creada, sincronizado }, 201);
});

// Activa o desactiva una playlist de la emisora en esta estación
radioMusicaRoutes.put('/estaciones/:id/playlists/:playlistId/uso', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  const parsed = usoPlaylistSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const playlistId = c.req.param('playlistId') as string;
  const [p] = await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, playlistId));
  if (!p || p.radioId !== e.radioId) return c.json({ error: 'no_encontrado' }, 404);
  if (parsed.data.usar) {
    const enlaces = await db.select({ position: stationPlaylistLinks.position }).from(stationPlaylistLinks).where(eq(stationPlaylistLinks.stationId, e.id));
    const siguiente = enlaces.reduce((m, x) => Math.max(m, x.position + 1), 0);
    await db.insert(stationPlaylistLinks).values({ stationId: e.id, playlistId, position: siguiente }).onConflictDoNothing();
  } else {
    await db.delete(stationPlaylistLinks).where(and(eq(stationPlaylistLinks.stationId, e.id), eq(stationPlaylistLinks.playlistId, playlistId)));
  }
  await registrarAuditoria({ userId: acceso.user.id, accion: parsed.data.usar ? 'playlist.usar' : 'playlist.dejar_de_usar', entidad: 'playlist', entidadId: playlistId, detalle: `${e.name}: ${p.name}` });
  const sincronizado = e.mountPoint ? await sincronizarPlaylists(e) : ({ estado: 'sin_transmision' } as EstadoSync);
  return c.json({ ok: true, sincronizado });
});

// Nuevo orden de las listas de la emisora vinculadas a esta estación (de arriba abajo)
radioMusicaRoutes.put('/estaciones/:id/playlists/orden', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  const cuerpo = (await c.req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(cuerpo?.ids) ? cuerpo!.ids.filter((x): x is string => typeof x === 'string') : null;
  if (!ids || new Set(ids).size !== ids.length) return c.json({ error: 'ids_invalidos' }, 400);
  const vinculadas = new Set((await db.select({ id: stationPlaylistLinks.playlistId }).from(stationPlaylistLinks).where(eq(stationPlaylistLinks.stationId, e.id))).map((x) => x.id));
  if (!ids.every((id) => vinculadas.has(id))) return c.json({ error: 'no_vinculada' }, 400);
  await Promise.all(ids.map((playlistId, position) =>
    db.update(stationPlaylistLinks).set({ position }).where(and(eq(stationPlaylistLinks.stationId, e.id), eq(stationPlaylistLinks.playlistId, playlistId))),
  ));
  await registrarAuditoria({ userId: acceso.user.id, accion: 'playlist.orden', entidad: 'estacion', entidadId: e.id, detalle: `${e.name}: ${ids.length} listas` });
  const sincronizado = e.mountPoint ? await sincronizarPlaylists(e) : ({ estado: 'sin_transmision' } as EstadoSync);
  return c.json({ ok: true, sincronizado });
});

// Estado del proceso de Liquidsoap de la emisora (en marcha o reiniciando, reinicios, último código de salida)
radioMusicaRoutes.get('/estaciones/:id/proceso', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  try {
    const r = await radioApi<{ proceso: { estado: string; reinicios: number; desde: number | null; ultimoCodigo: number | null } }>(`/v1/stations/${acceso.estacion.slug}`);
    return c.json({ proceso: r.proceso });
  } catch {
    return c.json({ proceso: null });
  }
});

// Ahora suena en la estación (pista, artista, lista de origen). Si la radio no responde, no hay dato.
radioMusicaRoutes.get('/estaciones/:id/ahora', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  try {
    const r = await radioApi<{ ahora: { titulo: string; artista: string; lista: string; inicio: number | null; archivo?: string; siguienteLista?: string | null } | null }>(`/v1/stations/${acceso.estacion.slug}/ahora`);
    const ahora = r.ahora;
    if (!ahora) return c.json({ ahora: null });
    // Los audios suelen no traer etiquetas: el título y artista son los de la base de datos (pista de la estación o de la emisora)
    if (ahora.archivo && !ahora.titulo) {
      const [pista] = await db
        .select({ title: stationTracks.title, artist: stationTracks.artist })
        .from(stationTracks)
        .where(and(eq(stationTracks.storageKey, ahora.archivo), or(eq(stationTracks.stationId, acceso.estacion.id), eq(stationTracks.radioId, acceso.estacion.radioId))))
        .limit(1);
      if (pista) return c.json({ ahora: { ...ahora, titulo: pista.title, artista: pista.artist ?? '' } });
    }
    return c.json({ ahora });
  } catch {
    return c.json({ ahora: null });
  }
});

// Saltar la canción que suena ahora (Liquidsoap la salta una vez)
radioMusicaRoutes.post('/estaciones/:id/saltar', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  if (!e.mountPoint || !(await radioEncendida()) || !e.encendida) return c.json({ error: 'no_esta_al_aire' }, 409);
  try {
    await radioApi(`/v1/stations/${e.slug}/saltar`, { method: 'POST' });
  } catch {
    return c.json({ error: 'radio_no_disponible' }, 503);
  }
  await registrarAuditoria({ userId: acceso.user.id, accion: 'estacion.saltar', entidad: 'estacion', entidadId: e.id, detalle: e.name });
  return c.json({ ok: true });
});

// Siguiente lista de reproducción: suena la siguiente de la rotación (Liquidsoap salta hasta cambiar)
radioMusicaRoutes.post('/estaciones/:id/saltar-lista', ACCESO, async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const e = acceso.estacion;
  if (!e.mountPoint || !(await radioEncendida()) || !e.encendida) return c.json({ error: 'no_esta_al_aire' }, 409);
  try {
    await radioApi(`/v1/stations/${e.slug}/saltar-lista`, { method: 'POST' });
  } catch {
    return c.json({ error: 'radio_no_disponible' }, 503);
  }
  await registrarAuditoria({ userId: acceso.user.id, accion: 'estacion.saltar_lista', entidad: 'estacion', entidadId: e.id, detalle: e.name });
  return c.json({ ok: true });
});

// Audio de una pista para escucharla en el panel (el archivo vive en la radio-api)
radioMusicaRoutes.get('/pistas/:id/audio', ACCESO, async (c) => {
  const [pista] = await db.select().from(stationTracks).where(eq(stationTracks.id, c.req.param('id') as string));
  if (!pista) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await accesoAPista(c, pista);
  if (acceso instanceof Response) return acceso;
  let carpeta: string;
  if (pista.stationId) {
    const [st] = await db.select().from(stations).where(eq(stations.id, pista.stationId));
    if (!st) return c.json({ error: 'no_encontrado' }, 404);
    carpeta = st.slug;
  } else {
    const [emisora] = await db.select().from(radios).where(eq(radios.id, pista.radioId as string));
    if (!emisora) return c.json({ error: 'no_encontrado' }, 404);
    carpeta = archivoRadio(emisora);
  }
  const respuesta = await radioApiRaw(`/v1/stations/${carpeta}/tracks/${encodeURIComponent(pista.storageKey)}`);
  if (!respuesta) return c.json({ error: 'audio_no_disponible' }, 404);
  return new Response(respuesta.body, { headers: { 'Content-Type': respuesta.type, 'Cache-Control': 'private, max-age=300' } });
});

/** Acceso a una playlist: por su estación, o por la emisora dueña de la lista de emisora. */
async function accesoAPlaylist(c: Context, p: typeof stationPlaylists.$inferSelect) {
  if (p.stationId) return estacionParaRuta(c, p.stationId);
  const user = await loadCurrentUser(c.req.raw.headers);
  if (!user) return c.json({ error: 'no_autenticado' }, 401) as unknown as Response;
  if (!p.radioId || !(await puedeGestionarEmisora(user, p.radioId))) return c.json({ error: 'sin_permiso' }, 403) as unknown as Response;
  return { user };
}

// Horarios de una lista: si es programada (solo suena en sus horarios) y sus opciones
radioMusicaRoutes.put('/playlists/:id/horarios', ACCESO, async (c) => {
  const id = c.req.param('id') as string;
  const [actual] = await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await accesoAPlaylist(c, actual);
  if (acceso instanceof Response) return acceso;
  const cuerpo = (await c.req.json().catch(() => ({}))) as { programada?: unknown; horarios?: unknown; interrumpe?: unknown; unaSola?: unknown };
  const programada = cuerpo.programada === true;
  const horas = /^([01]\d|2[0-3]):[0-5]\d$/;
  const horarios = Array.isArray(cuerpo.horarios) ? cuerpo.horarios as { dayOfWeek?: unknown; startTime?: unknown; endTime?: unknown }[] : [];
  const valido = horarios.every((h) =>
    Number.isInteger(h.dayOfWeek) && (h.dayOfWeek as number) >= 0 && (h.dayOfWeek as number) <= 6 &&
    typeof h.startTime === 'string' && typeof h.endTime === 'string' && horas.test(h.startTime) && horas.test(h.endTime) && h.endTime > h.startTime,
  );
  if (!valido) return c.json({ error: 'validacion', message: 'Revisa los horarios: el fin debe ser posterior al inicio.' }, 422);
  if (programada && horarios.length === 0) return c.json({ error: 'validacion', message: 'Agrega al menos un horario.' }, 422);
  const modo = programada ? 'programada' : actual.mode === 'programada' ? 'rotacion' : actual.mode;
  await db.update(stationPlaylists).set({
    mode: modo,
    interrumpe: cuerpo.interrumpe !== false,
    unaSola: cuerpo.unaSola === true,
    updatedAt: new Date(),
  }).where(eq(stationPlaylists.id, id));
  await db.delete(playlistSchedules).where(eq(playlistSchedules.playlistId, id));
  if (programada) {
    await db.insert(playlistSchedules).values(horarios.map((h) => ({
      playlistId: id,
      dayOfWeek: h.dayOfWeek as number,
      startTime: h.startTime as string,
      endTime: h.endTime as string,
    })));
  }
  await registrarAuditoria({ userId: (acceso as { user: { id: string } }).user.id, accion: 'playlist.horarios', entidad: 'playlist', entidadId: id, detalle: `${actual.name}: ${programada ? `${horarios.length} horario(s)` : 'en rotación'}` });
  const sincronizado = await sincronizarEstacionesDePlaylists([id]);
  return c.json({ ok: true, sincronizado });
});

// Cómo suenan los audios de la lista: mezclado, aleatorio o secuencial (uno solo por lista)
radioMusicaRoutes.put('/playlists/:id/modo-pistas', ACCESO, async (c) => {
  const id = c.req.param('id') as string;
  const [actual] = await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await accesoAPlaylist(c, actual);
  if (acceso instanceof Response) return acceso;
  const cuerpo = (await c.req.json().catch(() => null)) as { orden?: unknown } | null;
  if (cuerpo?.orden !== 'mezclado' && cuerpo?.orden !== 'aleatorio' && cuerpo?.orden !== 'secuencial') return c.json({ error: 'orden_invalido' }, 400);
  await db.update(stationPlaylists).set({ ordenPistas: cuerpo.orden, updatedAt: new Date() }).where(eq(stationPlaylists.id, id));
  await registrarAuditoria({ userId: (acceso as { user: { id: string } }).user.id, accion: 'playlist.orden_pistas', entidad: 'playlist', entidadId: id, detalle: `${actual.name}: ${cuerpo.orden}` });
  const sincronizado = await sincronizarEstacionesDePlaylists([id]);
  return c.json({ ok: true, sincronizado });
});

// Nuevo orden de los audios dentro de la lista (mismos audios, otro orden)
radioMusicaRoutes.put('/playlists/:id/pistas-orden', ACCESO, async (c) => {
  const id = c.req.param('id') as string;
  const [actual] = await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await accesoAPlaylist(c, actual);
  if (acceso instanceof Response) return acceso;
  const cuerpo = (await c.req.json().catch(() => null)) as { trackIds?: unknown } | null;
  const nuevos = Array.isArray(cuerpo?.trackIds) ? cuerpo!.trackIds.filter((x): x is string => typeof x === 'string') : null;
  const filas = await db.select({ trackId: playlistTracks.trackId }).from(playlistTracks).where(eq(playlistTracks.playlistId, id));
  const actuales = filas.map((f) => f.trackId);
  if (!nuevos || nuevos.length !== actuales.length || new Set(nuevos).size !== nuevos.length || !nuevos.every((t) => actuales.includes(t))) {
    return c.json({ error: 'validacion', message: 'El orden debe incluir exactamente los mismos audios de la lista.' }, 422);
  }
  await db.transaction(async (tx) => {
    await Promise.all(nuevos.map((trackId, position) =>
      tx.update(playlistTracks).set({ position }).where(and(eq(playlistTracks.playlistId, id), eq(playlistTracks.trackId, trackId))),
    ));
  });
  await registrarAuditoria({ userId: (acceso as { user: { id: string } }).user.id, accion: 'playlist.orden_audios', entidad: 'playlist', entidadId: id, detalle: actual.name });
  const sincronizado = await sincronizarEstacionesDePlaylists([id]);
  return c.json({ ok: true, sincronizado });
});

radioMusicaRoutes.put('/playlists/:id', ACCESO, async (c) => {
  const id = c.req.param('id') as string;
  const [actual] = await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await accesoAPlaylist(c, actual);
  if (acceso instanceof Response) return acceso;
  const parsed = playlistSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const radioId = actual.radioId ?? (await estacionPorId(actual.stationId!))!.radioId;
  if (!(await pistasPermitidas(parsed.data.trackIds, radioId, actual.stationId))) {
    return c.json({ error: 'validacion', campo: 'trackIds', message: 'Alguno de los audios no está disponible para esta playlist.' }, 422);
  }
  await guardarPlaylist(id, parsed.data);
  await registrarAuditoria({ userId: (acceso as { user: { id: string } }).user.id, accion: 'playlist.editar', entidad: 'playlist', entidadId: id, detalle: parsed.data.name });
  const sincronizado = await sincronizarEstacionesDePlaylists([id]);
  const [actualizada] = await conDatos([(await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, id)))[0]]);
  return c.json({ playlist: actualizada, sincronizado });
});

radioMusicaRoutes.delete('/playlists/:id', ACCESO, async (c) => {
  const id = c.req.param('id') as string;
  const [actual] = await db.select().from(stationPlaylists).where(eq(stationPlaylists.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await accesoAPlaylist(c, actual);
  if (acceso instanceof Response) return acceso;
  const afectadas = await estacionesDePlaylists([id]);
  await db.delete(stationPlaylists).where(eq(stationPlaylists.id, id));
  await registrarAuditoria({ userId: (acceso as { user: { id: string } }).user.id, accion: 'playlist.eliminar', entidad: 'playlist', entidadId: id, detalle: actual.name });
  const sincronizado: EstadoSync[] = [];
  for (const e of afectadas) if (e.mountPoint) sincronizado.push(await sincronizarPlaylists(e));
  return c.json({ ok: true, sincronizado });
});

export { esAdmin };

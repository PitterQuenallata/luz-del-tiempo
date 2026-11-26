import { randomBytes } from 'node:crypto';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { playlistSchedules, playlistTracks, radioAjustes, radios, stationPlaylistLinks, stationPlaylists, stationTracks, stations } from '../../db/schema.js';
import { CUOTA_ARCHIVO_MB, archivoRadio } from './archivo.js';
import { nombreSalidaPorDefecto } from '@luz/shared';
import { descifrar } from '../../lib/cifrado.js';

// Cliente de la radio-api (API 2) y sincronización de la configuración.
// La API 1 es la fuente de verdad: cada cambio de transmisión o playlists se empuja a la radio-api.

export class RadioApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`radio-api respondió ${status}`);
  }
}

export type EstadoSync =
  | { estado: 'ok' }
  | { estado: 'sin_transmision' }
  | { estado: 'falta_contrasena' }
  | { estado: 'radio_no_disponible'; message: string }
  | { estado: 'error'; status: number; body: unknown };

type Estacion = typeof stations.$inferSelect;
type Emisora = typeof radios.$inferSelect;

function base() {
  return (process.env.RADIO_API_URL ?? 'http://localhost:4100').replace(/\/$/, '');
}

export async function radioApi<T = unknown>(ruta: string, init: { method?: string; body?: BodyInit | null; json?: unknown } = {}): Promise<T> {
  const token = process.env.RADIO_API_TOKEN;
  if (!token) throw new RadioApiError(503, { error: 'radio_api_sin_token' });
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let body: BodyInit | null | undefined = init.body;
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${base()}${ruta}`, { method: init.method ?? 'GET', headers, body, signal: AbortSignal.timeout(15_000) });
  const texto = await res.text();
  const datos = texto ? safeJson(texto) : null;
  if (!res.ok) throw new RadioApiError(res.status, datos);
  return datos as T;
}

/** Descarga cruda desde la radio-api (audios). Devuelve null si el archivo no existe. */
export async function radioApiRaw(ruta: string): Promise<{ body: ReadableStream<Uint8Array> | null; type: string } | null> {
  const token = process.env.RADIO_API_TOKEN;
  if (!token) throw new RadioApiError(503, { error: 'radio_api_sin_token' });
  const res = await fetch(`${base()}${ruta}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new RadioApiError(res.status, null);
  return { body: res.body, type: res.headers.get('Content-Type') ?? 'audio/mpeg' };
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

const minutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

/** Nombre que ven los oyentes: el de la estación o, si no hay, «Radio La Luz del Tiempo - <estación>». */
export function nombreSalida(e: { name: string; streamName: string | null }) {
  return e.streamName?.trim() || nombreSalidaPorDefecto(e.name);
}

/** Interruptor de toda la radio (true si no hay fila: arranca encendida). */
export async function radioEncendida(): Promise<boolean> {
  const [fila] = await db.select().from(radioAjustes).where(eq(radioAjustes.id, 'global'));
  return fila?.encendida ?? true;
}

export async function emisoraDe(e: { radioId: string }): Promise<Emisora> {
  const [r] = await db.select().from(radios).where(eq(radios.id, e.radioId));
  return r;
}

/** Empuja mount, contraseña, bitrate, AutoDJ y límites de la estación a la radio-api. */
export async function sincronizarTransmision(e: Estacion): Promise<EstadoSync> {
  if (!e.mountPoint) return { estado: 'sin_transmision' };
  if (!e.livePasswordEnc) return { estado: 'falta_contrasena' };
  // Suena solo si la estación y su emisora están activas y encendidas, y la radio completa también.
  const emisora = await emisoraDe(e);
  const sonara = e.status === 'active' && emisora.status === 'active' && e.encendida && (await radioEncendida());
  try {
    await radioApi(`/v1/stations/${e.slug}`, {
      method: 'PUT',
      json: {
        name: nombreSalida(e),
        mount: e.mountPoint,
        bitrate: e.bitrateKbps,
        livePassword: descifrar(e.livePasswordEnc),
        autodj: e.autodjEnabled,
        enabled: sonara,
        maxListeners: e.maxListeners,
        storageQuotaMb: e.storageQuotaMb,
        calidadBaja: e.calidadBajaKbps,
        hls: true,
      },
    });
    return { estado: 'ok' };
  } catch (err) {
    return estadoDeError(err);
  }
}

/** Empuja a la radio-api el estado de todas las estaciones con transmisión (al encender o apagar toda la radio). */
export async function sincronizarTodasLasEstaciones(): Promise<EstadoSync[]> {
  const todas = await db.select().from(stations).orderBy(asc(stations.sortOrder));
  const resultados: EstadoSync[] = [];
  for (const e of todas) if (e.mountPoint) resultados.push(await sincronizarTransmision(e));
  return resultados;
}

// ---------- Archivos ----------

const archivosListos = new Set<string>();

/** Crea en la radio-api la carpeta del archivo de una emisora (una vez). Es una estación interna, apagada: solo guarda audios. */
export async function asegurarArchivo(emisora: Emisora): Promise<string> {
  const slug = archivoRadio(emisora);
  if (archivosListos.has(slug)) return slug;
  try {
    await radioApi(`/v1/stations/${slug}`);
  } catch (err) {
    if (!(err instanceof RadioApiError && err.status === 404)) throw err;
    await radioApi(`/v1/stations/${slug}`, {
      method: 'PUT',
      json: {
        name: `Archivo de ${emisora.name}`,
        mount: `/arch-${emisora.id.replace(/-/g, '').slice(0, 12)}`,
        bitrate: 128,
        livePassword: randomBytes(18).toString('hex'),
        autodj: false,
        enabled: false,
        maxListeners: 1,
        storageQuotaMb: CUOTA_ARCHIVO_MB,
      },
    });
  }
  archivosListos.add(slug);
  return slug;
}

// ---------- Playlists ----------

/**
 * Empuja a la radio-api las playlists que suenan en una estación:
 * las suyas, y las de la emisora que tenga activadas. Cada pista sale de su archivo (la estación o la emisora).
 */
export async function sincronizarPlaylists(e: Estacion): Promise<EstadoSync> {
  if (!e.mountPoint) return { estado: 'sin_transmision' };
  const emisora = await emisoraDe(e);
  const propias = await db.select().from(stationPlaylists).where(eq(stationPlaylists.stationId, e.id)).orderBy(asc(stationPlaylists.createdAt));
  const deEmisora = await db.select().from(stationPlaylists).where(eq(stationPlaylists.radioId, e.radioId)).orderBy(asc(stationPlaylists.createdAt));
  // Orden de las listas de la emisora en esta estación (position). Las de la estación van primero.
  const posicion = new Map(
    (await db.select({ id: stationPlaylistLinks.playlistId, position: stationPlaylistLinks.position }).from(stationPlaylistLinks).where(eq(stationPlaylistLinks.stationId, e.id))).map((x) => [x.id, x.position]),
  );
  // Las playlists se mandan todas, en el orden en que suenan; `active` dice cuáles suenan (eso va a estado.txt, sin reiniciar).
  const ordenadas = deEmisora
    .filter((p) => posicion.has(p.id))
    .sort((a, b) => (posicion.get(a.id) ?? 0) - (posicion.get(b.id) ?? 0));
  const sinVincular = deEmisora.filter((p) => !posicion.has(p.id));
  const lista = [
    ...propias.map((p) => ({ p, activa: true })),
    ...ordenadas.map((p) => ({ p, activa: true })),
    ...sinVincular.map((p) => ({ p, activa: false })),
  ];
  const ids = lista.map((x) => x.p.id);
  const pistas = ids.length
    ? await db
        .select({ playlistId: playlistTracks.playlistId, position: playlistTracks.position, storageKey: stationTracks.storageKey, stationId: stationTracks.stationId })
        .from(playlistTracks)
        .innerJoin(stationTracks, eq(playlistTracks.trackId, stationTracks.id))
        .where(inArray(playlistTracks.playlistId, ids))
        .orderBy(asc(playlistTracks.position))
    : [];
  const horarios = ids.length ? await db.select().from(playlistSchedules).where(inArray(playlistSchedules.playlistId, ids)) : [];

  // Ruta de cada pista para la radio-api: la del archivo de la estación, o "carpeta-de-la-emisora/archivo"
  const ruta = (t: { storageKey: string; stationId: string | null }) => (t.stationId ? t.storageKey : `${archivoRadio(emisora)}/${t.storageKey}`);
  const payload = {
    playlists: lista.map(({ p, activa }) => ({
      id: p.id,
      name: p.name,
      mode: p.mode,
      weight: p.weight,
      // Solo «aleatorio» sortea en Liquidsoap; «mezclado» ya viene barajado y «secuencial» va tal cual
      shuffle: p.ordenPistas === 'aleatorio',
      orden: p.ordenPistas,
      interrumpe: p.interrumpe,
      unaSola: p.unaSola,
      active: p.isActive && activa,
      tracks: pistas.filter((t) => t.playlistId === p.id).map(ruta),
      schedules: horarios
        .filter((h) => h.playlistId === p.id)
        .map((h) => ({ day: h.dayOfWeek, inicio: minutos(h.startTime), fin: minutos(h.endTime) })),
    })),
  };
  try {
    await radioApi(`/v1/stations/${e.slug}/playlists`, { method: 'PUT', json: payload });
    return { estado: 'ok' };
  } catch (err) {
    return estadoDeError(err);
  }
}

/** Estaciones a las que afecta un cambio en estas playlists: la dueña, las que la activaron y, si es de la emisora, todas sus estaciones. */
export async function estacionesDePlaylists(playlistIds: string[]): Promise<Estacion[]> {
  if (!playlistIds.length) return [];
  const ids = new Set<string>();
  const filas = await db
    .select({ stationId: stationPlaylists.stationId, radioId: stationPlaylists.radioId })
    .from(stationPlaylists)
    .where(inArray(stationPlaylists.id, playlistIds));
  for (const f of filas) {
    if (f.stationId) ids.add(f.stationId);
    if (f.radioId) for (const e of await db.select({ id: stations.id }).from(stations).where(eq(stations.radioId, f.radioId))) ids.add(e.id);
  }
  for (const l of await db.select({ s: stationPlaylistLinks.stationId }).from(stationPlaylistLinks).where(inArray(stationPlaylistLinks.playlistId, playlistIds))) ids.add(l.s);
  return ids.size ? db.select().from(stations).where(inArray(stations.id, [...ids])) : [];
}

/** Sincroniza las estaciones que usan estas playlists (tras cambiarlas). */
export async function sincronizarEstacionesDePlaylists(playlistIds: string[]) {
  const resultados: EstadoSync[] = [];
  for (const e of await estacionesDePlaylists(playlistIds)) if (e.mountPoint) resultados.push(await sincronizarPlaylists(e));
  return resultados;
}

// ---------- Radio-api: quitar, subir, leer, borrar ----------

/** Estado en vivo de cada estación (la radio-api lo lee de Icecast). Si la radio no responde, todas aparecen sin señal. */
export async function enAirePorSlugRadio() {
  const enAire = new Map<string, { online: boolean; listeners: number; title: string | null }>();
  try {
    const r = await radioApi<{ stations: { slug: string; status: { online: boolean; listeners: number; title: string | null } }[] }>('/v1/stations');
    for (const s of r.stations) enAire.set(s.slug, { online: s.status.online, listeners: s.status.listeners, title: s.status.title });
  } catch {
    // sin radio-api: todas aparecen sin señal
  }
  return enAire;
}

/** Quita la estación de la radio-api (al borrarla en el panel). */
export async function quitarTransmision(slug: string) {
  try {
    await radioApi(`/v1/stations/${slug}`, { method: 'DELETE' });
  } catch (err) {
    if (!(err instanceof RadioApiError && err.status === 404)) return estadoDeError(err);
  }
  return { estado: 'ok' as const };
}

/** Sube un audio a la carpeta indicada (la de la estación o la del archivo de la emisora). */
export async function subirAudio(slug: string, archivo: File) {
  const form = new FormData();
  form.append('file', archivo, archivo.name);
  return radioApi<{ file: string; sizeBytes: number }>(`/v1/stations/${slug}/tracks`, { method: 'POST', body: form });
}

/** Bytes de un audio que ya está en la radio (para leer sus etiquetas). */
export async function leerAudioRadio(slug: string, nombre: string): Promise<Uint8Array> {
  const token = process.env.RADIO_API_TOKEN;
  if (!token) throw new RadioApiError(503, { error: 'radio_api_sin_token' });
  const res = await fetch(`${base()}/v1/stations/${slug}/tracks/${encodeURIComponent(nombre)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new RadioApiError(res.status, null);
  return new Uint8Array(await res.arrayBuffer());
}

export async function borrarAudioRadio(slug: string, nombre: string) {
  try {
    await radioApi(`/v1/stations/${slug}/tracks/${encodeURIComponent(nombre)}`, { method: 'DELETE' });
  } catch (err) {
    if (!(err instanceof RadioApiError && err.status === 404)) throw err;
  }
}

function estadoDeError(err: unknown): EstadoSync {
  if (err instanceof RadioApiError) {
    if (err.status === 503) return { estado: 'radio_no_disponible', message: 'La radio-api no está configurada en la API.' };
    return { estado: 'error', status: err.status, body: err.body };
  }
  const message = err instanceof Error ? err.message : 'No se pudo conectar con la radio-api.';
  return { estado: 'radio_no_disponible', message };
}


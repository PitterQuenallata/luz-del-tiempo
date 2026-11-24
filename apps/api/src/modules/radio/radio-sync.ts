import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { playlistSchedules, playlistTracks, stationPlaylists, stationTracks, stations } from '../../db/schema.js';
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
  const res = await fetch(`${base()}${ruta}`, {
    method: init.method ?? 'GET',
    headers,
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const texto = await res.text();
  const datos = texto ? safeJson(texto) : null;
  if (!res.ok) throw new RadioApiError(res.status, datos);
  return datos as T;
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

type Emisora = typeof stations.$inferSelect;

/** Empuja mount, contraseña, bitrate, AutoDJ y límites de la estación a la radio-api. */
export async function sincronizarTransmision(e: Emisora): Promise<EstadoSync> {
  if (!e.mountPoint) return { estado: 'sin_transmision' };
  if (!e.livePasswordEnc) return { estado: 'falta_contrasena' };
  try {
    await radioApi(`/v1/stations/${e.slug}`, {
      method: 'PUT',
      json: {
        name: e.name,
        mount: e.mountPoint,
        bitrate: e.bitrateKbps,
        livePassword: descifrar(e.livePasswordEnc),
        autodj: e.autodjEnabled,
        enabled: e.status === 'active',
        maxListeners: e.maxListeners,
        storageQuotaMb: e.storageQuotaMb,
      },
    });
    return { estado: 'ok' };
  } catch (err) {
    return estadoDeError(err);
  }
}

/** Empuja todas las playlists de la estación (lista de pistas, modo, peso y horarios). */
export async function sincronizarPlaylists(e: Emisora): Promise<EstadoSync> {
  if (!e.mountPoint) return { estado: 'sin_transmision' };
  const ps = await db.select().from(stationPlaylists).where(eq(stationPlaylists.stationId, e.id)).orderBy(asc(stationPlaylists.createdAt));
  const ids = ps.map((p) => p.id);
  const pistas = ids.length
    ? await db
        .select({ playlistId: playlistTracks.playlistId, position: playlistTracks.position, storageKey: stationTracks.storageKey })
        .from(playlistTracks)
        .innerJoin(stationTracks, eq(playlistTracks.trackId, stationTracks.id))
        .where(inArray(playlistTracks.playlistId, ids))
        .orderBy(asc(playlistTracks.position))
    : [];
  const horarios = ids.length ? await db.select().from(playlistSchedules).where(inArray(playlistSchedules.playlistId, ids)) : [];

  const payload = {
    playlists: ps.map((p) => ({
      id: p.id,
      name: p.name,
      mode: p.mode,
      weight: p.weight,
      shuffle: p.shuffle,
      active: p.isActive,
      tracks: pistas.filter((t) => t.playlistId === p.id).map((t) => t.storageKey),
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

/** Sincroniza transmisión y playlists de una estación. */
export async function sincronizarTodo(e: Emisora) {
  const transmision = await sincronizarTransmision(e);
  if (transmision.estado !== 'ok') return { transmision, playlists: transmision };
  return { transmision, playlists: await sincronizarPlaylists(e) };
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

/** Sube un audio al AutoDJ de la estación. */
export async function subirAudio(slug: string, archivo: File) {
  const form = new FormData();
  form.append('file', archivo, archivo.name);
  return radioApi<{ file: string; sizeBytes: number }>(`/v1/stations/${slug}/tracks`, { method: 'POST', body: form });
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


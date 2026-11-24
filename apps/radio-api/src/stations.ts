import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { config } from './config.js';

export const slugSchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/, 'slug inválido');

/** Lo que manda la API 1 para crear o actualizar una estación. */
export const estacionEntradaSchema = z.object({
  name: z.string().trim().min(1).max(120),
  mount: z.string().regex(/^\/[a-z0-9][a-z0-9-]{0,39}$/, 'mount inválido, p. ej. /salud'),
  bitrate: z.number().int().min(32).max(320).default(128),
  livePassword: z.string().min(8).max(128),
  autodj: z.boolean().default(true),
  enabled: z.boolean().default(true),
  maxListeners: z.number().int().min(1).max(2000).default(100),
  storageQuotaMb: z.number().int().min(1).max(10240).default(5120),
});
export type EstacionEntrada = z.infer<typeof estacionEntradaSchema>;

/** Forma en disco (stations.json), la que lee Liquidsoap. */
export interface Estacion {
  slug: string;
  name: string;
  mount: string;
  bitrate: number;
  live_password: string;
  autodj: boolean;
  enabled: boolean;
  max_listeners: number;
  storage_quota_mb: number;
  /** Modo, peso y horarios de cada playlist (la lista de pistas está en su .m3u) */
  playlists?: import('./playlists.js').PlaylistMeta[];
}

const archivo = () => path.join(config.configDir, 'stations.json');

export async function leerEstaciones(): Promise<Estacion[]> {
  try {
    const datos = JSON.parse(await readFile(archivo(), 'utf8')) as { stations?: Estacion[] };
    // Estaciones guardadas antes de las playlists: siempre con lista (Liquidsoap la necesita)
    return (datos.stations ?? []).map((s) => ({ ...s, playlists: s.playlists ?? [] }));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

/** Escritura atómica: Liquidsoap nunca lee un archivo a medias. */
export async function guardarEstaciones(estaciones: Estacion[]): Promise<void> {
  await mkdir(config.configDir, { recursive: true });
  const tmp = `${archivo()}.tmp`;
  await writeFile(tmp, JSON.stringify({ stations: estaciones }, null, 2));
  await rename(tmp, archivo());
}

// Serializa los cambios para que dos peticiones simultáneas no se pisen.
let cola: Promise<unknown> = Promise.resolve();
export function enCola<T>(fn: () => Promise<T>): Promise<T> {
  const siguiente = cola.then(fn, fn);
  cola = siguiente.catch(() => undefined);
  return siguiente;
}

export function guardarEstacion(slug: string, e: EstacionEntrada) {
  return enCola(async () => {
    const estaciones = await leerEstaciones();
    const otraConMount = estaciones.find((s) => s.mount === e.mount && s.slug !== slug);
    if (otraConMount) return { error: 'mount_en_uso' as const, slug: otraConMount.slug };

    const estacion: Estacion = {
      slug,
      name: e.name,
      mount: e.mount,
      bitrate: e.bitrate,
      live_password: e.livePassword,
      autodj: e.autodj,
      enabled: e.enabled,
      max_listeners: e.maxListeners,
      storage_quota_mb: e.storageQuotaMb,
      playlists: estaciones.find((s) => s.slug === slug)?.playlists ?? [],
    };
    const i = estaciones.findIndex((s) => s.slug === slug);
    const creada = i === -1;
    if (creada) estaciones.push(estacion);
    else estaciones[i] = estacion;

    await mkdir(path.join(config.musicDir, slug), { recursive: true });
    await guardarEstaciones(estaciones);
    return { estacion, creada };
  });
}

export function quitarEstacion(slug: string) {
  return enCola(async () => {
    const estaciones = await leerEstaciones();
    const restantes = estaciones.filter((s) => s.slug !== slug);
    if (restantes.length === estaciones.length) return false;
    // Los audios se conservan en disco; se borran aparte si hace falta.
    await guardarEstaciones(restantes);
    return true;
  });
}

/** Versión pública: nunca devuelve la contraseña del locutor. */
export function sinSecretos(e: Estacion) {
  const { live_password: _omitida, ...resto } = e;
  return { ...resto, streamUrl: `${config.publicStreamBase}${e.mount}` };
}

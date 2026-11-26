import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
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
  /** Calidad baja del HLS (señal lenta o datos móviles) */
  calidadBaja: z.number().int().min(32).max(128).default(48),
  hls: z.boolean().default(true),
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
  calidad_baja: number;
  hls: boolean;
  /** Bloque de puertos de la estación (ver puertosDeBloque): oyentes, control y locutores. */
  icecast_port?: number;
  control_port?: number;
  harbor_port?: number;
  /** Modo, peso y horarios de cada playlist (la lista de pistas está en su .m3u) */
  playlists?: import('./playlists.js').PlaylistMeta[];
}

const archivo = () => path.join(config.configDir, 'stations.json');
// Lista de slugs que lee supervisa.sh (una estación por línea): decide qué procesos de Liquidsoap existen.
const archivoEmisoras = () => path.join(config.configDir, 'emisoras.txt');

/**
 * Archivo interno de una emisora (slug «arch-…»): solo guarda audios, nunca transmite.
 * No reserva bloque de puertos, para que el límite de 20 sea de estaciones de verdad.
 */
export const esArchivo = (slug: string) => slug.startsWith('arch-');

/**
 * Puertos como AzuraCast: cada estación reserva un bloque de 10 dentro del rango (por defecto 8000–8199: 20 emisoras).
 * base → oyentes (Icecast propio de la estación); base+4 → control de Liquidsoap; base+5 → locutores (DJ).
 * El compose publica el rango completo al instalar.
 */
export const PUERTO_BASE_MIN = Number(process.env.RADIO_PUERTO_MIN ?? 8000);
export const PUERTO_BASE_MAX = Number(process.env.RADIO_PUERTO_MAX ?? 8199);
const TAMANO_BLOQUE = 10;

export function puertosDeBloque(base: number) {
  return { icecast_port: base, control_port: base + 4, harbor_port: base + 5 };
}

/** Todos los puertos ya reservados por las estaciones con bloque. */
function puertosReservados(estaciones: Estacion[]): Set<number> {
  const usados = new Set<number>();
  for (const e of estaciones) {
    if (!e.icecast_port) continue;
    const base = e.icecast_port as number;
    for (let p = base; p < base + TAMANO_BLOQUE; p++) usados.add(p);
  }
  return usados;
}

/** Primer bloque de 10 libre dentro del rango, o null si no queda ninguno. */
export function bloqueLibre(estaciones: Estacion[]): number | null {
  const usados = puertosReservados(estaciones);
  for (let base = PUERTO_BASE_MIN; base + TAMANO_BLOQUE - 1 <= PUERTO_BASE_MAX; base += TAMANO_BLOQUE) {
    let libre = true;
    for (let p = base; p < base + TAMANO_BLOQUE; p++) if (usados.has(p)) { libre = false; break; }
    if (libre) return base;
  }
  return null;
}

/** Da bloque a las estaciones que no lo tienen, en orden (la primera recibe el primer bloque libre). */
function asignarPuertos(estaciones: Estacion[]): Estacion[] {
  const resultado: Estacion[] = [];
  for (const e of estaciones) {
    if (esArchivo(e.slug)) {
      // Los archivos no usan puertos: 0 = sin bloque. Los campos deben existir (Liquidsoap lee todo o nada).
      resultado.push({ ...e, icecast_port: 0, control_port: 0, harbor_port: 0 });
      continue;
    }
    if (Number.isInteger(e.icecast_port)) { resultado.push(e); continue; }
    const base = bloqueLibre(resultado);
    if (base === null) { resultado.push(e); continue; }
    resultado.push({ ...e, ...puertosDeBloque(base) });
  }
  return resultado;
}

// Encendida o apagada cada emisora. Va en un archivo aparte (estado.txt, una línea "slug 1" o "slug 0") para que
// encender o apagar NO cambie stations.json: Liquidsoap reinicia solo cuando cambia stations.json.
const archivoEstado = () => path.join(config.configDir, 'estado.txt');

export async function leerEstado(): Promise<Record<string, boolean>> {
  try {
    const mapa: Record<string, boolean> = {};
    for (const linea of (await readFile(archivoEstado(), 'utf8')).split('\n')) {
      const [slug, valor] = linea.trim().split(' ');
      if (slug) mapa[slug] = valor === '1';
    }
    return mapa;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw err;
  }
}

/** Escritura atómica (Liquidsoap lo lee cada 2 s). */
export async function guardarEstado(mapa: Record<string, boolean>): Promise<void> {
  await mkdir(config.configDir, { recursive: true });
  const texto = Object.entries(mapa).map(([slug, on]) => `${slug} ${on ? 1 : 0}`).join('\n') + '\n';
  const tmp = `${archivoEstado()}.tmp`;
  await writeFile(tmp, texto);
  await rename(tmp, archivoEstado());
}

export async function leerEstaciones(): Promise<Estacion[]> {
  try {
    const datos = JSON.parse(await readFile(archivo(), 'utf8')) as { stations?: Estacion[] };
    const estado = await leerEstado();
    // Estaciones guardadas antes de las playlists: siempre con lista (Liquidsoap la necesita).
    // Sin entrada en estado.txt, la emisora queda encendida y con AutoDJ (así estaban antes).
    const base = (datos.stations ?? []).map((s) => ({
      ...s,
      enabled: estado[s.slug] ?? true,
      autodj: estado[`${s.slug}.autodj`] ?? true,
      playlists: s.playlists ?? [],
    }));
    // Estaciones guardadas antes de tener puerto de locutor: se les asigna uno (queda guardado al arrancar)
    return asignarPuertos(base);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

/** Escritura atómica: Liquidsoap nunca lee un archivo a medias. */
export async function guardarEstaciones(estaciones: Estacion[]): Promise<void> {
  await mkdir(config.configDir, { recursive: true });
  // stations.json no lleva el estado de encendido ni del AutoDJ (van en estado.txt): así no reinicia Liquidsoap
  // Las listas se guardan solo con lo estructural (id y modo aleatorio): nombre y pistas van en listas.txt
  const sinEstado = estaciones.map((e) => ({
    ...e,
    enabled: true,
    autodj: true,
    playlists: (e.playlists ?? []).map(({ id, shuffle }) => ({ id, shuffle })),
  }));
  const tmp = `${archivo()}.tmp`;
  await writeFile(tmp, JSON.stringify({ stations: sinEstado }, null, 2));
  await rename(tmp, archivo());

  // Lista para supervisa.sh: un proceso de Liquidsoap solo por emisora ENCENDIDA (como AzuraCast).
  // Apagar una emisora detiene su proceso; encenderla lo arranca. Las demás no se tocan.
  const tmpEmisoras = `${archivoEmisoras()}.tmp`;
  // Formato: "slug puerto_icecast". El puerto va aquí para que el supervisor sepa en qué puerto levantar el Icecast
  await writeFile(tmpEmisoras, estaciones.filter((e) => e.enabled && Number.isInteger(e.icecast_port)).map((e) => `${e.slug} ${e.icecast_port}`).join('\n') + '\n');
  await rename(tmpEmisoras, archivoEmisoras());
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

    // Una estación nueva necesita un puerto de locutor libre; una existente conserva el suyo
    const existente = estaciones.find((s) => s.slug === slug);
    const base = esArchivo(slug) ? null : (existente?.icecast_port ?? bloqueLibre(estaciones));
    if (base === null && !esArchivo(slug)) return { error: 'sin_puerto_libre' as const };

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
      calidad_baja: e.calidadBaja,
      hls: e.hls,
      ...(base === null ? { icecast_port: 0, control_port: 0, harbor_port: 0 } : puertosDeBloque(base)),
      playlists: existente?.playlists ?? [],
    };
    const i = estaciones.findIndex((s) => s.slug === slug);
    const creada = i === -1;
    if (creada) estaciones.push(estacion);
    else estaciones[i] = estacion;

    await mkdir(path.join(config.musicDir, slug), { recursive: true });
    // Primero el estado (Liquidsoap lo lee al arrancar); luego la estación
    const estado = await leerEstado();
    estado[slug] = e.enabled;
    estado[`${slug}.autodj`] = e.autodj;
    await guardarEstado(estado);
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
    const estado = await leerEstado();
    delete estado[slug];
    delete estado[`${slug}.autodj`];
    await guardarEstado(estado);
    await guardarEstaciones(restantes);
    // Lo que la emisora dejó en disco y ya no sirve: su «ahora» (lo lee el panel). El estado de proceso lo
    // limpia sincronizar.sh (la radio-api monta /procesos solo lectura). El historial está en la base y los logs se conservan.
    await rm(path.join(config.configDir, 'ahora', `${slug}.txt`), { force: true });
    return true;
  });
}

/** Versión pública: nunca devuelve la contraseña del locutor. */
export function sinSecretos(e: Estacion) {
  const { live_password: _omitida, ...resto } = e;
  // Cada emisora escucha en su propio Icecast: su puerto de oyentes (ver puertosDeBloque)
  return { ...resto, streamUrl: e.icecast_port ? `${config.publicStreamHost}:${e.icecast_port}${e.mount}` : null };
}

/** Estado del proceso de Liquidsoap de una emisora (lo escribe supervisa.sh en /procesos/<slug>.txt). */
export interface EstadoProceso {
  estado: 'en_marcha' | 'reiniciando' | 'sin_proceso';
  reinicios: number;
  desde: number | null;
  ultimoCodigo: number | null;
}

export async function leerProceso(slug: string): Promise<EstadoProceso> {
  const sinProceso: EstadoProceso = { estado: 'sin_proceso', reinicios: 0, desde: null, ultimoCodigo: null };
  try {
    const campos = new Map<string, string>();
    for (const linea of (await readFile(path.join(config.procesosDir, `${slug}.txt`), 'utf8')).split('\n')) {
      const [k, ...v] = linea.split('=');
      if (k) campos.set(k.trim(), v.join('=').trim());
    }
    const estado = campos.get('estado');
    if (estado !== 'en_marcha' && estado !== 'reiniciando') return sinProceso;
    const numero = (v: string | undefined) => (v && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
    return {
      estado,
      reinicios: numero(campos.get('reinicios')) ?? 0,
      desde: numero(campos.get('desde')),
      ultimoCodigo: numero(campos.get('ultimo_codigo')),
    };
  } catch {
    return sinProceso;
  }
}

/**
 * Reserva el bloque de puertos de una estación nueva (como AzuraCast al crearla). La deja APAGADA:
 * no arranca ningún proceso hasta que tenga transmisión y se encienda.
 */
export function reservarEstacion(slug: string, nombre: string, mount: string) {
  return enCola(async () => {
    const estaciones = await leerEstaciones();
    const existente = estaciones.find((s) => s.slug === slug);
    if (existente && Number.isInteger(existente.icecast_port)) return { estacion: existente, creada: false };

    const base = bloqueLibre(estaciones);
    if (base === null) return { error: 'sin_puerto_libre' as const };

    const estacion: Estacion = {
      slug,
      name: nombre,
      mount,
      bitrate: 128,
      live_password: '',
      autodj: false,
      enabled: false,
      max_listeners: 100,
      storage_quota_mb: 5120,
      calidad_baja: 48,
      hls: false,
      ...puertosDeBloque(base),
      playlists: [],
    };
    // Apagada desde el principio: el estado va en estado.txt antes que la estación
    const estado = await leerEstado();
    estado[slug] = false;
    estado[`${slug}.autodj`] = false;
    await guardarEstado(estado);
    await guardarEstaciones([...estaciones, estacion]);
    return { estacion, creada: true };
  });
}

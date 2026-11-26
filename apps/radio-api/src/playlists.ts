import { mkdir, readdir, readFile, rm, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { config } from './config.js';
import { enCola, guardarEstado, guardarEstaciones, leerEstaciones, leerEstado, type Estacion } from './stations.js';

/**
 * Playlists del AutoDJ.
 * - La lista de pistas (qué audios y en qué orden) va en un .m3u por playlist: Liquidsoap la recarga sola.
 * - stations.json solo lleva lo ESTRUCTURAL de cada lista (id y modo aleatorio): si cambia, la emisora se reinicia.
 * - Nombre y número de audios van en listas.txt, y los horarios y el modo en programas.txt: Liquidsoap los lee
 *   cada 2 s SIN reiniciar. Así subir audios no corta la emisora.
 */

export const MODOS = ['rotacion', 'secuencial', 'programada'] as const;

const horario = z
  .object({
    day: z.number().int().min(0).max(6), // 0 = domingo … 6 = sábado
    inicio: z.number().int().min(0).max(1439), // minutos desde medianoche
    fin: z.number().int().min(1).max(1440),
  })
  .refine((h) => h.fin > h.inicio, 'La hora de fin debe ser posterior a la de inicio (las franjas que cruzan medianoche se parten en dos).');

export const playlistEntradaSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/, 'id de playlist inválido'),
  name: z.string().trim().min(1).max(80),
  mode: z.enum(MODOS),
  weight: z.number().int().min(1).max(100).default(50),
  shuffle: z.boolean().default(true),
  // Cómo suenan los audios: mezclado (una vez al escribir la lista), aleatorio (Liquidsoap sortea en cada turno) o secuencial
  orden: z.enum(['mezclado', 'aleatorio', 'secuencial']).default('aleatorio'),
  // Solo programadas: interrumpe lo que suena a la hora; una_sola = suena una pista por horario
  interrumpe: z.boolean().default(true),
  unaSola: z.boolean().default(false),
  active: z.boolean().default(true),
  tracks: z.array(z.string().min(1).max(120)).max(5000).default([]),
  schedules: z.array(horario).max(200).default([]),
});
export type PlaylistEntrada = z.infer<typeof playlistEntradaSchema>;

/** Forma guardada en stations.json: solo lo que reinicia la emisora si cambia. */
export interface PlaylistMeta {
  id: string;
  shuffle: boolean;
}

export const playlistsSchema = z.object({ playlists: z.array(playlistEntradaSchema).max(100) });

// Ruta con la que Liquidsoap ve la carpeta de audios (en Docker es /music)
const RUTA_LIQUIDSOAP = process.env.LIQUIDSOAP_MUSIC_DIR ?? '/music';

const carpetaPlaylists = (slug: string) => path.join(config.configDir, 'playlists', slug);
const carpetaAudios = (slug: string) => path.join(config.musicDir, slug);

/** Ruta del .m3u de una playlist (la usa Liquidsoap). */
export function rutaM3u(slug: string, id: string) {
  return `${config.configDir}/playlists/${slug}/${id}.m3u`.replace(/\\/g, '/');
}

async function archivosExistentes(slug: string): Promise<Set<string>> {
  try {
    const nombres = await readdir(carpetaAudios(slug));
    return new Set(nombres.filter((n) => !n.startsWith('.')));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return new Set();
    throw err;
  }
}

/** Una pista es "carpeta/archivo" si viene de otra carpeta (biblioteca compartida); si no, es de la estación. */
const esDeOtraCarpeta = (t: string) => t.includes('/');

/** Devuelve las pistas que no existen en disco. */
export async function pistasFaltantes(slug: string, entradas: PlaylistEntrada[]): Promise<string[]> {
  const existentes = await archivosExistentes(slug);
  const porCarpeta = new Map<string, Set<string>>();
  const faltan = new Set<string>();
  for (const p of entradas)
    for (const t of p.tracks) {
      if (!esDeOtraCarpeta(t)) {
        if (!existentes.has(t)) faltan.add(t);
        continue;
      }
      const [carpeta, ...resto] = t.split('/');
      if (!porCarpeta.has(carpeta)) porCarpeta.set(carpeta, await nombresEn(carpeta));
      if (!porCarpeta.get(carpeta)!.has(resto.join('/'))) faltan.add(t);
    }
  return [...faltan];
}

async function nombresEn(carpeta: string): Promise<Set<string>> {
  try {
    return new Set((await readdir(path.join(config.musicDir, carpeta))).filter((n) => !n.startsWith('.')));
  } catch {
    return new Set();
  }
}

// Solo lo estructural va en stations.json (reinicia la emisora). Nombre y pistas van en listas.txt,
// modo y horarios en programas.txt, activa o pausada en estado.txt: todo se lee en caliente.
function metaDe(p: PlaylistEntrada): PlaylistMeta {
  return { id: p.id, shuffle: p.shuffle };
}

/** Lee listas.txt: clave "slug/id" → nombre y número de audios (lo que Liquidsoap lee en vivo). */
export async function leerListas(): Promise<Map<string, { nombre: string; pistas: number }>> {
  const mapa = new Map<string, { nombre: string; pistas: number }>();
  try {
    for (const linea of (await readFile(path.join(config.configDir, 'listas.txt'), 'utf8')).split('\n')) {
      const [clave, nombre, pistas] = linea.split(';');
      if (clave) mapa.set(clave, { nombre: nombre ?? '', pistas: Number(pistas) || 0 });
    }
  } catch { /* sin listas.txt todavía: ninguna lista tiene audios */ }
  return mapa;
}

/** Reemplaza las líneas de esta estación en listas.txt (las de las demás se conservan). */
export async function escribirListasDe(slug: string, filas: { id: string; name: string; pistas: number }[]) {
  const ruta = path.join(config.configDir, 'listas.txt');
  let actuales = '';
  try {
    actuales = await readFile(ruta, 'utf8');
  } catch {
    actuales = '';
  }
  // El punto y coma separa campos: se cambia por coma en el nombre (y no puede haber saltos de línea)
  const limpio = (s: string) => s.replace(/[;\r\n]/g, ' ');
  const otras = actuales.split('\n').filter((l) => l && !l.startsWith(`${slug}/`));
  const nuevas = filas.map((f) => `${slug}/${f.id};${limpio(f.name)};${f.pistas}`);
  const texto = [...otras, ...nuevas].join('\n') + '\n';
  await mkdir(config.configDir, { recursive: true });
  const tmp = `${ruta}.tmp`;
  await writeFile(tmp, texto);
  await rename(tmp, ruta);
}

/**
 * Pasa a listas.txt los nombres y pistas que aún están en stations.json (formato anterior a esta versión).
 * Se llama una vez al arrancar, antes de dejar stations.json solo con lo estructural.
 */
export async function migrarListas(estaciones: Estacion[]) {
  for (const e of estaciones) {
    const antiguas = (e.playlists ?? []) as unknown as { id: string; name?: string; pistas?: number }[];
    if (!antiguas.some((p) => typeof p.pistas === 'number')) continue;
    await escribirListasDe(
      e.slug,
      antiguas.map((p) => ({ id: p.id, name: p.name ?? p.id, pistas: p.pistas ?? 0 })),
    );
  }
}

/** Una línea por lista: "slug/id;modo;interrumpe;una_sola;dia-inicio-fin,..." (o "-" sin horarios). */
function lineaPrograma(slug: string, p: PlaylistEntrada): string {
  const modo = p.mode === 'programada' ? 'programada' : 'rotacion';
  const horarios = p.schedules.map((h) => `${h.day}-${h.inicio}-${h.fin}`).join(',') || '-';
  return `${slug}/${p.id};${modo};${p.interrumpe ? 1 : 0};${p.unaSola ? 1 : 0};${horarios}`;
}

/** Reemplaza las líneas de esta estación en programas.txt (las de las demás se conservan). */
async function escribirProgramas(slug: string, entradas: PlaylistEntrada[]) {
  const ruta = path.join(config.configDir, 'programas.txt');
  let actuales = '';
  try {
    actuales = await readFile(ruta, 'utf8');
  } catch {
    actuales = '';
  }
  const otras = actuales.split('\n').filter((l) => l && !l.startsWith(`${slug}/`));
  const texto = [...otras, ...entradas.map((p) => lineaPrograma(slug, p))].join('\n') + '\n';
  await mkdir(config.configDir, { recursive: true });
  const tmp = `${ruta}.tmp`;
  await writeFile(tmp, texto);
  await rename(tmp, ruta);
}

/** Orden al azar de una copia (Fisher-Yates). Se usa al escribir una lista «mezclada». */
function mezclarCopia<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Escribe el .m3u de forma atómica. Liquidsoap lo recarga al cambiar. */
async function escribirM3u(slug: string, p: PlaylistEntrada) {
  const dir = carpetaPlaylists(slug);
  await mkdir(dir, { recursive: true });
  // Pistas de la biblioteca compartida llevan su carpeta ("institucional/archivo.mp3")
  const pistas = p.orden === 'mezclado' ? mezclarCopia(p.tracks) : p.tracks;
  const lineas = ['#EXTM3U', ...pistas.map((t) => (esDeOtraCarpeta(t) ? `${RUTA_LIQUIDSOAP}/${t}` : `${RUTA_LIQUIDSOAP}/${slug}/${t}`))];
  const tmp = path.join(dir, `.${p.id}.tmp`);
  await writeFile(tmp, lineas.join('\n') + '\n');
  await rename(tmp, path.join(dir, `${p.id}.m3u`));
}

async function quitarM3uHuerfanos(slug: string, ids: Set<string>) {
  let nombres: string[] = [];
  try {
    nombres = await readdir(carpetaPlaylists(slug));
  } catch {
    return;
  }
  for (const n of nombres) {
    if (!n.endsWith('.m3u')) continue;
    if (!ids.has(n.replace(/\.m3u$/, ''))) await rm(path.join(carpetaPlaylists(slug), n), { force: true });
  }
}

/**
 * Reemplaza todas las playlists de una estación.
 * Devuelve si hubo que reiniciar Liquidsoap (cambió modo, peso, horarios o si estén activas).
 */
export function guardarPlaylists(slug: string, entradas: PlaylistEntrada[]) {
  return enCola(async () => {
    const estaciones = await leerEstaciones();
    const i = estaciones.findIndex((s) => s.slug === slug);
    if (i === -1) return { error: 'no_existe' as const };

    for (const p of entradas) await escribirM3u(slug, p);
    await quitarM3uHuerfanos(slug, new Set(entradas.map((p) => p.id)));
    await escribirProgramas(slug, entradas);

    // Activación de cada playlist en esta emisora (estado.txt, clave "slug/playlist")
    const estado = await leerEstado();
    for (const clave of Object.keys(estado)) if (clave.startsWith(`${slug}/`)) delete estado[clave];
    for (const p of entradas) estado[`${slug}/${p.id}`] = p.active;
    await guardarEstado(estado);

    // Nombre y número de audios: en listas.txt, sin reiniciar nada
    await escribirListasDe(slug, entradas.map((p) => ({ id: p.id, name: p.name, pistas: p.tracks.length })));

    // Solo lo estructural (id y modo aleatorio) reinicia la emisora
    const metaNueva = entradas.map(metaDe);
    const metaAnterior = (estaciones[i].playlists ?? []).map(({ id, shuffle }) => ({ id, shuffle }));
    const cambioConfig = JSON.stringify(metaNueva) !== JSON.stringify(metaAnterior);
    if (cambioConfig) {
      estaciones[i] = { ...estaciones[i], playlists: metaNueva };
      await guardarEstaciones(estaciones);
    }
    return { cambioConfig, playlists: metaNueva.length };
  });
}

/** Lista de pistas de una playlist, leída de su .m3u (para la API 1 o diagnóstico). */
export async function leerPistasDePlaylist(slug: string, id: string): Promise<string[] | null> {
  try {
    const texto = await readFile(path.join(carpetaPlaylists(slug), `${id}.m3u`), 'utf8');
    return texto
      .split('\n')
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => path.basename(l));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}


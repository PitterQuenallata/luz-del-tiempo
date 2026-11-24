import { eq } from 'drizzle-orm';
import { parseBuffer } from 'music-metadata';
import { db } from '../../db/index.js';
import { stationTracks } from '../../db/schema.js';
import { leerAudioRadio } from './radio-sync.js';

// Etiquetas de los audios (ID3, Vorbis, MP4…). Solo completa lo que está vacío:
// nunca pisa un dato que ya escribió alguien a mano en el panel.

export interface Etiquetas {
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
  genre: string | null;
  durationSec: number | null;
}

const texto = (v: string | undefined | null) => (v?.trim() ? v.trim().slice(0, 120) : null);

export async function leerEtiquetas(datos: Uint8Array, mimeType?: string): Promise<Etiquetas> {
  const vacio: Etiquetas = { title: null, artist: null, album: null, year: null, genre: null, durationSec: null };
  try {
    const meta = await parseBuffer(datos, { mimeType: mimeType || undefined }, { duration: true });
    const anio = meta.common.year && meta.common.year >= 1900 && meta.common.year <= 2100 ? meta.common.year : null;
    return {
      title: texto(meta.common.title),
      artist: texto(meta.common.artist),
      album: texto(meta.common.album),
      year: anio,
      genre: texto(meta.common.genre?.[0]),
      durationSec: meta.format.duration ? Math.round(meta.format.duration) : null,
    };
  } catch {
    return vacio;
  }
}

type Pista = typeof stationTracks.$inferSelect;

/** Campos a completar: lo que está vacío, o el título que es solo el nombre del archivo. */
function cambiosDesde(pista: Pista, e: Etiquetas): Partial<Pista> {
  const stem = pista.storageKey.replace(/\.[^.]+$/, '');
  const cambios: Partial<Pista> = {};
  if (e.title && (!pista.title?.trim() || pista.title === stem)) cambios.title = e.title;
  if (e.artist && !pista.artist?.trim()) cambios.artist = e.artist;
  if (e.album && !pista.album?.trim()) cambios.album = e.album;
  if (e.year && !pista.year) cambios.year = e.year;
  if (e.genre && !pista.genre?.trim()) cambios.genre = e.genre;
  if (e.durationSec && !pista.durationSec) cambios.durationSec = e.durationSec;
  return cambios;
}

/** Lee las etiquetas de cada audio en la radio y completa los campos vacíos. Devuelve cuántos cambiaron. */
export async function releerEtiquetas(slug: string, pistas: Pista[]) {
  let actualizadas = 0;
  let sinEtiquetas = 0;
  let noLeidas = 0;
  for (const pista of pistas) {
    let datos: Uint8Array;
    try {
      datos = await leerAudioRadio(slug, pista.storageKey);
    } catch {
      noLeidas++;
      continue;
    }
    const etiquetas = await leerEtiquetas(datos);
    const cambios = cambiosDesde(pista, etiquetas);
    if (!Object.keys(cambios).length) {
      if (!etiquetas.title && !etiquetas.artist) sinEtiquetas++;
      continue;
    }
    await db.update(stationTracks).set(cambios).where(eq(stationTracks.id, pista.id));
    actualizadas++;
  }
  return { revisadas: pistas.length, actualizadas, sinEtiquetas, noLeidas };
}

import type { ApiPista } from '../../../shared/api/luz-api';

// Lógica de metadatos de los audios. Un audio "sin datos" no muestra «Desconocido»:
// muestra en rojo lo que falta y el nombre del archivo, y el resto se marca como opcional.

/** Nombre del archivo sin extensión (lo que queda cuando no hay etiquetas). */
export const nombreDeArchivo = (p: Pick<ApiPista, 'storageKey'>) => p.storageKey.replace(/\.[^.]+$/, '');

/** Título real: el que tiene el audio en sus etiquetas o el que escribió alguien. */
export const tituloReal = (p: Pick<ApiPista, 'title' | 'storageKey'>) => {
  const t = p.title?.trim();
  return t && t !== nombreDeArchivo(p) ? t : null;
};

/** Lo que el oyente y el locutor necesitan: título y artista. Año, álbum y género son opcionales. */
export function faltantes(p: ApiPista) {
  const obligatorios: string[] = [];
  if (!tituloReal(p)) obligatorios.push('título');
  if (!p.artist?.trim()) obligatorios.push('artista');
  const opcionales: string[] = [];
  if (!p.album?.trim()) opcionales.push('álbum');
  if (!p.year) opcionales.push('año');
  if (!p.genre?.trim()) opcionales.push('género');
  return { obligatorios, opcionales };
}

export const duracion = (segundos: number | null) => {
  if (segundos == null) return '—';
  const m = Math.floor(segundos / 60);
  return `${m}:${String(segundos % 60).padStart(2, '0')}`;
};

export const megas = (bytes: number) => (bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`);

/** Carpeta para mostrar: vacía = «Sin carpeta». */
export const etiquetaCarpeta = (carpeta: string) => carpeta || 'Sin carpeta';

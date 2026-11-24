import { eq } from 'drizzle-orm';
import { stationTracks } from '../../db/schema.js';

// Archivos de la radio. Hay dos niveles:
// - Archivo de la ESTACIÓN: audios propios de esa estación (su AutoDJ puede usarlos).
// - Archivo de la EMISORA: audios de la emisora entera; todas sus estaciones pueden usarlos.
// Una emisora nunca ve el archivo de otra.

/** Cuota de cada archivo (MB). */
export const CUOTA_ARCHIVO_MB = 10240;

/** Nombre de la carpeta en la radio-api del archivo de una emisora (corto y único). */
export const archivoRadio = (r: { id: string }) => `arch-${r.id.replace(/-/g, '').slice(0, 12)}`;

export const filtroArchivoEstacion = (estacionId: string) => eq(stationTracks.stationId, estacionId);
export const filtroArchivoEmisora = (radioId: string) => eq(stationTracks.radioId, radioId);

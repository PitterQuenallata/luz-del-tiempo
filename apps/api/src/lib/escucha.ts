/**
 * Dónde escuchan los oyentes. Cada emisora tiene su propio Icecast (como AzuraCast): su dirección es
 * el servidor público (PUBLIC_STREAM_HOST, sin puerto) + el puerto de oyentes de la emisora + su mount.
 */
const SERVIDOR = (process.env.PUBLIC_STREAM_HOST ?? 'http://localhost').replace(/\/$/, '');

/** Puerto de oyentes de la emisora (o 8000 si todavía no tiene uno asignado) */
export function puertoOyentesDe(e: { icecastPort: number | null }): number {
  return e.icecastPort ?? 8000;
}

/** Enlace de escucha de la emisora, o null si no tiene transmisión */
export function urlEscucha(e: { icecastPort: number | null; mountPoint: string | null }): string | null {
  return e.mountPoint ? `${SERVIDOR}:${puertoOyentesDe(e)}${e.mountPoint}` : null;
}

import { config } from './config.js';

export interface EstadoMount {
  mount: string;
  online: boolean;
  listeners: number;
  listenerPeak: number;
  title: string | null;
  bitrate: number | null;
  startedAt: string | null;
}

interface FuenteIcecast {
  listenurl?: string;
  listeners?: number;
  listener_peak?: number;
  title?: string;
  artist?: string;
  bitrate?: number;
  stream_start_iso8601?: string;
}

/** Lee el estado de UN Icecast (el de una emisora, en su puerto de oyentes). */
async function estadoDeUno(puerto: number): Promise<Map<string, EstadoMount> | null> {
  let res: Response;
  try {
    res = await fetch(`http://${config.icecastHost}:${puerto}/status-json.xsl`, { signal: AbortSignal.timeout(3000) });
  } catch {
    return null; // emisora apagada o Icecast caído
  }
  if (!res.ok) return null;
  // Icecast a veces manda "title": - sin comillas cuando falta; se corrige antes de parsear.
  const texto = (await res.text()).replace(/:\s*-\s*([,}])/g, ':null$1');
  const datos = JSON.parse(texto) as { icestats?: { source?: FuenteIcecast | FuenteIcecast[] } };

  const fuentes = datos.icestats?.source;
  const lista = Array.isArray(fuentes) ? fuentes : fuentes ? [fuentes] : [];
  const mapa = new Map<string, EstadoMount>();
  for (const f of lista) {
    if (!f.listenurl) continue;
    const mount = new URL(f.listenurl).pathname;
    const titulo = [f.artist, f.title].filter(Boolean).join(' - ');
    mapa.set(mount, {
      mount,
      online: true,
      listeners: f.listeners ?? 0,
      listenerPeak: f.listener_peak ?? 0,
      title: titulo || null,
      bitrate: f.bitrate ?? null,
      startedAt: f.stream_start_iso8601 ?? null,
    });
  }
  return mapa;
}

/**
 * Estado de los mounts de todas las emisoras. Cada estación tiene su propio Icecast (como AzuraCast),
 * así que se pregunta a cada uno en su puerto. `respondio` dice si alguno contestó.
 */
export async function estadoIcecastDe(estaciones: { icecast_port?: number }[]): Promise<{ mapa: Map<string, EstadoMount>; respondio: boolean }> {
  const resultados = await Promise.all(estaciones.filter((e) => (e.icecast_port ?? 0) > 0).map((e) => estadoDeUno(e.icecast_port as number)));
  const mapa = new Map<string, EstadoMount>();
  for (const r of resultados) if (r) for (const [mount, estado] of r) mapa.set(mount, estado);
  return { mapa, respondio: resultados.some((r) => r !== null) };
}

export function estadoApagado(mount: string): EstadoMount {
  return { mount, online: false, listeners: 0, listenerPeak: 0, title: null, bitrate: null, startedAt: null };
}

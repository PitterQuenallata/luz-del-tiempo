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

/** Lee /status-json.xsl de Icecast. Devuelve un mapa por mount ("/salud"). */
export async function estadoIcecast(): Promise<Map<string, EstadoMount>> {
  const res = await fetch(`${config.icecastUrl}/status-json.xsl`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`Icecast respondió ${res.status}`);
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

export function estadoApagado(mount: string): EstadoMount {
  return { mount, online: false, listeners: 0, listenerPeak: 0, title: null, bitrate: null, startedAt: null };
}

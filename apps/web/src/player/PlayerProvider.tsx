/**
 * Reproductor global. Vive fuera de las rutas, así la radio sigue sonando
 * al navegar entre páginas.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Hls from "hls.js";
import type { Station } from "../api/types";

/** Calidad elegida por quien escucha: automática (según la señal), alta o ahorro de datos. */
export type Calidad = "auto" | "alta" | "baja";
const CLAVE_CALIDAD = "luz-calidad";

function leerCalidad(): Calidad {
  try {
    const v = localStorage.getItem(CLAVE_CALIDAD);
    return v === "alta" || v === "baja" ? v : "auto";
  } catch {
    return "auto";
  }
}

/** Enlace HLS de la calidad elegida. Si la estación no tiene HLS, queda el MP3 de siempre. */
export function enlaceDe(station: Station, calidad: Calidad): string {
  if (!station.hlsUrl) return station.streamUrl;
  if (calidad === "auto") return station.hlsUrl;
  return station.hlsUrl.replace(/live\.m3u8$/, calidad === "alta" ? "alta.m3u8" : "baja.m3u8");
}

type Status = "idle" | "loading" | "playing" | "paused" | "error";

type PlayerState = {
  station: Station | null;
  status: Status;
  volume: number;
  muted: boolean;
  calidad: Calidad;
  setCalidad: (c: Calidad) => void;
  play: (station?: Station) => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [calidad, setCalidadState] = useState<Calidad>(leerCalidad);
  const hlsRef = useRef<Hls | null>(null);

  // Conecta el audio: HLS si la estación lo tiene (Safari lo lee directo; el resto con hls.js), MP3 si no.
  const conectar = useCallback((target: Station, cal: Calidad) => {
    const a = audioRef.current;
    if (!a) return;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    const url = enlaceDe(target, cal);
    if (!target.hlsUrl) {
      a.src = url;
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: false, enableWorker: true });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        // Si el HLS falla de forma irrecuperable, queda el MP3 de siempre
        if (data.fatal) {
          hls.destroy();
          hlsRef.current = null;
          a.src = target.streamUrl;
          void a.play().catch(() => setStatus("error"));
        }
      });
      hls.loadSource(url);
      hls.attachMedia(a);
      hlsRef.current = hls;
    } else if (a.canPlayType("application/vnd.apple.mpegurl")) {
      a.src = url;
    } else {
      a.src = target.streamUrl;
    }
  }, []);

  const setCalidad = useCallback(
    (c: Calidad) => {
      setCalidadState(c);
      try {
        localStorage.setItem(CLAVE_CALIDAD, c);
      } catch {
        /* sin almacenamiento: la elección vale solo esta vez */
      }
      // Si está sonando, reconecta con la nueva calidad
      if (station && (status === "playing" || status === "loading")) {
        conectar(station, c);
        setStatus("loading");
        void audioRef.current?.play().catch(() => setStatus("error"));
      }
    },
    [station, status, conectar],
  );

  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "none";
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const on = (ev: string, s: Status) => {
      const h = () => setStatus(s);
      a.addEventListener(ev, h);
      return () => a.removeEventListener(ev, h);
    };
    const offs = [on("playing", "playing"), on("pause", "paused"), on("waiting", "loading"), on("error", "error")];
    return () => offs.forEach((off) => off());
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  const play = useCallback(
    (next?: Station) => {
      const a = audioRef.current;
      const target = next ?? station;
      if (!a || !target) return;
      if (!station || target.slug !== station.slug || status === "error") {
        // Streams en vivo: siempre conectar de nuevo para no quedar atrasados.
        conectar(target, calidad);
        setStation(target);
      }
      setStatus("loading");
      a.play().catch(() => setStatus("error"));
    },
    [station, status, calidad, conectar],
  );

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !station) return;
    if (status === "playing" || status === "loading") {
      a.pause();
      hlsRef.current?.destroy(); // corta la descarga del stream
      hlsRef.current = null;
      a.removeAttribute("src");
      a.load();
      setStatus("paused");
    } else {
      play(station);
    }
  }, [play, station, status]);

  const value = useMemo<PlayerState>(
    () => ({
      station,
      status,
      volume,
      muted,
      calidad,
      setCalidad,
      play,
      toggle,
      setVolume: (v) => {
        setVolumeState(v);
        if (v > 0) setMuted(false);
      },
      toggleMute: () => setMuted((m) => !m),
    }),
    [station, status, volume, muted, calidad, setCalidad, play, toggle],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer debe usarse dentro de <PlayerProvider>");
  return ctx;
}

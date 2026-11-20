/**
 * Reproductor global. Vive fuera de las rutas, así la radio sigue sonando
 * al navegar entre páginas.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Station } from "../api/types";

type Status = "idle" | "loading" | "playing" | "paused" | "error";

type PlayerState = {
  station: Station | null;
  status: Status;
  volume: number;
  muted: boolean;
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
        a.src = target.streamUrl;
        setStation(target);
      }
      setStatus("loading");
      a.play().catch(() => setStatus("error"));
    },
    [station, status],
  );

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !station) return;
    if (status === "playing" || status === "loading") {
      a.pause();
      a.removeAttribute("src"); // corta la descarga del stream
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
      play,
      toggle,
      setVolume: (v) => {
        setVolumeState(v);
        if (v > 0) setMuted(false);
      },
      toggleMute: () => setMuted((m) => !m),
    }),
    [station, status, volume, muted, play, toggle],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer debe usarse dentro de <PlayerProvider>");
  return ctx;
}

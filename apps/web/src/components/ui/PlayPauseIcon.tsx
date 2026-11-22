import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

/** Ícono de reproducir/pausar que gira y cambia de tamaño al alternar. */
export function PlayPauseIcon({ playing, size = 15, className = "" }: { playing: boolean; size?: number; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={playing ? "pause" : "play"}
        className={`grid place-items-center ${className}`}
        initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {playing ? (
          <Pause size={size} fill="currentColor" />
        ) : (
          // El triángulo se ve corrido a la izquierda: se compensa un poco.
          <Play size={size} fill="currentColor" style={{ marginLeft: size * 0.08 }} />
        )}
      </motion.span>
    </AnimatePresence>
  );
}

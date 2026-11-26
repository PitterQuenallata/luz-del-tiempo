import { AnimatePresence, motion } from "motion/react";
import { ChevronUp, Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useStations } from "../../api";
import { usePlayer } from "../../player/PlayerProvider";
import { Equalizer } from "../ui/Equalizer";
import { LogoMark } from "./Logo";

/** Barra fija abajo. Aparece cuando el usuario elige una emisora y no se corta al navegar. */
export function PlayerBar() {
  const { station, status, toggle, play, volume, setVolume, muted, toggleMute, calidad, setCalidad } = usePlayer();
  const { data: stations = [] } = useStations();
  const [picker, setPicker] = useState(false);
  const playing = status === "playing";

  return (
    <AnimatePresence>
      {station && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6"
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          <div className="relative mx-auto flex max-w-[1152px] 2xl:max-w-[1296px] items-center gap-3 rounded-xl border border-oro-500/60 bg-noche-800/95 p-2 pr-3 shadow-2xl backdrop-blur-lg sm:gap-4">
            <div className="relative hidden h-12 w-16 shrink-0 place-items-center rounded-md sm:grid" style={{ background: station.art }}>
              <LogoMark className="h-9 w-9" />
            </div>
            <button
              type="button"
              onClick={toggle}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-oro-500 text-noche-900 transition hover:bg-oro-400 active:scale-95"
              aria-label={playing ? "Pausar" : "Reproducir"}
            >
              {status === "loading" ? <Loader2 className="animate-spin" size={20} /> : playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="rounded-[3px] bg-oro-500 px-1.5 py-0.5 text-noche-900">En vivo</span>
                <span className="truncate text-oro-400">{station.name}</span>
                <Equalizer active={playing} color="#e2a927" className="h-3" />
              </div>
              <p className="mt-0.5 truncate text-sm font-bold">
                {status === "error" ? "Señal no disponible por ahora" : station.nowPlaying}
              </p>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <button type="button" onClick={toggleMute} aria-label={muted ? "Activar sonido" : "Silenciar"} className="text-niebla-300 hover:text-white">
                {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volumen"
                className="w-24 accent-oro-500"
              />
            </div>

            <label
              className="flex items-center gap-1.5 text-xs text-niebla-300"
              title="Automática cambia la calidad según tu señal. Ahorro de datos gasta menos en 3G y 4G."
            >
              <span className="hidden sm:inline">Calidad</span>
              <select
                value={calidad}
                onChange={(e) => setCalidad(e.target.value as "auto" | "alta" | "baja")}
                aria-label="Calidad de audio"
                className="min-h-10 rounded-md border border-white/15 bg-transparent px-2 text-xs text-white"
              >
                <option className="text-black" value="auto">Automática</option>
                <option className="text-black" value="alta">Alta</option>
                <option className="text-black" value="baja">Ahorro de datos</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => setPicker((p) => !p)}
              className="btn-borde min-h-10 px-3 text-xs"
              aria-expanded={picker}
            >
              <span className="hidden sm:inline">Cambiar emisora</span>
              <span className="sm:hidden">Emisoras</span>
              <ChevronUp size={14} className={`transition ${picker ? "" : "rotate-180"}`} />
            </button>

            <AnimatePresence>
              {picker && (
                <motion.ul
                  className="absolute right-2 bottom-full mb-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-noche-800 p-1.5 shadow-2xl"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  {stations.map((s) => {
                    const on = s.slug === station.slug;
                    return (
                      <li key={s.slug}>
                        <button
                          type="button"
                          onClick={() => {
                            play(s);
                            setPicker(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg border p-1.5 text-left transition ${
                            on ? "border-oro-500 bg-oro-500/15" : "border-transparent hover:bg-white/5"
                          }`}
                        >
                          <span className="grid h-10 w-16 shrink-0 place-items-center rounded-md font-serif text-xs font-semibold" style={{ background: s.art }}>
                            {s.genre}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-bold">{s.name}</span>
                            <span className="block truncate text-xs text-niebla-200">{s.nowPlaying}</span>
                          </span>
                          {on && <Equalizer active={playing} color="#e2a927" className="h-3.5" />}
                        </button>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

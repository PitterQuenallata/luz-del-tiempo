import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useStations } from "../../api";
import { usePlayer } from "../../player/PlayerProvider";
import { Equalizer } from "../ui/Equalizer";
import { BandHeading, Reveal } from "../ui/Reveal";
import { SmartImage } from "../ui/SmartImage";

/** Banda "Nuestras emisoras": tarjeta grande de la emisora elegida + lista para cambiar. */
export function StationsBand() {
  const { data: stations = [] } = useStations();
  const player = usePlayer();
  const [picked, setPicked] = useState<string | null>(null);
  const current = stations.find((s) => s.slug === (picked ?? player.station?.slug)) ?? stations[0];
  if (!current) return null;

  const isThis = player.station?.slug === current.slug;
  const playing = isThis && (player.status === "playing" || player.status === "loading");

  return (
    <section id="emisoras" className="banda-2 pt-10 pb-12">
      <div className="contenedor flex flex-col gap-5">
        <BandHeading
          eyebrow="Nuestras emisoras"
          text={`${stations.length} señales al aire las 24 horas. Elige una y escucha.`}
          action={<a href="#envivo" className="btn-oro min-h-9 text-xs">Ir al reproductor</a>}
        />
        <div className="flex flex-wrap items-stretch gap-5">
          <Reveal className="relative aspect-video min-w-0 flex-[2_1_520px] overflow-hidden rounded-xl">
            <AnimatePresence initial={false}>
              <motion.div
                key={current.slug}
                className="absolute inset-0 flex flex-col justify-center gap-1.5 p-6 sm:p-9"
                style={{ background: current.art }}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Foto de la emisora a la derecha; el texto queda sobre la parte oscura de la izquierda */}
                <SmartImage src={current.imageUrl} alt={`Emisora ${current.name}`} />
                <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,19,36,0.92)_0%,rgba(11,19,36,0.6)_45%,rgba(11,19,36,0)_80%)]" />
                <span className="absolute top-3 left-3 z-10 rounded bg-oro-500 px-1.5 py-0.5 text-xs font-semibold text-noche-900">En vivo 24/7</span>
                <span className="relative font-serif text-[15px] text-oro-400">Emisora</span>
                <motion.span
                  className="relative font-serif text-[clamp(40px,7vw,84px)] leading-none font-semibold uppercase"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {current.genre}
                </motion.span>
                <span className="relative max-w-sm font-serif text-lg text-[#e8dcc0] sm:text-xl">{current.description}</span>
                {playing && <Equalizer active color="#e2a927" bars={6} className="relative mt-3 h-6" />}
              </motion.div>
            </AnimatePresence>
          </Reveal>

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
            {stations.map((s) => {
              const on = s.slug === current.slug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setPicked(s.slug)}
                  aria-pressed={on}
                  className={`flex items-center gap-4 rounded-lg border p-1.5 text-left transition ${on ? "border-oro-500 bg-oro-500/15" : "border-transparent hover:bg-white/5"}`}
                >
                  <span className="grid h-16 w-28 shrink-0 place-items-center rounded-md font-serif text-[17px] font-semibold" style={{ background: s.art }}>
                    {s.genre}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] font-bold">{s.name}</span>
                    <span className="truncate text-xs text-niebla-200">{s.description}</span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => (isThis ? player.toggle() : player.play(current))}
              className="group mt-auto flex items-center justify-between gap-3 rounded-xl bg-oro-500 px-5 py-4 text-left text-noche-900 transition hover:bg-oro-400"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold">Escuchar</span>
                <span className="text-sm font-semibold">{current.name}</span>
                <span className="text-xs font-medium">{playing ? "Reproduciendo en vivo" : "En vivo ahora"} · {current.listeners} oyentes</span>
              </span>
              <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold">{playing ? "Pausar" : "Oír"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

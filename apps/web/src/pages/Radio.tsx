import { CalendarDays, Pause, Play, Users } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useSchedule, useStations } from "../api";
import type { Station } from "../api/types";
import { Equalizer } from "../components/ui/Equalizer";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { splitSchedule } from "../lib/schedule";
import { usePlayer } from "../player/PlayerProvider";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * /radio — En vivo. Arriba siempre la radio principal (Radio La Luz del Tiempo).
 * Debajo, las emisoras temáticas (música, prédicas, salud…) si el ministerio tiene;
 * si no hay ninguna, esa sección no aparece.
 */
export default function Radio() {
  const { data: stations = [] } = useStations();
  const { data: schedule = [] } = useSchedule();
  const player = usePlayer();

  const main = stations.find((s) => s.isMain) ?? stations[0];
  const others = stations.filter((s) => s !== main);
  if (!main) return <div className="min-h-[70vh]" />;

  const playingSlug = player.status === "playing" || player.status === "loading" ? player.station?.slug : null;
  const mainPlaying = playingSlug === main.slug;
  const { current: now, upcoming } = splitSchedule(schedule, main.slug);
  const toggle = (s: Station) => (player.station?.slug === s.slug ? player.toggle() : player.play(s));

  return (
    <>
      <title>En vivo · Radio La Luz del Tiempo</title>

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: main.art }}>
          <SmartImage src={main.imageUrl} eager />
        </div>
        <span className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(11,19,36,0.95)_0%,rgba(11,19,36,0.75)_45%,rgba(11,19,36,0.25)_100%)]" />
        <span className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-noche-900 to-transparent" />

        <div className="contenedor grid min-h-[clamp(420px,58vh,620px)] grid-cols-1 items-end gap-10 py-10 lg:grid-cols-[1.5fr_1fr]">
          <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <span className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-2 rounded-full bg-oro-500 px-3 py-1 font-semibold text-noche-900">
                <span className="h-2 w-2 rounded-full bg-noche-900" /> En vivo las 24 horas
              </span>
              <span className="flex items-center gap-1.5 text-niebla-200"><Users size={15} /> {main.listeners} oyentes</span>
            </span>
            <h1 className="titulo text-[clamp(40px,5.4vw,84px)] leading-[0.98]">{main.name}</h1>
            <p className="max-w-lg text-[clamp(16px,1.1vw,19px)] text-niebla-100">{main.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => toggle(main)}
                className="flex items-center gap-4 rounded-full bg-oro-500 py-2 pr-6 pl-2 text-lg font-semibold text-noche-900 transition-[background-color,transform] hover:bg-oro-400 active:scale-[0.98]"
                aria-label={mainPlaying ? `Pausar ${main.name}` : `Escuchar ${main.name}`}
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-noche-900 text-oro-500">
                  {mainPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </span>
                {mainPlaying ? "Escuchando" : "Escuchar ahora"}
              </button>
              {mainPlaying && <Equalizer active color="#e2a927" bars={6} className="h-7" />}
            </div>
            {player.status === "error" && player.station?.slug === main.slug && (
              <span className="text-sm text-niebla-300">Señal no disponible por ahora. Intenta en un momento</span>
            )}
          </motion.div>

          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-noche-900/70 p-5 backdrop-blur">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-oro-400">Sonando ahora</span>
              <span className="titulo text-xl leading-tight">{now?.programName ?? main.nowPlaying}</span>
              {now?.host && <span className="text-sm text-niebla-300">{now.host}</span>}
            </div>
            {upcoming.length > 0 && (
              <ul className="flex flex-col gap-2 border-t border-white/10 pt-3 text-sm">
                {upcoming.slice(0, 3).map((u) => (
                  <li key={u.start} className="flex gap-3">
                    <span className="w-12 shrink-0 font-semibold tabular-nums text-oro-400">{u.start}</span>
                    <span>{u.programName}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/programacion" className="btn-borde min-h-10 self-start text-xs"><CalendarDays size={15} /> Ver la programación</Link>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="contenedor flex flex-col gap-4 py-10">
          <RowHeading title="Emisoras" />
          <p className="-mt-2 text-sm text-niebla-300">Señales temáticas que también transmiten las 24 horas</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s, i) => {
              const on = playingSlug === s.slug;
              const { current: ahora, upcoming: proximos } = splitSchedule(schedule, s.slug);
              return (
                <Reveal key={s.slug} delay={0.06 * i}>
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    aria-pressed={on}
                    aria-label={on ? `Pausar ${s.name}` : `Escuchar ${s.name}`}
                    className={`group flex w-full flex-col overflow-hidden rounded-xl border text-left transition-colors ${on ? "border-oro-500" : "border-white/[0.08] hover:border-white/25"}`}
                  >
                    <span className="relative flex aspect-[16/8] items-end overflow-hidden p-4" style={{ background: s.art }}>
                      <SmartImage src={s.imageUrl} className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
                      <span className="absolute inset-0 bg-gradient-to-t from-noche-900/85 to-transparent" />
                      <span className="relative font-serif text-3xl font-semibold uppercase">{s.genre}</span>
                      <span className="relative ml-auto grid h-12 w-12 place-items-center rounded-full bg-oro-500 text-noche-900 transition-colors group-hover:bg-oro-400">
                        {on ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                      </span>
                    </span>
                    <span className="flex flex-col gap-1 p-4">
                      <span className="flex items-center gap-2">
                        <span className="titulo text-lg">{s.name}</span>
                        {on && <Equalizer active color="#e2a927" className="h-4" />}
                      </span>
                      <span className="text-sm text-niebla-200">{s.description}</span>
                      {ahora && <span className="truncate text-xs text-niebla-300">Ahora: {ahora.programName}</span>}
                      {proximos.length > 0 && (
                        <span className="mt-1 flex flex-col gap-0.5 border-t border-white/10 pt-2 text-xs text-niebla-300">
                          {proximos.slice(0, 2).map((u) => (
                            <span key={u.start + u.programName} className="truncate">
                              <span className="font-semibold tabular-nums text-oro-400">{u.start}</span> {u.programName}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

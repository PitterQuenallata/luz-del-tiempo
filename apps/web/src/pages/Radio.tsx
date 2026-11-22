import { CalendarDays, Users } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";
import { Link } from "react-router";
import { useSchedule, useStations } from "../api";
import type { Station } from "../api/types";
import { absoluta, Seo } from "../components/Seo";
import { Equalizer } from "../components/ui/Equalizer";
import { PlayPauseIcon } from "../components/ui/PlayPauseIcon";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { Tilt } from "../components/ui/Tilt";
import { programProgress, splitSchedule } from "../lib/schedule";
import { usePlayer } from "../player/PlayerProvider";

const ease = [0.22, 1, 0.36, 1] as const;

/** Número que sube contando desde cero al aparecer. */
function Contador({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("es-BO"));
  useEffect(() => {
    const c = animate(mv, value, { duration: reduce ? 0 : 1.4, ease });
    return () => c.stop();
  }, [mv, value, reduce]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

/** Datos estructurados: cada emisora como RadioStation de schema.org. */
function jsonLd(stations: Station[]) {
  return {
    "@context": "https://schema.org",
    "@graph": stations.map((s) => ({
      "@type": "RadioStation",
      name: s.name,
      description: s.description,
      genre: s.genre,
      url: absoluta("/radio"),
      ...(s.imageUrl ? { image: absoluta(s.imageUrl) } : {}),
      openingHours: "Mo-Su 00:00-23:59",
      parentOrganization: { "@type": "Organization", name: "Ministerio La Luz del Tiempo" },
      address: { "@type": "PostalAddress", addressCountry: "BO" },
    })),
  };
}

/**
 * /radio — Radio en vivo. Arriba siempre la radio principal (Radio La Luz del Tiempo).
 * Debajo, las emisoras temáticas (música, prédicas, salud…) si el ministerio tiene;
 * si no hay ninguna, esa sección no aparece.
 */
export default function Radio() {
  const { data: stations = [] } = useStations();
  const { data: schedule = [] } = useSchedule();
  const player = usePlayer();

  const main = stations.find((s) => s.isMain) ?? stations[0];
  const others = stations.filter((s) => s !== main);

  const seo = (
    <Seo
      title="Radio en vivo 24/7 · La Luz del Tiempo"
      description="Escucha en vivo Radio La Luz del Tiempo y sus emisoras de música, prédicas y salud. Gratis, las 24 horas y sin anuncios, desde Bolivia."
      jsonLd={stations.length ? jsonLd(stations) : undefined}
    />
  );
  if (!main) return <>{seo}<div className="min-h-[70vh]" /></>;

  const playingSlug = player.status === "playing" || player.status === "loading" ? player.station?.slug : null;
  const mainPlaying = playingSlug === main.slug;
  const { current: now, upcoming } = splitSchedule(schedule, main.slug);
  const toggle = (s: Station) => (player.station?.slug === s.slug ? player.toggle() : player.play(s));

  return (
    <>
      {seo}

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: main.art }}>
          {/* Acercamiento lento de la foto: la portada "respira" */}
          <motion.div className="absolute inset-0" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 9, ease: "linear" }}>
            <SmartImage src={main.imageUrl} alt="" eager sizes="100vw" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
          </motion.div>
        </div>
        {/* Escritorio: oscuro a la izquierda. Celular: oscuro desde abajo, donde va el texto. */}
        <span className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(11,19,36,0.95)_0%,rgba(11,19,36,0.75)_45%,rgba(11,19,36,0.25)_100%)] md:block" />
        <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(11,19,36,0.98)_0%,rgba(11,19,36,0.85)_45%,rgba(11,19,36,0.35)_100%)] md:hidden" />
        <span className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-noche-900 to-transparent" />

        <div className="contenedor grid min-h-[clamp(420px,58vh,620px)] grid-cols-1 items-end gap-6 pt-24 pb-8 md:gap-10 md:py-10 lg:grid-cols-[1.5fr_1fr]">
          <motion.div
            className="flex flex-col gap-4"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {[
              <span key="pill" className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-2 rounded-full bg-oro-500 px-3 py-1 font-semibold text-noche-900">
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inset-0 animate-ping rounded-full bg-noche-900/70" />
                    <span className="relative h-2 w-2 rounded-full bg-noche-900" />
                  </span>
                  En vivo las 24 horas
                </span>
                <span className="flex items-center gap-1.5 text-niebla-200">
                  <Users size={15} aria-hidden /> <Contador value={main.listeners} /> oyentes
                </span>
              </span>,
              <h1 key="h1" className="titulo text-[clamp(38px,5.4vw,84px)] leading-[0.98]">{main.name}</h1>,
              <p key="p" className="max-w-lg text-[clamp(16px,1.1vw,19px)] text-niebla-100">{main.description}</p>,
              <div key="play" className="mt-2 flex flex-wrap items-center gap-5">
                <motion.button
                  type="button"
                  onClick={() => toggle(main)}
                  whileTap={{ scale: 0.96 }}
                  className={`btn-brillo flex items-center gap-4 rounded-full bg-oro-500 py-2 pr-6 pl-2 text-lg font-semibold text-noche-900 transition-colors hover:bg-oro-400 ${mainPlaying ? "" : "pulso-vivo"}`}
                  aria-pressed={mainPlaying}
                  aria-label={mainPlaying ? `Pausar ${main.name}` : `Escuchar ${main.name}`}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-noche-900 text-oro-500">
                    <PlayPauseIcon playing={mainPlaying} size={24} />
                  </span>
                  {mainPlaying ? "Escuchando" : "Escuchar ahora"}
                </motion.button>
                {mainPlaying && <Equalizer active color="#e2a927" bars={6} className="h-7" />}
              </div>,
            ].map((el, i) => (
              <motion.div key={i} className="flex flex-col" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}>
                {el}
              </motion.div>
            ))}
            {player.status === "error" && player.station?.slug === main.slug && (
              <span className="text-sm text-niebla-300" role="status">Señal no disponible por ahora. Intenta en un momento</span>
            )}
          </motion.div>

          <motion.div
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-noche-900/70 p-5 backdrop-blur"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
          >
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-sm text-oro-400">
                Sonando ahora
                {mainPlaying && <Equalizer active color="#f0c35a" className="h-3" />}
              </span>
              <span className="titulo text-xl leading-tight">{now?.programName ?? main.nowPlaying}</span>
              {now?.host && <span className="text-sm text-niebla-300">{now.host}</span>}
              {now && (
                <span className="mt-2 flex items-center gap-2 text-xs tabular-nums text-niebla-400">
                  {now.start}
                  <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Avance del programa" aria-valuenow={Math.round(programProgress(now) * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full bg-oro-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${programProgress(now) * 100}%` }}
                      transition={{ duration: 1.2, delay: 0.6, ease }}
                    />
                  </span>
                  {now.end}
                </span>
              )}
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
            <Link to="/programacion" className="btn-borde self-start text-xs">
              <CalendarDays size={15} aria-hidden /> Ver la programación
            </Link>
          </motion.div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="contenedor flex flex-col gap-4 py-10">
          <RowHeading title="Emisoras" />
          <p className="-mt-2 text-sm text-niebla-300">Señales temáticas que también transmiten las 24 horas</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s, i) => {
              const on = playingSlug === s.slug;
              return (
                <Reveal key={s.slug} delay={0.06 * i}>
                  <Tilt className="rounded-xl" max={5}>
                    <button
                      type="button"
                      onClick={() => toggle(s)}
                      aria-pressed={on}
                      aria-label={on ? `Pausar ${s.name}` : `Escuchar ${s.name}`}
                      className={`group flex w-full flex-col overflow-hidden rounded-xl border bg-noche-900 text-left transition-[border-color,box-shadow] duration-300 ${
                        on ? "border-oro-500 shadow-[0_0_0_1px_rgb(226_169_39/0.5),0_12px_40px_-12px_rgb(226_169_39/0.45)]" : "border-white/[0.08] hover:border-white/25"
                      }`}
                    >
                      <span className="relative flex aspect-[16/8] items-end overflow-hidden p-4" style={{ background: s.art }}>
                        <SmartImage
                          src={s.imageUrl}
                          alt=""
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-500 group-hover:scale-105 group-hover:brightness-110"
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-noche-900/85 to-transparent" />
                        <span className="relative font-serif text-3xl font-semibold uppercase">{s.genre}</span>
                        <span className="relative ml-auto grid h-12 w-12 place-items-center rounded-full bg-oro-500 text-noche-900 transition-[background-color,transform] duration-200 group-hover:scale-110 group-hover:bg-oro-400">
                          <PlayPauseIcon playing={on} size={20} />
                        </span>
                      </span>
                      <span className="flex flex-col gap-1 p-4">
                        <span className="flex items-center gap-2">
                          <span className="titulo text-lg">{s.name}</span>
                          {on && <Equalizer active color="#e2a927" className="h-4" />}
                        </span>
                        <span className="text-sm text-niebla-200">{s.description}</span>
                        <span className="truncate text-xs text-niebla-300">Ahora: {s.nowPlaying}</span>
                      </span>
                    </button>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

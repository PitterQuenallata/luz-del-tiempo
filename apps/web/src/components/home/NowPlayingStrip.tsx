import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useLive, useSchedule, useStations } from "../../api";
import { splitSchedule } from "../../lib/schedule";
import { usePlayer } from "../../player/PlayerProvider";
import { LogoMark, Wordmark } from "../layout/Logo";
import { Equalizer } from "../ui/Equalizer";
import { PlayPauseIcon } from "../ui/PlayPauseIcon";
import { LoadError, Sk, SkeletonRegion, SkText } from "../ui/Skeleton";
import { EASE } from "../../lib/motion";

/** "Estamos presentando": lo que suena ahora + los próximos programas en la barra dorada. */
export function NowPlayingStrip() {
  const { data: stations = [], isPending, isError, refetch } = useStations();
  const { data: schedule = [] } = useSchedule();
  const { data: live } = useLive();
  const player = usePlayer();
  // Transmisión en otra plataforma (no la radio) para el aviso "También en vivo en…".
  const otraTransmision = live?.streams.find((s) => s.platform !== "radio");
  const [idx, setIdx] = useState(0);

  // Si ya hay una emisora sonando, la tira muestra esa.
  const selected = player.station ?? stations[idx];
  if (!selected) {
    if (isError)
      return (
        <section id="envivo" className="scroll-mt-24 px-4 pt-7 sm:px-6">
          <div className="mx-auto max-w-[1152px] 2xl:max-w-[1296px]">
            <LoadError compact onRetry={() => void refetch()} message="No pudimos cargar las emisoras" />
          </div>
        </section>
      );
    return isPending ? <NowPlayingSkeleton /> : null;
  }

  const { current, upcoming } = splitSchedule(schedule, selected.slug);
  const nextAll = splitSchedule(schedule).upcoming.slice(0, 3);
  const isThis = player.station?.slug === selected.slug;
  const playing = isThis && (player.status === "playing" || player.status === "loading");

  const cycle = () => {
    const next = stations[(stations.findIndex((s) => s.slug === selected.slug) + 1) % stations.length];
    if (!next) return;
    if (player.station) player.play(next);
    else setIdx(stations.indexOf(next));
  };

  return (
    <section id="envivo" className="scroll-mt-24 px-4 pt-7 sm:px-6">
      <motion.div
        className="mx-auto max-w-[1152px] 2xl:max-w-[1296px] overflow-hidden rounded-xl border border-oro-500 bg-noche-800"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: EASE }}
      >
        <div className="flex flex-wrap items-center gap-5 p-4 sm:p-5">
          <motion.div
            key={selected.slug}
            className="relative grid h-28 w-full shrink-0 place-items-center overflow-hidden rounded-lg sm:w-[200px]"
            style={{ background: selected.art }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="absolute top-2 left-2 rounded bg-oro-500 px-1.5 py-0.5 text-xs font-semibold text-noche-900">En vivo</span>
            <span className="flex items-center gap-2">
              <LogoMark className="h-14 w-14" />
              <Wordmark size="md" />
            </span>
            {playing && (
              <span className="absolute right-2 bottom-2">
                <Equalizer active color="#e2a927" className="h-4" />
              </span>
            )}
          </motion.div>

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {current && <span className="rounded-[3px] bg-oro-500 px-1.5 py-0.5 text-noche-900">{current.start}</span>}
              <span className="text-oro-400">Estamos presentando · {selected.name}</span>
            </div>
            <motion.span key={selected.slug + "t"} className="text-xl leading-tight font-bold" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              {current?.programName ?? selected.nowPlaying}
            </motion.span>
            <span className="text-[13px] text-niebla-400">{current?.host ?? selected.description}</span>
            <span className="text-xs text-niebla-400">
              {player.status === "error" && isThis ? "Señal no disponible por ahora" : `${playing ? "Reproduciendo en vivo" : "En vivo ahora"} · ${selected.listeners} oyentes`}
              {upcoming[0] && ` · Después: ${upcoming[0].programName}`}
            </span>
            {live?.isLive && otraTransmision && (
              <a href={otraTransmision.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-2 self-start rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/80" />
                  <span className="relative h-2 w-2 rounded-full bg-white" />
                </span>
                También en vivo en {otraTransmision.platform === "tiktok" ? "TikTok" : otraTransmision.platform === "facebook" ? "Facebook" : "YouTube"}: {live.title}
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          <div className="flex min-w-[130px] flex-[1_1_100%] flex-row flex-wrap gap-1.5 sm:flex-[0_1_160px] sm:flex-col">
            <button
              type="button"
              onClick={() => (isThis ? player.toggle() : player.play(selected))}
              className={`btn-oro btn-brillo flex-1 ${playing ? "" : "pulso-vivo"}`}
              aria-pressed={playing}
            >
              <PlayPauseIcon playing={playing} />
              {playing ? "Pausar" : "Escuchar en vivo"}
            </button>
            <button type="button" onClick={cycle} className="btn-borde flex-1">Cambiar emisora</button>
            <Link to="/programacion" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-noche-600 px-4 text-[13px] font-semibold text-niebla-100 hover:bg-noche-700">
              Programación
            </Link>
          </div>
        </div>

        {/* Barra dorada con los próximos programas */}
        <div className="overflow-hidden bg-oro-500 py-2.5 text-xs font-semibold text-noche-900">
          <div className="hidden justify-between gap-6 px-5 sm:flex">
            {nextAll.map((x) => (
              <span key={x.start + x.programName}><b className="mr-2 font-semibold">{x.start}</b>{x.programName}</span>
            ))}
          </div>
          <div className="flex w-max animate-marquee gap-10 sm:hidden">
            {[...nextAll, ...nextAll].map((x, i) => (
              <span key={i} className="whitespace-nowrap"><b className="mr-2 font-semibold">{x.start}</b>{x.programName}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/** Esqueleto de la tira: misma caja, mismas columnas y misma barra dorada por breakpoint. */
function NowPlayingSkeleton() {
  return (
    <section id="envivo" className="scroll-mt-24 px-4 pt-7 sm:px-6">
      <SkeletonRegion label="Cargando la radio en vivo" className="mx-auto max-w-[1152px] overflow-hidden rounded-xl border border-oro-500/40 bg-noche-800 2xl:max-w-[1296px]">
        <div className="flex flex-wrap items-center gap-5 p-4 sm:p-5">
          <Sk className="h-28 w-full shrink-0 sm:w-[200px]" />
          <span className="flex min-h-[123px] min-w-0 flex-[1_1_320px] sm:min-h-[112px] flex-col justify-center gap-2.5">
            <Sk className="h-4 w-48" />
            <Sk className="h-6 w-3/4" />
            <Sk className="h-3.5 w-2/3" />
            <SkText lines={2} line="h-3" className="max-w-md" />
          </span>
          <span className="flex min-w-[130px] flex-[1_1_100%] flex-row flex-wrap gap-1.5 sm:flex-[0_1_160px] sm:flex-col">
            <Sk className="h-11 flex-1 rounded-lg sm:flex-none" />
            <Sk className="h-11 flex-1 rounded-lg sm:flex-none" />
            <Sk className="h-11 flex-1 rounded-md sm:flex-none" />
          </span>
        </div>
        <Sk className="h-9 rounded-none bg-oro-500/25" />
      </SkeletonRegion>
    </section>
  );
}

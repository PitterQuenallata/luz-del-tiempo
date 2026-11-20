import { Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSchedule, useStations } from "../../api";
import { nowBolivia } from "../../lib/schedule";
import { usePlayer } from "../../player/PlayerProvider";
import { Equalizer } from "../ui/Equalizer";
import { Reveal, RowHeading } from "../ui/Reveal";

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/**
 * "Hoy en la radio": la línea del día con todos los programas. Lo que ya pasó
 * queda tenue, lo que suena ahora resaltado con su botón, y lo que viene normal.
 * La fila se desliza sola hasta el programa actual.
 */
export function LatestAndToday() {
  const { data: schedule = [] } = useSchedule();
  const { data: stations = [] } = useStations();
  const player = usePlayer();
  const rowRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);
  const now = nowBolivia();

  const items = [...schedule].sort((a, b) => toMin(a.start) - toMin(b.start));
  const stationOf = (slug: string) => stations.find((s) => s.slug === slug);
  const currentIdx = items.findIndex((i) => toMin(i.start) <= now && now < toMin(i.end));
  const nextIdx = items.findIndex((i) => toMin(i.start) > now);
  const focusIdx = currentIdx >= 0 ? currentIdx : nextIdx;

  useEffect(() => {
    const row = rowRef.current;
    const card = nowRef.current;
    if (row && card) row.scrollTo({ left: Math.max(0, card.offsetLeft - row.offsetLeft - 16), behavior: "smooth" });
  }, [focusIdx, items.length]);

  if (!items.length) return null;

  return (
    <section className="pt-14 pb-14">
      <div className="contenedor flex flex-col gap-5">
        <RowHeading title="Hoy en la radio" to="/programacion" label="ver la semana" />
        <Reveal>
          <div ref={rowRef} className="-mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {items.map((r, i) => {
              const st = stationOf(r.stationSlug);
              const isNow = i === currentIdx;
              const past = currentIdx >= 0 ? i < currentIdx : nextIdx >= 0 ? i < nextIdx : true;
              const playing = isNow && player.station?.slug === st?.slug && (player.status === "playing" || player.status === "loading");
              return (
                <div
                  key={r.start + r.stationSlug}
                  ref={i === focusIdx ? nowRef : undefined}
                  className={`relative flex w-[78%] shrink-0 snap-start flex-col gap-3 overflow-hidden rounded-xl border p-4 sm:w-64 ${
                    isNow ? "border-oro-500 bg-noche-800" : "border-white/[0.08]"
                  } ${past ? "opacity-45" : ""}`}
                >
                  {isNow && (
                    <span className="absolute inset-x-0 top-0 h-1 bg-oro-500" aria-hidden />
                  )}
                  <span className="flex items-center justify-between gap-2">
                    <span className={`font-display text-2xl font-semibold tabular-nums ${isNow ? "text-oro-400" : "text-white"}`}>{r.start}</span>
                    {isNow ? (
                      <span className="rounded-full bg-oro-500 px-2.5 py-0.5 text-xs font-semibold text-noche-900">Ahora</span>
                    ) : (
                      <span className="text-xs text-niebla-300">hasta {r.end === "23:59" ? "24:00" : r.end}</span>
                    )}
                  </span>
                  <span className="flex min-h-[3.25rem] flex-col gap-1">
                    <span className="text-base leading-snug font-semibold">{r.programName}</span>
                    <span className="truncate text-sm text-niebla-300">{r.host}</span>
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: `${st?.color}26`, color: st?.color }}>
                      {st?.name}
                    </span>
                    {isNow && st && (
                      <button
                        type="button"
                        onClick={() => (playing ? player.toggle() : player.play(st))}
                        className="flex items-center gap-2 rounded-full bg-oro-500 py-1 pr-3 pl-1 text-xs font-semibold text-noche-900 transition-colors hover:bg-oro-400"
                        aria-label={playing ? "Pausar" : `Escuchar ${r.programName}`}
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-noche-900 text-oro-500">
                          {playing ? <Equalizer active color="#e2a927" bars={3} className="h-3" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
                        </span>
                        {playing ? <Pause size={12} fill="currentColor" /> : "Escuchar"}
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

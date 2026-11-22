import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { useScheduleDay, useStations } from "../api";
import type { ScheduleItem, Station } from "../api/types";
import { PageBody } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { Chips } from "../components/shared/Chips";
import { Equalizer } from "../components/ui/Equalizer";
import { PlayPauseIcon } from "../components/ui/PlayPauseIcon";
import { nowBolivia, programProgress } from "../lib/schedule";
import { usePlayer } from "../player/PlayerProvider";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/** La semana se muestra de lunes a domingo. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const ease = [0.22, 1, 0.36, 1] as const;

/** Día de la semana en Bolivia (0 = domingo). */
const todayBolivia = () => {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "America/La_Paz", weekday: "short" }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
};

/** Fecha (AAAA-MM-DD) en Bolivia del día elegido dentro de esta semana. */
function fechaDelDia(day: number, today: number) {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" }).format(new Date());
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ORDER.indexOf(day) - ORDER.indexOf(today));
  return d.toISOString().slice(0, 10);
}

/** Programas del día como BroadcastEvent de schema.org (Bolivia es UTC-4 todo el año). */
function jsonLd(rows: ScheduleItem[], fecha: string, stationOf: (slug: string) => Station | undefined) {
  const hora = (t: string) => (t === "23:59" || t === "24:00" ? "23:59" : t);
  return {
    "@context": "https://schema.org",
    "@graph": rows.map((r) => ({
      "@type": "BroadcastEvent",
      name: r.programName,
      ...(r.host ? { performer: { "@type": "Person", name: r.host } } : {}),
      startDate: `${fecha}T${hora(r.start)}:00-04:00`,
      endDate: `${fecha}T${hora(r.end)}:00-04:00`,
      isLiveBroadcast: r.isLive,
      publishedOn: { "@type": "RadioStation", name: stationOf(r.stationSlug)?.name ?? "La Luz del Tiempo", url: absoluta("/radio") },
    })),
  };
}

/** /programacion — Guía semanal (como la guía de TV de SUMtv: hoy, día anterior, siguiente). */
export default function Programacion() {
  const today = todayBolivia();
  const [day, setDay] = useState(today);
  const [station, setStation] = useState("todas");
  const { data: items = [] } = useScheduleDay(day);
  const { data: stations = [] } = useStations();
  const player = usePlayer();
  const now = nowBolivia();

  // Hacia dónde se desliza la lista al cambiar de día: adelante entra por la derecha, atrás por la izquierda.
  const prevDay = useRef(day);
  const dir = Math.sign(ORDER.indexOf(day) - ORDER.indexOf(prevDay.current)) || 1;
  const changeDay = (d: number) => {
    prevDay.current = day;
    setDay(d);
  };

  const dayOptions = ORDER.map((d) => ({ id: String(d), label: d === today ? `Hoy · ${DAYS[d]}` : DAYS[d]! }));
  const stationOptions = [{ id: "todas", label: "Todas las emisoras" }, ...stations.map((s) => ({ id: s.slug, label: s.name }))];

  const rows = useMemo(
    () => items.filter((i) => station === "todas" || i.stationSlug === station).sort((a, b) => toMin(a.start) - toMin(b.start)),
    [items, station],
  );
  const stationOf = (slug: string) => stations.find((s) => s.slug === slug);
  const playingSlug = player.status === "playing" || player.status === "loading" ? player.station?.slug : null;

  return (
    <>
      <Seo
        title={`Programación de ${day === today ? "hoy" : DAYS[day]!.toLowerCase()} · Radio La Luz del Tiempo`}
        description="Horarios de la radio La Luz del Tiempo en Bolivia: prédicas, música, salud y programas en vivo de lunes a domingo."
        jsonLd={rows.length ? jsonLd(rows, fechaDelDia(day, today), stationOf) : undefined}
      />
      <PageBody className="gap-5">
        {/* Sin cabecera: título y días en una sola barra, y la grilla de inmediato */}
        <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <motion.div className="flex flex-col gap-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <h1 className="titulo text-[clamp(28px,2.6vw,38px)] leading-none">Programación</h1>
            <p className="text-sm text-niebla-300">Horarios de Bolivia</p>
          </motion.div>
          <Chips label="Día" options={dayOptions} value={String(day)} onChange={(v) => changeDay(Number(v))} />
        </div>
        <Chips label="Emisora" options={stationOptions} value={station} onChange={setStation} />

        <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.ul
              key={`${day}-${station}`}
              custom={dir}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: 12 * d }),
                show: { opacity: 1, x: 0, transition: { duration: 0.3, ease, staggerChildren: 0.035 } },
                exit: (d: number) => ({ opacity: 0, x: -12 * d, transition: { duration: 0.18 } }),
              }}
              initial="enter"
              animate="show"
              exit="exit"
              aria-label={`Programas del ${DAYS[day]}`}
            >
              {rows.length === 0 && <li className="p-8 text-center text-niebla-300">No hay programas para este filtro</li>}
              {rows.map((r) => {
                const st = stationOf(r.stationSlug);
                const isToday = day === today;
                const isNow = isToday && toMin(r.start) <= now && now < toMin(r.end);
                const isPast = isToday && toMin(r.end) <= now;
                const sounding = isNow && st && playingSlug === st.slug;
                return (
                  <motion.li
                    key={r.start + r.stationSlug}
                    variants={{ enter: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className={`relative grid grid-cols-[64px_1fr] gap-x-4 gap-y-3 border-b border-white/[0.06] px-4 py-4 transition-colors last:border-b-0 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:px-5 ${
                      isNow ? "bg-oro-500/10" : "hover:bg-white/[0.03]"
                    } ${isPast ? "opacity-55" : ""}`}
                    aria-current={isNow ? "time" : undefined}
                  >
                    {/* Barra dorada a la izquierda del programa en emisión */}
                    {isNow && <span className="absolute inset-y-0 left-0 w-1 bg-oro-500" aria-hidden />}

                    <span
                      className={`flex flex-col font-display font-semibold tabular-nums leading-tight sm:w-36 sm:shrink-0 sm:flex-row sm:text-xl sm:whitespace-nowrap ${
                        isNow ? "text-oro-400" : "text-niebla-300"
                      }`}
                    >
                      <span className="text-lg sm:text-xl">{r.start}</span>
                      <span className="text-xs text-niebla-400 sm:text-xl sm:text-inherit">
                        <span className="hidden sm:inline">–</span>
                        {r.end === "23:59" ? "24:00" : r.end}
                      </span>
                    </span>

                    <span className="flex min-w-0 flex-col gap-1 sm:flex-[1_1_240px]">
                      <span className="flex items-center gap-2 text-base font-semibold">
                        {r.programName}
                        {sounding && <Equalizer active color="#e2a927" className="h-3.5" />}
                      </span>
                      {r.host && <span className="text-sm text-niebla-300">{r.host}</span>}
                      {isNow && (
                        <span
                          className="mt-1 block h-1 max-w-xs overflow-hidden rounded-full bg-white/10"
                          role="progressbar"
                          aria-label="Avance del programa"
                          aria-valuenow={Math.round(programProgress(r, now) * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <motion.span
                            className="block h-full rounded-full bg-oro-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${programProgress(r, now) * 100}%` }}
                            transition={{ duration: 1, delay: 0.3, ease }}
                          />
                        </span>
                      )}
                    </span>

                    <span className="col-start-2 flex flex-wrap items-center gap-2">
                      {isNow && (
                        <span className="flex items-center gap-1.5 rounded-full bg-oro-500 px-3 py-1 text-xs font-semibold text-noche-900">
                          <span className="relative flex h-1.5 w-1.5" aria-hidden>
                            <span className="absolute inset-0 animate-ping rounded-full bg-noche-900/70" />
                            <span className="relative h-1.5 w-1.5 rounded-full bg-noche-900" />
                          </span>
                          Ahora
                        </span>
                      )}
                      {r.isLive && !isNow && <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-niebla-200">En vivo</span>}
                      <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: `${st?.color}26`, color: st?.color }}>
                        {st?.name}
                      </span>
                      {isNow && st && (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => (player.station?.slug === st.slug ? player.toggle() : player.play(st))}
                          aria-pressed={!!sounding}
                          className={`btn-oro btn-brillo min-h-11 px-4 text-xs ${sounding ? "" : "pulso-vivo"}`}
                        >
                          <PlayPauseIcon playing={!!sounding} size={14} />
                          {sounding ? "Pausar" : "Escuchar"}
                        </motion.button>
                      )}
                    </span>
                  </motion.li>
                );
              })}
            </motion.ul>
          </AnimatePresence>
        </div>
      </PageBody>
    </>
  );
}

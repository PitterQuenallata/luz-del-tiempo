import { Play } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useScheduleDay, useStations } from "../api";
import { PageBody } from "../components/layout/PageHeader";
import { Chips } from "../components/shared/Chips";
import { nowBolivia } from "../lib/schedule";
import { usePlayer } from "../player/PlayerProvider";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Día de la semana en Bolivia (0 = domingo). */
const todayBolivia = () => {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "America/La_Paz", weekday: "short" }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
};

/** /programacion — Guía semanal (como la guía de TV de SUMtv: hoy, día anterior, siguiente). */
export default function Programacion() {
  const today = todayBolivia();
  const [day, setDay] = useState(today);
  const [station, setStation] = useState("todas");
  const { data: items = [] } = useScheduleDay(day);
  const { data: stations = [] } = useStations();
  const player = usePlayer();
  const now = nowBolivia();

  const order = [1, 2, 3, 4, 5, 6, 0];
  const dayOptions = order.map((d) => ({ id: String(d), label: d === today ? `Hoy · ${DAYS[d]}` : DAYS[d]! }));
  const stationOptions = [{ id: "todas", label: "Todas las emisoras" }, ...stations.map((s) => ({ id: s.slug, label: s.name }))];

  const rows = useMemo(
    () => items.filter((i) => station === "todas" || i.stationSlug === station).sort((a, b) => toMin(a.start) - toMin(b.start)),
    [items, station],
  );
  const stationOf = (slug: string) => stations.find((s) => s.slug === slug);

  return (
    <>
      <title>Programación · La Luz del Tiempo</title>
      <PageBody className="gap-5">
        {/* Sin cabecera: título y días en una sola barra, y la grilla de inmediato */}
        <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="titulo text-[clamp(28px,2.6vw,38px)] leading-none">Programación</h1>
            <p className="text-sm text-niebla-300">Horarios de Bolivia</p>
          </div>
          <Chips label="Día" options={dayOptions} value={String(day)} onChange={(v) => setDay(Number(v))} />
        </div>
        <Chips label="Emisora" options={stationOptions} value={station} onChange={setStation} />

        <motion.ul
          key={`${day}-${station}`}
          className="overflow-hidden rounded-2xl border border-white/[0.08]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {rows.length === 0 && <li className="p-8 text-center text-niebla-300">No hay programas para este filtro</li>}
          {rows.map((r) => {
            const st = stationOf(r.stationSlug);
            const isNow = day === today && toMin(r.start) <= now && now < toMin(r.end);
            return (
              <li
                key={r.start + r.stationSlug}
                className={`flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/[0.06] px-5 py-4 last:border-b-0 ${isNow ? "bg-oro-500/10" : ""}`}
              >
                <span className={`w-36 shrink-0 whitespace-nowrap font-display text-xl font-semibold tabular-nums ${isNow ? "text-oro-400" : "text-niebla-300"}`}>
                  {r.start}–{r.end === "23:59" ? "24:00" : r.end}
                </span>
                <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                  <span className="text-base font-semibold">{r.programName}</span>
                  <span className="text-sm text-niebla-300">{r.host}</span>
                </span>
                <span className="flex items-center gap-2">
                  {isNow && <span className="rounded-full bg-oro-500 px-3 py-1 text-xs font-semibold text-noche-900">Ahora</span>}
                  {r.isLive && !isNow && <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-niebla-200">En vivo</span>}
                  <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: `${st?.color}26`, color: st?.color }}>
                    {st?.name}
                  </span>
                  {isNow && st && (
                    <button type="button" onClick={() => player.play(st)} className="btn-oro min-h-9 px-3 text-xs">
                      <Play size={14} fill="currentColor" /> Escuchar
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </motion.ul>
      </PageBody>
    </>
  );
}

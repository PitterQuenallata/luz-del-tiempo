import { useQueries } from "@tanstack/react-query";
import { api } from "../../api";
import type { ScheduleItem } from "../../api/types";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const ORDEN = [1, 2, 3, 4, 5, 6, 0]; // lunes primero (0 = domingo)
const ALTO_HORA = 56; // px por hora
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Vista semanal: una columna por día y cada programa como bloque en su horario. */
export function GuiaSemanal({
  station,
  colorDe,
  hoy,
  ahora,
}: {
  station: string;
  colorDe: (slug: string) => string | undefined;
  hoy: number;
  ahora: number;
}) {
  const consultas = useQueries({
    queries: ORDEN.map((d) => ({ queryKey: ["schedule", d], queryFn: () => api.scheduleDay(d) })),
  });
  const cargando = consultas.some((q) => q.isLoading);
  const horas = Array.from({ length: 24 }, (_, h) => h);
  const alto = 24 * ALTO_HORA;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
      <div className="grid min-w-[780px] grid-cols-[56px_repeat(7,minmax(0,1fr))]">
        {/* Encabezados */}
        <div />
        {ORDEN.map((d, i) => (
          <div key={d} className={`border-b border-white/[0.08] px-2 py-3 text-center text-sm font-semibold ${d === hoy ? "text-oro-400" : "text-niebla-200"}`}>
            {DIAS[i]}
          </div>
        ))}

        {/* Horas */}
        <div className="relative" style={{ height: alto }}>
          {horas.map((h) => (
            <span key={h} className="absolute right-2 -translate-y-2 text-[11px] tabular-nums text-niebla-300" style={{ top: h * ALTO_HORA }}>
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        {/* Columnas por día */}
        {ORDEN.map((d, i) => {
          const items: ScheduleItem[] = (consultas[i]?.data ?? []).filter((r) => station === "todas" || r.stationSlug === station);
          return (
            <div key={d} className={`relative border-l border-white/[0.06] ${d === hoy ? "bg-oro-500/[0.04]" : ""}`} style={{ height: alto }}>
              {horas.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-white/[0.05]" style={{ top: h * ALTO_HORA }} />
              ))}
              {d === hoy && (
                <div className="absolute inset-x-0 z-10 border-t-2 border-oro-400" style={{ top: (ahora / 60) * ALTO_HORA }} />
              )}
              {items.map((r) => {
                const inicio = toMin(r.start);
                const fin = r.end === "23:59" ? 1440 : toMin(r.end);
                const color = colorDe(r.stationSlug) ?? "#e2a927";
                const enCurso = d === hoy && inicio <= ahora && ahora < fin;
                return (
                  <div
                    key={r.start + r.stationSlug + d}
                    className="absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-[11px] leading-tight"
                    style={{
                      top: (inicio / 60) * ALTO_HORA + 1,
                      height: Math.max(((fin - inicio) / 60) * ALTO_HORA - 2, 22),
                      background: `${color}22`,
                      borderColor: enCurso ? "#e2a927" : `${color}55`,
                    }}
                    title={`${r.start}–${r.end} · ${r.programName}${r.host ? ` · ${r.host}` : ""}`}
                  >
                    <span className="block font-semibold tabular-nums text-niebla-100">{r.start}</span>
                    <span className="block truncate text-niebla-100">{r.programName}</span>
                    {r.host && <span className="block truncate text-niebla-300">{r.host}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {cargando && <p className="p-4 text-sm text-niebla-300">Cargando la semana…</p>}
    </div>
  );
}

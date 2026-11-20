import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useActivities, useAreas } from "../api";
import { ACTIVITY_TYPE_LABEL, type ActivityType } from "../api/types";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { ActivityPoster, useCountdown } from "../components/shared/ActivityBits";
import { Chips } from "../components/shared/Chips";
import { Reveal } from "../components/ui/Reveal";
import type { Activity } from "../api/types";

/** /actividades — Próximas actividades, escuelas y campañas (como "Todos los eventos" de SUMtv). */
export default function Actividades() {
  const { data: activities = [] } = useActivities();
  const { data: areas = [] } = useAreas();
  const [type, setType] = useState<"todas" | ActivityType>("todas");

  const types = [...new Set(activities.map((a) => a.type))];
  const list = activities.filter((a) => type === "todas" || a.type === type);
  const colorOf = (slug: string | null) => areas.find((a) => a.slug === slug)?.color ?? "#2c4580";

  return (
    <>
      <title>Actividades · La Luz del Tiempo</title>
      <PageHeader title="Actividades y escuelas" subtitle="Escuelas, talleres, campañas de salud y estudios bíblicos. Inscríbete por WhatsApp">
        {activities[0] && <NextUp a={activities[0]} />}
      </PageHeader>
      <PageBody className="gap-6">
        <Chips
          label="Tipo de actividad"
          options={[{ id: "todas" as const, label: "Todas" }, ...types.map((t) => ({ id: t, label: ACTIVITY_TYPE_LABEL[t] }))]}
          value={type}
          onChange={setType}
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((a, i) => (
            <Reveal key={a.slug} delay={0.05 * i}>
              <ActivityPoster a={a} color={colorOf(a.areaSlug)} />
            </Reveal>
          ))}
        </div>
        {list.length === 0 && <p className="py-12 text-center text-niebla-300">No hay actividades de este tipo por ahora</p>}
      </PageBody>
    </>
  );
}

/** Próxima actividad en la cabecera: así ese espacio sirve de algo. */
function NextUp({ a }: { a: Activity }) {
  const c = useCountdown(a.startsAt);
  return (
    <Link to={`/actividades/${a.slug}`} className="group flex w-full max-w-sm items-center gap-4 rounded-2xl border border-oro-500/40 bg-noche-800/80 p-4 transition-colors hover:border-oro-500 sm:w-auto">
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-xs text-oro-400">Próxima actividad</span>
        <span className="truncate font-semibold">{a.title}</span>
        <span className="text-sm tabular-nums text-niebla-200">
          Faltan {c.días} d {c.horas} h {c.min} min
        </span>
      </span>
      <ArrowRight size={18} className="ml-auto shrink-0 text-oro-400 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

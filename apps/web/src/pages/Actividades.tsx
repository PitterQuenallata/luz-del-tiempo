import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { useActivities, useAreas } from "../api";
import { ACTIVITY_TYPE_LABEL, type Activity, type ActivityType } from "../api/types";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { Seo } from "../components/Seo";
import { ActivityPoster, useCountdown } from "../components/shared/ActivityBits";
import { Chips } from "../components/shared/Chips";
import { eventJsonLd } from "../lib/eventos";
import { LoadError, Sk, SkeletonRegion } from "../components/ui/Skeleton";
import { EASE, stagger } from "../lib/motion";

/** /actividades — Próximas actividades, escuelas y campañas (como "Todos los eventos" de SUMtv). */
export default function Actividades() {
  const { data: activities = [], isPending, isError, refetch } = useActivities();
  const { data: areas = [] } = useAreas();
  const [type, setType] = useState<"todas" | ActivityType>("todas");

  const types = [...new Set(activities.map((a) => a.type))];
  const list = activities.filter((a) => type === "todas" || a.type === type);
  const colorOf = (slug: string | null) => areas.find((a) => a.slug === slug)?.color ?? "#2c4580";

  return (
    <>
      <Seo
        title="Actividades, escuelas y campañas · La Luz del Tiempo"
        description="Escuelas de vacaciones y de música, campañas de salud, talleres y estudios bíblicos del ministerio La Luz del Tiempo en Bolivia. Inscríbete por WhatsApp."
        jsonLd={activities.length ? { "@context": "https://schema.org", "@graph": activities.map(eventJsonLd) } : undefined}
      />
      <PageHeader title="Actividades y escuelas" subtitle="Escuelas, talleres, campañas de salud y estudios bíblicos. Inscríbete por WhatsApp">
        {activities[0] ? <NextUp a={activities[0]} /> : isPending && <Sk className="h-[92px] w-full max-w-sm rounded-2xl sm:w-72" />}
      </PageHeader>
      <PageBody className="gap-6">
        <Chips
          label="Tipo de actividad"
          options={[{ id: "todas" as const, label: "Todas" }, ...types.map((t) => ({ id: t, label: ACTIVITY_TYPE_LABEL[t] }))]}
          value={type}
          onChange={setType}
        />
        {/* Al filtrar, los afiches que salen se encogen y los que quedan se acomodan deslizándose */}
        <motion.div layout className={isPending ? "hidden" : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"}>
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((a, i) => (
              <motion.div
                key={a.slug}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5, delay: stagger(i % 4), ease: EASE }}
              >
                <ActivityPoster a={a} color={colorOf(a.areaSlug)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {isPending && (
          <SkeletonRegion label="Cargando actividades" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Sk key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </SkeletonRegion>
        )}
        {isError && <LoadError onRetry={() => void refetch()} message="No pudimos cargar las actividades" />}
        {!isPending && !isError && list.length === 0 && <p className="py-12 text-center text-niebla-300">No hay actividades de este tipo por ahora</p>}
      </PageBody>
    </>
  );
}

/** Próxima actividad en la cabecera: así ese espacio sirve de algo. */
function NextUp({ a }: { a: Activity }) {
  const c = useCountdown(a.startsAt);
  return (
    <Link
      to={`/actividades/${a.slug}`}
      className="group flex w-full max-w-sm items-center gap-4 rounded-2xl border border-oro-500/40 bg-noche-800/80 p-4 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-oro-500 hover:shadow-[0_12px_32px_-14px_rgb(226_169_39/0.5)] sm:w-auto"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 text-xs text-oro-400">
          <span className="relative flex h-1.5 w-1.5" aria-hidden>
            <span className="absolute inset-0 animate-ping rounded-full bg-oro-400/70" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-oro-400" />
          </span>
          Próxima actividad
        </span>
        <span className="truncate font-semibold">{a.title}</span>
        <span className="text-sm tabular-nums text-niebla-200">
          Faltan {c.días} d {c.horas} h {c.min} min
        </span>
      </span>
      <ArrowRight size={18} className="ml-auto shrink-0 text-oro-400 transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

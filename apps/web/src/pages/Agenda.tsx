import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useActivities, useAgendaFiltros, useAreas } from "../api";
import type { Activity } from "../api/types";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { Seo } from "../components/Seo";
import { ActivityPoster, useCountdown } from "../components/shared/ActivityBits";
import { Chips } from "../components/shared/Chips";
import { eventJsonLd } from "../lib/eventos";
import { LoadError, Sk, SkeletonRegion } from "../components/ui/Skeleton";
import { EASE, stagger } from "../lib/motion";

/** /agenda — campañas, escuelas, talleres, cursos y eventos. Se filtra por tipo, área, precio, formato y fecha. */
export default function Agenda() {
  const [estado, setEstado] = useState<"proximas" | "pasadas">("proximas");
  const [tipo, setTipo] = useState<string>("todas");
  const [area, setArea] = useState<string>("todas");
  const [gratis, setGratis] = useState(false);
  const [virtual, setVirtual] = useState(false);

  const filtros = useMemo(
    () => ({
      estado,
      tipo: tipo === "todas" ? undefined : tipo,
      area: area === "todas" ? undefined : area,
      gratis: gratis || undefined,
      virtual: virtual || undefined,
    }),
    [estado, tipo, area, gratis, virtual],
  );

  const { data: activities = [], isPending, isError, refetch } = useActivities(filtros);
  const { data: meta } = useAgendaFiltros();
  const { data: areas = [] } = useAreas();
  const colorOf = (a: Activity) => areas.find((x) => x.slug === a.areas[0]?.slug)?.color ?? "#2c4580";

  return (
    <>
      <Seo
        title="Agenda: campañas, escuelas, talleres y cursos · La Luz del Tiempo"
        description="Campañas evangelísticas, escuelas de vacaciones, expos de salud, talleres, cursos y estudios bíblicos del ministerio La Luz del Tiempo en Bolivia. Inscríbete desde la web."
        jsonLd={activities.length ? { "@context": "https://schema.org", "@graph": activities.map(eventJsonLd) } : undefined}
      />
      <PageHeader title="Agenda" subtitle="Campañas, escuelas, talleres, cursos y eventos. Inscríbete desde la web o por WhatsApp">
        {estado === "proximas" && activities[0]?.inicio ? <NextUp a={activities[0]} /> : isPending && <Sk className="h-[92px] w-full max-w-sm rounded-2xl sm:w-72" />}
      </PageHeader>
      <PageBody className="gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {(["proximas", "pasadas"] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEstado(e)}
              aria-pressed={estado === e}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${estado === e ? "border-oro-500 bg-oro-500/15 text-oro-300" : "border-white/15 text-niebla-200 hover:border-white/40"}`}
            >
              {e === "proximas" ? "Próximas" : "Ya realizadas"}
            </button>
          ))}
          <Pastilla activo={gratis} onClick={() => setGratis((v) => !v)}>Gratis</Pastilla>
          <Pastilla activo={virtual} onClick={() => setVirtual((v) => !v)}>Virtual</Pastilla>
        </div>

        <Chips
          label="Tipo"
          options={[{ id: "todas", label: "Todas" }, ...(meta?.tipos ?? []).map((t) => ({ id: t.valor, label: t.etiqueta }))]}
          value={tipo}
          onChange={setTipo}
        />
        <Chips
          label="Área"
          options={[{ id: "todas", label: "Todas" }, ...(meta?.areas ?? []).map((a) => ({ id: a.slug, label: a.name }))]}
          value={area}
          onChange={setArea}
        />

        {/* Al filtrar, los afiches que salen se encogen y los que quedan se acomodan deslizándose */}
        <motion.div layout className={isPending ? "hidden" : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"}>
          <AnimatePresence mode="popLayout" initial={false}>
            {activities.map((a, i) => (
              <motion.div
                key={a.slug}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5, delay: stagger(i % 4), ease: EASE }}
              >
                <ActivityPoster a={a} color={colorOf(a)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {isPending && (
          <SkeletonRegion label="Cargando la agenda" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Sk key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </SkeletonRegion>
        )}
        {isError && <LoadError onRetry={() => void refetch()} message="No pudimos cargar la agenda" />}
        {!isPending && !isError && activities.length === 0 && (
          <p className="py-12 text-center text-niebla-300">
            {estado === "proximas" ? "No hay actividades con estos filtros por ahora" : "Todavía no hay actividades realizadas con estos filtros"}
          </p>
        )}
      </PageBody>
    </>
  );
}

function Pastilla({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${activo ? "border-oro-500 bg-oro-500/15 text-oro-300" : "border-white/15 text-niebla-200 hover:border-white/40"}`}
    >
      {children}
    </button>
  );
}

/** Próxima actividad en la cabecera: así ese espacio sirve de algo. */
function NextUp({ a }: { a: Activity }) {
  const c = useCountdown(a.inicio as string);
  return (
    <Link
      to={`/agenda/${a.slug}`}
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

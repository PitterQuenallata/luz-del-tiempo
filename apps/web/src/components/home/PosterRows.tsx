import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Link } from "react-router";
import { useActivities, useAreas } from "../../api";
import type { Activity } from "../../api/types";
import { ActivityPoster } from "../shared/ActivityBits";
import { AreaIcon } from "../ui/AreaIcon";
import { RowHeading } from "../ui/Reveal";
import { SmartImage } from "../ui/SmartImage";
import { Tilt } from "../ui/Tilt";
import { LoadError, Sk, SkeletonRegion } from "../ui/Skeleton";

const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

/**
 * Fila tipo afiches (3:4) que en celular se desliza de lado.
 * La visibilidad se mide en un envoltorio que NO se desliza: con `whileInView`
 * sobre el contenedor deslizable, Motion no disparaba la animación en celular.
 */
function PosterGrid({ children, hidden = false }: { children: React.ReactNode; hidden?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className={hidden ? "hidden" : undefined}>
      <motion.div
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Cuatro afiches 3:4 de esqueleto: mismo ancho por breakpoint (62 % / 40 % / grilla de 4) y misma proporción. */
function PosterSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label} className="-mx-4 flex gap-4 overflow-hidden px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:px-0">
      {[0, 1, 2, 3].map((i) => (
        <Sk key={i} className="aspect-[3/4] w-[62%] max-w-[260px] shrink-0 sm:w-[40%] md:w-auto md:max-w-none" />
      ))}
    </SkeletonRegion>
  );
}

const shade = (hex: string) => `linear-gradient(160deg, ${hex} 0%, #0b1324 115%)`;

export function ActivitiesRow() {
  const { data: activities = [], isPending, isError, refetch } = useActivities();
  const { data: areas = [] } = useAreas();
  const colorOf = (a: Activity) => areas.find((x) => x.slug === a.areas[0]?.slug)?.color ?? "#2c4580";

  return (
    <section className="pt-10 pb-6">
      <div className="contenedor flex flex-col gap-4">
        <RowHeading title="Agenda" to="/agenda" label="ver toda la agenda" />
        {isPending && <PosterSkeleton label="Cargando la agenda" />}
        {isError && <LoadError compact onRetry={() => void refetch()} message="No pudimos cargar la agenda" />}
        <PosterGrid hidden={isPending || isError}>
          {activities.slice(0, 4).map((a) => (
            <motion.div key={a.slug} variants={item} className="w-[62%] max-w-[260px] shrink-0 snap-start sm:w-[40%] md:w-auto md:max-w-none">
              <ActivityPoster a={a} color={colorOf(a)} />
            </motion.div>
          ))}
        </PosterGrid>
      </div>
    </section>
  );
}

export function AreasRow() {
  const { data: areas = [], isPending, isError, refetch } = useAreas();
  return (
    <section className="pt-6 pb-12">
      <div className="contenedor flex flex-col gap-4">
        <RowHeading title="Áreas del ministerio" to="/areas" />
        {isPending && <PosterSkeleton label="Cargando áreas" />}
        {isError && <LoadError compact onRetry={() => void refetch()} message="No pudimos cargar las áreas" />}
        <PosterGrid hidden={isPending || isError}>
          {areas.map((a) => (
            <motion.div key={a.slug} variants={item} className="w-[62%] max-w-[260px] shrink-0 snap-start sm:w-[40%] md:w-auto md:max-w-none">
              <Tilt className="rounded-lg">
              <Link to={`/areas/${a.slug}`} className="group relative flex aspect-[3/4] flex-col items-center justify-between overflow-hidden rounded-lg px-4 py-6 text-center">
                <span className="absolute inset-0 transition-[filter] duration-300 group-hover:brightness-110" style={{ background: shade(a.color) }} />
                <SmartImage src={a.coverUrl} alt={`Ministerio de ${a.name}`} sizes="(min-width: 768px) 25vw, 62vw" className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,36,0.55)_0%,rgba(11,19,36,0.15)_40%,rgba(11,19,36,0.85)_100%)]" />
                <span className="absolute -right-8 -bottom-8 text-white/10">
                  <AreaIcon icon={a.icon} size={170} strokeWidth={1} />
                </span>
                <span className="relative text-xs font-bold">Ministerio</span>
                <span className="relative poster text-[clamp(30px,3.4vw,42px)] leading-none uppercase">{a.name}</span>
                <span className="relative text-xs font-semibold text-white/85">{a.eventEnabled ? "Con evento próximo" : "Conocer más"}</span>
              </Link>
              </Tilt>
            </motion.div>
          ))}
        </PosterGrid>
      </div>
    </section>
  );
}

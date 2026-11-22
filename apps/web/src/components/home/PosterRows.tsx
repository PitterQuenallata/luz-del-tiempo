import { motion, useInView } from "motion/react";
import { CalendarDays, MapPin } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { useActivities, useAreas } from "../../api";
import { ACTIVITY_TYPE_LABEL } from "../../api/types";
import { dayMonth } from "../../lib/format";
import { AreaIcon } from "../ui/AreaIcon";
import { RowHeading } from "../ui/Reveal";
import { SmartImage } from "../ui/SmartImage";
import { Tilt } from "../ui/Tilt";

const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

/**
 * Fila tipo afiches (3:4) que en celular se desliza de lado.
 * La visibilidad se mide en un envoltorio que NO se desliza: con `whileInView`
 * sobre el contenedor deslizable, Motion no disparaba la animación en celular.
 */
function PosterGrid({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref}>
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

const shade = (hex: string) => `linear-gradient(160deg, ${hex} 0%, #0b1324 115%)`;

export function ActivitiesRow() {
  const { data: activities = [] } = useActivities();
  const { data: areas = [] } = useAreas();
  const colorOf = (slug: string | null) => areas.find((a) => a.slug === slug)?.color ?? "#2c4580";

  return (
    <section className="pt-10 pb-6">
      <div className="contenedor flex flex-col gap-4">
        <RowHeading title="Actividades y escuelas" to="/actividades" label="ver calendario" />
        <PosterGrid>
          {activities.slice(0, 4).map((a) => {
            const { day, month } = dayMonth(a.startsAt);
            return (
              <motion.div key={a.slug} variants={item} className="w-[62%] max-w-[260px] shrink-0 snap-start sm:w-[40%] md:w-auto md:max-w-none">
                <Tilt className="rounded-lg">
                <Link to={`/actividades/${a.slug}`} className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-lg p-4 text-center">
                  <span className="absolute inset-0 transition-[filter] duration-300 group-hover:brightness-110" style={{ background: shade(colorOf(a.areaSlug)) }} />
                  <SmartImage src={a.coverUrl} alt={a.title} sizes="(min-width: 768px) 25vw, 62vw" className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,36,0.55)_0%,rgba(11,19,36,0.15)_40%,rgba(11,19,36,0.85)_100%)]" />
                  <span className="relative flex items-start justify-between text-left">
                    <span className="text-xs font-bold text-white/80">{ACTIVITY_TYPE_LABEL[a.type]}</span>
                    <span className="flex flex-col items-center rounded-md bg-oro-500 px-2 py-1 leading-none text-noche-900">
                      <span className="poster text-xl">{day}</span>
                      <span className="text-xs font-semibold">{month}</span>
                    </span>
                  </span>
                  <span className="relative poster text-[clamp(22px,2.4vw,30px)] leading-[1.02] uppercase">{a.title}</span>
                  <span className="relative flex flex-col items-center gap-1 text-xs font-semibold text-white/85">
                    {a.scheduleText && <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {a.scheduleText}</span>}
                    <span className="flex items-center gap-1.5"><MapPin size={13} /> {a.isVirtual ? "Virtual" : a.locationName}</span>
                  </span>
                </Link>
                </Tilt>
              </motion.div>
            );
          })}
        </PosterGrid>
      </div>
    </section>
  );
}

export function AreasRow() {
  const { data: areas = [] } = useAreas();
  return (
    <section className="pt-6 pb-12">
      <div className="contenedor flex flex-col gap-4">
        <RowHeading title="Áreas del ministerio" to="/areas" />
        <PosterGrid>
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

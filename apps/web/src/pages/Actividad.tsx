import { CalendarDays, CalendarPlus, Clock, MapPin, Ticket, User, Users, Video as VideoIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useActivity, useAreas } from "../api";
import { ACTIVITY_TYPE_LABEL } from "../api/types";
import { LogoMark } from "../components/layout/Logo";
import { PageBody } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { Countdown, RegisterButton } from "../components/shared/ActivityBits";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { ShareButton } from "../components/ui/ShareButton";
import { SmartImage } from "../components/ui/SmartImage";
import { LoadError, Sk, SkeletonRegion } from "../components/ui/Skeleton";
import { descargarCalendario, eventJsonLd } from "../lib/eventos";
import { longDate } from "../lib/format";
import ComingSoon from "./ComingSoon";
import { EASE, stagger } from "../lib/motion";

const ease = EASE;

/** /actividades/:slug — Detalle (como la página de un evento de SUMtv: lugar, presentador, precio, horario diario). */
export default function Actividad() {
  const { slug = "" } = useParams();
  const { data: a, isLoading, isError, refetch } = useActivity(slug);
  const { data: areas = [] } = useAreas();
  if (isLoading) return <ActividadSkeleton />;
  if (isError)
    return (
      <div className="contenedor py-10">
        <LoadError onRetry={() => void refetch()} message="No pudimos cargar esta actividad" />
      </div>
    );
  if (!a) return <ComingSoon title="Actividad no encontrada" />;
  const area = areas.find((x) => x.slug === a.areaSlug);

  const facts: { icon: ReactNode; label: string; value: string }[] = [
    { icon: <CalendarDays size={18} />, label: "Fecha", value: a.endsAt ? `${longDate(a.startsAt)} al ${longDate(a.endsAt)}` : longDate(a.startsAt) },
    ...(a.scheduleText ? [{ icon: <Clock size={18} />, label: "Horario", value: a.scheduleText }] : []),
    {
      icon: a.isVirtual ? <VideoIcon size={18} /> : <MapPin size={18} />,
      label: "Lugar",
      value: a.isVirtual ? "Virtual" : [a.locationName, a.locationAddress].filter(Boolean).join(" · "),
    },
    ...(a.presenter ? [{ icon: <User size={18} />, label: "Dirige", value: a.presenter }] : []),
    ...(a.cost ? [{ icon: <Ticket size={18} />, label: "Costo", value: a.cost }] : []),
    ...(a.capacity ? [{ icon: <Users size={18} />, label: "Cupos", value: `${a.capacity} personas` }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      eventJsonLd(a),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: absoluta("/") },
          { "@type": "ListItem", position: 2, name: "Actividades", item: absoluta("/actividades") },
          { "@type": "ListItem", position: 3, name: a.title, item: absoluta(`/actividades/${a.slug}`) },
        ],
      },
    ],
  };

  return (
    <>
      <Seo title={`${a.title} · ${ACTIVITY_TYPE_LABEL[a.type]} · La Luz del Tiempo`} description={a.summary} jsonLd={jsonLd} />
      <header className="relative overflow-hidden">
        <span className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${area?.color ?? "#22376a"} 0%, #0b1324 110%)` }} />
        <span className="absolute top-6 right-6 opacity-15"><LogoMark sizes="160px" className="h-40 w-40" /></span>
        <motion.div className="absolute inset-0" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 8, ease: "linear" }}>
          <SmartImage src={a.coverUrl} alt="" eager sizes="100vw" />
        </motion.div>
        {/* Escritorio: oscuro a la izquierda. Celular: oscuro desde abajo. */}
        <span className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(11,19,36,0.94)_0%,rgba(11,19,36,0.7)_55%,rgba(11,19,36,0.35)_100%)] md:block" />
        <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(11,19,36,0.97)_0%,rgba(11,19,36,0.8)_55%,rgba(11,19,36,0.35)_100%)] md:hidden" />
        <motion.div
          className="contenedor relative grid grid-cols-1 items-end gap-6 pt-28 pb-8 sm:py-10 md:pt-10 lg:grid-cols-[1.3fr_1fr]"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          <div className="flex min-w-0 flex-col gap-3">
            {[
              <span key="crumbs" className="flex flex-wrap items-center gap-1 text-xs text-niebla-200">
                <Link to="/actividades" className="py-1.5 hover:text-oro-400">Actividades</Link>
                {area && <> · <Link to={`/areas/${area.slug}`} className="py-1.5 hover:text-oro-400">{area.name}</Link></>}
                <span className="text-oro-400"> · {ACTIVITY_TYPE_LABEL[a.type]}</span>
              </span>,
              <h1 key="h1" className="titulo max-w-3xl text-[clamp(30px,4vw,52px)] leading-[1.05]">{a.title}</h1>,
              <p key="p" className="max-w-xl text-base text-niebla-100">{a.summary}</p>,
              <div key="cta" className="mt-1 flex flex-wrap gap-2">
                <RegisterButton a={a} />
                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => descargarCalendario(a)} className="btn-borde">
                  <CalendarPlus size={16} aria-hidden /> Agendar
                </motion.button>
                <ShareButton title={a.title} text={a.summary} />
              </div>,
            ].map((el, i) => (
              <motion.div key={i} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}>
                {el}
              </motion.div>
            ))}
          </div>
          <motion.div
            className="flex flex-col gap-2 lg:items-end"
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease, delay: 0.1 } } }}
          >
            <span className="text-sm text-niebla-200">Empieza en</span>
            <Countdown iso={a.startsAt} />
          </motion.div>
        </motion.div>
      </header>

      <PageBody>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f, i) => (
            <Reveal
              key={f.label}
              delay={stagger(i)}
              className="group flex gap-3 rounded-xl border border-white/[0.08] p-4 transition-colors duration-300 hover:border-oro-500/40 hover:bg-white/[0.03]"
            >
              <span className="mt-0.5 text-oro-400 transition-transform duration-300 group-hover:scale-110" aria-hidden>{f.icon}</span>
              <span className="flex flex-col gap-1">
                <span className="text-xs text-niebla-300">{f.label}</span>
                <span className="text-[15px] font-medium">{f.value}</span>
              </span>
            </Reveal>
          ))}
        </div>

        {a.agenda.length > 0 && (
          <section className="flex flex-col gap-4">
            <RowHeading title="Horario diario" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {a.agenda.map((d, i) => (
                <Reveal key={d.day} delay={stagger(i)} className="rounded-xl border border-white/[0.08] p-5">
                  <h3 className="titulo text-lg text-oro-400">{d.day}</h3>
                  {/* Línea de tiempo: cada punto se enciende al pasar el mouse por su fila */}
                  <ul className="mt-3 flex flex-col border-l border-white/10">
                    {d.items.map((it) => {
                      const [time, ...rest] = it.split(" ");
                      return (
                        <li key={it} className="group relative flex gap-3 py-1.5 pl-4 text-[15px]">
                          <span className="absolute top-1/2 -left-[4.5px] h-2 w-2 -translate-y-1/2 rounded-full bg-noche-600 transition-colors duration-300 group-hover:bg-oro-500" aria-hidden />
                          <span className="w-12 shrink-0 font-semibold tabular-nums text-niebla-300 transition-colors group-hover:text-oro-400">{time}</span>
                          <span>{rest.join(" ")}</span>
                        </li>
                      );
                    })}
                  </ul>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <Reveal className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-oro-500 p-6 text-noche-900 sm:p-8">
          {/* Brillo que cruza la franja dorada de vez en cuando */}
          <span className="brillo-franja pointer-events-none absolute inset-0" aria-hidden />
          <span className="relative flex flex-col gap-1">
            <span className="titulo text-2xl">¿Quieres participar?</span>
            <span className="text-sm">Escríbenos y te reservamos un lugar</span>
          </span>
          <RegisterButton
            a={a}
            className="relative inline-flex min-h-11 items-center gap-2 rounded-lg bg-noche-900 px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-noche-800 active:scale-[0.96] max-sm:w-full max-sm:justify-center"
          />
        </Reveal>
      </PageBody>
    </>
  );
}

/** Esqueleto de una actividad: portada con título y cuenta regresiva (lado a lado desde laptop) y la grilla de datos. */
function ActividadSkeleton() {
  return (
    <SkeletonRegion label="Cargando la actividad">
      <span className="block bg-white/[0.03]">
        <span className="contenedor grid grid-cols-1 items-end gap-6 pt-28 pb-8 sm:py-10 md:pt-10 lg:grid-cols-[1.3fr_1fr]">
          <span className="flex flex-col gap-3">
            <Sk className="h-3 w-48" />
            <Sk className="h-[clamp(30px,4vw,52px)] w-4/5" />
            <Sk className="h-4 w-3/5" />
            <span className="mt-1 flex flex-wrap gap-2">
              <Sk className="h-11 w-44 rounded-lg" />
              <Sk className="h-11 w-28 rounded-lg" />
              <Sk className="h-11 w-32 rounded-lg" />
            </span>
          </span>
          <span className="flex flex-col gap-2 lg:items-end">
          <Sk className="h-4 w-24" />
          <span className="grid w-full max-w-md grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Sk key={i} className="h-[72px] rounded-xl sm:h-[82px]" />
            ))}
          </span>
          </span>
        </span>
      </span>
      <span className="contenedor grid grid-cols-1 gap-3 py-8 sm:grid-cols-2 sm:py-10 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Sk key={i} className="h-[74px] rounded-xl" />
        ))}
      </span>
    </SkeletonRegion>
  );
}

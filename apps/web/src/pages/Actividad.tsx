import { CalendarDays, Clock, MapPin, Ticket, User, Users, Video as VideoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useActivity, useAreas } from "../api";
import { ACTIVITY_TYPE_LABEL } from "../api/types";
import { LogoMark } from "../components/layout/Logo";
import { PageBody } from "../components/layout/PageHeader";
import { Countdown, RegisterButton } from "../components/shared/ActivityBits";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { longDate } from "../lib/format";
import ComingSoon from "./ComingSoon";

/** /actividades/:slug — Detalle (como la página de un evento de SUMtv: lugar, presentador, precio, horario diario). */
export default function Actividad() {
  const { slug = "" } = useParams();
  const { data: a, isLoading } = useActivity(slug);
  const { data: areas = [] } = useAreas();
  if (isLoading) return <div className="min-h-[60vh]" />;
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

  return (
    <>
      <title>{`${a.title} · La Luz del Tiempo`}</title>
      <header className="relative overflow-hidden">
        <span className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${area?.color ?? "#22376a"} 0%, #0b1324 110%)` }} />
        <span className="absolute top-6 right-6 opacity-15"><LogoMark className="h-40 w-40" /></span>
        {/* Fondo: la misma foto desenfocada, para no recortar la original */}
        {a.coverUrl && <SmartImage src={a.coverUrl} eager className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl" />}
        <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,19,36,0.96)_0%,rgba(11,19,36,0.8)_55%,rgba(11,19,36,0.55)_100%)]" />
        <Reveal className="contenedor relative grid grid-cols-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1fr_auto]">
          <div className="flex min-w-0 flex-col gap-3">
            <span className="flex flex-wrap items-center gap-1 text-xs text-niebla-200">
              <Link to="/actividades" className="hover:text-oro-400">Actividades</Link>
              {area && <> · <Link to={`/areas/${area.slug}`} className="hover:text-oro-400">{area.name}</Link></>}
              <span className="text-oro-400"> · {ACTIVITY_TYPE_LABEL[a.type]}</span>
            </span>
            <h1 className="titulo max-w-3xl text-[clamp(30px,4vw,52px)] leading-[1.05]">{a.title}</h1>
            <p className="max-w-xl text-base text-niebla-100">{a.summary}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <RegisterButton a={a} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-sm text-niebla-200">Empieza en</span>
              <Countdown iso={a.startsAt} />
            </div>
          </div>
          {a.coverUrl && (
            // Afiche en proporción 3:4, la misma que las tarjetas: la foto se ve completa
            <div className="mx-auto aspect-[3/4] w-56 overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:w-64 lg:mx-0">
              <SmartImage src={a.coverUrl} eager className="h-full w-full object-cover" />
            </div>
          )}
        </Reveal>
      </header>

      <PageBody>
        <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="flex gap-3 rounded-xl border border-white/[0.08] p-4">
              <span className="mt-0.5 text-oro-400">{f.icon}</span>
              <span className="flex flex-col gap-1">
                <span className="text-xs text-niebla-300">{f.label}</span>
                <span className="text-[15px] font-medium">{f.value}</span>
              </span>
            </div>
          ))}
        </Reveal>

        {a.agenda.length > 0 && (
          <section className="flex flex-col gap-4">
            <RowHeading title="Horario diario" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {a.agenda.map((d) => (
                <Reveal key={d.day} className="rounded-xl border border-white/[0.08] p-5">
                  <h3 className="titulo text-lg text-oro-400">{d.day}</h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {d.items.map((it) => {
                      const [time, ...rest] = it.split(" ");
                      return (
                        <li key={it} className="flex gap-3 text-[15px]">
                          <span className="w-12 shrink-0 font-semibold tabular-nums text-niebla-300">{time}</span>
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

        <Reveal className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-oro-500 p-6 text-noche-900 sm:p-8">
          <span className="flex flex-col gap-1">
            <span className="titulo text-2xl">¿Quieres participar?</span>
            <span className="text-sm">Escríbenos y te reservamos un lugar</span>
          </span>
          <RegisterButton a={a} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-noche-900 px-5 text-sm font-semibold text-white hover:bg-noche-800" />
        </Reveal>
      </PageBody>
    </>
  );
}

import { CalendarDays, CalendarPlus, Clock, Mail, MapPin, MessageCircle, Ticket, Users, Video as VideoIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "react-router";
import { api, useActivity, useAreas } from "../api";
import type { ActivityDetail } from "../api/types";
import { PageBody } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { Countdown, precioCorto } from "../components/shared/ActivityBits";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { LoadError, Sk, SkeletonRegion } from "../components/ui/Skeleton";
import { descargarCalendario, eventJsonLd } from "../lib/eventos";
import { longDate, whatsappLink } from "../lib/format";
import ComingSoon from "./ComingSoon";

// Códigos de país para el teléfono de la inscripción (Bolivia primero).
const PAISES = [
  ["+591", "Bolivia"], ["+51", "Perú"], ["+54", "Argentina"], ["+55", "Brasil"], ["+56", "Chile"], ["+57", "Colombia"],
  ["+593", "Ecuador"], ["+595", "Paraguay"], ["+598", "Uruguay"], ["+34", "España"], ["+52", "México"], ["+1", "Estados Unidos"],
] as const;

const hora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", timeZone: "America/La_Paz" }) : "";

/** /agenda/:slug — ficha de una actividad: sesiones y programa, personas, precio, inscripción y, después, lo que se hizo. */
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

  const color = areas.find((x) => x.slug === a.areas[0]?.slug)?.color ?? "#2c4580";
  const primera = a.sesiones[0];
  const ultima = a.sesiones[a.sesiones.length - 1] as ActivityDetail["sesiones"][number] | undefined;

  const facts: { icon: ReactNode; label: string; value: string }[] = [
    {
      icon: <CalendarDays size={18} />,
      label: "Fecha",
      value: !primera ? "Por confirmar" : a.sesiones.length > 1 && ultima ? `${longDate(primera.startsAt)} al ${longDate(ultima.startsAt)}` : longDate(primera.startsAt),
    },
    ...(a.sesiones.length > 1 ? [{ icon: <Clock size={18} />, label: "Sesiones", value: `${a.sesiones.length} encuentros` }] : []),
    {
      icon: a.isVirtual ? <VideoIcon size={18} /> : <MapPin size={18} />,
      label: "Lugar",
      value: a.isVirtual ? "Virtual" : a.lugar ?? "Por confirmar",
    },
    { icon: <Ticket size={18} />, label: "Precio", value: precioCorto(a) + (a.priceNote ? ` · ${a.priceNote}` : "") },
    ...(a.cupo.capacidad ? [{ icon: <Users size={18} />, label: "Cupos", value: a.cupo.lleno ? "Cupo lleno" : a.cupo.lugaresLibres !== null ? `Quedan ${a.cupo.lugaresLibres} de ${a.cupo.capacidad}` : `${a.cupo.capacidad} personas` }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      eventJsonLd(a),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: absoluta("/") },
          { "@type": "ListItem", position: 2, name: "Agenda", item: absoluta("/agenda") },
          { "@type": "ListItem", position: 3, name: a.title, item: absoluta(`/agenda/${a.slug}`) },
        ],
      },
    ],
  };

  return (
    <>
      <Seo title={`${a.title} · ${a.kindLabel} · La Luz del Tiempo`} description={a.summary} jsonLd={jsonLd} />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${color} 0%, #0b1324 110%)` }} aria-hidden />
        <div className="contenedor relative grid gap-8 py-10 md:grid-cols-[1fr_1.1fr] md:items-center md:py-16">
          <Reveal className="flex flex-col gap-4">
            <span className="text-sm text-oro-400">{a.kindLabel}{a.areas.length ? ` · ${a.areas.map((x) => x.name).join(", ")}` : ""}</span>
            <h1 className="titulo text-[clamp(34px,5vw,60px)] leading-[1.02]">{a.title}</h1>
            {a.summary && <p className="max-w-xl text-niebla-100">{a.summary}</p>}
            {a.inicio && !a.pasada && <Countdown iso={a.inicio} />}
            {a.pasada && <span className="w-fit rounded bg-white/10 px-3 py-1 text-sm text-niebla-100">Ya se realizó</span>}
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[3/4] w-full max-w-sm justify-self-center overflow-hidden rounded-2xl border border-white/10 md:max-w-none md:justify-self-end">
            <SmartImage src={a.coverUrl} alt={a.title} sizes="(min-width: 768px) 40vw, 90vw" className="absolute inset-0 h-full w-full object-cover" />
          </Reveal>
        </div>
      </section>

      <PageBody className="gap-12">
        <motion.dl layout className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-noche-800/60 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <span className="mt-0.5 text-oro-400">{f.icon}</span>
              <div>
                <dt className="text-xs text-niebla-300">{f.label}</dt>
                <dd className="font-medium">{f.value}</dd>
              </div>
            </div>
          ))}
        </motion.dl>

        {a.content && (
          <Reveal className="flex max-w-3xl flex-col gap-4 text-niebla-100">
            <RowHeading title="De qué se trata" />
            {a.content.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p.trim()}</p>
            ))}
          </Reveal>
        )}

        <div className="flex flex-col gap-4">
          <RowHeading title={a.sesiones.length > 1 ? "Fechas y programa" : "Programa"} />
          {a.sesiones.length === 0 && <p className="text-niebla-300">Las fechas se confirmarán pronto.</p>}
          {a.sesiones.map((s, i) => (
            <Reveal key={s.startsAt} delay={i * 0.04} className="grid gap-5 rounded-2xl border border-white/10 bg-noche-800/60 p-5 md:grid-cols-[1fr_1.4fr]">
              <div className="flex flex-col gap-2">
                <p className="font-display text-2xl">{longDate(s.startsAt)}</p>
                <p className="text-sm text-niebla-200">
                  {hora(s.startsAt)}{s.endsAt ? ` a ${hora(s.endsAt)}` : ""}
                </p>
                {a.isVirtual ? (
                  <p className="flex items-center gap-2 text-sm"><VideoIcon size={15} className="text-oro-400" /> Virtual</p>
                ) : s.lugar ? (
                  <p className="flex items-start gap-2 text-sm">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-oro-400" />
                    <span>
                      {s.lugar.name}
                      {s.lugar.address ? <><br />{s.lugar.address}</> : null}
                      {s.locationNote ? <><br /><span className="text-niebla-300">{s.locationNote}</span></> : null}
                      {s.lugar.mapUrl && <><br /><a href={s.lugar.mapUrl} target="_blank" rel="noreferrer" className="text-oro-400 underline">Ver en el mapa</a></>}
                    </span>
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => descargarCalendario(a, { inicio: s.startsAt, fin: s.endsAt })}
                  className="btn-borde mt-2 w-fit text-sm"
                >
                  <CalendarPlus size={15} className="mr-1.5 inline" /> Agregar al calendario
                </button>
              </div>
              <ol className="flex flex-col gap-3">
                {s.programa.length === 0 && <li className="text-sm text-niebla-300">Programa por confirmar.</li>}
                {s.programa.map((p, j) => (
                  <li key={j} className="flex gap-3 border-l-2 border-oro-500/50 pl-4">
                    <span className="w-14 shrink-0 font-mono text-sm text-oro-300">{p.startTime ?? ""}</span>
                    <div className="min-w-0">
                      <p className="font-medium">{p.title}{p.durationMin ? <span className="text-niebla-300"> · {p.durationMin} min</span> : null}</p>
                      {p.persona && <p className="text-sm text-niebla-200">{p.persona.name} <span className="text-niebla-300">· {p.persona.roleTitle}</span></p>}
                      {p.description && <p className="text-sm text-niebla-300">{p.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          ))}
        </div>

        {a.personas.length > 0 && (
          <div className="flex flex-col gap-4">
            <RowHeading title="Quiénes participan" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {a.personas.map((p) => (
                <Reveal key={p.name + p.role} className="flex gap-4 rounded-2xl border border-white/10 bg-noche-800/60 p-4">
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-noche-900">
                    {p.photoUrl ? <SmartImage src={p.photoUrl} alt={p.name} sizes="80px" className="h-full w-full object-cover" /> : null}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-oro-400">{p.roleLabel}</p>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-niebla-300">{p.roleTitle}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        <Inscripcion a={a} />

        {(a.report || a.galeria.length > 0) && (
          <div className="flex flex-col gap-6">
            <RowHeading title="Lo que se hizo" />
            {a.report && (
              <div className="flex max-w-3xl flex-col gap-4 text-niebla-100">
                {a.report.split(/\n\s*\n/).map((p, i) => (
                  <p key={i}>{p.trim()}</p>
                ))}
              </div>
            )}
            {a.galeria.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {a.galeria.map((g, i) => (
                  <figure key={i} className="flex flex-col gap-2">
                    <span className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <SmartImage src={g.imageUrl} alt={g.caption || a.title} sizes="(min-width: 768px) 33vw, 50vw" className="absolute inset-0 h-full w-full object-cover" />
                    </span>
                    {g.caption && <figcaption className="text-xs text-niebla-300">{g.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}
      </PageBody>
    </>
  );
}

/** Inscripción: formulario en la web si está activado, y contacto por WhatsApp, correo o enlace. */
function Inscripcion({ a }: { a: ActivityDetail }) {
  const [datos, setDatos] = useState({ fullName: "", phoneCode: "+591", phone: "", email: "", website: "" });
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const enviar = useMutation({
    mutationFn: () => api.inscribir(a.slug, datos),
    onSuccess: (r) => {
      setListo(r.message);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const contacto = a.canales.map((c) => {
    if (c.channel === "whatsapp") {
      return { key: c.channel, href: whatsappLink(c.value.replace(/\D/g, ""), `Hola, quiero inscribirme en: ${a.title}`), texto: "Inscribirme por WhatsApp", icono: <MessageCircle size={16} />, externo: true };
    }
    if (c.channel === "correo") return { key: c.channel, href: `mailto:${c.value}?subject=${encodeURIComponent(a.title)}`, texto: "Inscribirme por correo", icono: <Mail size={16} />, externo: false };
    return { key: c.channel, href: c.value, texto: "Inscribirme por enlace", icono: null, externo: true };
  });

  return (
    <section id="inscribirme" className="scroll-mt-28 flex flex-col gap-5 rounded-2xl border border-oro-500/30 bg-noche-800/60 p-5 sm:p-8">
      <RowHeading title="Inscripción" />
      {a.qrInscripcionUrl || a.qrSubidoUrl ? (
        <div className="flex flex-wrap gap-6">
          {a.qrInscripcionUrl ? (
            <figure className="flex flex-col items-center gap-2 text-sm">
              <img src={a.qrInscripcionUrl} alt={`QR para inscribirse en `} className="h-44 w-44 rounded-xl bg-white p-2" loading="lazy" />
              <figcaption className="text-niebla-300">Escanea para inscribirte</figcaption>
            </figure>
          ) : null}
          {a.qrSubidoUrl ? (
            <figure className="flex flex-col items-center gap-2 text-sm">
              <img src={a.qrSubidoUrl} alt={`QR de pago de `} className="h-44 w-44 rounded-xl bg-white p-2 object-contain" loading="lazy" />
              <figcaption className="text-niebla-300">QR para pagar</figcaption>
            </figure>
          ) : null}
        </div>
      ) : null}
      {a.pasada ? (
        <p className="text-niebla-200">Esta actividad ya se realizó.</p>
      ) : listo ? (
        <p className="text-lg text-oro-300">{listo}</p>
      ) : a.inscripcionWeb && !a.cupo.lleno ? (
        <form
          noValidate
          className="grid max-w-2xl gap-4 sm:grid-cols-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setError(null);
            enviar.mutate();
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            Nombre completo
            <input required value={datos.fullName} onChange={(e) => setDatos({ ...datos, fullName: e.target.value })} autoComplete="name" className={campo} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Teléfono (WhatsApp)
            <span className="flex gap-2">
              <select value={datos.phoneCode} onChange={(e) => setDatos({ ...datos, phoneCode: e.target.value })} className={`${campo} w-28`} aria-label="Código de país">
                {PAISES.map(([codigo, nombre]) => <option key={codigo} value={codigo}>{codigo} {nombre}</option>)}
              </select>
              <input inputMode="tel" value={datos.phone} onChange={(e) => setDatos({ ...datos, phone: e.target.value })} autoComplete="tel-national" className={campo} />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Correo (opcional)
            <input type="email" value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} autoComplete="email" className={campo} />
          </label>
          {/* Campo trampa para robots: las personas no lo ven */}
          <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={datos.website} onChange={(e) => setDatos({ ...datos, website: e.target.value })} className="hidden" />
          {error && <p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
            <button type="submit" disabled={enviar.isPending} className="btn-oro btn-brillo disabled:opacity-60">
              {enviar.isPending ? "Enviando…" : a.isFree ? "Inscribirme gratis" : "Inscribirme"}
            </button>
            {!a.isFree && <span className="text-sm text-niebla-300">{precioCorto(a)}{a.priceNote ? ` · ${a.priceNote}` : ""}</span>}
          </div>
        </form>
      ) : (
        <p className="text-niebla-200">{a.cupo.lleno ? "Ya no hay lugares disponibles." : "Por ahora las inscripciones no se abren por la web."}</p>
      )}

      {!a.pasada && contacto.length > 0 && !listo && (
        <div className="flex flex-wrap gap-2 pt-2">
          {contacto.map((c) => (
            <a key={c.key} href={c.href} target={c.externo ? "_blank" : undefined} rel={c.externo ? "noreferrer" : undefined} className="btn-borde inline-flex items-center gap-2 text-sm">
              {c.icono}{c.texto}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

const campo = "w-full rounded-xl border border-white/15 bg-noche-900/70 px-4 py-3 text-base text-white placeholder:text-niebla-300 focus:border-oro-500 focus:outline-none";

function ActividadSkeleton() {
  return (
    <SkeletonRegion label="Cargando la actividad" className="contenedor flex flex-col gap-6 py-12">
      <Sk className="h-10 w-2/3 rounded-xl" />
      <Sk className="aspect-[3/4] w-full max-w-sm rounded-2xl" />
    </SkeletonRegion>
  );
}

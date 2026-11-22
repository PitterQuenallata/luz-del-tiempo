import { CalendarDays, Expand, Headphones, MapPin, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useActivities, useArea, usePosts, useStations, useVideos } from "../api";
import type { Activity, Area as AreaT } from "../api/types";
import { ACTIVITY_TYPE_LABEL } from "../api/types";
import { LogoMark } from "../components/layout/Logo";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { Countdown, RegisterButton } from "../components/shared/ActivityBits";
import { VideoGrid } from "../components/shared/VideoGrid";
import { AreaIcon } from "../components/ui/AreaIcon";
import { Equalizer } from "../components/ui/Equalizer";
import { Lightbox } from "../components/ui/Lightbox";
import { PlayPauseIcon } from "../components/ui/PlayPauseIcon";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { longDate, whatsappLink } from "../lib/format";
import { usePlayer } from "../player/PlayerProvider";
import ComingSoon from "./ComingSoon";

const ease = [0.22, 1, 0.36, 1] as const;

/** El área como parte del ministerio, la ruta de migas y su próximo evento (schema.org). */
function jsonLd(area: AreaT, event?: Activity) {
  const url = absoluta(`/areas/${area.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: `${area.name} · Ministerio La Luz del Tiempo`,
        description: area.summary,
        url,
        ...(area.coverUrl ? { image: absoluta(area.coverUrl) } : {}),
        parentOrganization: { "@type": "Organization", name: "Ministerio La Luz del Tiempo", url: absoluta("/") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: absoluta("/") },
          { "@type": "ListItem", position: 2, name: "Áreas", item: absoluta("/areas") },
          { "@type": "ListItem", position: 3, name: area.name, item: url },
        ],
      },
      ...(event
        ? [
            {
              "@type": "Event",
              name: event.title,
              description: event.summary,
              startDate: event.startsAt,
              ...(event.endsAt ? { endDate: event.endsAt } : {}),
              eventAttendanceMode: event.isVirtual
                ? "https://schema.org/OnlineEventAttendanceMode"
                : "https://schema.org/OfflineEventAttendanceMode",
              location: event.isVirtual
                ? { "@type": "VirtualLocation", url: absoluta(`/actividades/${event.slug}`) }
                : { "@type": "Place", name: event.locationName ?? "Bolivia", address: { "@type": "PostalAddress", addressCountry: "BO" } },
              url: absoluta(`/actividades/${event.slug}`),
            },
          ]
        : []),
    ],
  };
}

/**
 * /areas/:slug — Página de un área. El panel elige UNA de tres plantillas:
 *  - hero:    portada grande a todo el ancho con el título encima
 *  - gallery: texto a la izquierda y galería de fotos a la derecha
 *  - simple:  imagen pequeña y texto en una columna
 * Si el área tiene "Programar evento" activado, aparece el bloque del próximo evento.
 */
export default function Area() {
  const { slug = "" } = useParams();
  const { data: area, isLoading } = useArea(slug);
  const { data: activities = [] } = useActivities();
  if (isLoading) return <div className="min-h-[60vh]" />;
  if (!area) return <ComingSoon title="Área no encontrada" />;

  const event = area.eventEnabled ? activities.find((a) => a.areaSlug === area.slug) : undefined;

  return (
    <>
      <Seo title={`${area.name} · Ministerio La Luz del Tiempo`} description={area.summary} jsonLd={jsonLd(area, event)} />
      {area.template === "hero" && <TemplateHero area={area} />}
      {area.template === "gallery" && <TemplateGallery area={area} />}
      {area.template === "simple" && <TemplateSimple area={area} />}
      <PageBody>
        {event && <EventBlock a={event} />}
        {/* La plantilla "texto + galería" ya la muestra arriba; las otras dos, aquí */}
        {area.template !== "gallery" && area.gallery.length > 0 && <AreaGallery area={area} />}
        <Related area={area} />
      </PageBody>
    </>
  );
}

const cover = (a: AreaT) => ({ background: `linear-gradient(160deg, ${a.color} 0%, #0b1324 110%)` });

function ContactButton({ area }: { area: AreaT }) {
  if (!area.whatsapp) return null;
  return (
    <a
      href={whatsappLink(area.whatsapp, `Hola, quiero saber más sobre el área de ${area.name}`)}
      target="_blank"
      rel="noreferrer"
      className="btn-oro btn-brillo self-start justify-self-start"
    >
      <MessageCircle size={16} aria-hidden /> Escribir al área
    </a>
  );
}

/** Foto de galería que se agranda al pasar el mouse y abre el visor al tocarla. */
function GalleryPhoto({ area, src, i, onOpen, className = "", sizes }: { area: AreaT; src: string | null; i: number; onOpen?: () => void; className?: string; sizes: string }) {
  const content = (
    <>
      <AreaIcon icon={area.icon} size={i === 0 ? 64 : 36} strokeWidth={1.25} className="text-white/25" />
      <SmartImage
        src={src}
        alt={`${area.name}: foto ${i + 1}`}
        sizes={sizes}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
      />
      {src && (
        <span className="absolute right-2 bottom-2 grid h-9 w-9 place-items-center rounded-full bg-noche-900/70 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Expand size={16} aria-hidden />
        </span>
      )}
    </>
  );
  const cls = `group relative grid place-items-center overflow-hidden rounded-xl ${className}`;
  const style = { background: `linear-gradient(${140 + i * 30}deg, ${area.color}cc 0%, #0b1324 100%)` };
  return src && onOpen ? (
    <motion.button type="button" onClick={onOpen} whileTap={{ scale: 0.97 }} className={`${cls} cursor-zoom-in`} style={style} aria-label={`Ver foto ${i + 1} de ${area.name}`}>
      {content}
    </motion.button>
  ) : (
    <span className={cls} style={style}>{content}</span>
  );
}

/** Plantilla A — Portada grande */
function TemplateHero({ area }: { area: AreaT }) {
  return (
    <>
      <header className="relative flex min-h-[clamp(300px,42vh,400px)] items-end overflow-hidden md:min-h-[clamp(260px,34vh,380px)]">
        <span className="absolute inset-0" style={cover(area)} />
        <motion.span
          className="absolute top-6 right-6 text-white/10"
          initial={{ rotate: -25, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease }}
        >
          <AreaIcon icon={area.icon} size={180} strokeWidth={0.75} />
        </motion.span>
        <motion.div className="absolute inset-0" initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 8, ease: "linear" }}>
          <SmartImage src={area.coverUrl} alt="" eager sizes="100vw" />
        </motion.div>
        <span className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(11,19,36,0.92)_0%,rgba(11,19,36,0.55)_50%,rgba(11,19,36,0.1)_100%)] md:block" />
        <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(11,19,36,0.97)_0%,rgba(11,19,36,0.7)_50%,rgba(11,19,36,0.2)_100%)] md:hidden" />
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-noche-900 to-transparent" />
        <Reveal className="contenedor relative flex flex-col gap-2 py-8">
          <Link to="/areas" className="self-start py-2 text-xs text-niebla-200 hover:text-oro-400">Áreas del ministerio</Link>
          <h1 className="titulo text-[clamp(34px,4.4vw,60px)] leading-none">{area.name}</h1>
          <p className="max-w-xl text-base text-niebla-100">{area.summary}</p>
        </Reveal>
      </header>
      <div className="contenedor flex flex-col gap-6 pt-8">
        <Reveal className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
          <p className="text-[17px] leading-[1.75] text-niebla-100">{area.content}</p>
          <ContactButton area={area} />
        </Reveal>
      </div>
    </>
  );
}

/** Plantilla B — Texto + galería */
function TemplateGallery({ area }: { area: AreaT }) {
  const [open, setOpen] = useState<number | null>(null);
  const photos = area.gallery.slice(0, 4);
  return (
    <>
      <PageHeader title={area.name} subtitle={area.summary} crumbs={[{ to: "/areas", label: "Áreas" }]} />
      <div className="contenedor grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[1fr_1.15fr]">
        <Reveal className="flex flex-col gap-5">
          <span className="flex items-center gap-2 text-sm text-oro-400"><AreaIcon icon={area.icon} size={16} /> Qué hacemos</span>
          <p className="text-[17px] leading-[1.75] text-niebla-100">{area.content}</p>
          <ContactButton area={area} />
        </Reveal>
        <Reveal delay={0.1} className="grid grid-cols-2 gap-3">
          {(photos.length ? photos : [null, null, null, null]).map((src, i) => (
            <GalleryPhoto
              key={i}
              area={area}
              src={src}
              i={i}
              onOpen={() => setOpen(i)}
              sizes={i === 0 ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 27vw, 50vw"}
              className={i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}
            />
          ))}
        </Reveal>
      </div>
      <Lightbox images={photos} index={open} onIndex={setOpen} alt={(i) => `${area.name}: foto ${i + 1}`} />
    </>
  );
}

/** Plantilla C — Simple */
function TemplateSimple({ area }: { area: AreaT }) {
  return (
    <>
      <PageHeader title={area.name} crumbs={[{ to: "/areas", label: "Áreas" }]} />
      <Reveal className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 pt-8 sm:px-6">
        <span className="relative grid aspect-[21/9] place-items-center overflow-hidden rounded-2xl" style={cover(area)}>
          <AreaIcon icon={area.icon} size={72} strokeWidth={1.25} className="text-white/30" />
          <SmartImage src={area.coverUrl} alt={`Ministerio de ${area.name}`} sizes="(min-width: 768px) 760px, 100vw" />
        </span>
        <p className="text-xl leading-relaxed text-white">{area.summary}</p>
        <p className="text-[17px] leading-[1.75] text-niebla-100">{area.content}</p>
        <ContactButton area={area} />
      </Reveal>
    </>
  );
}

/** Bloque "Próximo evento" (solo si el área tiene el interruptor activado). */
function EventBlock({ a }: { a: Activity }) {
  return (
    <Reveal className="grid grid-cols-1 overflow-hidden rounded-2xl border border-oro-500/40 bg-noche-800 md:grid-cols-[1fr_1.2fr]">
      <div className="group relative min-h-[220px] overflow-hidden">
        <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_40%_40%,#22376a,#0b1324_75%)]">
          <LogoMark sizes="128px" className="h-24 w-24 opacity-60" />
        </span>
        <SmartImage
          src={a.coverUrl}
          alt={a.title}
          sizes="(min-width: 768px) 45vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute top-4 left-4 flex items-center gap-1.5 rounded bg-oro-500 px-2 py-1 text-xs font-semibold text-noche-900">
          <span className="relative flex h-1.5 w-1.5" aria-hidden>
            <span className="absolute inset-0 animate-ping rounded-full bg-noche-900/70" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-noche-900" />
          </span>
          Próximo evento
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:p-8">
        <span className="text-sm text-oro-400">{ACTIVITY_TYPE_LABEL[a.type]}</span>
        <h2 className="titulo text-[clamp(24px,3vw,34px)] leading-tight">{a.title}</h2>
        <Countdown iso={a.startsAt} />
        <ul className="flex flex-col gap-2 text-sm text-niebla-100">
          <li className="flex items-center gap-2"><CalendarDays size={16} className="shrink-0 text-oro-400" aria-hidden /> {longDate(a.startsAt)}{a.scheduleText ? ` · ${a.scheduleText}` : ""}</li>
          <li className="flex items-center gap-2"><MapPin size={16} className="shrink-0 text-oro-400" aria-hidden /> {a.isVirtual ? "Virtual" : a.locationName}</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <RegisterButton a={a} className="btn-oro btn-brillo" />
          <Link to={`/actividades/${a.slug}`} className="btn-borde">Ver detalles</Link>
        </div>
      </div>
    </Reveal>
  );
}

/** Galería del área (fotos de area_gallery). Una foto grande y tres chicas; se abren a pantalla completa. */
function AreaGallery({ area }: { area: AreaT }) {
  const [open, setOpen] = useState<number | null>(null);
  const photos = area.gallery.slice(0, 4);
  return (
    <section className="flex flex-col gap-4">
      <RowHeading title="Galería" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
        {photos.map((src, i) => (
          <Reveal
            key={src}
            delay={0.06 * i}
            className={i === 0 ? "col-span-2 aspect-[4/3] md:row-span-2 md:aspect-auto" : i === 3 ? "col-span-2 aspect-[2/1]" : "aspect-square"}
          >
            <GalleryPhoto
              area={area}
              src={src}
              i={i}
              onOpen={() => setOpen(i)}
              sizes={i === 0 || i === 3 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
              className="h-full w-full"
            />
          </Reveal>
        ))}
      </div>
      <Lightbox images={photos} index={open} onIndex={setOpen} alt={(i) => `${area.name}: foto ${i + 1}`} />
    </section>
  );
}

/** Lo relacionado con el área: su emisora, sus videos y sus noticias. */
function Related({ area }: { area: AreaT }) {
  const { data: stations = [] } = useStations();
  const { data: videos = [] } = useVideos();
  const { data: posts = [] } = usePosts();
  const player = usePlayer();
  const station = stations.find((s) => s.areaSlug === area.slug);
  const areaVideos = videos.filter((v) => v.areaSlug === area.slug);
  const areaPosts = posts.filter((p) => p.areaSlug === area.slug);
  const sounding = !!station && player.station?.slug === station.slug && (player.status === "playing" || player.status === "loading");

  return (
    <>
      {station && (
        <Reveal
          className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 transition-[border-color,box-shadow] duration-300 ${
            sounding ? "border-oro-500 shadow-[0_12px_40px_-14px_rgb(226_169_39/0.5)]" : "border-white/[0.08]"
          }`}
        >
          <span className="relative grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: station.art }}>
            <SmartImage src={station.imageUrl} alt="" sizes="128px" />
            {sounding ? <Equalizer active color="#ffffff" bars={5} className="relative h-6" /> : <Headphones className="relative" aria-hidden />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-oro-400">Emisora del área</span>
            <span className="titulo text-xl">{station.name}</span>
            <span className="text-sm text-niebla-200">{station.description}</span>
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => (player.station?.slug === station.slug ? player.toggle() : player.play(station))}
            aria-pressed={sounding}
            className={`btn-oro btn-brillo max-sm:w-full ${sounding ? "" : "pulso-vivo"}`}
          >
            <PlayPauseIcon playing={sounding} />
            {sounding ? "Pausar" : "Escuchar"}
          </motion.button>
        </Reveal>
      )}
      {areaVideos.length > 0 && (
        <section className="flex flex-col gap-4">
          <RowHeading title={`Videos de ${area.name}`} to="/videos" />
          <VideoGrid videos={areaVideos} prefix={`area-${area.slug}`} />
        </section>
      )}
      {areaPosts.length > 0 && (
        <section className="flex flex-col gap-4">
          <RowHeading title="Noticias" to="/noticias" label="ver todas" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {areaPosts.map((p) => (
              <Link
                key={p.slug}
                to={`/noticias/${p.slug}`}
                className="group rounded-xl border border-white/[0.08] p-4 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-oro-500/40 hover:bg-white/[0.04]"
              >
                <span className="block text-xs text-niebla-300">{longDate(p.publishedAt)}</span>
                <h3 className="titulo mt-1 text-lg leading-snug transition-colors group-hover:text-oro-400">{p.title}</h3>
                <span className="mt-1 block text-sm text-niebla-200">{p.excerpt}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

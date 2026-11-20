import { CalendarDays, Headphones, MapPin, MessageCircle } from "lucide-react";
import { Link, useParams } from "react-router";
import { useActivities, useArea, usePosts, useStations, useVideos } from "../api";
import type { Activity, Area as AreaT } from "../api/types";
import { ACTIVITY_TYPE_LABEL } from "../api/types";
import { LogoMark } from "../components/layout/Logo";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { Countdown, RegisterButton } from "../components/shared/ActivityBits";
import { VideoGrid } from "../components/shared/VideoGrid";
import { AreaIcon } from "../components/ui/AreaIcon";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { longDate, whatsappLink } from "../lib/format";
import { usePlayer } from "../player/PlayerProvider";
import ComingSoon from "./ComingSoon";

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
      <title>{`${area.name} · La Luz del Tiempo`}</title>
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
    <a href={whatsappLink(area.whatsapp, `Hola, quiero saber más sobre el área de ${area.name}`)} target="_blank" rel="noreferrer" className="btn-oro self-start justify-self-start">
      <MessageCircle size={16} /> Escribir al área
    </a>
  );
}

/** Plantilla A — Portada grande */
function TemplateHero({ area }: { area: AreaT }) {
  return (
    <>
      <header className="relative flex min-h-[clamp(260px,34vh,380px)] items-end overflow-hidden">
        <span className="absolute inset-0" style={cover(area)} />
        <span className="absolute top-6 right-6 text-white/10"><AreaIcon icon={area.icon} size={180} strokeWidth={0.75} /></span>
        <SmartImage src={area.coverUrl} eager />
        <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,19,36,0.92)_0%,rgba(11,19,36,0.55)_50%,rgba(11,19,36,0.1)_100%)]" />
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-noche-900 to-transparent" />
        <Reveal className="contenedor relative flex flex-col gap-2 py-8">
          <Link to="/areas" className="text-xs text-niebla-200 hover:text-oro-400">Áreas del ministerio</Link>
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
          {(area.gallery.length ? area.gallery : [null, null, null, null]).slice(0, 4).map((src, i) => (
            <span
              key={i}
              className={`relative grid place-items-center overflow-hidden rounded-xl ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}
              style={{ background: `linear-gradient(${140 + i * 30}deg, ${area.color}cc 0%, #0b1324 100%)` }}
            >
              <AreaIcon icon={area.icon} size={i === 0 ? 64 : 36} strokeWidth={1.25} className="text-white/25" />
              <SmartImage src={src} />
            </span>
          ))}
        </Reveal>
      </div>
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
          <SmartImage src={area.coverUrl} />
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
      <div className="relative min-h-[220px] overflow-hidden">
        <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_40%_40%,#22376a,#0b1324_75%)]">
          <LogoMark className="h-24 w-24 opacity-60" />
        </span>
        <SmartImage src={a.coverUrl} />
        <span className="absolute top-4 left-4 rounded bg-oro-500 px-2 py-1 text-xs font-semibold text-noche-900">Próximo evento</span>
      </div>
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <span className="text-sm text-oro-400">{ACTIVITY_TYPE_LABEL[a.type]}</span>
        <h2 className="titulo text-[clamp(24px,3vw,34px)] leading-tight">{a.title}</h2>
        <Countdown iso={a.startsAt} />
        <ul className="flex flex-col gap-2 text-sm text-niebla-100">
          <li className="flex items-center gap-2"><CalendarDays size={16} className="text-oro-400" /> {longDate(a.startsAt)}{a.scheduleText ? ` · ${a.scheduleText}` : ""}</li>
          <li className="flex items-center gap-2"><MapPin size={16} className="text-oro-400" /> {a.isVirtual ? "Virtual" : a.locationName}</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <RegisterButton a={a} />
          <Link to={`/actividades/${a.slug}`} className="btn-borde">Ver detalles</Link>
        </div>
      </div>
    </Reveal>
  );
}

/** Lo relacionado con el área: su emisora, sus videos y sus noticias. */
/** Galería del área (fotos de area_gallery). Una foto grande y tres chicas. */
function AreaGallery({ area }: { area: AreaT }) {
  return (
    <section className="flex flex-col gap-4">
      <RowHeading title="Galería" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
        {area.gallery.slice(0, 4).map((src, i) => (
          <Reveal
            key={src}
            delay={0.06 * i}
            className={`relative grid place-items-center overflow-hidden rounded-xl ${
              i === 0 ? "col-span-2 aspect-[4/3] md:row-span-2 md:aspect-auto" : i === 3 ? "col-span-2 aspect-[2/1]" : "aspect-square"
            }`}
            style={{ background: `linear-gradient(${140 + i * 30}deg, ${area.color}cc 0%, #0b1324 100%)` }}
          >
            <AreaIcon icon={area.icon} size={i === 0 ? 64 : 36} strokeWidth={1.25} className="text-white/25" />
            <SmartImage src={src} alt={`${area.name}: foto ${i + 1}`} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Related({ area }: { area: AreaT }) {
  const { data: stations = [] } = useStations();
  const { data: videos = [] } = useVideos();
  const { data: posts = [] } = usePosts();
  const player = usePlayer();
  const station = stations.find((s) => s.areaSlug === area.slug);
  const areaVideos = videos.filter((v) => v.areaSlug === area.slug);
  const areaPosts = posts.filter((p) => p.areaSlug === area.slug);

  return (
    <>
      {station && (
        <Reveal className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.08] p-4">
          <span className="relative grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: station.art }}>
            <SmartImage src={station.imageUrl} />
            <Headphones className="relative" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-oro-400">Emisora del área</span>
            <span className="titulo text-xl">{station.name}</span>
            <span className="text-sm text-niebla-200">{station.description}</span>
          </span>
          <button type="button" onClick={() => player.play(station)} className="btn-oro">Escuchar</button>
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
              <Link key={p.slug} to={`/noticias/${p.slug}`} className="rounded-xl border border-white/[0.08] p-4 transition-colors hover:bg-white/[0.04]">
                <span className="block text-xs text-niebla-300">{longDate(p.publishedAt)}</span>
                <span className="titulo mt-1 block text-lg leading-snug">{p.title}</span>
                <span className="mt-1 block text-sm text-niebla-200">{p.excerpt}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useVideos } from "../api";
import type { Video } from "../api/types";
import { Seo } from "../components/Seo";
import { SmartImage } from "../components/ui/SmartImage";
import { LoadError, Sk, SkeletonRegion } from "../components/ui/Skeleton";
import { RowHeading } from "../components/ui/Reveal";
import { VideoModal, videoJsonLd, ytThumb } from "../components/ui/VideoModal";
import { longDate } from "../lib/format";

const suave = [0.25, 0.1, 0.25, 1] as const;

/**
 * /videos — Sin cabecera ni filtros: el episodio más reciente en grande y
 * debajo una fila deslizable por serie (como YouTube / plataformas de video).
 */
export default function Videos() {
  const { data: videos = [], isPending, isError, refetch } = useVideos();
  const [open, setOpen] = useState<Video | null>(null);
  const featured = videos.find((v) => v.isFeatured) ?? videos[0];

  const sorted = [...videos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const series = new Map<string, Video[]>();
  for (const v of sorted) {
    const key = v.seriesName ?? "Otros videos";
    series.set(key, [...(series.get(key) ?? []), v]);
  }
  const latest = sorted.slice(0, 8);

  return (
    <>
      <Seo
        title="Videos y podcast · La Luz del Tiempo"
        description="Prédicas, estudios bíblicos, música y salud en video. Mira los episodios del ministerio La Luz del Tiempo y suscríbete a nuestro canal de YouTube."
        jsonLd={videos.length ? { "@context": "https://schema.org", "@graph": sorted.map(videoJsonLd) } : undefined}
      />

      {isPending && (
        <SkeletonRegion label="Cargando videos">
          {/* Episodio destacado: video 16:9 y texto, lado a lado desde laptop */}
          <span className="contenedor grid grid-cols-1 items-center gap-6 py-6 sm:gap-8 sm:py-10 lg:grid-cols-[1.35fr_1fr]">
            <Sk className="aspect-video rounded-2xl" />
            <span className="flex flex-col gap-3">
              <Sk className="h-5 w-44" />
              <Sk className="h-[clamp(26px,3vw,46px)] w-11/12" />
              <Sk className="h-[clamp(26px,3vw,46px)] w-2/3" />
              <Sk className="h-3.5 w-32" />
              <span className="mt-2 flex gap-2">
                <Sk className="h-11 w-32 rounded-lg" />
                <Sk className="h-11 w-40 rounded-lg" />
              </span>
            </span>
          </span>
          {/* Filas por serie: 72 % del ancho en celular, 3 por fila en tablet, 4 en laptop/PC */}
          <span className="contenedor flex flex-col gap-10 py-8 sm:py-10">
            {[0, 1].map((r) => (
              <span key={r} className="flex flex-col gap-4">
                <Sk className="h-6 w-40" />
                <span className="-mx-4 flex gap-4 overflow-hidden px-4 sm:mx-0 sm:px-0">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="flex w-[72%] shrink-0 flex-col gap-3 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
                      <Sk className="aspect-video rounded-xl" />
                      <Sk className="h-4 w-4/5" />
                      <Sk className="h-3 w-1/3" />
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </span>
        </SkeletonRegion>
      )}
      {isError && (
        <div className="contenedor py-10">
          <LoadError onRetry={() => void refetch()} message="No pudimos cargar los videos" />
        </div>
      )}

      {featured && (
        <section className="relative isolate overflow-hidden">
          <SmartImage
            src={ytThumb(featured.youtubeId, "maxres")}
            fallbackSrc={ytThumb(featured.youtubeId)}
            skeleton={false}
            className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
          <span className="absolute inset-0 -z-10 bg-gradient-to-b from-noche-900/40 via-noche-900/70 to-noche-900" />
          <div className="contenedor grid grid-cols-1 items-center gap-6 py-6 sm:gap-8 sm:py-10 lg:grid-cols-[1.35fr_1fr]">
            <motion.button
              type="button"
              layoutId={`videos-${featured.youtubeId}`}
              onClick={() => setOpen(featured)}
              whileTap={{ scale: 0.98 }}
              className="group relative block aspect-video overflow-hidden rounded-2xl bg-black text-left shadow-2xl"
              aria-label={`Ver: ${featured.title}`}
            >
              <SmartImage
                src={ytThumb(featured.youtubeId, "maxres")}
                fallbackSrc={ytThumb(featured.youtubeId)}
                alt={featured.title}
                eager
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.03] group-hover:brightness-110"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="pulso-vivo grid h-16 w-16 place-items-center rounded-full bg-oro-500 text-noche-900 shadow-xl transition-[background-color,transform] duration-300 group-hover:scale-110 group-hover:bg-oro-400 sm:h-20 sm:w-20">
                  <Play size={30} fill="currentColor" className="ml-1" aria-hidden />
                </span>
              </span>
            </motion.button>
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: suave }}
            >
              <span className="flex flex-wrap items-center gap-2 text-sm text-oro-400">
                <span className="rounded bg-oro-500 px-2 py-0.5 text-xs font-semibold text-noche-900">Nuevo episodio</span>
                {featured.seriesName}
              </span>
              <h1 className="titulo text-[clamp(26px,3vw,46px)] leading-[1.08]">{featured.title}</h1>
              <time dateTime={featured.publishedAt} className="text-sm text-niebla-300">{longDate(featured.publishedAt)}</time>
              <div className="mt-2 flex flex-wrap gap-2">
                <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => setOpen(featured)} className="btn-oro btn-brillo max-sm:flex-1">
                  <Play size={16} fill="currentColor" aria-hidden /> Ver ahora
                </motion.button>
                <a href="https://www.youtube.com/@laluzdeltiempo" target="_blank" rel="noreferrer" className="btn-borde max-sm:flex-1">
                  Canal de YouTube
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <div className={isPending || isError ? "hidden" : "contenedor flex flex-col gap-10 py-8 sm:py-10"}>
        <VideoRow title="Lo más reciente" videos={latest} onOpen={setOpen} />
        {[...series.entries()].map(([name, list]) => (
          <VideoRow key={name} title={name} videos={list} onOpen={setOpen} />
        ))}
      </div>

      <VideoModal video={open} onClose={() => setOpen(null)} layoutPrefix="videos" />
    </>
  );
}

/** Fila deslizable de una serie, con flechas en pantallas grandes que se apagan al llegar a cada extremo. */
function VideoRow({ title, videos, onOpen }: { title: string; videos: Video[]; onOpen: (v: Video) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [videos.length]);

  const arrow = "grid h-10 w-10 place-items-center rounded-full border border-white/10 text-niebla-200 transition-[border-color,color,opacity] hover:border-oro-500/60 hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <RowHeading title={title} />
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scroll(-1)} disabled={edges.start} className={arrow} aria-label={`Anteriores de ${title}`}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll(1)} disabled={edges.end} className={arrow} aria-label={`Siguientes de ${title}`}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={ref} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {videos.map((v, i) => (
          <motion.button
            key={v.youtubeId}
            type="button"
            onClick={() => onOpen(v)}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: Math.min(i, 4) * 0.05, ease: suave }}
            whileTap={{ scale: 0.97 }}
            className="group flex w-[72%] shrink-0 snap-start flex-col gap-3 text-left sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
            aria-label={`Ver video: ${v.title}`}
          >
            <span className="relative block aspect-video overflow-hidden rounded-xl bg-noche-800">
              <SmartImage
                src={ytThumb(v.youtubeId)}
                alt={v.title}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 72vw"
                className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-105 group-hover:brightness-110"
              />
              {/* En celular el botón de play se ve siempre; con mouse aparece al pasar encima */}
              <span className="absolute inset-0 grid place-items-center transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                <span className="grid h-12 w-12 scale-90 place-items-center rounded-full bg-oro-500 text-noche-900 shadow-lg transition-transform duration-300 group-hover:scale-100">
                  <Play size={20} fill="currentColor" className="ml-0.5" aria-hidden />
                </span>
              </span>
            </span>
            <span className="flex flex-col gap-1">
              <span className="line-clamp-2 text-[15px] leading-snug font-semibold transition-colors group-hover:text-oro-400">{v.title}</span>
              <time dateTime={v.publishedAt} className="text-xs text-niebla-300">{longDate(v.publishedAt)}</time>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

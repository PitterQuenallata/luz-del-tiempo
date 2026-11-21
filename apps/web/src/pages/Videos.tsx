import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useSite, useVideos } from "../api";
import type { Video } from "../api/types";
import { RowHeading } from "../components/ui/Reveal";
import { VideoModal, ytThumb } from "../components/ui/VideoModal";
import { longDate } from "../lib/format";

/**
 * /videos — Sin cabecera ni filtros: el episodio más reciente en grande y
 * debajo una fila deslizable por serie (como YouTube / plataformas de video).
 */
export default function Videos() {
  const { data: videos = [] } = useVideos();
  const { data: site } = useSite();
  const [open, setOpen] = useState<Video | null>(null);
  const featured = videos.find((v) => v.isFeatured) ?? videos[0];

  const series = new Map<string, Video[]>();
  for (const v of [...videos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))) {
    const key = v.seriesName ?? "Otros videos";
    series.set(key, [...(series.get(key) ?? []), v]);
  }
  const latest = [...videos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 8);

  return (
    <>
      <title>Videos y podcast · La Luz del Tiempo</title>

      {featured && (
        <section className="relative isolate overflow-hidden">
          <img src={ytThumb(featured.youtubeId, "maxres")} onError={(e) => (e.currentTarget.src = ytThumb(featured.youtubeId))} alt="" className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
          <span className="absolute inset-0 -z-10 bg-gradient-to-b from-noche-900/40 via-noche-900/70 to-noche-900" />
          <div className="contenedor grid grid-cols-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1.35fr_1fr]">
            <motion.button
              type="button"
              layoutId={`videos-${featured.youtubeId}`}
              onClick={() => setOpen(featured)}
              className="group relative block aspect-video overflow-hidden rounded-2xl bg-black text-left shadow-2xl"
            >
              <img src={ytThumb(featured.youtubeId, "maxres")} onError={(e) => (e.currentTarget.src = ytThumb(featured.youtubeId))} alt="" className="h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-oro-500 text-noche-900 transition-colors group-hover:bg-oro-400">
                  <Play size={32} fill="currentColor" className="ml-1" />
                </span>
              </span>
            </motion.button>
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-2 text-sm text-oro-400">
                <span className="rounded bg-oro-500 px-2 py-0.5 text-xs font-semibold text-noche-900">Nuevo episodio</span>
                {featured.seriesName}
              </span>
              <h1 className="titulo text-[clamp(28px,3vw,46px)] leading-[1.08]">{featured.title}</h1>
              <span className="text-sm text-niebla-300">{longDate(featured.publishedAt)}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => setOpen(featured)} className="btn-oro"><Play size={16} fill="currentColor" /> Ver ahora</button>
                <a href={site?.redes?.youtube ?? "#"} target="_blank" rel="noreferrer" className="btn-borde">Ir al canal de YouTube</a>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="contenedor flex flex-col gap-10 py-8 sm:py-10">
        <VideoRow title="Lo más reciente" videos={latest} onOpen={setOpen} />
        {[...series.entries()].map(([name, list]) => (
          <VideoRow key={name} title={name} videos={list} onOpen={setOpen} />
        ))}
      </div>

      <VideoModal video={open} onClose={() => setOpen(null)} layoutPrefix="videos" />
    </>
  );
}

/** Fila deslizable de una serie, con flechas en pantallas grandes. */
function VideoRow({ title, videos, onOpen }: { title: string; videos: Video[]; onOpen: (v: Video) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <RowHeading title={title} />
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scroll(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-niebla-200 transition-colors hover:border-oro-500/60 hover:text-white" aria-label={`Anteriores de ${title}`}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll(1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-niebla-200 transition-colors hover:border-oro-500/60 hover:text-white" aria-label={`Siguientes de ${title}`}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={ref} className="-mx-4 flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {videos.map((v) => (
          <button key={v.youtubeId} type="button" onClick={() => onOpen(v)} className="group flex w-[72%] shrink-0 snap-start flex-col gap-3 text-left sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
            <span className="relative block aspect-video overflow-hidden rounded-xl bg-noche-800">
              <img src={ytThumb(v.youtubeId)} alt="" loading="lazy" className="h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-oro-500 text-noche-900"><Play size={20} fill="currentColor" /></span>
              </span>
            </span>
            <span className="flex flex-col gap-1">
              <span className="line-clamp-2 text-[15px] leading-snug font-semibold group-hover:text-oro-400">{v.title}</span>
              <span className="text-xs text-niebla-300">{longDate(v.publishedAt)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

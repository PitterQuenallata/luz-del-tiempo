import { Play } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Video } from "../../api/types";
import { longDate } from "../../lib/format";
import { VideoModal, ytThumb } from "../ui/VideoModal";
import { SmartImage } from "../ui/SmartImage";

/** Grilla de videos de YouTube con fachada liviana: el reproductor solo carga al abrir. */
export function VideoGrid({ videos, prefix = "grid" }: { videos: Video[]; prefix?: string }) {
  const [open, setOpen] = useState<Video | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <button key={v.youtubeId} type="button" onClick={() => setOpen(v)} className="group flex flex-col gap-3 text-left" aria-label={`Ver video: ${v.title}`}>
            <motion.span layoutId={`${prefix}-${v.youtubeId}`} className="relative block aspect-video overflow-hidden rounded-xl bg-noche-800">
              <SmartImage
                src={ytThumb(v.youtubeId)}
                alt={v.title}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-105 group-hover:brightness-110"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-oro-500 text-noche-900 shadow-lg transition-[background-color,transform] duration-300 group-hover:scale-110 group-hover:bg-oro-400">
                  <Play size={20} fill="currentColor" className="ml-0.5" aria-hidden />
                </span>
              </span>
            </motion.span>
            <span className="flex flex-col gap-1">
              <span className="text-xs text-oro-400">{v.seriesName ?? "Video"}</span>
              {/* Dentro de un botón no puede ir un título (h3): se usa span */}
              <span className="titulo text-lg leading-snug transition-colors group-hover:text-oro-400">{v.title}</span>
              <time dateTime={v.publishedAt} className="text-xs text-niebla-300">{longDate(v.publishedAt)}</time>
            </span>
          </button>
        ))}
      </div>
      <VideoModal video={open} onClose={() => setOpen(null)} layoutPrefix={prefix} />
    </>
  );
}

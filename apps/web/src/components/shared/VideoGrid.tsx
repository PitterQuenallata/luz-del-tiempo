import { Play } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Video } from "../../api/types";
import { longDate } from "../../lib/format";
import { VideoModal, ytThumb } from "../ui/VideoModal";

/** Grilla de videos de YouTube con fachada liviana: el reproductor solo carga al abrir. */
export function VideoGrid({ videos, prefix = "grid" }: { videos: Video[]; prefix?: string }) {
  const [open, setOpen] = useState<Video | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <button key={v.youtubeId} type="button" onClick={() => setOpen(v)} className="group flex flex-col gap-3 text-left">
            <motion.span layoutId={`${prefix}-${v.youtubeId}`} className="relative block aspect-video overflow-hidden rounded-xl bg-noche-800">
              <img src={ytThumb(v.youtubeId)} alt="" loading="lazy" className="h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-oro-500 text-noche-900 transition-colors group-hover:bg-oro-400">
                  <Play size={20} fill="currentColor" />
                </span>
              </span>
            </motion.span>
            <span className="flex flex-col gap-1">
              <span className="text-xs text-oro-400">{v.seriesName ?? "Video"}</span>
              <span className="titulo text-lg leading-snug group-hover:text-oro-400">{v.title}</span>
              <span className="text-xs text-niebla-300">{longDate(v.publishedAt)}</span>
            </span>
          </button>
        ))}
      </div>
      <VideoModal video={open} onClose={() => setOpen(null)} layoutPrefix={prefix} />
    </>
  );
}

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { Video } from "../../api/types";

export const ytThumb = (id: string, q: "hq" | "maxres" = "hq") => `https://i.ytimg.com/vi/${id}/${q}default.jpg`;

/**
 * Reproductor de YouTube en un modal. La miniatura con el mismo `layoutId`
 * crece hasta ser el reproductor. El iframe solo se carga al abrir.
 */
export function VideoModal({ video, onClose, layoutPrefix }: { video: Video | null; onClose: () => void; layoutPrefix: string }) {
  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [video, onClose]);

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-noche-950/90 p-4 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
        >
          <motion.div
            layoutId={`${layoutPrefix}-${video.youtubeId}`}
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
          <button type="button" onClick={onClose} className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Cerrar video">
            <X />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

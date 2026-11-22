import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect } from "react";
import type { Video } from "../../api/types";

export const ytThumb = (id: string, q: "hq" | "maxres" = "hq") => `https://i.ytimg.com/vi/${id}/${q}default.jpg`;

/** Un video como VideoObject de schema.org (Google lo puede mostrar en la pestaña de videos). */
export const videoJsonLd = (v: Video) => ({
  "@type": "VideoObject",
  name: v.title,
  description: v.seriesName ? `${v.seriesName}: ${v.title}` : v.title,
  thumbnailUrl: [ytThumb(v.youtubeId, "maxres"), ytThumb(v.youtubeId)],
  uploadDate: v.publishedAt,
  embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
  contentUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
});

/**
 * Reproductor de YouTube en un modal. La miniatura con el mismo `layoutId`
 * crece hasta ser el reproductor. El iframe solo se carga al abrir.
 * Mientras está abierto, la página de atrás no se desplaza.
 */
export function VideoModal({ video, onClose, layoutPrefix }: { video: Video | null; onClose: () => void; layoutPrefix: string }) {
  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
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
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Cerrar video"
          >
            <X />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

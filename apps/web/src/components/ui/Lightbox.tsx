import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Visor de fotos a pantalla completa. Se cierra con Esc, tocando fuera o con la X;
 * se pasa de foto con las flechas del teclado, los botones o deslizando el dedo.
 */
export function Lightbox({
  images,
  index,
  onIndex,
  alt,
}: {
  images: string[];
  /** Foto abierta; null = cerrado. */
  index: number | null;
  onIndex: (i: number | null) => void;
  alt: (i: number) => string;
}) {
  const open = index !== null;
  const go = (step: number) => index !== null && onIndex((index + step + images.length) % images.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  });

  const onDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 60) go(info.offset.x < 0 ? 1 : -1);
    else if (info.offset.y > 90) onIndex(null);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-noche-950/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onIndex(null)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={images[index]}
              src={images[index]}
              alt={alt(index)}
              className="max-h-[82svh] max-w-full cursor-grab touch-none rounded-xl object-contain shadow-2xl active:cursor-grabbing"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25 }}
              drag
              dragSnapToOrigin
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </AnimatePresence>

          <button
            type="button"
            onClick={() => onIndex(null)}
            className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), go(-1))}
                className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 max-sm:hidden"
                aria-label="Foto anterior"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), go(1))}
                className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 max-sm:hidden"
                aria-label="Foto siguiente"
              >
                <ChevronRight />
              </button>
              <span className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-xs tabular-nums text-niebla-100">
                {index + 1} / {images.length}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

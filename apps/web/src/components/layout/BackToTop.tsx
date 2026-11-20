import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { usePlayer } from "../../player/PlayerProvider";

/**
 * Botón para volver arriba (abajo a la derecha). Aparece cuando ya se bajó
 * más de una pantalla y media, así que en páginas cortas casi no se ve.
 * El anillo dorado muestra cuánto de la página se recorrió.
 * Si el reproductor está abierto, sube para no taparlo.
 */
export function BackToTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const [show, setShow] = useState(false);
  const { station } = usePlayer();
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > window.innerHeight * 1.5));

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed right-4 z-[45] grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-noche-800/95 text-oro-400 shadow-xl backdrop-blur transition-[bottom,background-color] duration-300 hover:bg-noche-700 sm:right-6 ${
            station ? "bottom-24" : "bottom-6"
          }`}
          aria-label="Volver arriba"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
        >
          <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <motion.circle cx="24" cy="24" r="22" fill="none" stroke="#e2a927" strokeWidth="2" strokeLinecap="round" style={{ pathLength: scrollYProgress }} />
          </svg>
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

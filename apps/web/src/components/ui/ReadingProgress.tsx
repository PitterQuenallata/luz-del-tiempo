import { motion, useScroll, useSpring } from "motion/react";
import type { RefObject } from "react";

/** Línea dorada fija arriba que se llena a medida que se lee el artículo. */
export function ReadingProgress({ target }: { target: RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start 30%", "end 70%"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-oro-500"
      style={{ scaleX }}
      role="progressbar"
      aria-label="Avance de lectura"
      aria-hidden
    />
  );
}

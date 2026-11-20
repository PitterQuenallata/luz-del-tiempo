import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

/**
 * ELEMENTO FIRMA del sitio: las tres estelas de los ángeles del logo.
 * Se usa siempre igual y solo en dos lugares:
 *  - <EstelasMarca>: tres trazos dorados decrecientes delante de cada título de sección.
 *  - <EstelasVuelo>: las tres estelas cruzando la portada, dibujándose de izquierda a derecha.
 */

const ease = [0.22, 1, 0.36, 1] as const;

export function EstelasMarca({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  return (
    <span ref={ref} className={`inline-flex flex-col items-end gap-[3px] self-start ${className}`} aria-hidden>
      {[18, 13, 8].map((w, i) => (
        <motion.span
          key={w}
          className="block h-[3px] origin-right rounded-full bg-oro-500"
          style={{ width: w }}
          initial={reduce ? false : { scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : undefined}
          transition={{ duration: 0.6, delay: 0.1 + i * 0.12, ease }}
        />
      ))}
    </span>
  );
}

/** Curvas inspiradas en el vuelo de los tres ángeles: suben de izquierda a derecha. */
const PATHS = [
  "M -40 360 C 220 330, 420 250, 640 210 S 1020 150, 1240 120",
  "M -40 420 C 240 390, 460 310, 700 270 S 1060 210, 1260 190",
  "M -40 480 C 260 450, 500 370, 760 330 S 1100 270, 1280 260",
];

export function EstelasVuelo({ replayKey }: { replayKey?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 560"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="estela" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e2a927" stopOpacity="0" />
          <stop offset="0.75" stopColor="#f0c35a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f6e3b8" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {PATHS.map((d, i) => (
        <motion.path
          key={`${replayKey}-${i}`}
          d={d}
          fill="none"
          stroke="url(#estela)"
          strokeWidth={2.2 - i * 0.5}
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, delay: 0.2 + i * 0.25, ease }}
        />
      ))}
    </svg>
  );
}

/**
 * Movimiento de toda la web en un solo lugar, para que cada entrada se sienta igual
 * en celular, tablet y PC:
 *  - una sola curva (ease-out cúbica): arranca ágil y frena suave, sin rebote;
 *  - desplazamientos cortos (10 px): el contenido "se asienta", no "vuela";
 *  - cascadas (stagger) cortas y con tope, para que nada espere de más.
 * Con "reducir movimiento" del sistema, MotionConfig (main.tsx) quita los desplazamientos
 * y deja solo el fundido; las animaciones CSS se apagan en index.css.
 */

/** Curva de entrada (ease-out cúbica). */
export const EASE = [0.33, 1, 0.68, 1] as const;

/** Duraciones en segundos. */
export const DUR = {
  /** Salidas y cambios pequeños (íconos, filtros). */
  fast: 0.2,
  /** Entradas de contenido (fade in / fade up). */
  base: 0.45,
  /** Bloques grandes (portadas). */
  slow: 0.6,
} as const;

/** Distancia del fade up, en px. */
export const OFFSET = 10;

/**
 * Retraso del elemento `i` en una cascada: 50 ms entre uno y otro, con tope de 250 ms.
 * Así una lista larga no hace esperar a los últimos.
 */
export const stagger = (i: number, step = 0.05, max = 0.25) => Math.min(i * step, max);

/** Variantes listas para `initial="hidden" animate="show"` o `whileInView="show"`. */
export const fadeUp = {
  hidden: { opacity: 0, y: OFFSET },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
};
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};
/** Contenedor que reparte la entrada de sus hijos en cascada. */
export const staggerParent = (step = 0.05) => ({ hidden: {}, show: { transition: { staggerChildren: step } } });

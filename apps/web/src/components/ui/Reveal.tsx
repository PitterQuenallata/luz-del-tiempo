import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { EstelasMarca } from "./Estelas";
import { DUR, EASE, OFFSET, fadeUp, staggerParent } from "../../lib/motion";

/** Fade up: aparece suave al entrar en pantalla (una sola vez). */
export function Reveal({ delay = 0, y = OFFSET, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: DUR.base, delay, ease: EASE }}
      {...props}
    />
  );
}

/**
 * Stagger: los hijos `StaggerItem` entran uno tras otro (50 ms entre cada uno) cuando el grupo
 * aparece en pantalla. `mount` lo anima al montar, para lo que ya está visible arriba (cabeceras).
 */
export function Stagger({ step = 0.05, mount = false, ...props }: HTMLMotionProps<"div"> & { step?: number; mount?: boolean }) {
  const trigger = mount ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "-40px" } };
  return <motion.div initial="hidden" variants={staggerParent(step)} {...trigger} {...props} />;
}

/** Elemento de un `Stagger`: fade up con la curva y distancia comunes. */
export function StaggerItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={fadeUp} {...props} />;
}

/** Encabezado de fila: "Programación de hoy ............ [ver toda]". */
export function RowHeading({ title, to, label = "ver todos" }: { title: string; to?: string; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-3">
        <EstelasMarca />
        <h2 className="titulo text-xl">{title}</h2>
      </span>
      {to && <Link to={to} className="chip-ver">{label}</Link>}
    </div>
  );
}

/** Encabezado de banda: estelas + eyebrow dorado, título y botón dorado a la derecha. */
export function BandHeading({ eyebrow, text, action }: { eyebrow: string; text: string; action?: ReactNode }) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-3">
        <span className="flex items-center gap-3">
          <EstelasMarca />
          <span className="eyebrow">{eyebrow}</span>
        </span>
        <h2 className="titulo max-w-xl text-[clamp(20px,2.4vw,26px)] leading-tight">{text}</h2>
      </div>
      {action}
    </Reveal>
  );
}

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { EstelasMarca } from "./Estelas";

/** Aparece suave al entrar en pantalla. */
export function Reveal({ delay = 0, y = 10, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      {...props}
    />
  );
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

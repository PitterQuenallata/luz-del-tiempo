import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { staggerParent } from "../../lib/motion";
import { Stagger, StaggerItem } from "../ui/Reveal";

/**
 * Cabecera común de las páginas internas. Compacta a propósito: ruta, título
 * y una línea de bajada, para que el contenido importante se vea de entrada.
 * `children` va a la derecha en pantallas grandes (ej. un dato rápido).
 */
export function PageHeader({
  title,
  subtitle,
  crumbs = [],
  children,
}: {
  title: string;
  subtitle?: string;
  crumbs?: { to: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-white/[0.06]">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(90deg, black 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(90deg, black 0%, transparent 70%)",
        }}
        aria-hidden
      />
      {/* Entrada en cascada al abrir la página: ruta, título, bajada y el dato de la derecha */}
      <Stagger mount className="contenedor relative flex flex-wrap items-end justify-between gap-x-8 gap-y-3 py-6 sm:py-8">
        <motion.div variants={staggerParent()} className="flex min-w-0 flex-col gap-2">
          <StaggerItem>
          <nav aria-label="Ubicación" className="flex flex-wrap items-center gap-1 text-xs text-niebla-300">
            <Link to="/" className="hover:text-oro-400">Inicio</Link>
            {crumbs.map((c) => (
              <span key={c.to} className="flex items-center gap-1">
                <ChevronRight size={12} aria-hidden />
                <Link to={c.to} className="hover:text-oro-400">{c.label}</Link>
              </span>
            ))}
          </nav>
          </StaggerItem>
          <StaggerItem>
            <h1 className="titulo text-[clamp(28px,3.2vw,42px)] leading-[1.08]">{title}</h1>
          </StaggerItem>
          {subtitle && (
            <StaggerItem>
              <p className="max-w-2xl text-[15px] leading-relaxed text-niebla-200 sm:text-base">{subtitle}</p>
            </StaggerItem>
          )}
        </motion.div>
        {children && <StaggerItem className="max-sm:w-full">{children}</StaggerItem>}
      </Stagger>
    </header>
  );
}

/** Contenedor estándar de las páginas internas. */
export function PageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`contenedor flex flex-col gap-10 py-8 sm:py-10 ${className}`}>{children}</div>;
}

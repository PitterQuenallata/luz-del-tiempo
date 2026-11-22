import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";

/**
 * Tarjeta que se inclina un poco hacia el mouse, con un brillo que lo sigue.
 * Solo con mouse (en celular no hay "encima"); respeta "reducir movimiento".
 */
export function Tilt({ children, className = "", max = 5 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 150, damping: 22, mass: 0.5 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const glowX = useTransform(px, (v) => `${v * 100}%`);
  const glowY = useTransform(py, (v) => `${v * 100}%`);
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, rgb(226 169 39 / 0.22), transparent 55%)`;
  const opacity = useSpring(0, spring);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={`relative [transform-style:preserve-3d] ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
        opacity.set(1);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
        opacity.set(0);
      }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glow, opacity }} />
    </motion.div>
  );
}

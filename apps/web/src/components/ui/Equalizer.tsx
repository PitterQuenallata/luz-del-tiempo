import { motion, useReducedMotion } from "motion/react";

/** Barras de ecualizador animadas; quietas si no está sonando. */
export function Equalizer({ active, color = "currentColor", bars = 4, className = "h-4" }: {
  active: boolean;
  color?: string;
  bars?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={`inline-flex items-end gap-[3px] ${className}`} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color, originY: 1 }}
          initial={{ height: "30%" }}
          animate={
            active && !reduce
              ? { height: ["30%", "100%", "45%", "85%", "30%"] }
              : { height: "30%" }
          }
          transition={{ duration: 1 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}
    </span>
  );
}

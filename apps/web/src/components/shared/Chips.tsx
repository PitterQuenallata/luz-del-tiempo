import { motion } from "motion/react";
import { useEffect, useId, useRef } from "react";

/**
 * Filtros tipo píldora (áreas, tipos, emisoras, días).
 * La píldora dorada se desliza hasta la opción elegida, y en celular (fila con scroll lateral)
 * la opción elegida se centra sola para que nunca quede escondida fuera de la pantalla.
 */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const pill = useId();
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = row.current;
    const active = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !active || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: active.offsetLeft - el.clientWidth / 2 + active.offsetWidth / 2, behavior: "smooth" });
  }, [value]);

  return (
    <div
      ref={row}
      role="group"
      aria-label={label}
      className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {options.map((o) => {
        const on = value === o.id;
        return (
          <motion.button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            whileTap={{ scale: 0.95 }}
            className={`relative isolate min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
              on ? "border-oro-500 text-noche-900" : "border-white/10 text-niebla-200 hover:border-oro-500/60 hover:text-white"
            }`}
          >
            {on && (
              <motion.span
                layoutId={pill}
                className="absolute inset-0 -z-10 rounded-full bg-oro-500"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {o.label}
          </motion.button>
        );
      })}
    </div>
  );
}

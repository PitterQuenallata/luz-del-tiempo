import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

/** Lo que conviene copiar de una línea: un número de cuenta o un correo. Si no hay, null. */
export const copiable = (line: string) => line.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? line.match(/\d[\d-]{4,}\d/)?.[0] ?? null;

/**
 * Línea de datos que se copia con un toque (número de cuenta, correo).
 * Muestra un check y "Copiado" por dos segundos. Sin nada copiable, es texto normal.
 */
export function CopyLine({ line }: { line: string }) {
  const value = copiable(line);
  const [ok, setOk] = useState(false);
  if (!value) return <span className="[overflow-wrap:anywhere]">{line}</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch {
      prompt("Copia el dato:", value);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={copy}
      whileTap={{ scale: 0.97 }}
      className="group -mx-2 flex min-h-9 w-[calc(100%+1rem)] items-center justify-between gap-2 rounded-lg px-2 text-left transition-colors hover:bg-white/[0.05]"
      aria-label={`Copiar ${value}`}
    >
      <span className="tabular-nums [overflow-wrap:anywhere]">{line}</span>
      <span className="flex shrink-0 items-center gap-1 text-xs text-oro-400" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={ok ? "ok" : "copy"}
            className="flex items-center gap-1"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
          >
            {ok ? <Check size={14} aria-hidden /> : <Copy size={14} className="opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />}
            {ok && "Copiado"}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

import { Check, Share2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

/**
 * Compartir: en el celular abre el menú del sistema (WhatsApp, Facebook…);
 * en la computadora copia el enlace y lo confirma con un check.
 */
export function ShareButton({ title, text, className = "btn-borde" }: { title: string; text?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // El usuario cerró el menú: no es un error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copia el enlace:", url);
    }
  };
  return (
    <motion.button type="button" onClick={share} whileTap={{ scale: 0.95 }} className={className} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "ok" : "share"}
          className="grid place-items-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {copied ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />}
        </motion.span>
      </AnimatePresence>
      {copied ? "Enlace copiado" : "Compartir"}
    </motion.button>
  );
}

import { RefreshCw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Esqueletos de carga: bloques con un brillo que los recorre (shimmer) mientras llegan los datos.
 * Cada esqueleto copia las medidas del contenido real, por breakpoint, para que al cargar
 * nada salte de lugar (CLS). Con "reducir movimiento" el brillo se reemplaza por un pulso suave.
 */

/** Bloque base. El tamaño y la forma van en className (mismas clases responsive que el contenido real). */
export function Sk({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`sk block ${className}`} style={style} aria-hidden />;
}

/** Líneas de texto; la última más corta, como un párrafo real. */
export function SkText({ lines = 3, className = "", line = "h-3.5" }: { lines?: number; className?: string; line?: string }) {
  return (
    <span className={`flex flex-col gap-2.5 ${className}`} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Sk key={i} className={`${line} rounded ${i === lines - 1 && lines > 1 ? "w-3/5" : "w-full"}`} />
      ))}
    </span>
  );
}

/** Zona en carga: avisa a los lectores de pantalla ("Cargando…"); los bloques son decorativos. */
export function SkeletonRegion({ children, className = "", label = "Cargando contenido" }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div className={className} role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

/** Estado de error con botón para reintentar. `compact` para usarlo dentro de una sección del inicio. */
export function LoadError({ onRetry, compact = false, message = "No pudimos cargar este contenido" }: { onRetry?: () => void; compact?: boolean; message?: string }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-noche-800/60 text-center ${compact ? "px-5 py-6" : "px-6 py-14"}`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-niebla-300">
        <WifiOff size={20} aria-hidden />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-semibold">{message}</span>
        <span className="text-sm text-niebla-300">Revisa tu conexión e intenta de nuevo</span>
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-borde mt-1">
          <RefreshCw size={15} aria-hidden /> Reintentar
        </button>
      )}
    </div>
  );
}

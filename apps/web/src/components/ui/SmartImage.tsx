import { useLayoutEffect, useRef, useState } from "react";

/** Fotos que ya se mostraron en esta visita: al volver a una página aparecen sin fundido ni esqueleto. */
const vistas = new Set<string>();

/**
 * Imagen con sus tres estados:
 * - cargando: un esqueleto con brillo (shimmer) ocupa exactamente su lugar, sin mover nada (CLS 0);
 * - lista: aparece con un fundido corto (o directo, si ya estaba en la caché del navegador);
 * - error: si falla, prueba `fallbackSrc`; si también falla, se retira y queda el diseño
 *   que tenga debajo (degradado, logo, ícono). Así la web se ve completa con o sin fotos.
 *
 * Se coloca con `absolute inset-0` sobre un contenedor con posición (relative/absolute) y medidas
 * propias (aspect-ratio, alto fijo…): el contenedor reserva el espacio, no la imagen.
 */
export function SmartImage({
  src,
  alt = "",
  className = "absolute inset-0 h-full w-full object-cover",
  eager = false,
  sizes,
  fallbackSrc,
  skeleton = true,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  eager?: boolean;
  /** Ancho con que se muestra (p. ej. "(min-width: 768px) 25vw, 62vw"), para cuando la API entregue varios tamaños. */
  sizes?: string;
  /** Segunda opción si la primera falla (p. ej. miniatura de YouTube en calidad menor). */
  fallbackSrc?: string;
  /** false para imágenes decorativas (fondos difuminados) que no necesitan esqueleto. */
  skeleton?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(() => !!src && vistas.has(src));

  // Si cambia la foto (otra diapositiva, otra emisora), se reinicia el estado.
  if (current !== src && !(fallbackSrc && current === fallbackSrc)) {
    setCurrent(src);
    setFailed(false);
    setLoaded(!!src && vistas.has(src));
  }

  // Antes de pintar: si el navegador ya la tiene en caché, se muestra directo, sin esqueleto.
  useLayoutEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [current]);

  if (!current || failed) return null;
  return (
    <>
      {skeleton && !loaded && <span className="sk absolute inset-0 rounded-none" aria-hidden />}
      <img
        ref={ref}
        src={current}
        alt={alt}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        onLoad={() => {
          vistas.add(current);
          setLoaded(true);
        }}
        onError={() => {
          if (fallbackSrc && current !== fallbackSrc) setCurrent(fallbackSrc);
          else setFailed(true);
        }}
        className={`${className} transition-opacity duration-300 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

import { useLayoutEffect, useRef, useState } from "react";

/** Fotos que ya se mostraron en esta visita: al volver a una página aparecen sin fundido. */
const vistas = new Set<string>();

/**
 * Imagen que se retira sola si el archivo no existe (o falla al cargar), para
 * que debajo quede el diseño sin foto (degradado, logo). Así la web se ve
 * completa antes y después de tener las imágenes de la demo.
 * Se coloca encima del fondo con `absolute inset-0` por defecto.
 *
 * Solo las fotos que de verdad llegan por la red aparecen con un fundido corto;
 * las que ya están en la caché del navegador se muestran de inmediato, sin parpadeo.
 */
export function SmartImage({
  src,
  alt = "",
  className = "absolute inset-0 h-full w-full object-cover",
  eager = false,
  sizes,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  eager?: boolean;
  /** Ancho con que se muestra (p. ej. "(min-width: 768px) 25vw, 62vw"), para cuando la API entregue varios tamaños. */
  sizes?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(() => !!src && vistas.has(src));

  // Antes de pintar: si el navegador ya la tiene en caché, se muestra directo.
  useLayoutEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  if (!src || failed) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      onLoad={() => {
        vistas.add(src);
        setLoaded(true);
      }}
      onError={() => setFailed(true)}
      className={`${className} transition-opacity duration-300 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
}

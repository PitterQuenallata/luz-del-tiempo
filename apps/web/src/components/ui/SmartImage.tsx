import { useState } from "react";

/**
 * Imagen que se retira sola si el archivo no existe (o falla al cargar), para
 * que debajo quede el diseño sin foto (degradado, logo). Así la web se ve
 * completa antes y después de tener las imágenes de la demo.
 * Se coloca encima del fondo con `absolute inset-0` por defecto.
 */
export function SmartImage({
  src,
  alt = "",
  className = "absolute inset-0 h-full w-full object-cover",
  eager = false,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
}

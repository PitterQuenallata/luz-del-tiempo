import { useLocation } from "react-router";

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "").replace(/\/$/, "");

/**
 * Título, descripción y etiquetas para compartir de cada página.
 * React 19 las sube solas al <head> y las cambia al navegar.
 * La URL canónica solo se pone si hay dominio (VITE_SITE_URL).
 * `jsonLd`: datos estructurados de schema.org propios de la página.
 */
export function Seo({ title, description, jsonLd }: { title: string; description: string; jsonLd?: object }) {
  const { pathname } = useLocation();
  const url = SITE_URL ? `${SITE_URL}${pathname}` : null;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {url && <link rel="canonical" href={url} />}
      {url && <meta property="og:url" content={url} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </>
  );
}

/** URL absoluta para datos estructurados: el dominio si está configurado, si no el del navegador. */
export const absoluta = (path: string) => new URL(path, SITE_URL || location.origin).href;

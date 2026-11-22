import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * public/demo/ tiene imágenes SOLO para mostrar la demo al cliente (algunas son
 * de referencia, de otro ministerio). Nunca deben publicarse: este plugin las
 * borra de dist/ al compilar. Para una demo compilada a propósito:
 *   INCLUIR_DEMO=1 pnpm build
 */
function sinImagenesDemo(): Plugin {
  return {
    name: "sin-imagenes-demo",
    apply: "build",
    async closeBundle() {
      if (process.env.INCLUIR_DEMO === "1") return;
      await rm(resolve(__dirname, "dist/demo"), { recursive: true, force: true });
    },
  };
}

/** Páginas fijas del sitio, para el sitemap. Las de detalle (noticias, actividades) se suman cuando la web lea la API. */
const RUTAS = ["/", "/radio", "/programacion", "/areas", "/actividades", "/videos", "/noticias", "/nosotros", "/donar", "/contacto"];

/**
 * SEO que necesita el dominio real (VITE_SITE_URL, p. ej. https://laluzdeltiempo.org):
 * - reemplaza %SITE_URL% en index.html (canonical, Open Graph, JSON-LD);
 * - genera robots.txt y sitemap.xml al compilar.
 * Sin dominio, quita las etiquetas marcadas con data-requiere-url (una URL relativa ahí confunde a Google y WhatsApp).
 */
function seo(siteUrl: string): Plugin {
  const url = siteUrl.replace(/\/$/, "");
  return {
    name: "seo-luz",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const limpio = url
          ? html.replaceAll(" data-requiere-url", "")
          : html.replace(/^.*data-requiere-url.*\n/gm, "");
        return limpio.replaceAll("%SITE_URL%", url);
      },
    },
    generateBundle() {
      const robots = ["User-agent: *", "Allow: /", ...(url ? ["", `Sitemap: ${url}/sitemap.xml`] : [])].join("\n");
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots + "\n" });
      if (!url) return;
      const hoy = new Date().toISOString().slice(0, 10);
      const urls = RUTAS.map(
        (r) => `  <url><loc>${url}${r}</loc><lastmod>${hoy}</lastmod><priority>${r === "/" ? "1.0" : "0.7"}</priority></url>`,
      ).join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");
  return {
    plugins: [react(), tailwindcss(), sinImagenesDemo(), seo(env.VITE_SITE_URL ?? "")],
    server: { port: 5173 },
  };
});

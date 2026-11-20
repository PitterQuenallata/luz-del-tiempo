import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
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

export default defineConfig({
  plugins: [react(), tailwindcss(), sinImagenesDemo()],
  server: { port: 5173 },
});

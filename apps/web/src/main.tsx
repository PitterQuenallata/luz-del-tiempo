import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { MotionConfig } from "motion/react";
import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Layout } from "./components/layout/Layout";
import "./index.css";
import Home from "./pages/Home";
import { PlayerProvider } from "./player/PlayerProvider";
import { EASE } from "./lib/motion";

// El inicio va en el paquete principal; las demás páginas se descargan aparte (menos JS al abrir la web en el celular).
const paginas = {
  Actividad: () => import("./pages/Actividad"),
  Agenda: () => import("./pages/Agenda"),
  Area: () => import("./pages/Area"),
  Areas: () => import("./pages/Areas"),
  ComingSoon: () => import("./pages/ComingSoon"),
  Contacto: () => import("./pages/Contacto"),
  Donar: () => import("./pages/Donar"),
  Emisora: () => import("./pages/Emisora"),
  Noticia: () => import("./pages/Noticia"),
  Noticias: () => import("./pages/Noticias"),
  Nosotros: () => import("./pages/Nosotros"),
  Programacion: () => import("./pages/Programacion"),
  Radio: () => import("./pages/Radio"),
  Videos: () => import("./pages/Videos"),
};
const Actividad = lazy(paginas.Actividad);
const Agenda = lazy(paginas.Agenda);
const Area = lazy(paginas.Area);
const Areas = lazy(paginas.Areas);
const ComingSoon = lazy(paginas.ComingSoon);
const Contacto = lazy(paginas.Contacto);
const Donar = lazy(paginas.Donar);
const Emisora = lazy(paginas.Emisora);
const Noticia = lazy(paginas.Noticia);
const Noticias = lazy(paginas.Noticias);
const Nosotros = lazy(paginas.Nosotros);
const Programacion = lazy(paginas.Programacion);
const Radio = lazy(paginas.Radio);
const Videos = lazy(paginas.Videos);

// Cuando la página ya cargó y el navegador está libre, se bajan las demás en segundo plano:
// así, al tocar un enlace, la página nueva aparece al instante (sin pantalla vacía).
const precargar = () => Object.values(paginas).forEach((cargar) => void cargar().catch(() => {}));
window.addEventListener("load", () => ("requestIdleCallback" in window ? requestIdleCallback(precargar, { timeout: 4000 }) : setTimeout(precargar, 2000)), { once: true });

// index.html trae título y descripción fijos para quien no ejecuta JavaScript (buscadores, WhatsApp).
// Ya en el navegador, cada página pone los suyos con <Seo>; se quitan los fijos para que no queden duplicados.
document.querySelectorAll("[data-estatico]").forEach((el) => el.remove());

/**
 * Caché de datos: lo que se descargó (emisoras, programación, actividades…) se guarda en el
 * navegador por 24 horas. Al recargar o volver a la web, todo se muestra al instante con lo guardado
 * y se actualiza en segundo plano si tiene más de 5 minutos.
 */
const DIA = 24 * 60 * 60 * 1000;
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, gcTime: DIA, refetchOnWindowFocus: false } },
});

// En modo privado o con el almacenamiento bloqueado, localStorage puede fallar: entonces la web funciona sin caché.
const storage = (() => {
  try {
    const s = window.localStorage;
    s.setItem("luz-prueba", "1");
    s.removeItem("luz-prueba");
    return s;
  } catch {
    return undefined;
  }
})();
const persister = createSyncStoragePersister({ storage, key: "luz-cache", throttleTime: 1000 });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* buster: cada versión publicada descarta la caché anterior, por si cambió la forma de los datos */}
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: DIA, buster: __BUILD_ID__ }}>
      {/* Movimiento por defecto: suave y sin rebote */}
      <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: EASE }}>
        <PlayerProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="radio" element={<Radio />} />
                <Route path="emisora/:slug" element={<Emisora />} />
                <Route path="programacion" element={<Programacion />} />
                <Route path="videos" element={<Videos />} />
                <Route path="noticias" element={<Noticias />} />
                <Route path="noticias/:slug" element={<Noticia />} />
                <Route path="areas" element={<Areas />} />
                <Route path="areas/:slug" element={<Area />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="agenda/:slug" element={<Actividad />} />
                <Route path="actividades" element={<Navigate to="/agenda" replace />} />
                <Route path="actividades/:slug" element={<Navigate to="/agenda" replace />} />
                <Route path="nosotros" element={<Nosotros />} />
                <Route path="donar" element={<Donar />} />
                <Route path="contacto" element={<Contacto />} />
                <Route path="*" element={<ComingSoon title="Página no encontrada" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PlayerProvider>
      </MotionConfig>
    </PersistQueryClientProvider>
  </StrictMode>,
);

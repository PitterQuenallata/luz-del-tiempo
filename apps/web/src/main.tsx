import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "./components/layout/Layout";
import "./index.css";
import Home from "./pages/Home";
import { PlayerProvider } from "./player/PlayerProvider";

// El inicio va en el paquete principal; las demás páginas se descargan al visitarlas (menos JS en el celular).
const Actividad = lazy(() => import("./pages/Actividad"));
const Actividades = lazy(() => import("./pages/Actividades"));
const Area = lazy(() => import("./pages/Area"));
const Areas = lazy(() => import("./pages/Areas"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Contacto = lazy(() => import("./pages/Contacto"));
const Donar = lazy(() => import("./pages/Donar"));
const Noticia = lazy(() => import("./pages/Noticia"));
const Noticias = lazy(() => import("./pages/Noticias"));
const Nosotros = lazy(() => import("./pages/Nosotros"));
const Programacion = lazy(() => import("./pages/Programacion"));
const Radio = lazy(() => import("./pages/Radio"));
const Videos = lazy(() => import("./pages/Videos"));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <PlayerProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="radio" element={<Radio />} />
                <Route path="programacion" element={<Programacion />} />
                <Route path="videos" element={<Videos />} />
                <Route path="noticias" element={<Noticias />} />
                <Route path="noticias/:slug" element={<Noticia />} />
                <Route path="areas" element={<Areas />} />
                <Route path="areas/:slug" element={<Area />} />
                <Route path="actividades" element={<Actividades />} />
                <Route path="actividades/:slug" element={<Actividad />} />
                <Route path="nosotros" element={<Nosotros />} />
                <Route path="donar" element={<Donar />} />
                <Route path="contacto" element={<Contacto />} />
                <Route path="*" element={<ComingSoon title="Página no encontrada" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PlayerProvider>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);

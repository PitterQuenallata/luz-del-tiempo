import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "./components/layout/Layout";
import "./index.css";
import Actividad from "./pages/Actividad";
import Actividades from "./pages/Actividades";
import Area from "./pages/Area";
import Areas from "./pages/Areas";
import ComingSoon from "./pages/ComingSoon";
import Contacto from "./pages/Contacto";
import Donar from "./pages/Donar";
import Home from "./pages/Home";
import Noticia from "./pages/Noticia";
import Noticias from "./pages/Noticias";
import Nosotros from "./pages/Nosotros";
import Programacion from "./pages/Programacion";
import Radio from "./pages/Radio";
import Videos from "./pages/Videos";
import { PlayerProvider } from "./player/PlayerProvider";

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

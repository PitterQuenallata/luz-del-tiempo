import { AboutDonate, AppPromo } from "../components/home/AboutAndApp";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { LatestAndToday } from "../components/home/LatestAndToday";
import { NewsBand } from "../components/home/NewsBand";
import { NowPlayingStrip } from "../components/home/NowPlayingStrip";
import { ActivitiesRow, AreasRow } from "../components/home/PosterRows";
import { StationsBand } from "../components/home/StationsBand";
import { VideoBand } from "../components/home/VideoBand";
import { useActivities } from "../api";
import { Seo } from "../components/Seo";
import { eventJsonLd } from "../lib/eventos";

/** Actividades próximas como eventos (schema.org/Event): Google puede mostrarlas con fecha y lugar. */
function ActivitiesJsonLd() {
  const { data: activities = [] } = useActivities();
  if (!activities.length) return null;
  const data = { "@context": "https://schema.org", "@graph": activities.slice(0, 6).map(eventJsonLd) };
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

/** Inicio según el diseño "Opción 1 — Menú arriba". */
export default function Home() {
  return (
    <>
      <Seo
        title="La Luz del Tiempo · Radio cristiana en vivo 24/7 desde Bolivia"
        description="Ministerio La Luz del Tiempo: radio cristiana en vivo las 24 horas, sin anuncios. Música, prédicas, salud, escuelas y estudios bíblicos desde Bolivia."
      />
      {/* Un solo H1 fijo para buscadores y lectores de pantalla; los títulos del carrusel son H2 */}
      <h1 className="sr-only">La Luz del Tiempo: radio cristiana en vivo 24/7, música, prédicas y salud desde Bolivia</h1>
      <ActivitiesJsonLd />
      <HeroCarousel />
      <NowPlayingStrip />
      <AppPromo />
      <LatestAndToday />
      <VideoBand />
      <ActivitiesRow />
      <AreasRow />
      <StationsBand />
      <NewsBand />
      <AboutDonate />
    </>
  );
}

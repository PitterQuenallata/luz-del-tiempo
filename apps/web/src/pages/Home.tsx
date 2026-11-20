import { AboutDonate, AppPromo } from "../components/home/AboutAndApp";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { LatestAndToday } from "../components/home/LatestAndToday";
import { NewsBand } from "../components/home/NewsBand";
import { NowPlayingStrip } from "../components/home/NowPlayingStrip";
import { ActivitiesRow, AreasRow } from "../components/home/PosterRows";
import { StationsBand } from "../components/home/StationsBand";
import { VideoBand } from "../components/home/VideoBand";

/** Inicio según el diseño "Opción 1 — Menú arriba". */
export default function Home() {
  return (
    <>
      <title>La Luz del Tiempo · Radio y ministerio</title>
      <HeroCarousel />
      <NowPlayingStrip />
      <LatestAndToday />
      <VideoBand />
      <ActivitiesRow />
      <AreasRow />
      <StationsBand />
      <NewsBand />
      <AboutDonate />
      <AppPromo />
    </>
  );
}

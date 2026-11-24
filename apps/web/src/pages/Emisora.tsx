import { Link, useParams } from "react-router";
import { useEmisoraPublica } from "../api";
import type { Station } from "../api/types";
import { Seo } from "../components/Seo";
import { Equalizer } from "../components/ui/Equalizer";
import { PlayPauseIcon } from "../components/ui/PlayPauseIcon";
import { SmartImage } from "../components/ui/SmartImage";
import { LoadError, Sk } from "../components/ui/Skeleton";
import { usePlayer } from "../player/PlayerProvider";

/**
 * /emisora/:slug — Página de una emisora de un tercero. Plantilla sencilla, aparte de la de Luz del Tiempo:
 * solo reproducir, el nombre, la descripción y lo básico (oyentes y lo que suena).
 */
export default function Emisora() {
  const { slug = "" } = useParams();
  const { data: emisora, isPending, isError, refetch } = useEmisoraPublica(slug);
  const player = usePlayer();

  if (isPending)
    return (
      <section className="contenedor flex flex-col gap-4 py-16">
        <Sk className="h-10 w-2/3" />
        <Sk className="h-5 w-1/2" />
        <Sk className="h-14 w-48 rounded-full" />
      </section>
    );
  if (isError)
    return (
      <section className="contenedor py-16">
        <LoadError onRetry={() => void refetch()} message="No pudimos cargar esta emisora" />
      </section>
    );
  if (!emisora)
    return (
      <section className="contenedor flex flex-col gap-4 py-16">
        <Seo title="Emisora no encontrada · La Luz del Tiempo" description="Esta emisora no está disponible." />
        <h1 className="titulo text-3xl">Esta emisora no está disponible</h1>
        <Link to="/radio" className="text-oro-400 underline">Volver a la radio</Link>
      </section>
    );

  const station: Station = {
    slug: emisora.estacionSlug,
    isMain: false,
    name: emisora.name,
    description: emisora.description,
    genre: emisora.genre,
    color: emisora.color,
    art: emisora.art,
    imageUrl: emisora.imageUrl,
    streamUrl: emisora.streamUrl,
    areaSlug: null,
    nowPlaying: emisora.nowPlaying,
    listeners: emisora.listeners,
  };
  const sonando = player.station?.slug === station.slug && (player.status === "playing" || player.status === "loading");
  const conSenal = Boolean(emisora.streamUrl) && emisora.online;
  const toggle = () => (player.station?.slug === station.slug ? player.toggle() : player.play(station));

  return (
    <>
      <Seo
        title={`${emisora.name} · Radio en vivo`}
        description={emisora.description || `Escucha en vivo ${emisora.name}, desde Bolivia.`}
        image={emisora.imageUrl}
      />
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: emisora.art }}>
          <SmartImage src={emisora.imageUrl} alt="" eager sizes="100vw" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(11,19,36,0.98)_0%,rgba(11,19,36,0.8)_50%,rgba(11,19,36,0.5)_100%)]" />
        <div className="contenedor flex min-h-[60vh] flex-col justify-end gap-5 pb-12 pt-32">
          <Link to="/radio" className="text-sm text-niebla-200 underline-offset-4 hover:underline">← Todas las emisoras</Link>
          <p className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-oro-500 px-3 py-1 font-semibold text-noche-900">{conSenal ? "En vivo" : "Fuera del aire"}</span>
            {emisora.genre && <span className="text-niebla-200">{emisora.genre}</span>}
          </p>
          <h1 className="titulo text-[clamp(2.25rem,6vw,4.5rem)] leading-none">{emisora.name}</h1>
          {emisora.description && <p className="max-w-2xl text-niebla-100">{emisora.description}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={toggle}
              disabled={!conSenal}
              aria-pressed={sonando}
              aria-label={sonando ? `Pausar ${emisora.name}` : `Escuchar ${emisora.name}`}
              className="flex items-center gap-3 rounded-full bg-oro-500 px-6 py-3 font-semibold text-noche-900 transition hover:bg-oro-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlayPauseIcon playing={sonando} size={22} />
              {sonando ? "Pausar" : conSenal ? "Escuchar" : "Sin señal"}
            </button>
            {sonando && <Equalizer active color="#e2a927" className="h-5" />}
          </div>
          <p className="text-sm text-niebla-300">
            {conSenal ? `${emisora.listeners} oyente${emisora.listeners === 1 ? "" : "s"}` : "La emisora todavía no está al aire"}
            {conSenal && emisora.nowPlaying ? ` · Ahora: ${emisora.nowPlaying}` : ""}
          </p>
        </div>
      </section>
    </>
  );
}

import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useVideos } from "../../api";
import type { Video } from "../../api/types";
import { BandHeading, Reveal } from "../ui/Reveal";
import { VideoModal, ytThumb } from "../ui/VideoModal";
import { SmartImage } from "../ui/SmartImage";
import { LoadError, Sk, SkeletonRegion, SkText } from "../ui/Skeleton";
import { stagger } from "../../lib/motion";

/** Banda azul "Videos y podcast": episodio grande + 3 anteriores + tarjeta dorada "Más contenido". */
export function VideoBand() {
  const { data: videos = [], isPending, isError, refetch } = useVideos();
  const [open, setOpen] = useState<Video | null>(null);
  const [main, ...rest] = videos;
  if (!main) {
    if (!isPending && !isError) return null;
    return (
      <section className="banda pt-10 pb-12">
        <div className="contenedor flex flex-col gap-5">
          <BandHeading
            eyebrow="Videos y podcast"
            text="Salud, música y estudios bíblicos en nuestro canal de YouTube."
            action={<Link to="/videos" className="btn-oro min-h-9 text-xs">Ver más episodios</Link>}
          />
          {isError ? (
            <LoadError compact onRetry={() => void refetch()} message="No pudimos cargar los videos" />
          ) : (
            <SkeletonRegion label="Cargando videos" className="flex flex-wrap items-stretch gap-5">
              <span className="flex min-w-0 flex-[2_1_520px] flex-col gap-3">
                <Sk className="aspect-video w-full rounded-xl" />
                <span className="flex flex-col gap-1.5">
                  <Sk className="h-5 w-32" />
                  <Sk className="h-6 w-3/4" />
                  {/* En celular el título suele ocupar dos líneas; desde tablet, una */}
                  <Sk className="h-6 w-1/2 sm:hidden" />
                </span>
              </span>
              <span className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="flex items-center gap-4">
                    <Sk className="h-16 w-28 shrink-0 rounded-md" />
                    <SkText lines={2} line="h-3" className="flex-1" />
                  </span>
                ))}
                <Sk className="mt-auto h-[88px] rounded-xl bg-oro-500/20" />
              </span>
            </SkeletonRegion>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="banda pt-10 pb-12">
      <div className="contenedor flex flex-col gap-5">
        <BandHeading
          eyebrow="Videos y podcast"
          text="Salud, música y estudios bíblicos en nuestro canal de YouTube."
          action={<Link to="/videos" className="btn-oro min-h-9 text-xs">Ver más episodios</Link>}
        />
        <div className="flex flex-wrap items-stretch gap-5">
          <Reveal className="min-w-0 flex-[2_1_520px]">
            <motion.button
              type="button"
              layoutId={`band-${main.youtubeId}`}
              onClick={() => setOpen(main)}
              className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-black text-left"
            >
              <SmartImage src={ytThumb(main.youtubeId, "maxres")} fallbackSrc={ytThumb(main.youtubeId)} alt={main.title} sizes="(min-width: 1024px) 60vw, 100vw" className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
              <span className="absolute top-3 left-3 flex gap-1.5">
                <span className="rounded bg-oro-500 px-1.5 py-0.5 text-xs font-semibold text-noche-900">Nuevo episodio</span>
              </span>
              {/* La miniatura de YouTube ya trae su título: aquí solo el botón de reproducir */}
              <span className="absolute right-4 bottom-4 grid h-14 w-14 place-items-center rounded-full bg-oro-500 text-noche-900 shadow-lg transition-colors group-hover:bg-oro-400">
                <Play fill="currentColor" className="ml-0.5" />
              </span>
            </motion.button>
            <span className="mt-3 flex flex-col gap-1">
              <span className="text-sm text-oro-400">{main.seriesName}</span>
              <h3 className="titulo text-xl leading-snug">{main.title}</h3>
            </span>
          </Reveal>

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            {rest.slice(0, 3).map((v, i) => (
              <Reveal key={v.youtubeId} delay={stagger(i)}>
                <motion.button type="button" onClick={() => setOpen(v)} className="group flex w-full items-center gap-4 text-left">
                  <motion.span layoutId={`band-${v.youtubeId}`} className="relative block h-16 w-28 shrink-0 overflow-hidden rounded-md bg-noche-800">
                    <SmartImage src={ytThumb(v.youtubeId)} alt={v.title} sizes="112px" />
                    <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                      <Play size={18} fill="currentColor" />
                    </span>
                  </motion.span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="line-clamp-2 text-[13px] leading-snug font-bold">{v.title}</span>
                    <span className="text-xs text-niebla-200">{v.seriesName ?? "Video"}</span>
                  </span>
                </motion.button>
              </Reveal>
            ))}
            <Link to="/videos" className="group mt-auto flex items-center justify-between gap-3 rounded-xl bg-oro-500 px-5 py-4 text-noche-900 transition hover:bg-oro-400">
              <span className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold">Más contenido</span>
                <span className="text-sm font-semibold">Ver todos los videos</span>
                <span className="text-xs font-medium">Explora episodios anteriores</span>
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white transition group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </div>
      <VideoModal video={open} onClose={() => setOpen(null)} layoutPrefix="band" />
    </section>
  );
}

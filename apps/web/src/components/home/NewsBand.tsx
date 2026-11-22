import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useAreas, usePosts } from "../../api";
import { longDate } from "../../lib/format";
import { LogoMark } from "../layout/Logo";
import { BandHeading, Reveal } from "../ui/Reveal";
import { SmartImage } from "../ui/SmartImage";
import { LoadError, Sk, SkeletonRegion, SkText } from "../ui/Skeleton";

/**
 * "Actualidad en el ministerio". A propósito NO repite el esquema de la banda
 * de videos (grande + lista + tarjeta dorada): aquí es una noticia principal
 * partida en dos (imagen | texto) y debajo una fila de tarjetas.
 */
export function NewsBand() {
  const { data: posts = [], isPending, isError, refetch } = usePosts();
  const { data: areas = [] } = useAreas();
  const [main, ...rest] = posts;
  if (!main) {
    if (!isPending && !isError) return null;
    return (
      <section className="pt-14 pb-16">
        <div className="contenedor flex flex-col gap-6">
          <BandHeading
            eyebrow="Actualidad en el ministerio"
            text="Lo que está pasando en la radio, las campañas y las escuelas"
            action={<Link to="/noticias" className="chip-ver">ver todas</Link>}
          />
          {isError ? (
            <LoadError compact onRetry={() => void refetch()} message="No pudimos cargar las noticias" />
          ) : (
            <SkeletonRegion label="Cargando noticias" className="flex flex-col gap-6">
              <span className="grid grid-cols-1 overflow-hidden rounded-xl border border-white/[0.08] md:grid-cols-[1.25fr_1fr]">
                <Sk className="aspect-[16/10] rounded-none md:aspect-auto md:min-h-[340px]" />
                <span className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                  <Sk className="h-3 w-32" />
                  <SkText lines={3} line="h-7" />
                  <SkText lines={3} line="h-4" />
                </span>
              </span>
              <span className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  // 152 px en celular y tablet (el resumen ocupa más líneas); 107 px desde laptop
                  <span key={i} className="flex h-[152px] gap-4 overflow-hidden rounded-xl border border-white/[0.08] p-3 lg:h-[107px]">
                    <Sk className="w-1.5 rounded-full" />
                    <span className="flex flex-1 flex-col gap-2.5 py-1 lg:gap-2">
                      <Sk className="h-3 w-40" />
                      <Sk className="h-5 w-4/5" />
                      <SkText lines={2} line="h-3" className="lg:hidden" />
                      <Sk className="hidden h-3 w-3/4 lg:block" />
                    </span>
                  </span>
                ))}
              </span>
            </SkeletonRegion>
          )}
        </div>
      </section>
    );
  }
  const areaOf = (slug: string | null) => areas.find((a) => a.slug === slug);
  const mainArea = areaOf(main.areaSlug);

  return (
    <section className="pt-14 pb-16">
      <div className="contenedor flex flex-col gap-6">
        <BandHeading
          eyebrow="Actualidad en el ministerio"
          text="Lo que está pasando en la radio, las campañas y las escuelas"
          action={<Link to="/noticias" className="chip-ver">ver todas</Link>}
        />

        <Reveal>
          <Link
            to={`/noticias/${main.slug}`}
            className="group grid grid-cols-1 overflow-hidden rounded-xl border border-white/[0.08] bg-noche-800 md:grid-cols-[1.25fr_1fr]"
          >
            <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[340px]">
              <div
                className="absolute inset-0 transition-[filter] duration-300 group-hover:brightness-110"
                style={{ background: `radial-gradient(circle at 30% 40%, ${mainArea?.color ?? "#22376a"}aa, #0b1324 75%)` }}
              />
              <div className="absolute inset-0 grid place-items-center">
                <LogoMark sizes="128px" className="h-32 w-32 opacity-60" />
              </div>
              <SmartImage src={main.coverUrl} alt={main.title} className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
              <span className="absolute top-4 left-4 rounded bg-oro-500 px-2 py-1 text-xs font-semibold text-noche-900">
                {mainArea?.name ?? "Ministerio"}
              </span>
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
              <span className="text-xs text-niebla-300">{longDate(main.publishedAt)}</span>
              <h3 className="titulo text-[clamp(24px,3vw,34px)] leading-[1.1] group-hover:text-oro-400">{main.title}</h3>
              <p className="text-[15px] leading-relaxed text-niebla-200">{main.excerpt}</p>
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-oro-400">
                Leer la noticia
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rest.slice(0, 4).map((n, i) => {
            const area = areaOf(n.areaSlug);
            return (
              <Reveal key={n.slug} delay={0.08 * i}>
                <Link to={`/noticias/${n.slug}`} className="group flex h-full gap-4 rounded-xl border border-white/[0.08] p-3 transition-colors hover:bg-white/[0.04]">
                  <motion.span
                    className="w-1.5 shrink-0 rounded-full"
                    style={{ background: area?.color ?? "#e2a927" }}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 + 0.08 * i }}
                  />
                  <span className="flex min-w-0 flex-col gap-1.5 py-1">
                    <span className="text-xs text-niebla-300">{area?.name ?? "Ministerio"} · {longDate(n.publishedAt)}</span>
                    <h3 className="titulo text-lg leading-snug group-hover:text-oro-400">{n.title}</h3>
                    <span className="line-clamp-2 text-sm text-niebla-200">{n.excerpt}</span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

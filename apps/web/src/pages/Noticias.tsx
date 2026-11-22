import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { useAreas, usePosts } from "../api";
import type { Area, Post } from "../api/types";
import { LogoMark } from "../components/layout/Logo";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { Chips } from "../components/shared/Chips";
import { SmartImage } from "../components/ui/SmartImage";
import { longDate } from "../lib/format";
import { LoadError, Sk, SkeletonRegion, SkText } from "../components/ui/Skeleton";

const cover = (a?: Area) => ({ background: `radial-gradient(circle at 30% 40%, ${a?.color ?? "#22376a"}aa, #0b1324 75%)` });
const suave = [0.25, 0.1, 0.25, 1] as const;

/** Las noticias como lista de schema.org (Google entiende que es una sección de noticias). */
const jsonLd = (posts: Post[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Noticias del ministerio La Luz del Tiempo",
  itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: absoluta(`/noticias/${p.slug}`) })),
});

/**
 * /noticias — Como un portal de noticias: la más reciente en grande y debajo
 * las demás de la más nueva a la más antigua. El filtro por área es opcional.
 */
export default function Noticias() {
  const { data: posts = [], isPending, isError, refetch } = usePosts();
  const { data: areas = [] } = useAreas();
  const [area, setArea] = useState("todas");
  const areaOf = (slug: string | null) => areas.find((a) => a.slug === slug);

  const sorted = [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const list = sorted.filter((p) => area === "todas" || p.areaSlug === area);
  const [lead, ...rest] = list;

  return (
    <>
      <Seo
        title="Noticias · La Luz del Tiempo"
        description="Lo último del ministerio La Luz del Tiempo: la radio, las campañas de salud, las escuelas y los estudios bíblicos en Bolivia."
        jsonLd={sorted.length ? jsonLd(sorted) : undefined}
      />
      <PageHeader title="Noticias" subtitle="Lo último de la radio, las campañas y las escuelas" />
      <PageBody className="gap-8">
        <Chips label="Filtrar por área" options={[{ id: "todas", label: "Todas" }, ...areas.map((a) => ({ id: a.slug, label: a.name }))]} value={area} onChange={setArea} />

        {/* Al cambiar de área, la lista se reemplaza con un fundido corto */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={area}
            className="flex flex-col gap-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: suave } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            {lead ? (
              <>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: suave }}>
                  <Link
                    to={`/noticias/${lead.slug}`}
                    className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-noche-800 transition-[border-color,box-shadow] duration-300 hover:border-oro-500/40 hover:shadow-[0_18px_50px_-24px_rgb(226_169_39/0.45)] lg:grid-cols-[1.4fr_1fr]"
                  >
                    <span className="relative grid aspect-[16/9] place-items-center overflow-hidden lg:aspect-auto lg:min-h-[380px]" style={cover(areaOf(lead.areaSlug))}>
                      <LogoMark sizes="128px" className="h-28 w-28 opacity-50" />
                      <SmartImage
                        src={lead.coverUrl}
                        alt={lead.title}
                        eager
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.04] group-hover:brightness-110"
                      />
                      <span className="absolute top-4 left-4 rounded bg-oro-500 px-2 py-1 text-xs font-semibold text-noche-900">Lo más reciente</span>
                    </span>
                    <span className="flex flex-col justify-center gap-4 p-5 sm:p-8">
                      <span className="text-sm text-niebla-300">
                        {areaOf(lead.areaSlug)?.name ?? "Ministerio"} · <time dateTime={lead.publishedAt}>{longDate(lead.publishedAt)}</time>
                      </span>
                      <h2 className="titulo text-[clamp(24px,2.8vw,40px)] leading-[1.1] transition-colors group-hover:text-oro-400">{lead.title}</h2>
                      <span className="text-[16px] leading-relaxed text-niebla-200">{lead.excerpt}</span>
                      <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-oro-400">
                        Leer la noticia <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                      </span>
                    </span>
                  </Link>
                </motion.div>

                {rest.length > 0 && (
                  <section className="flex flex-col gap-2">
                    <h2 className="titulo text-xl">Más noticias</h2>
                    <ul className="flex flex-col divide-y divide-white/[0.06]">
                      {rest.map((p, i) => (
                        <NewsRow key={p.slug} p={p} area={areaOf(p.areaSlug)} i={i} />
                      ))}
                    </ul>
                  </section>
                )}
              </>
            ) : isPending ? (
              <SkeletonRegion label="Cargando noticias" className="flex flex-col gap-8">
                {/* Destacada: imagen 16:9 arriba en celular y tablet, a la izquierda desde laptop */}
                <span className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.08] lg:grid-cols-[1.4fr_1fr]">
                  <Sk className="aspect-[16/9] rounded-none lg:aspect-auto lg:min-h-[380px]" />
                  <span className="flex flex-col justify-center gap-4 p-5 sm:p-8">
                    <Sk className="h-3.5 w-40" />
                    <SkText lines={3} line="h-8" />
                    <SkText lines={3} line="h-3.5" />
                  </span>
                </span>
                <span className="flex flex-col divide-y divide-white/[0.06]">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="flex gap-4 py-5 sm:gap-6">
                      <Sk className="aspect-[4/3] w-28 shrink-0 rounded-xl sm:w-48" />
                      <span className="flex flex-1 flex-col gap-2">
                        <Sk className="h-3 w-36" />
                        <Sk className="h-5 w-4/5" />
                        <Sk className="h-5 w-1/2 sm:hidden" />
                        <SkText lines={2} line="h-3" />
                      </span>
                    </span>
                  ))}
                </span>
              </SkeletonRegion>
            ) : isError ? (
              <LoadError onRetry={() => void refetch()} message="No pudimos cargar las noticias" />
            ) : (
              <p className="py-12 text-center text-niebla-300">Todavía no hay noticias de esta área</p>
            )}
          </motion.div>
        </AnimatePresence>
      </PageBody>
    </>
  );
}

/** Fila de noticia: imagen pequeña, fecha, título y resumen (lista cronológica). */
function NewsRow({ p, area, i }: { p: Post; area?: Area; i: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(i, 4) * 0.05, ease: suave }}
    >
      <Link to={`/noticias/${p.slug}`} className="group -mx-2 flex gap-4 rounded-xl px-2 py-5 transition-colors duration-300 hover:bg-white/[0.03] sm:gap-6">
        <span className="relative grid aspect-[4/3] w-28 shrink-0 place-items-center overflow-hidden rounded-xl sm:w-48" style={cover(area)}>
          <LogoMark className="h-10 w-10 opacity-50" />
          <SmartImage
            src={p.coverUrl}
            alt={p.title}
            sizes="(min-width: 640px) 192px, 112px"
            className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 group-hover:scale-105 group-hover:brightness-110"
          />
        </span>
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs text-niebla-300">
            {area?.name ?? "Ministerio"} · <time dateTime={p.publishedAt}>{longDate(p.publishedAt)}</time>
          </span>
          <h3 className="titulo text-lg leading-snug transition-colors group-hover:text-oro-400 sm:text-xl">{p.title}</h3>
          <span className="line-clamp-2 text-sm text-niebla-200">{p.excerpt}</span>
        </span>
      </Link>
    </motion.li>
  );
}

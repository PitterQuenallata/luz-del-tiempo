import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useAreas, usePosts } from "../api";
import type { Area, Post } from "../api/types";
import { LogoMark } from "../components/layout/Logo";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { Chips } from "../components/shared/Chips";
import { Reveal } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { longDate } from "../lib/format";

const cover = (a?: Area) => ({ background: `radial-gradient(circle at 30% 40%, ${a?.color ?? "#22376a"}aa, #0b1324 75%)` });

/**
 * /noticias — Como un portal de noticias: la más reciente en grande y debajo
 * las demás de la más nueva a la más antigua. El filtro por área es opcional.
 */
export default function Noticias() {
  const { data: posts = [] } = usePosts();
  const { data: areas = [] } = useAreas();
  const [area, setArea] = useState("todas");
  const areaOf = (slug: string | null) => areas.find((a) => a.slug === slug);

  const sorted = [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const list = sorted.filter((p) => area === "todas" || p.areaSlug === area);
  const [lead, ...rest] = list;

  return (
    <>
      <title>Noticias · La Luz del Tiempo</title>
      <PageHeader title="Noticias" subtitle="Lo último de la radio, las campañas y las escuelas" />
      <PageBody className="gap-8">
        <Chips label="Filtrar por área" options={[{ id: "todas", label: "Todas" }, ...areas.map((a) => ({ id: a.slug, label: a.name }))]} value={area} onChange={setArea} />

        {lead ? (
          <>
            <Reveal>
              <Link to={`/noticias/${lead.slug}`} className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-noche-800 lg:grid-cols-[1.4fr_1fr]">
                <span className="relative grid aspect-[16/9] place-items-center overflow-hidden lg:aspect-auto lg:min-h-[380px]" style={cover(areaOf(lead.areaSlug))}>
                  <LogoMark className="h-28 w-28 opacity-50" />
                  <SmartImage src={lead.coverUrl} eager className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
                  <span className="absolute top-4 left-4 rounded bg-oro-500 px-2 py-1 text-xs font-semibold text-noche-900">Lo más reciente</span>
                </span>
                <span className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                  <span className="text-sm text-niebla-300">{areaOf(lead.areaSlug)?.name ?? "Ministerio"} · {longDate(lead.publishedAt)}</span>
                  <span className="titulo text-[clamp(26px,2.8vw,40px)] leading-[1.1] group-hover:text-oro-400">{lead.title}</span>
                  <span className="text-[16px] leading-relaxed text-niebla-200">{lead.excerpt}</span>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-oro-400">
                    Leer la noticia <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </Reveal>

            {rest.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="titulo text-xl">Más noticias</h2>
                <ul className="flex flex-col divide-y divide-white/[0.06]">
                  {rest.map((p) => (
                    <NewsRow key={p.slug} p={p} area={areaOf(p.areaSlug)} />
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <p className="py-12 text-center text-niebla-300">Todavía no hay noticias de esta área</p>
        )}
      </PageBody>
    </>
  );
}

/** Fila de noticia: imagen pequeña, fecha, título y resumen (lista cronológica). */
function NewsRow({ p, area }: { p: Post; area?: Area }) {
  return (
    <li>
      <Reveal>
        <Link to={`/noticias/${p.slug}`} className="group flex gap-4 py-5 sm:gap-6">
          <span className="relative grid aspect-[4/3] w-28 shrink-0 place-items-center overflow-hidden rounded-xl sm:w-48" style={cover(area)}>
            <LogoMark className="h-10 w-10 opacity-50" />
            <SmartImage src={p.coverUrl} className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
          </span>
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-niebla-300">{area?.name ?? "Ministerio"} · {longDate(p.publishedAt)}</span>
            <span className="titulo text-lg leading-snug group-hover:text-oro-400 sm:text-xl">{p.title}</span>
            <span className="line-clamp-2 text-sm text-niebla-200">{p.excerpt}</span>
          </span>
        </Link>
      </Reveal>
    </li>
  );
}

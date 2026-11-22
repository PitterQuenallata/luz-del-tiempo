import { ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { Link, useParams } from "react-router";
import { useAreas, usePost, usePosts } from "../api";
import type { Post } from "../api/types";
import { LogoMark } from "../components/layout/Logo";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { ReadingProgress } from "../components/ui/ReadingProgress";
import { Reveal } from "../components/ui/Reveal";
import { ShareButton } from "../components/ui/ShareButton";
import { SmartImage } from "../components/ui/SmartImage";
import { longDate } from "../lib/format";
import ComingSoon from "./ComingSoon";

/** Minutos de lectura a 200 palabras por minuto (mínimo 1). */
const minutosLectura = (p: Post) => Math.max(1, Math.round(p.body.join(" ").split(/\s+/).length / 200));

/** La noticia como NewsArticle de schema.org, con el ministerio como autor y editor. */
function jsonLd(post: Post) {
  const url = absoluta(`/noticias/${post.slug}`);
  const ministerio = {
    "@type": "Organization",
    name: "Ministerio La Luz del Tiempo",
    url: absoluta("/"),
    logo: { "@type": "ImageObject", url: absoluta("/brand/logo.png") },
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        image: [absoluta(post.coverUrl ?? "/brand/og.jpg")],
        author: ministerio,
        publisher: ministerio,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        inLanguage: "es",
        articleBody: post.body.join("\n\n"),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: absoluta("/") },
          { "@type": "ListItem", position: 2, name: "Noticias", item: absoluta("/noticias") },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}

/** /noticias/:slug — Una noticia. */
export default function Noticia() {
  const { slug = "" } = useParams();
  const { data: post, isLoading } = usePost(slug);
  const { data: posts = [] } = usePosts();
  const { data: areas = [] } = useAreas();
  const article = useRef<HTMLElement>(null);
  if (isLoading) return <div className="min-h-[60vh]" />;
  if (!post) return <ComingSoon title="Noticia no encontrada" />;

  const area = areas.find((a) => a.slug === post.areaSlug);
  // Primero las de la misma área, después las más recientes.
  const others = posts
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => Number(b.areaSlug === post.areaSlug) - Number(a.areaSlug === post.areaSlug) || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 2);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${post.title} ${location.href}`)}`;

  return (
    <>
      <Seo title={`${post.title} · Noticias La Luz del Tiempo`} description={post.excerpt} type="article" image={post.coverUrl} jsonLd={jsonLd(post)} />
      <meta property="article:published_time" content={post.publishedAt} />
      <ReadingProgress target={article} />

      <PageHeader title={post.title} subtitle={post.excerpt} crumbs={[{ to: "/noticias", label: "Noticias" }]}>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-niebla-300">
          {area && <Link to={`/areas/${area.slug}`} className="py-1 text-oro-400 hover:underline">{area.name}</Link>}
          {area && "·"}
          <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden /> {minutosLectura(post)} min de lectura</span>
        </span>
      </PageHeader>
      <PageBody className="max-w-[760px]">
        <Reveal
          className="relative grid aspect-[16/9] place-items-center overflow-hidden rounded-2xl"
          style={{ background: `radial-gradient(circle at 30% 40%, ${area?.color ?? "#22376a"}aa, #0b1324 75%)` }}
        >
          <LogoMark sizes="128px" className="h-28 w-28 opacity-50" />
          <motion.div className="absolute inset-0" initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 6, ease: "linear" }}>
            <SmartImage src={post.coverUrl} alt={post.title} eager sizes="(min-width: 800px) 760px, 100vw" />
          </motion.div>
        </Reveal>
        <article ref={article} className="flex flex-col gap-5 text-[17px] leading-[1.8] text-niebla-100">
          {post.body.map((p, i) => (
            <Reveal key={i} delay={Math.min(i, 3) * 0.04}>
              {/* Letra capital dorada en el primer párrafo, como en una revista */}
              <p className={i === 0 ? "first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-display first-letter:text-[3.4em] first-letter:leading-[0.8] first-letter:font-semibold first-letter:text-oro-400" : ""}>
                {p}
              </p>
            </Reveal>
          ))}
        </article>
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-6">
          <Link to="/noticias" className="btn-borde max-sm:flex-1"><ArrowLeft size={16} aria-hidden /> Todas las noticias</Link>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-oro btn-brillo max-sm:flex-1">
            <MessageCircle size={16} aria-hidden /> WhatsApp
          </a>
          <ShareButton title={post.title} text={post.excerpt} className="btn-borde max-sm:w-full" />
        </div>
        {others.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="titulo text-xl">Más noticias</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {others.map((o, i) => (
                <Reveal key={o.slug} delay={0.06 * i}>
                  <Link
                    to={`/noticias/${o.slug}`}
                    className="group block h-full rounded-xl border border-white/[0.08] p-4 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-oro-500/40 hover:bg-white/[0.04]"
                  >
                    <time dateTime={o.publishedAt} className="block text-xs text-niebla-300">{longDate(o.publishedAt)}</time>
                    <h3 className="titulo mt-1 text-lg leading-snug transition-colors group-hover:text-oro-400">{o.title}</h3>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </PageBody>
    </>
  );
}

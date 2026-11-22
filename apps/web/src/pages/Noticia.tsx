import { ArrowLeft, Share2 } from "lucide-react";
import { Link, useParams } from "react-router";
import { useAreas, usePost, usePosts } from "../api";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { LogoMark } from "../components/layout/Logo";
import { Reveal } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { longDate } from "../lib/format";
import ComingSoon from "./ComingSoon";

/** /noticias/:slug — Una noticia. */
export default function Noticia() {
  const { slug = "" } = useParams();
  const { data: post, isLoading } = usePost(slug);
  const { data: posts = [] } = usePosts();
  const { data: areas = [] } = useAreas();
  if (isLoading) return <div className="min-h-[60vh]" />;
  if (!post) return <ComingSoon title="Noticia no encontrada" />;

  const area = areas.find((a) => a.slug === post.areaSlug);
  const others = posts.filter((p) => p.slug !== post.slug).slice(0, 2);
  const share = `https://wa.me/?text=${encodeURIComponent(`${post.title} ${location.href}`)}`;

  return (
    <>
      <title>{`${post.title} · La Luz del Tiempo`}</title>
      <PageHeader title={post.title} subtitle={post.excerpt} crumbs={[{ to: "/noticias", label: "Noticias" }]}>
        <span className="text-sm text-niebla-300">
          {area && <Link to={`/areas/${area.slug}`} className="text-oro-400 hover:underline">{area.name}</Link>}
          {area && " · "}
          {longDate(post.publishedAt)}
        </span>
      </PageHeader>
      <PageBody className="max-w-[760px]">
        <Reveal className="relative grid aspect-[16/9] place-items-center overflow-hidden rounded-2xl" style={{ background: `radial-gradient(circle at 30% 40%, ${area?.color ?? "#22376a"}aa, #0b1324 75%)` }}>
          <LogoMark sizes="128px" className="h-28 w-28 opacity-50" />
          <SmartImage src={post.coverUrl} eager />
        </Reveal>
        <article className="flex flex-col gap-5 text-[17px] leading-[1.75] text-niebla-100">
          {post.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-6">
          <Link to="/noticias" className="btn-borde"><ArrowLeft size={16} /> Todas las noticias</Link>
          <a href={share} target="_blank" rel="noreferrer" className="btn-oro"><Share2 size={16} /> Compartir por WhatsApp</a>
        </div>
        {others.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="titulo text-xl">Más noticias</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {others.map((o) => (
                <Link key={o.slug} to={`/noticias/${o.slug}`} className="rounded-xl border border-white/[0.08] p-4 transition-colors hover:bg-white/[0.04]">
                  <span className="block text-xs text-niebla-300">{longDate(o.publishedAt)}</span>
                  <span className="titulo mt-1 block text-lg leading-snug">{o.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </PageBody>
    </>
  );
}

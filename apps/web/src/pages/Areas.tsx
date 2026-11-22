import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useAreas } from "../api";
import type { Area } from "../api/types";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { AreaIcon } from "../components/ui/AreaIcon";
import { Reveal } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { Tilt } from "../components/ui/Tilt";

/** Las áreas como lista de schema.org, para que Google entienda la estructura del ministerio. */
const jsonLd = (areas: Area[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Áreas del ministerio La Luz del Tiempo",
  itemListElement: areas.map((a, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: a.name,
    url: absoluta(`/areas/${a.slug}`),
  })),
});

/** /areas — Todas las áreas del ministerio. */
export default function Areas() {
  const { data: areas = [] } = useAreas();
  return (
    <>
      <Seo
        title="Áreas del ministerio · La Luz del Tiempo"
        description="Salud, música, estudios bíblicos y niños: conoce las áreas del ministerio La Luz del Tiempo en Bolivia y sus próximos eventos."
        jsonLd={areas.length ? jsonLd(areas) : undefined}
      />
      <PageHeader
        title="Áreas del ministerio"
        subtitle="Más que una radio: salud, música, la Palabra y los niños. Conoce lo que hace cada área y sus próximos eventos"
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {areas.map((a, i) => (
            <Reveal key={a.slug} delay={0.06 * i}>
              <Tilt className="rounded-2xl" max={4}>
                <Link
                  to={`/areas/${a.slug}`}
                  className="group relative flex min-h-[clamp(240px,62vw,300px)] flex-col justify-end overflow-hidden rounded-2xl p-5 sm:min-h-[280px] sm:p-6"
                >
                  <span className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${a.color} 0%, #0b1324 110%)` }} />
                  <span className="absolute -right-6 -bottom-6 text-white/10 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-12 group-hover:scale-110">
                    <AreaIcon icon={a.icon} size={180} strokeWidth={1} />
                  </span>
                  <SmartImage
                    src={a.coverUrl}
                    alt={`Ministerio de ${a.name}`}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:brightness-110"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-noche-900/95 via-noche-900/45 to-transparent" />
                  <span className="relative flex flex-col gap-2">
                    <span className="flex items-center gap-2 text-sm text-oro-400">
                      <AreaIcon icon={a.icon} size={16} /> {a.eventEnabled ? "Con evento próximo" : "Ministerio"}
                    </span>
                    <h2 className="titulo text-3xl">{a.name}</h2>
                    <span className="max-w-md text-sm text-niebla-100">{a.summary}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-oro-400">
                      Conocer el área
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                  </span>
                  {/* Línea dorada que se dibuja en la base al pasar el mouse */}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-oro-500 transition-transform duration-500 group-hover:scale-x-100" />
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </PageBody>
    </>
  );
}

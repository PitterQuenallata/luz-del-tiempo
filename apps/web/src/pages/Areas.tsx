import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useAreas } from "../api";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { AreaIcon } from "../components/ui/AreaIcon";
import { Reveal } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";

/** /areas — Todas las áreas del ministerio. */
export default function Areas() {
  const { data: areas = [] } = useAreas();
  return (
    <>
      <title>Áreas · La Luz del Tiempo</title>
      <PageHeader title="Áreas del ministerio" subtitle="Más que una radio: salud, música, la Palabra y los niños. Conoce lo que hace cada área y sus próximos eventos" />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {areas.map((a, i) => (
            <Reveal key={a.slug} delay={0.06 * i}>
              <Link to={`/areas/${a.slug}`} className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl p-6">
                <span className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${a.color} 0%, #0b1324 110%)` }} />
                <span className="absolute -right-6 -bottom-6 text-white/10"><AreaIcon icon={a.icon} size={180} strokeWidth={1} /></span>
                <SmartImage src={a.coverUrl} className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-noche-900/95 via-noche-900/40 to-transparent" />
                <span className="relative flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm text-oro-400">
                    <AreaIcon icon={a.icon} size={16} /> {a.eventEnabled ? "Con evento próximo" : "Ministerio"}
                  </span>
                  <span className="titulo text-3xl">{a.name}</span>
                  <span className="max-w-md text-sm text-niebla-100">{a.summary}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-oro-400">
                    Conocer el área <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </PageBody>
    </>
  );
}

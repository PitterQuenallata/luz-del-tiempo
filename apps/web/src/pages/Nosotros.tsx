import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useAreas, usePeople, useSite } from "../api";
import { LogoMark } from "../components/layout/Logo";
import { PageBody } from "../components/layout/PageHeader";
import { AreaIcon } from "../components/ui/AreaIcon";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";

/** /nosotros — Historia, misión, qué hacemos y el equipo (como "Acerca" + "Oradores" de SUMtv). */
export default function Nosotros() {
  const { data: site } = useSite();
  const { data: areas = [] } = useAreas();
  const { data: people = [] } = usePeople();

  return (
    <>
      <title>Quiénes somos · La Luz del Tiempo</title>
      {/* Sin cabecera: foto del equipo a todo el ancho y la misión encima */}
      <section className="relative isolate flex min-h-[clamp(340px,52vh,560px)] items-end overflow-hidden">
        <span className="absolute inset-0 -z-10 grid place-items-center bg-[radial-gradient(circle_at_60%_40%,#22376a,#0b1324_75%)]">
          <LogoMark className="h-40 w-40 opacity-40" />
        </span>
        <SmartImage src="/demo/nosotros-equipo.jpg" eager className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_30%]" />
        <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#0b1324_0%,rgba(11,19,36,0.75)_45%,rgba(11,19,36,0.2)_100%)]" />
        <Reveal className="contenedor flex flex-col gap-3 py-10">
          <span className="text-sm text-oro-400">Quiénes somos</span>
          <h1 className="titulo max-w-4xl text-[clamp(30px,4.2vw,64px)] leading-[1.05]">{site?.mission}</h1>
        </Reveal>
      </section>

      <PageBody>
        <section className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr]">
          <Reveal className="flex flex-col gap-5 text-[17px] leading-[1.75] text-niebla-100">
            {site?.history.map((p, i) => <p key={i}>{p}</p>)}
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-4 self-start rounded-2xl border border-white/[0.08] bg-noche-800 p-6">
            <span className="titulo text-xl">Súmate a esta obra</span>
            <p className="text-sm leading-relaxed text-niebla-200">Puedes ayudar como voluntario, orar con nosotros o apoyar con una donación.</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/donar" className="btn-oro">Apoyar la obra</Link>
              <Link to="/contacto" className="btn-borde">Contáctanos</Link>
            </div>
          </Reveal>
        </section>

        <section className="flex flex-col gap-4">
          <RowHeading title="Qué hacemos" to="/areas" label="ver áreas" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {areas.map((a) => (
              <Link key={a.slug} to={`/areas/${a.slug}`} className="group flex gap-4 rounded-xl border border-white/[0.08] p-4 transition-colors hover:bg-white/[0.04]">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: `${a.color}33`, color: a.color }}>
                  <AreaIcon icon={a.icon} size={22} />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="titulo text-lg group-hover:text-oro-400">{a.name}</span>
                  <span className="text-sm text-niebla-200">{a.summary}</span>
                </span>
                <ArrowRight size={16} className="ml-auto shrink-0 self-center text-niebla-300 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <RowHeading title="Nuestro equipo" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {people.map((p, i) => (
              <Reveal key={p.name} delay={0.06 * i} className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] p-5 text-center">
                <span className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-oro-500/60 bg-noche-800">
                  <LogoMark className="h-12 w-12 opacity-50" />
                  <SmartImage src={p.photoUrl} />
                </span>
                <span className="titulo text-base">{p.name}</span>
                <span className="text-xs text-oro-400">{p.role}</span>
                <span className="text-sm text-niebla-200">{p.bio}</span>
              </Reveal>
            ))}
          </div>
        </section>
      </PageBody>
    </>
  );
}

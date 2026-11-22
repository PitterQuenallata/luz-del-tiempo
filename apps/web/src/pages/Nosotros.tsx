import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useAreas, usePeople, useSite } from "../api";
import type { Area, Person, SiteInfo } from "../api/types";
import { LogoMark } from "../components/layout/Logo";
import { PageBody } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { AreaIcon } from "../components/ui/AreaIcon";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { SmartImage } from "../components/ui/SmartImage";
import { Tilt } from "../components/ui/Tilt";

const suave = [0.25, 0.1, 0.25, 1] as const;

/** Página "Acerca de" de schema.org: el ministerio, sus áreas y su equipo. */
function jsonLd(site: SiteInfo | undefined, areas: Area[], people: Person[]) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Quiénes somos · La Luz del Tiempo",
    url: absoluta("/nosotros"),
    mainEntity: {
      "@type": "Organization",
      name: "Ministerio La Luz del Tiempo",
      url: absoluta("/"),
      logo: absoluta("/brand/logo.png"),
      ...(site ? { description: site.mission, email: site.email, address: { "@type": "PostalAddress", streetAddress: site.address, addressLocality: site.city, addressCountry: "BO" } } : {}),
      department: areas.map((a) => ({ "@type": "Organization", name: a.name, url: absoluta(`/areas/${a.slug}`) })),
      member: people.map((p) => ({ "@type": "Person", name: p.name, jobTitle: p.role })),
    },
  };
}

/** /nosotros — Historia, misión, qué hacemos y el equipo (como "Acerca" + "Oradores" de SUMtv). */
export default function Nosotros() {
  const { data: site } = useSite();
  const { data: areas = [] } = useAreas();
  const { data: people = [] } = usePeople();

  return (
    <>
      <Seo
        title="Quiénes somos · Ministerio La Luz del Tiempo"
        description={site?.mission ?? "Conoce la historia, la misión y el equipo del ministerio La Luz del Tiempo: radio, salud, música, escuelas y estudios bíblicos en Bolivia."}
        jsonLd={jsonLd(site, areas, people)}
      />
      {/* Sin cabecera: foto del equipo a todo el ancho y la misión encima */}
      <section className="relative isolate flex min-h-[clamp(360px,60svh,560px)] items-end overflow-hidden">
        <span className="absolute inset-0 -z-10 grid place-items-center bg-[radial-gradient(circle_at_60%_40%,#22376a,#0b1324_75%)]">
          <LogoMark sizes="160px" className="h-40 w-40 opacity-40" />
        </span>
        <motion.div className="absolute inset-0 -z-10" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 9, ease: "linear" }}>
          <SmartImage src="/demo/nosotros-equipo.jpg" alt="Equipo del ministerio La Luz del Tiempo" eager sizes="100vw" className="absolute inset-0 h-full w-full object-cover object-[center_30%]" />
        </motion.div>
        <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#0b1324_0%,rgba(11,19,36,0.8)_45%,rgba(11,19,36,0.25)_100%)]" />
        <motion.div
          className="contenedor flex flex-col gap-3 py-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: suave }}
        >
          <span className="text-sm text-oro-400">Quiénes somos</span>
          <h1 className="titulo max-w-4xl text-[clamp(28px,4.2vw,64px)] leading-[1.08]">{site?.mission}</h1>
        </motion.div>
      </section>

      <PageBody>
        <section className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-5 text-[17px] leading-[1.75] text-niebla-100">
            {site?.history.map((p, i) => (
              <Reveal key={i} delay={Math.min(i, 3) * 0.05}>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="relative flex flex-col gap-4 self-start overflow-hidden rounded-2xl border border-oro-500/30 bg-noche-800 p-6 md:sticky md:top-24">
            <span className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-oro-500/10 blur-2xl" aria-hidden />
            <h2 className="titulo text-xl">Súmate a esta obra</h2>
            <p className="text-sm leading-relaxed text-niebla-200">Puedes ayudar como voluntario, orar con nosotros o apoyar con una donación.</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/donar" className="btn-oro btn-brillo max-sm:flex-1">Apoyar la obra</Link>
              <Link to="/contacto" className="btn-borde max-sm:flex-1">Contáctanos</Link>
            </div>
          </Reveal>
        </section>

        <section className="flex flex-col gap-4">
          <RowHeading title="Qué hacemos" to="/areas" label="ver áreas" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {areas.map((a, i) => (
              <Reveal key={a.slug} delay={0.05 * i}>
                <Link
                  to={`/areas/${a.slug}`}
                  className="group flex h-full gap-4 rounded-xl border border-white/[0.08] p-4 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-110 group-hover:-rotate-6"
                    style={{ background: `${a.color}33`, color: a.color }}
                  >
                    <AreaIcon icon={a.icon} size={22} />
                  </span>
                  <span className="flex flex-col gap-1">
                    <h3 className="titulo text-lg transition-colors group-hover:text-oro-400">{a.name}</h3>
                    <span className="text-sm text-niebla-200">{a.summary}</span>
                  </span>
                  <ArrowRight size={16} className="ml-auto shrink-0 self-center text-niebla-300 transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-oro-400" aria-hidden />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <RowHeading title="Nuestro equipo" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {people.map((p, i) => (
              <Reveal key={p.name} delay={0.06 * i} className="h-full">
                <Tilt className="h-full rounded-2xl" max={4}>
                  <div className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-white/[0.08] p-4 text-center transition-colors duration-300 hover:border-oro-500/40 sm:p-5">
                    <span className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-oro-500/60 bg-noche-800 transition-[border-color,box-shadow] duration-300 group-hover:border-oro-400 group-hover:shadow-[0_0_0_6px_rgb(226_169_39/0.12)] sm:h-24 sm:w-24">
                      <LogoMark className="h-12 w-12 opacity-50" />
                      <SmartImage src={p.photoUrl} alt={p.name} sizes="96px" />
                    </span>
                    <h3 className="titulo text-base">{p.name}</h3>
                    <span className="text-xs text-oro-400">{p.role}</span>
                    <span className="text-sm text-niebla-200">{p.bio}</span>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </section>
      </PageBody>
    </>
  );
}

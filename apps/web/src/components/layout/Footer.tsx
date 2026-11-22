import { Link } from "react-router";
import { useSite } from "../../api";
import { Logo } from "./Logo";
import { Stagger, StaggerItem } from "../ui/Reveal";

export function Footer() {
  const { data: site } = useSite();
  // Todo sale de la configuración del ministerio (panel → Datos del ministerio). Lo que esté vacío no se muestra.
  const redes = [
    { href: site?.redes?.youtube, label: "YouTube" },
    { href: site?.redes?.tiktok, label: "TikTok" },
    { href: site?.redes?.facebook, label: "Facebook" },
  ].filter((r): r is { href: string; label: string } => Boolean(r.href));
  const columnas = [
    { title: "Acerca del ministerio", links: [{ to: "/nosotros", label: "Quiénes somos" }, { to: "/donar", label: "Cómo donar" }, { to: "/contacto", label: "Contacto" }, { to: "/areas", label: "Áreas" }] },
    { title: "Dónde escuchar", links: [{ to: "/radio", label: "Radio en vivo" }, { to: "/programacion", label: "Programación" }, { to: "/videos", label: "Videos y podcast" }] },
    { title: "Redes sociales", links: redes },
  ];
  const digitos = site?.whatsapp?.replace(/\D/g, "");
  const wa = digitos ? `https://wa.me/${digitos}` : null;

  return (
    <footer className="bg-noche-900 pt-12 pb-32 text-niebla-200">
      <div className="contenedor flex flex-col gap-8">
        <Stagger className="flex flex-wrap items-start justify-between gap-8">
          <StaggerItem className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
            <Logo size="lg" />
            <span className="text-xs">Ministerio La Luz del Tiempo · Bolivia</span>
          </StaggerItem>
          <StaggerItem className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
            <span className="text-sm font-bold text-white">Escríbenos por WhatsApp</span>
            <span className="text-xs leading-relaxed">Pedidos de oración, saludos al aire, inscripciones y consultas sobre donaciones.</span>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-oro self-start">Abrir WhatsApp</a>}
          </StaggerItem>
        </Stagger>
        <Stagger className="grid grid-cols-2 gap-5 text-xs sm:grid-cols-4">
          {columnas.map((c) => (
            <StaggerItem key={c.title} className="flex flex-col gap-0.5">
              <span className="mb-1 font-bold text-white">{c.title}</span>
              {c.links.map((l) =>
                "to" in l ? (
                  <Link key={l.label} to={l.to} className="py-2.5 transition-colors hover:text-oro-400 sm:py-1.5">{l.label}</Link>
                ) : (
                  <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="py-2.5 transition-colors hover:text-oro-400 sm:py-1.5">{l.label}</a>
                ),
              )}
            </StaggerItem>
          ))}
          <StaggerItem className="flex flex-col gap-0.5">
            <span className="mb-1 font-bold text-white">Contáctenos</span>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="py-2.5 tabular-nums transition-colors hover:text-oro-400 sm:py-1.5">WhatsApp {site?.whatsappDisplay}</a>
            )}
            {site?.email && <a href={`mailto:${site.email}`} className="py-2.5 break-all transition-colors hover:text-oro-400 sm:py-1.5">{site.email}</a>}
          </StaggerItem>
        </Stagger>
        <div className="text-xs text-niebla-400">
          Copyright © {new Date().getFullYear()} <span className="text-oro-400">Ministerio La Luz del Tiempo</span> · Hecho por Blakor.tech
        </div>
      </div>
    </footer>
  );
}

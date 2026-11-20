import { MessageCircle } from "lucide-react";
import { siMoneygram, siPaypal, siWesternunion } from "simple-icons";
import { useDonationMethods, useNeeds, useSite } from "../api";
import type { DonationMethod } from "../api/types";
import { PageBody } from "../components/layout/PageHeader";
import { BrandLogo } from "../components/ui/BrandLogo";
import { QrDemo } from "../components/ui/QrDemo";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { whatsappLink } from "../lib/format";

/**
 * Cabecera visual de cada forma de donar: el QR, una tarjeta bancaria o el
 * logo real de la marca (PayPal, Western Union, MoneyGram). Nada de íconos genéricos.
 */
function MethodVisual({ id }: { id: DonationMethod["id"] }) {
  const box = "grid h-32 place-items-center";
  if (id === "qr")
    return (
      <div className={`${box} bg-white`}>
        <QrDemo size="h-24 w-24" />
      </div>
    );
  if (id === "bank")
    return (
      <div className={`${box} bg-[radial-gradient(circle_at_30%_20%,#22376a,#0b1324_80%)]`}>
        <div className="flex h-24 w-40 flex-col justify-between rounded-xl bg-[linear-gradient(135deg,#1e5bd8_0%,#0f3485_60%,#0a2463_100%)] p-3 shadow-lg ring-1 ring-white/15">
          <span className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide">Banco Unión</span>
            <span className="h-4 w-6 rounded-sm bg-[linear-gradient(135deg,#f6e3b8,#e2a927)]" />
          </span>
          <span className="font-mono text-xs tracking-widest text-white/85">•••• 4567</span>
        </div>
      </div>
    );
  if (id === "paypal")
    return (
      <div className={`${box} bg-white`}>
        <span className="flex items-center gap-2">
          <BrandLogo icon={siPaypal} className="h-9 w-9" />
          <span className="text-2xl font-bold tracking-tight italic"><span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span></span>
        </span>
      </div>
    );
  return (
    <div className={`${box} grid-cols-2 bg-white`}>
      <span className="flex items-center gap-2 justify-self-center">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-black"><BrandLogo icon={siWesternunion} className="h-7 w-7" /></span>
        <span className="text-xs leading-tight font-bold text-black">WESTERN<br />UNION</span>
      </span>
      <span className="flex items-center gap-1.5 justify-self-center">
        <BrandLogo icon={siMoneygram} className="h-8 w-8" />
        <span className="text-sm font-bold text-[#da291c]">MoneyGram</span>
      </span>
    </div>
  );
}

/** /donar — Formas de donar y necesidades del ministerio (como "Donaciones" de SUMtv, sin pago con tarjeta). */
export default function Donar() {
  const { data: methods = [] } = useDonationMethods();
  const { data: needs = [] } = useNeeds();
  const { data: site } = useSite();
  const wa = site ? whatsappLink(site.whatsapp, "Hola, quiero hacer una donación al ministerio") : "#";
  const qr = methods.find((m) => m.id === "qr");

  return (
    <>
      <title>Donar · La Luz del Tiempo</title>
      {/* Sin cabecera: la página abre con el llamado y el QR */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
        <span className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_30%,rgba(226,169,39,0.18),transparent_55%),radial-gradient(ellipse_at_10%_80%,rgba(34,55,106,0.6),transparent_60%)]" />
        <div className="contenedor grid grid-cols-1 items-center gap-10 py-10 sm:py-12 md:grid-cols-[1fr_auto]">
          <Reveal className="flex flex-col gap-4 text-[17px] leading-[1.75] text-niebla-100">
            <span className="text-sm text-oro-400">Donar</span>
            <h1 className="titulo text-[clamp(34px,4.4vw,64px)] leading-[1.05] text-white">Sé parte de esta obra</h1>
            <p>
              Con tu donación llegamos a más hogares con la Palabra, ayudamos a familias con chequeos de salud gratuitos y
              abrimos escuelas para niños y jóvenes.
            </p>
            <p>Cada mes publicamos un reporte de lo que recibimos y en qué lo usamos.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <a href={wa} target="_blank" rel="noreferrer" className="btn-oro"><MessageCircle size={16} /> Donar por WhatsApp</a>
              <a href="#formas" className="btn-borde">Ver formas de donar</a>
            </div>
          </Reveal>
          {qr && (
            <Reveal delay={0.1} className="flex flex-col items-center gap-3 justify-self-center rounded-2xl border border-white/10 bg-noche-800 p-6 text-center">
              <QrDemo size="h-48 w-48" />
              <span className="titulo text-lg">{qr.title}</span>
              <span className="max-w-[220px] text-sm text-niebla-200">{qr.detail}</span>
            </Reveal>
          )}
        </div>
      </section>

      <PageBody>

        <section id="formas" className="flex scroll-mt-24 flex-col gap-4">
          <RowHeading title="Formas de donar" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {methods.map((m, i) => (
              <Reveal key={m.id} delay={0.05 * i} className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-noche-800">
                <MethodVisual id={m.id} />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="titulo text-lg">{m.title}</span>
                  <span className="text-sm text-niebla-200">{m.detail}</span>
                  <ul className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3 text-sm">
                    {m.lines.map((l) => <li key={l} className="tabular-nums [overflow-wrap:anywhere]">{l}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Necesidades: una lectura, no un tablero de montos */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.3fr]">
          <Reveal className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <span className="text-sm text-oro-400">Necesidades del ministerio</span>
            <h2 className="titulo text-[clamp(28px,3vw,42px)] leading-[1.1]">¿Por qué necesitamos tu ayuda?</h2>
            <p className="text-[17px] leading-[1.75] text-niebla-100">
              Todo lo que hacemos es gratuito para quien lo recibe. La radio, las escuelas y las campañas existen gracias
              a personas que creen en esta obra y deciden sostenerla.
            </p>
            <p className="font-serif text-xl leading-relaxed text-oro-200 italic">
              “Cada uno dé como propuso en su corazón… porque Dios ama al dador alegre”
              <span className="mt-1 block text-sm text-niebla-300 not-italic">2 Corintios 9:7</span>
            </p>
          </Reveal>
          <ol className="flex flex-col">
            {needs.map((n, i) => (
              <li key={n.title} className="border-b border-white/[0.08] py-7 first:pt-0 last:border-b-0">
                <Reveal delay={0.05 * i} className="flex gap-5">
                  <span className="font-serif text-3xl leading-none text-oro-500 italic tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex flex-col gap-2">
                    <h3 className="titulo text-xl">{n.title}</h3>
                    <p className="text-[16px] leading-[1.75] text-niebla-100">{n.body}</p>
                  </span>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <Reveal className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-oro-500 p-6 text-noche-900 sm:p-8">
          <span className="flex flex-col gap-1">
            <span className="titulo text-2xl">¿Tienes dudas para donar?</span>
            <span className="text-sm">Escríbenos y te ayudamos con gusto</span>
          </span>
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-noche-900 px-5 text-sm font-semibold text-white hover:bg-noche-800">
            <MessageCircle size={16} /> Escribir por WhatsApp
          </a>
        </Reveal>
      </PageBody>
    </>
  );
}

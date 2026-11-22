import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { siMoneygram, siPaypal, siWesternunion } from "simple-icons";
import { useDonationMethods, useNeeds, useSite } from "../api";
import type { DonationMethod } from "../api/types";
import { PageBody } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { BrandLogo } from "../components/ui/BrandLogo";
import { CopyLine } from "../components/ui/CopyLine";
import { Tilt } from "../components/ui/Tilt";
import { LoadError, Sk, SkText } from "../components/ui/Skeleton";
import { QrDemo } from "../components/ui/QrDemo";
import { Reveal, RowHeading } from "../components/ui/Reveal";
import { whatsappLink } from "../lib/format";
import { stagger } from "../lib/motion";

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
  const { data: methods = [], isPending: methodsPending, isError: methodsError, refetch: refetchMethods } = useDonationMethods();
  const { data: needs = [], isPending: needsPending } = useNeeds();
  const { data: site } = useSite();
  const wa = site ? whatsappLink(site.whatsapp, "Hola, quiero hacer una donación al ministerio") : "#";
  const qr = methods.find((m) => m.id === "qr");

  return (
    <>
      <Seo
        title="Donar · Apoya al ministerio La Luz del Tiempo"
        description="Apoya la radio, las campañas de salud gratuitas y las escuelas del ministerio La Luz del Tiempo. Dona con QR, transferencia, PayPal o remesas desde cualquier país."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Donar al ministerio La Luz del Tiempo",
          url: absoluta("/donar"),
          about: {
            "@type": "Organization",
            name: "Ministerio La Luz del Tiempo",
            url: absoluta("/"),
            potentialAction: { "@type": "DonateAction", recipient: { "@type": "Organization", name: "Ministerio La Luz del Tiempo" }, target: absoluta("/donar") },
          },
        }}
      />
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
              <a href={wa} target="_blank" rel="noreferrer" className="btn-oro btn-brillo max-sm:flex-1"><MessageCircle size={16} aria-hidden /> Donar por WhatsApp</a>
              <a href="#formas" className="btn-borde max-sm:flex-1">Formas de donar</a>
            </div>
          </Reveal>
          {/* El QR reserva su tarjeta (mismo tamaño) mientras cargan las formas de donar */}
          {methodsPending && <Sk className="h-[358px] w-[270px] justify-self-center rounded-2xl" />}
          {qr && (
            <Reveal delay={0.1} className="relative flex flex-col items-center gap-3 justify-self-center rounded-2xl border border-oro-500/30 bg-noche-800 p-6 text-center shadow-[0_20px_60px_-30px_rgb(226_169_39/0.5)]">
              {/* El QR flota despacio: invita a escanearlo sin distraer */}
              <motion.span
                className="block rounded-xl bg-white p-2"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <QrDemo size="h-44 w-44" />
              </motion.span>
              <span className="titulo text-lg">{qr.title}</span>
              <span className="max-w-[220px] text-sm text-niebla-200">{qr.detail}</span>
            </Reveal>
          )}
        </div>
      </section>

      <PageBody>

        <section id="formas" className="flex scroll-mt-24 flex-col gap-4">
          <RowHeading title="Formas de donar" />
          {methodsError && <LoadError compact onRetry={() => void refetchMethods()} message="No pudimos cargar las formas de donar" />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {methodsPending &&
              [0, 1, 2, 3].map((i) => (
                <span key={i} className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-white/[0.08]" aria-hidden>
                  <Sk className="h-32 rounded-none" />
                  <span className="flex flex-col gap-2.5 p-5">
                    <Sk className="h-5 w-2/3" />
                    <SkText lines={2} line="h-3" />
                    <Sk className="mt-2 h-3.5 w-1/2" />
                  </span>
                </span>
              ))}
            {methods.map((m, i) => (
              <Reveal key={m.id} delay={stagger(i)} className="h-full">
                <Tilt className="h-full rounded-2xl" max={4}>
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-noche-800 transition-colors duration-300 hover:border-oro-500/40">
                <MethodVisual id={m.id} />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="titulo text-lg">{m.title}</h3>
                  <span className="text-sm text-niebla-200">{m.detail}</span>
                  <ul className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3 text-sm">
                    {m.lines.map((l) => (
                      <li key={l}>
                        <CopyLine line={l} />
                      </li>
                    ))}
                  </ul>
                </div>
                </div>
                </Tilt>
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
            {needsPending &&
              [0, 1, 2, 3].map((i) => (
                // Los textos de las necesidades son largos: ~300 px por ítem en celular, ~200 px en laptop/PC
                <li key={i} className="flex min-h-[300px] gap-5 border-b border-white/[0.08] py-7 first:pt-0 last:border-b-0 lg:min-h-[200px]" aria-hidden>
                  <Sk className="h-8 w-9" />
                  <span className="flex flex-1 flex-col gap-2.5">
                    <Sk className="h-6 w-1/2" />
                    <SkText lines={5} line="h-3.5" />
                  </span>
                </li>
              ))}
            {needs.map((n, i) => (
              <li key={n.title} className="border-b border-white/[0.08] py-7 first:pt-0 last:border-b-0">
                <Reveal delay={stagger(i)} className="group flex gap-5">
                  <span className="font-serif text-3xl leading-none text-oro-500 italic tabular-nums transition-transform duration-500 group-hover:-translate-y-0.5" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex flex-col gap-2">
                    <h3 className="titulo text-xl">{n.title}</h3>
                    <p className="text-[16px] leading-[1.75] text-niebla-100">{n.body}</p>
                  </span>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <Reveal className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-oro-500 p-6 text-noche-900 sm:p-8">
          <span className="brillo-franja pointer-events-none absolute inset-0" aria-hidden />
          <span className="relative flex flex-col gap-1">
            <span className="titulo text-2xl">¿Tienes dudas para donar?</span>
            <span className="text-sm">Escríbenos y te ayudamos con gusto</span>
          </span>
          <a href={wa} target="_blank" rel="noreferrer" className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-noche-900 px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-noche-800 active:scale-[0.96] max-sm:w-full">
            <MessageCircle size={16} aria-hidden /> Escribir por WhatsApp
          </a>
        </Reveal>
      </PageBody>
    </>
  );
}

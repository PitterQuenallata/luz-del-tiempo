import { CheckCircle2, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useState, type FormEvent } from "react";
import { useSite } from "../api";
import type { SiteInfo } from "../api/types";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { absoluta, Seo } from "../components/Seo";
import { Chips } from "../components/shared/Chips";
import { Reveal } from "../components/ui/Reveal";
import { LoadError, Sk, SkeletonRegion } from "../components/ui/Skeleton";
import { whatsappLink } from "../lib/format";

const TOPICS = ["Pedido de oración", "Saludo al aire", "Inscripción a una actividad", "Donaciones", "Otro"] as const;
type Topic = (typeof TOPICS)[number];
const MAX = 500;

/** Página de contacto de schema.org con los medios de contacto del ministerio. */
const jsonLd = (site: SiteInfo) => ({
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contacto · La Luz del Tiempo",
  url: absoluta("/contacto"),
  mainEntity: {
    "@type": "Organization",
    name: "Ministerio La Luz del Tiempo",
    url: absoluta("/"),
    email: site.email,
    address: { "@type": "PostalAddress", streetAddress: site.address, addressLocality: site.city, addressCountry: "BO" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: `+${site.whatsapp}`,
      email: site.email,
      availableLanguage: "es",
      areaServed: "BO",
    },
  },
});

const campo =
  "min-h-11 rounded-lg border border-white/10 bg-noche-900 px-3 text-base outline-none transition-[border-color,box-shadow] duration-200 focus:border-oro-500 focus:shadow-[0_0_0_3px_rgb(226_169_39/0.18)]";

/**
 * /contacto — Formas de contacto y mensaje rápido.
 * El formulario no guarda nada en un servidor: arma el mensaje y abre WhatsApp.
 */
export default function Contacto() {
  const { data: site, isPending, isError, refetch } = useSite();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState<Topic>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const shake = useAnimationControls();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError("Escribe tu nombre y tu mensaje");
      // Sacudida corta: indica el error sin ser agresiva.
      void shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
      return;
    }
    if (!site) return;
    window.open(whatsappLink(site.whatsapp, `Hola, soy ${name.trim()}. ${topic}: ${message.trim()}`), "_blank", "noopener");
    setSent(true);
  };

  const cards = site
    ? [
        { icon: MessageCircle, title: "WhatsApp", value: site.whatsappDisplay, href: whatsappLink(site.whatsapp, "Hola"), hint: "Respuesta más rápida" },
        { icon: Mail, title: "Correo", value: site.email, href: `mailto:${site.email}`, hint: "Para consultas largas" },
        {
          icon: MapPin,
          title: "Dirección",
          value: `${site.address}, ${site.city}`,
          href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.address}, ${site.city}, Bolivia`)}`,
          hint: "Abrir en el mapa",
        },
      ]
    : [];

  return (
    <>
      <Seo
        title="Contacto · La Luz del Tiempo"
        description="Escríbenos por WhatsApp o correo: pedidos de oración, saludos al aire, inscripciones y consultas sobre donaciones al ministerio La Luz del Tiempo."
        jsonLd={site ? jsonLd(site) : undefined}
      />
      <PageHeader title="Contacto" subtitle="Pedidos de oración, saludos al aire, inscripciones y consultas sobre donaciones" />
      <PageBody>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.2fr] md:gap-10">
          <div className="flex min-w-0 flex-col gap-3">
            {isPending && (
              <SkeletonRegion label="Cargando datos de contacto" className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.08] p-4">
                    <Sk className="h-11 w-11 shrink-0 rounded-xl" />
                    <span className="flex flex-1 flex-col gap-2">
                      <Sk className="h-3 w-16" />
                      <Sk className="h-4 w-3/4" />
                      <Sk className="h-4 w-1/2 sm:hidden" />
                      <Sk className="h-3 w-28" />
                    </span>
                  </span>
                ))}
              </SkeletonRegion>
            )}
            {isError && <LoadError compact onRetry={() => void refetch()} message="No pudimos cargar los datos de contacto" />}
            {cards.map((c, i) => (
              <Reveal key={c.title} delay={0.05 * i}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-xl border border-white/[0.08] p-4 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-oro-500/40 hover:bg-white/[0.04] active:scale-[0.99]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-oro-500/15 text-oro-400 transition-[background-color,color,transform] duration-300 group-hover:scale-110 group-hover:bg-oro-500 group-hover:text-noche-900">
                    <c.icon size={20} aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs text-niebla-300">{c.title}</span>
                    <span className="font-medium tabular-nums [overflow-wrap:anywhere]">{c.value}</span>
                    <span className="text-xs text-oro-400/80">{c.hint}</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <motion.div animate={shake} className="rounded-2xl border border-white/[0.08] bg-noche-800 p-5 sm:p-6">
              <AnimatePresence mode="wait" initial={false}>
                {sent ? (
                  <motion.div
                    key="ok"
                    className="flex flex-col items-center gap-3 py-8 text-center"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    role="status"
                  >
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}>
                      <CheckCircle2 size={48} className="text-oro-400" aria-hidden />
                    </motion.span>
                    <h2 className="titulo text-xl">¡Listo, {name.trim().split(" ")[0]}!</h2>
                    <p className="max-w-xs text-sm text-niebla-200">Abrimos WhatsApp con tu mensaje. Solo falta que lo envíes desde ahí.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setMessage("");
                      }}
                      className="btn-borde mt-2"
                    >
                      Escribir otro mensaje
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={submit} noValidate className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 className="titulo text-xl">Mensaje rápido</h2>
                    <label className="flex flex-col gap-2 text-sm">
                      Tu nombre
                      <input
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError("");
                        }}
                        className={campo}
                        autoComplete="name"
                        enterKeyHint="next"
                        aria-invalid={!!error && !name.trim()}
                      />
                    </label>
                    <div className="flex flex-col gap-2 text-sm">
                      Motivo
                      {/* Píldoras en vez de una lista desplegable: se elige con un toque */}
                      <Chips label="Motivo" options={TOPICS.map((t) => ({ id: t, label: t }))} value={topic} onChange={setTopic} />
                    </div>
                    <label className="flex flex-col gap-2 text-sm">
                      <span className="flex justify-between">
                        Mensaje
                        <span className={`tabular-nums text-xs transition-colors ${message.length > MAX * 0.9 ? "text-oro-400" : "text-niebla-400"}`}>
                          {message.length}/{MAX}
                        </span>
                      </span>
                      <textarea
                        value={message}
                        maxLength={MAX}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          setError("");
                        }}
                        rows={4}
                        className={`${campo} py-2`}
                        aria-invalid={!!error && !message.trim()}
                      />
                    </label>
                    <AnimatePresence>
                      {error && (
                        <motion.p
                          className="text-sm text-red-400"
                          role="alert"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <motion.button type="submit" whileTap={{ scale: 0.96 }} className="btn-oro btn-brillo self-start max-sm:self-stretch">
                      <Send size={16} aria-hidden /> Enviar por WhatsApp
                    </motion.button>
                    <p className="text-xs text-niebla-300">Se abrirá WhatsApp con tu mensaje listo para enviar</p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </Reveal>
        </div>
      </PageBody>
    </>
  );
}

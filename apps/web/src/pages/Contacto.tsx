import { Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSite } from "../api";
import { PageBody, PageHeader } from "../components/layout/PageHeader";
import { Reveal } from "../components/ui/Reveal";
import { whatsappLink } from "../lib/format";

const TOPICS = ["Pedido de oración", "Saludo al aire", "Inscripción a una actividad", "Donaciones", "Otro"];

/**
 * /contacto — Formas de contacto y mensaje rápido.
 * El formulario no guarda nada en un servidor: arma el mensaje y abre WhatsApp.
 */
export default function Contacto() {
  const { data: site } = useSite();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError("Escribe tu nombre y tu mensaje");
      return;
    }
    if (!site) return;
    window.open(whatsappLink(site.whatsapp, `Hola, soy ${name.trim()}. ${topic}: ${message.trim()}`), "_blank", "noopener");
  };

  const cards = site
    ? [
        { icon: MessageCircle, title: "WhatsApp", value: site.whatsappDisplay, href: whatsappLink(site.whatsapp, "Hola") },
        { icon: Mail, title: "Correo", value: site.email, href: `mailto:${site.email}` },
        { icon: MapPin, title: "Dirección", value: `${site.address}, ${site.city}`, href: null },
      ]
    : [];

  return (
    <>
      <title>Contacto · La Luz del Tiempo</title>
      <PageHeader title="Contacto" subtitle="Pedidos de oración, saludos al aire, inscripciones y consultas sobre donaciones" />
      <PageBody>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.2fr]">
          <Reveal className="flex min-w-0 flex-col gap-3">
            {cards.map((c) => {
              const Inner = (
                <>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-oro-500/15 text-oro-400"><c.icon size={20} /></span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs text-niebla-300">{c.title}</span>
                    <span className="font-medium tabular-nums [overflow-wrap:anywhere]">{c.value}</span>
                  </span>
                </>
              );
              return c.href ? (
                <a key={c.title} href={c.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-xl border border-white/[0.08] p-4 transition-colors hover:bg-white/[0.04]">{Inner}</a>
              ) : (
                <div key={c.title} className="flex items-center gap-4 rounded-xl border border-white/[0.08] p-4">{Inner}</div>
              );
            })}
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-noche-800 p-6">
              <h2 className="titulo text-xl">Mensaje rápido</h2>
              <label className="flex flex-col gap-2 text-sm">
                Tu nombre
                <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} className="min-h-11 rounded-lg border border-white/10 bg-noche-900 px-3 text-base outline-none focus:border-oro-500" autoComplete="name" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Motivo
                <select value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-11 rounded-lg border border-white/10 bg-noche-900 px-3 text-base outline-none focus:border-oro-500">
                  {TOPICS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Mensaje
                <textarea value={message} onChange={(e) => { setMessage(e.target.value); setError(""); }} rows={4} className="rounded-lg border border-white/10 bg-noche-900 px-3 py-2 text-base outline-none focus:border-oro-500" />
              </label>
              {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
              <button type="submit" className="btn-oro self-start"><Send size={16} /> Enviar por WhatsApp</button>
              <p className="text-xs text-niebla-300">Se abrirá WhatsApp con tu mensaje listo para enviar</p>
            </form>
          </Reveal>
        </div>
      </PageBody>
    </>
  );
}

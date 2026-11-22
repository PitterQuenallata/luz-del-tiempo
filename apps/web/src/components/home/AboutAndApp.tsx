import { ArrowRight, Bell, CalendarDays, Radio, Smartphone, Video } from "lucide-react";
import { Link } from "react-router";
import { LogoMark, Wordmark } from "../layout/Logo";
import { QrDemo } from "../ui/QrDemo";
import { Reveal } from "../ui/Reveal";

const APP_BENEFICIOS = [
  { icono: Radio, texto: "Radio en vivo, sin anuncios" },
  { icono: Video, texto: "Videos y podcast" },
  { icono: CalendarDays, texto: "Programación y actividades" },
  { icono: Bell, texto: "Avisos de transmisiones en vivo" },
];

const TIENDAS = ["Google Play", "App Store"];

/** "Nuestro ministerio" + tarjeta de donación. */
export function AboutDonate() {
  return (
    <section id="nosotros" className="bg-[linear-gradient(180deg,#2a3040_0%,#1c2233_100%)] pt-14 pb-16">
      <div className="contenedor flex flex-col gap-9">
        <Reveal><h2 className="text-center text-[28px] titulo">Nuestro ministerio</h2></Reveal>
        <div className="flex flex-wrap items-center justify-center gap-10">
          <Reveal className="flex max-w-[440px] min-w-0 flex-[1_1_340px] flex-col gap-4">
            <span className="self-start rounded-full border border-oro-500/60 bg-oro-500/20 px-2.5 py-1 text-xs font-semibold text-oro-400">Quiénes somos</span>
            <span className="text-[26px] leading-tight titulo">Más que una radio: un ministerio que lleva esperanza</span>
            <p className="text-[15px] leading-relaxed text-niebla-100">
              Empezamos como una radio para llevar esperanza a cada hogar. Hoy también abrimos escuelas de vacaciones y
              de música, salimos en campañas de salud y estudiamos la Biblia con quien quiera acompañarnos.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link to="/nosotros" className="btn-oro">Leer más</Link>
              <Link to="/donar" className="btn-borde">Cómo donar</Link>
            </div>
          </Reveal>
          <Reveal delay={0.15} className="flex min-w-0 flex-[0_1_320px] flex-col items-center gap-4 rounded-2xl border border-white/10 bg-noche-900 p-6 text-center">
            <span className="flex items-center gap-2">
              <LogoMark className="h-11 w-11" />
              <Wordmark size="md" />
            </span>
            <span className="poster text-3xl leading-tight">Apoya <span className="text-oro-500">la obra</span></span>
            <QrDemo />
            <div className="flex flex-col gap-1 text-sm text-niebla-100">
              <span className="font-semibold text-white">Banco Unión</span>
              <span className="tabular-nums">Cuenta 1-1234567 · Ministerio La Luz del Tiempo</span>
            </div>
            <a href="https://wa.me/59170000000" target="_blank" rel="noreferrer" className="btn-oro self-stretch">Escribir por WhatsApp</a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Promoción de la app con dispositivos dibujados. */
export function AppPromo() {
  return (
    <section className="pt-4 pb-14">
      <Reveal className="contenedor">
        <div className="relative overflow-hidden rounded-2xl border border-oro-500/25 bg-[linear-gradient(120deg,#0f1b38_0%,#0b1324_60%,#1b2740_100%)] px-6 py-10 sm:px-10 md:py-12">
          {/* Brillo dorado de fondo: solo decorativo */}
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-oro-500/15 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-10">
            <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
              <span className="text-xs font-semibold tracking-[0.18em] text-oro-400 uppercase">La app del ministerio</span>
              <h2 className="titulo text-[clamp(30px,4vw,44px)] leading-[1.05] text-white">Lleva la radio contigo</h2>
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-niebla-200">
                La radio, los videos y las actividades en un solo lugar, con avisos cuando hay transmisión en vivo y sin anuncios.
              </p>
              <ul className="grid gap-3 text-[15px] text-niebla-100 sm:grid-cols-2">
                {APP_BENEFICIOS.map(({ icono: Icono, texto }) => (
                  <li key={texto} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-oro-500/15 text-oro-400">
                      <Icono size={18} aria-hidden />
                    </span>
                    {texto}
                  </li>
                ))}
              </ul>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Link to="/radio" className="btn-oro">
                  Escuchar en la web
                  <ArrowRight size={16} aria-hidden />
                </Link>
                {TIENDAS.map((tienda) => (
                  <span
                    key={tienda}
                    aria-disabled="true"
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/15 px-5 text-sm text-niebla-300"
                  >
                    <Smartphone size={15} aria-hidden />
                    {tienda}
                    <span className="text-xs text-niebla-400">· pronto</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-[1_1_220px] justify-center" aria-hidden>
              <div className="grid h-52 w-52 place-items-center rounded-full border border-oro-500/30 bg-noche-900/60 shadow-[0_0_60px_-10px_rgba(226,169,39,0.45)] sm:h-60 sm:w-60">
                <LogoMark className="h-28 w-28 sm:h-32 sm:w-32" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

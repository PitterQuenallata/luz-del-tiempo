import { Link } from "react-router";
import { LogoMark, Wordmark } from "../layout/Logo";
import { QrDemo } from "../ui/QrDemo";
import { Reveal } from "../ui/Reveal";

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
    <section className="bg-[repeating-linear-gradient(100deg,rgba(255,255,255,0.07)_0_1px,rgba(255,255,255,0)_1px_64px),linear-gradient(90deg,#14176e_0%,#1d25b8_55%,#2a33d6_100%)] py-[72px]">
      <div className="contenedor flex flex-wrap items-center gap-10">
        <Reveal className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
          <h2 className="text-[clamp(30px,4vw,40px)] leading-[1.05] titulo text-oro-500">La Luz del Tiempo App</h2>
          <p className="text-[15px] text-[#e1e6fb]">Todas las emisoras, videos y actividades en un solo lugar, con avisos y sin anuncios.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[["Próximamente en", "Google Play"], ["Próximamente en", "App Store"], ["Escucha en la", "Web"]].map(([a, b]) => (
              <a key={b} href={b === "Web" ? "#envivo" : "#"} className="inline-flex min-h-[46px] flex-col justify-center rounded-md bg-black px-4 py-1.5 transition-colors hover:bg-noche-950">
                <span className="text-xs text-[#c9cdea]">{a}</span>
                <span className={`text-[15px] font-bold ${b === "Web" ? "text-oro-500" : ""}`}>{b}</span>
              </a>
            ))}
          </div>
        </Reveal>
        <div className="flex min-w-0 flex-[1_1_380px] items-end justify-center" aria-hidden>
          <div className="-mr-9 flex h-[126px] w-[190px] flex-col gap-1.5 rounded-t-lg rounded-b-sm border-[6px] border-[#1c2233] bg-noche-900 p-2">
            <div className="flex-1 rounded bg-[linear-gradient(120deg,#101010,#3b2c0c)]" />
            <div className="h-3.5 rounded-sm bg-oro-500" />
          </div>
          <div className="relative z-10 flex h-[200px] w-[300px] flex-col gap-2 rounded-xl border-8 border-[#1c2233] bg-noche-900 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><LogoMark className="h-7 w-7" /><Wordmark size="sm" /></span>
              <span className="h-1.5 w-14 rounded bg-noche-600" />
            </div>
            <div className="flex-1 rounded-md bg-[radial-gradient(circle_at_58%_45%,#22376a,#0f1b38)]" />
            <div className="h-5 rounded border border-oro-500 bg-[#1b2740]" />
          </div>
          <div className="relative z-20 -ml-11 flex h-[180px] w-24 flex-col gap-2 rounded-2xl border-[5px] border-[#1c2233] bg-noche-900 px-2 py-3">
            <div className="flex-1 rounded-lg bg-[linear-gradient(135deg,#5a3a12,#2a1a08)]" />
            <div className="h-6 rounded-xl bg-oro-500" />
          </div>
        </div>
      </div>
    </section>
  );
}

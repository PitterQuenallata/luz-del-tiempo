import { motion, useReducedMotion } from "motion/react";
import { Bell, CalendarDays, Play } from "lucide-react";
import { LogoMark } from "../layout/Logo";
import { Equalizer } from "../ui/Equalizer";
import { DUR, EASE } from "../../lib/motion";

/** Marco de celular dibujado con CSS (sin imágenes). */
function Celular({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative h-[400px] w-[196px] rounded-[2.4rem] border-[7px] border-[#1c2233] bg-noche-950 p-2.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ${className}`}>
      <div aria-hidden className="absolute top-2.5 left-1/2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-[#1c2233]" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.8rem] bg-noche-900 pt-8">{children}</div>
    </div>
  );
}

/** Pantalla 1: reproductor de la radio con ecualizador y botón de reproducir. */
function PantallaRadio({ activa }: { activa: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-1 flex-col gap-3 px-3 pb-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <LogoMark className="h-6 w-6" />
          <span className="text-[11px] font-bold tracking-wide text-white">LA LUZ</span>
        </span>
        <span className="flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] font-bold text-white">
          <span className="relative flex h-1.5 w-1.5">
            {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-white/80" />}
            <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          EN VIVO
        </span>
      </div>
      <motion.div
        className="mx-auto grid h-36 w-36 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_40%,#22376a,#0b1324_70%)] shadow-[0_0_40px_-8px_rgba(226,169,39,0.45)]"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <LogoMark className="h-20 w-20" />
      </motion.div>
      <div className="text-center">
        <p className="text-[12px] font-semibold text-oro-400">Estamos presentando</p>
        <p className="text-[13px] font-bold text-white">Radio La Luz del Tiempo</p>
      </div>
      <div className="flex justify-center">
        <Equalizer active={activa} color="#e2a927" bars={5} className="h-5" />
      </div>
      <div className="mt-auto flex items-center justify-center gap-4">
        <div className="h-1 flex-1 overflow-hidden rounded bg-noche-600">
          <motion.div
            className="h-full bg-oro-500"
            animate={reduce ? undefined : { width: ["10%", "90%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ width: reduce ? "45%" : undefined }}
          />
        </div>
        <motion.span
          whileTap={{ scale: 0.9 }}
          className="grid h-11 w-11 place-items-center rounded-full bg-oro-500 text-noche-900 shadow-[0_0_20px_-4px_rgba(226,169,39,0.8)]"
        >
          <Play size={18} fill="currentColor" aria-hidden />
        </motion.span>
      </div>
    </div>
  );
}

const PROGRAMAS = [
  { hora: "07:00", nombre: "Buenos días", ahora: false },
  { hora: "09:00", nombre: "Estudio bíblico", ahora: true },
  { hora: "18:00", nombre: "Salud en casa", ahora: false },
  { hora: "20:00", nombre: "Música de adoración", ahora: false },
];

/** Pantalla 2: la programación del día, con filas que entran una a una. */
function PantallaProgramacion() {
  return (
    <div className="flex flex-1 flex-col gap-2.5 px-3 pb-4">
      <div className="flex items-center gap-2 text-[12px] font-bold text-white">
        <CalendarDays size={15} className="text-oro-400" aria-hidden />
        Hoy en la radio
      </div>
      <motion.div
        className="flex flex-col gap-2"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
      >
        {PROGRAMAS.map((p) => (
          <motion.div
            key={p.hora}
            variants={{ hidden: { opacity: 0, x: 16 }, show: { opacity: 1, x: 0, transition: { duration: DUR.base, ease: EASE } } }}
            className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 ${
              p.ahora ? "border-oro-500/60 bg-oro-500/10" : "border-white/10 bg-noche-850"
            }`}
          >
            <span className={`text-[11px] font-bold ${p.ahora ? "text-oro-400" : "text-niebla-300"}`}>{p.hora}</span>
            <span className="flex-1 truncate text-[11px] text-white">{p.nombre}</span>
            {p.ahora && <Equalizer active bars={3} color="#e2a927" className="h-3" />}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/** Dos celulares con flotación suave, una tarjeta de aviso que aparece y se oculta, y toques al presionar. */
export function AppMockups() {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex h-[430px] w-full max-w-[460px] items-center justify-center" aria-hidden>
      <motion.div
        className="absolute left-[4%] top-6 z-10 origin-bottom"
        initial={{ opacity: 0, y: 40, rotate: -6 }}
        whileInView={{ opacity: 1, y: 0, rotate: -6 }}
        viewport={{ once: true }}
        transition={{ duration: DUR.slow, ease: EASE }}
      >
        <motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <Celular>
            <PantallaRadio activa />
          </Celular>
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute right-[4%] top-0 z-20"
        initial={{ opacity: 0, y: 50, rotate: 5 }}
        whileInView={{ opacity: 1, y: 0, rotate: 5 }}
        viewport={{ once: true }}
        transition={{ duration: DUR.slow, delay: 0.15, ease: EASE }}
      >
        <motion.div animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}>
          <Celular>
            <PantallaProgramacion />
          </Celular>
        </motion.div>
      </motion.div>
      {/* Aviso que aparece cada cierto tiempo: "Estamos en vivo" */}
      <motion.div
        className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-oro-500/40 bg-noche-950/95 px-3.5 py-2.5 shadow-xl"
        initial={{ opacity: 0, y: 14, scale: 0.92 }}
        animate={reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: [0, 1, 1, 0], y: [14, 0, 0, -6], scale: [0.92, 1, 1, 0.98] }}
        transition={reduce ? { duration: 0 } : { duration: 6, times: [0, 0.12, 0.8, 1], repeat: Infinity, repeatDelay: 2, delay: 1.2 }}
      >
        <Bell size={15} className="text-oro-400" />
        <span className="text-[12px] font-semibold text-white whitespace-nowrap">Estamos en vivo ahora</span>
      </motion.div>
    </div>
  );
}

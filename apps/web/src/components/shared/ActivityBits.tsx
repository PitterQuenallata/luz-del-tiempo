import { CalendarDays, MapPin, Video as VideoIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ACTIVITY_TYPE_LABEL, type Activity } from "../../api/types";
import { dayMonth, whatsappLink } from "../../lib/format";
import { SmartImage } from "../ui/SmartImage";
import { Tilt } from "../ui/Tilt";

export function useCountdown(iso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(iso).getTime() - now);
  return {
    días: Math.floor(diff / 86_400_000),
    horas: Math.floor(diff / 3_600_000) % 24,
    min: Math.floor(diff / 60_000) % 60,
    seg: Math.floor(diff / 1000) % 60,
  };
}

/** Cuenta regresiva. El número que cambia sube un poco (movimiento que explica algo). */
export function Countdown({ iso }: { iso: string }) {
  const c = useCountdown(iso);
  return (
    <div className="grid max-w-md grid-cols-4 gap-2">
      {Object.entries(c).map(([label, v]) => (
        <div key={label} className="rounded-xl border border-white/10 bg-white/5 py-3 text-center">
          <motion.span
            key={v}
            className="block font-display text-[clamp(22px,3vw,34px)] leading-none font-semibold tabular-nums"
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {String(v).padStart(2, "0")}
          </motion.span>
          <span className="mt-1 block text-xs text-niebla-300">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function RegisterButton({ a, className = "btn-oro btn-brillo" }: { a: Activity; className?: string }) {
  if (a.registration.type === "none") return null;
  const href =
    a.registration.type === "whatsapp"
      ? whatsappLink(a.registration.value, `Hola, quiero inscribirme en: ${a.title}`)
      : a.registration.value;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {a.registration.type === "whatsapp" ? "Inscribirme por WhatsApp" : "Inscribirme"}
    </a>
  );
}

const shade = (hex: string) => `linear-gradient(160deg, ${hex} 0%, #0b1324 115%)`;

/** Afiche 3:4 de una actividad (fila del inicio y página de actividades). */
export function ActivityPoster({ a, color }: { a: Activity; color: string }) {
  const { day, month } = dayMonth(a.startsAt);
  return (
    <Tilt className="rounded-xl">
    <Link to={`/actividades/${a.slug}`} className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-xl p-3 text-center sm:p-4">
      <span className="absolute inset-0" style={{ background: shade(color) }} />
      <SmartImage
        src={a.coverUrl}
        alt={a.title}
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:brightness-110"
      />
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,36,0.55)_0%,rgba(11,19,36,0.15)_40%,rgba(11,19,36,0.85)_100%)]" />
      <span className="relative flex items-start justify-between gap-2 text-left">
        <span className="text-xs font-medium text-white/85">{ACTIVITY_TYPE_LABEL[a.type]}</span>
        <span className="flex flex-col items-center rounded-lg bg-oro-500 px-2 py-1 leading-none text-noche-900 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
          <span className="poster text-xl">{day}</span>
          <span className="text-xs font-semibold">{month}</span>
        </span>
      </span>
      <h2 className="relative poster text-[clamp(19px,2.4vw,30px)] leading-[1.02]">{a.title}</h2>
      <span className="relative flex flex-col items-center gap-1 text-xs font-medium text-white/85">
        {a.scheduleText && (
          <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {a.scheduleText}</span>
        )}
        <span className="flex items-center gap-1.5">
          {a.isVirtual ? <VideoIcon size={14} /> : <MapPin size={14} />} {a.isVirtual ? "Virtual" : a.locationName}
        </span>
      </span>
    </Link>
    </Tilt>
  );
}

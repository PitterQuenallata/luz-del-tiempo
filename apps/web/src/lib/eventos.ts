import type { Activity } from "../api/types";
import { absoluta } from "../components/Seo";

/**
 * Una actividad de la agenda como Event de schema.org. Lo usan el inicio, las áreas y la agenda,
 * para que Google pueda mostrarla con fecha, lugar y precio en los resultados.
 */
export function eventJsonLd(a: Activity) {
  const url = absoluta(`/agenda/${a.slug}`);
  return {
    "@type": "Event",
    name: a.title,
    description: a.summary,
    ...(a.inicio ? { startDate: a.inicio } : {}),
    ...(a.fin ? { endDate: a.fin } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: a.isVirtual ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    location: a.isVirtual
      ? { "@type": "VirtualLocation", url }
      : { "@type": "Place", name: a.lugar ?? "Bolivia", address: { "@type": "PostalAddress", addressCountry: "BO" } },
    ...(a.coverUrl ? { image: absoluta(a.coverUrl) } : {}),
    offers: {
      "@type": "Offer",
      price: a.isFree ? "0" : String(a.priceAmount ?? ""),
      priceCurrency: "BOB",
      availability: "https://schema.org/InStock",
      url,
    },
    organizer: { "@type": "Organization", name: "Ministerio La Luz del Tiempo", url: absoluta("/") },
    url,
  };
}

/** Fecha en formato de calendario (UTC): 20261205T130000Z */
const ics = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/**
 * Descarga un archivo .ics para agregar una sesión al calendario del teléfono.
 * Sin hora de fin, se cuentan 2 horas.
 */
export function descargarCalendario(a: { slug: string; title: string; summary: string; isVirtual: boolean; lugar: string | null }, sesion: { inicio: string; fin: string | null }) {
  const start = new Date(sesion.inicio);
  const end = sesion.fin ? new Date(sesion.fin) : new Date(start.getTime() + 2 * 3_600_000);
  const lugar = a.isVirtual ? "Virtual" : a.lugar ?? "";
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//La Luz del Tiempo//Agenda//ES",
    "BEGIN:VEVENT",
    `UID:${a.slug}-${start.getTime()}@laluzdeltiempo`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(start)}`,
    `DTEND:${ics(end)}`,
    `SUMMARY:${esc(a.title)}`,
    `DESCRIPTION:${esc(`${a.summary}\n${absoluta(`/agenda/${a.slug}`)}`)}`,
    ...(lugar ? [`LOCATION:${esc(lugar)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `${a.slug}.ics` });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import type { Activity } from "../api/types";
import { absoluta } from "../components/Seo";

/**
 * Una actividad como Event de schema.org. Lo usan el inicio, las áreas y las actividades,
 * para que Google pueda mostrarla con fecha, lugar y precio en los resultados.
 */
export function eventJsonLd(a: Activity) {
  const url = absoluta(`/actividades/${a.slug}`);
  const gratis = !a.cost || /gratis|libre/i.test(a.cost);
  const precio = a.cost?.match(/\d+([.,]\d+)?/)?.[0]?.replace(",", ".");
  return {
    "@type": "Event",
    name: a.title,
    description: a.summary,
    startDate: a.startsAt,
    ...(a.endsAt ? { endDate: a.endsAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: a.isVirtual ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    location: a.isVirtual
      ? { "@type": "VirtualLocation", url }
      : {
          "@type": "Place",
          name: a.locationName ?? "Bolivia",
          address: { "@type": "PostalAddress", ...(a.locationAddress ? { streetAddress: a.locationAddress } : {}), addressCountry: "BO" },
        },
    ...(a.coverUrl ? { image: absoluta(a.coverUrl) } : {}),
    ...(a.presenter ? { performer: { "@type": "Person", name: a.presenter } } : {}),
    ...(a.capacity ? { maximumAttendeeCapacity: a.capacity } : {}),
    ...(gratis || precio
      ? { offers: { "@type": "Offer", price: gratis ? "0" : precio, priceCurrency: "BOB", availability: "https://schema.org/InStock", url } }
      : {}),
    organizer: { "@type": "Organization", name: "Ministerio La Luz del Tiempo", url: absoluta("/") },
    url,
  };
}

/** Fecha en formato de calendario (UTC): 20261205T130000Z */
const ics = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/**
 * Descarga un archivo .ics para agregar la actividad al calendario del teléfono
 * (Google Calendar, Calendario de iPhone, Outlook). Sin hora de fin, se cuentan 2 horas.
 */
export function descargarCalendario(a: Activity) {
  const start = new Date(a.startsAt);
  const end = a.endsAt ? new Date(a.endsAt) : new Date(start.getTime() + 2 * 3_600_000);
  const lugar = a.isVirtual ? "Virtual" : [a.locationName, a.locationAddress].filter(Boolean).join(", ");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//La Luz del Tiempo//Actividades//ES",
    "BEGIN:VEVENT",
    `UID:${a.slug}@laluzdeltiempo`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(start)}`,
    `DTEND:${ics(end)}`,
    `SUMMARY:${esc(a.title)}`,
    `DESCRIPTION:${esc(`${a.summary}\n${absoluta(`/actividades/${a.slug}`)}`)}`,
    ...(lugar ? [`LOCATION:${esc(lugar)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `${a.slug}.ics` });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

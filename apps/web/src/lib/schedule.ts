import type { ScheduleItem } from "../api/types";

const toMin = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Hora actual en Bolivia (UTC-4, sin horario de verano). */
export function nowBolivia(date = new Date()) {
  const parts = new Intl.DateTimeFormat("es-BO", { timeZone: "America/La_Paz", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/** Franja en emisión y las siguientes, para una emisora o para todas. */
export function splitSchedule(items: ScheduleItem[], stationSlug?: string, now = nowBolivia()) {
  const list = stationSlug ? items.filter((i) => i.stationSlug === stationSlug) : items;
  const sorted = [...list].sort((a, b) => toMin(a.start) - toMin(b.start));
  const current = sorted.find((i) => toMin(i.start) <= now && now < toMin(i.end)) ?? null;
  const upcoming = sorted.filter((i) => toMin(i.start) > now);
  return { current, upcoming, all: sorted };
}

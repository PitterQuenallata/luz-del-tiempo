/**
 * Capa de datos. Por ahora responde con datos de prueba; cuando exista la API
 * se cambia `USE_MOCK` a false (o VITE_API_URL) y nada más del sitio cambia.
 */
import { useQuery } from "@tanstack/react-query";
import * as mock from "./mock";
import * as extra from "./mock-extra";
import type { Activity, Area, DonationMethod, LiveStatus, MinistryNeed, Person, Post, ScheduleItem, SiteInfo, Station, Video } from "./types";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const USE_MOCK = !API_URL;

/**
 * Solo en desarrollo, para probar los esqueletos y los errores sin API:
 *   ?demora=3000  → los datos de prueba tardan 3 s
 *   ?error=1      → todas las consultas fallan
 * (Conviene borrar la caché antes: localStorage.removeItem("luz-cache").)
 */
const params = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
const MOCK_MS = Number(params?.get("demora") ?? 250);
const MOCK_ERROR = params?.get("error") === "1";

const delay = <T,>(value: T, ms = MOCK_MS) =>
  new Promise<T>((resolve, reject) => setTimeout(() => (MOCK_ERROR ? reject(new Error("Error simulado")) : resolve(value)), ms));

async function get<T>(path: string, fallback: () => T): Promise<T> {
  if (USE_MOCK) return delay(fallback());
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json() as Promise<T>;
}

const upcoming = (a: Activity) => new Date(a.endsAt ?? a.startsAt).getTime() >= Date.now();

export const api = {
  areas: () => get<Area[]>("/public/areas", () => mock.areas),
  area: (slug: string) => get<Area | null>(`/public/areas/${slug}`, () => mock.areas.find((a) => a.slug === slug) ?? null),
  stations: () => get<Station[]>("/public/stations", () => mock.stations),
  activities: () =>
    get<Activity[]>("/public/activities", () =>
      mock.activities.filter(upcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    ),
  videos: () => get<Video[]>("/public/videos", () => mock.videos),
  posts: () => get<Post[]>("/public/posts", () => mock.posts),
  live: () => get<LiveStatus>("/public/live", () => mock.live),
};

export const useAreas = () => useQuery({ queryKey: ["areas"], queryFn: api.areas });
export const useArea = (slug: string) => useQuery({ queryKey: ["area", slug], queryFn: () => api.area(slug) });
export const useStations = () => useQuery({ queryKey: ["stations"], queryFn: api.stations });
export const useActivities = () => useQuery({ queryKey: ["activities"], queryFn: api.activities });
export const useVideos = () => useQuery({ queryKey: ["videos"], queryFn: api.videos });
export const usePosts = () => useQuery({ queryKey: ["posts"], queryFn: api.posts });
/** Se refresca cada minuto para que el aviso "En vivo" aparezca solo. */
export const useLive = () => useQuery({ queryKey: ["live"], queryFn: api.live, refetchInterval: 60_000 });

export const useSlides = () => useQuery({ queryKey: ["slides"], queryFn: () => get("/public/slides", () => mock.slides) });
export const useSchedule = () => useQuery({ queryKey: ["schedule"], queryFn: () => get("/public/schedule/today", () => mock.schedule) });

export const usePost = (slug: string) =>
  useQuery({ queryKey: ["post", slug], queryFn: () => get<Post | null>(`/public/posts/${slug}`, () => mock.posts.find((p) => p.slug === slug) ?? null) });
export const useActivity = (slug: string) =>
  useQuery({ queryKey: ["activity", slug], queryFn: () => get<Activity | null>(`/public/activities/${slug}`, () => mock.activities.find((a) => a.slug === slug) ?? null) });
/** Programación de un día de la semana (0 = domingo … 6 = sábado). */
export const useScheduleDay = (day: number) =>
  useQuery({ queryKey: ["schedule", day], queryFn: () => get<ScheduleItem[]>(`/public/schedule?day=${day}`, () => extra.scheduleFor(day)) });
export const usePeople = () => useQuery({ queryKey: ["people"], queryFn: () => get<Person[]>("/public/people", () => extra.people) });
export const useSite = () => useQuery({ queryKey: ["site"], queryFn: () => get<SiteInfo>("/public/site", () => extra.site) });
export const useDonationMethods = () =>
  useQuery({ queryKey: ["donation-methods"], queryFn: () => get<DonationMethod[]>("/public/donations/methods", () => extra.donationMethods) });
export const useNeeds = () => useQuery({ queryKey: ["needs"], queryFn: () => get<MinistryNeed[]>("/public/donations/needs", () => extra.needs) });

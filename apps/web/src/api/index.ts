/**
 * Capa de datos de la web pública. Todo sale de la API (apps/api, rutas /public).
 * Si la API no responde, la sección muestra el error (no se oculta con datos de prueba).
 * En desarrollo, VITE_API_URL apunta a http://localhost:4000/api/v1.
 */
import { useQuery } from "@tanstack/react-query";
import type { Activity, Area, DonationMethod, HeroSlide, LiveStatus, MinistryNeed, Person, Post, ScheduleItem, SiteInfo, Station, Video } from "./types";

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1").replace(/\/$/, "");
// Origen de la API: las imágenes que guarda llegan como /api/v1/... y se completan con este origen
const ORIGEN = BASE.startsWith("http") ? new URL(BASE).origin : window.location.origin;

async function leer<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json() as Promise<T>;
}

/** Devuelve null si la API responde 404 (por ejemplo, un enlace que ya no existe). */
async function leerOpcional<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json() as Promise<T | null>;
}

const imagen = (url: string | null | undefined): string | null => (url && url.startsWith("/") ? `${ORIGEN}${url}` : url ?? null);

const conImagenArea = (a: Area): Area => ({ ...a, coverUrl: imagen(a.coverUrl), gallery: a.gallery.map((u) => imagen(u) as string) });
const conImagenPost = (p: Post): Post => ({ ...p, coverUrl: imagen(p.coverUrl) });
const conImagenActividad = (a: Activity): Activity => ({ ...a, coverUrl: imagen(a.coverUrl) });

export const api = {
  slides: async (): Promise<HeroSlide[]> =>
    (await leer<HeroSlide[]>("/public/slides")).map((s) => ({ ...s, imageUrl: imagen(s.imageUrl) })),
  areas: async (): Promise<Area[]> => (await leer<Area[]>("/public/areas")).map(conImagenArea),
  area: async (slug: string): Promise<Area | null> => {
    const a = await leerOpcional<Area>(`/public/areas/${slug}`);
    return a ? conImagenArea(a) : null;
  },
  people: async (): Promise<Person[]> => (await leer<Person[]>("/public/people")).map((p) => ({ ...p, photoUrl: imagen(p.photoUrl) })),
  posts: async (): Promise<Post[]> => (await leer<Post[]>("/public/posts")).map(conImagenPost),
  post: async (slug: string): Promise<Post | null> => {
    const p = await leerOpcional<Post>(`/public/posts/${slug}`);
    return p ? conImagenPost(p) : null;
  },
  activities: async (): Promise<Activity[]> => (await leer<Activity[]>("/public/activities")).map(conImagenActividad),
  activity: async (slug: string): Promise<Activity | null> => {
    const a = await leerOpcional<Activity>(`/public/activities/${slug}`);
    return a ? conImagenActividad(a) : null;
  },
  videos: () => leer<Video[]>("/public/videos"),
  live: () => leer<LiveStatus>("/public/live"),
  stations: async (): Promise<Station[]> =>
    (await leer<Station[]>("/public/stations")).map((s) => ({ ...s, imageUrl: imagen(s.imageUrl) })),
  schedule: () => leer<ScheduleItem[]>("/public/schedule/today"),
  scheduleDay: (day: number) => leer<ScheduleItem[]>(`/public/schedule?day=${day}`),
  donationMethods: () => leer<DonationMethod[]>("/public/donations/methods"),
  needs: () => leer<MinistryNeed[]>("/public/donations/needs"),
  site: () => leer<SiteInfo>("/public/site"),
};

export const useAreas = () => useQuery({ queryKey: ["areas"], queryFn: api.areas });
export const useArea = (slug: string) => useQuery({ queryKey: ["area", slug], queryFn: () => api.area(slug) });
export const useSlides = () => useQuery({ queryKey: ["slides"], queryFn: api.slides });
export const usePeople = () => useQuery({ queryKey: ["people"], queryFn: api.people });
export const useStations = () => useQuery({ queryKey: ["stations"], queryFn: api.stations });
export const useActivities = () => useQuery({ queryKey: ["activities"], queryFn: api.activities });
export const useActivity = (slug: string) => useQuery({ queryKey: ["activity", slug], queryFn: () => api.activity(slug) });
export const useVideos = () => useQuery({ queryKey: ["videos"], queryFn: api.videos });
export const usePosts = () => useQuery({ queryKey: ["posts"], queryFn: api.posts });
export const usePost = (slug: string) => useQuery({ queryKey: ["post", slug], queryFn: () => api.post(slug) });
/** Se refresca cada minuto para que el aviso "En vivo" aparezca solo. */
export const useLive = () => useQuery({ queryKey: ["live"], queryFn: api.live, refetchInterval: 60_000 });
export const useSchedule = () => useQuery({ queryKey: ["schedule"], queryFn: api.schedule });
/** Programación de un día de la semana (0 = domingo … 6 = sábado). */
export const useScheduleDay = (day: number) => useQuery({ queryKey: ["schedule", day], queryFn: () => api.scheduleDay(day) });
export const useSite = () => useQuery({ queryKey: ["site"], queryFn: api.site });
export const useDonationMethods = () => useQuery({ queryKey: ["donation-methods"], queryFn: api.donationMethods });
export const useNeeds = () => useQuery({ queryKey: ["needs"], queryFn: api.needs });

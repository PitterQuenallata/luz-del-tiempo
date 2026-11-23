/**
 * Cliente de la API pública (apps/api, rutas /api/v1/public). Sin sesión.
 * En el emulador Android, localhost es el propio emulador: por eso el valor por
 * defecto usa 10.0.2.2 (la Mac). En un celular real, pon EXPO_PUBLIC_API_URL con la IP de la Mac.
 */
import type { Activity, ActivityDetail, AgendaFiltros, Area, DonationMethod, Person, LiveStatus, MinistryNeed, Post, ScheduleItem, SiteInfo, Station, Video } from './types';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1').replace(/\/$/, '');

// Origen de la API: las imágenes guardadas llegan como /api/v1/... y se completan con este origen
const ORIGEN = new URL(API_URL).origin;

async function leer<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return (await res.json()) as T;
}

export const imagen = (url: string | null | undefined): string | null =>
  url && url.startsWith('/') ? `${ORIGEN}${url}` : url ?? null;

export const api = {
  posts: async (): Promise<Post[]> =>
    (await leer<Post[]>('/public/posts')).map((p) => ({ ...p, coverUrl: imagen(p.coverUrl) })),
  activities: async (filtros: { estado?: 'proximas' | 'pasadas' | 'todas'; tipo?: string; area?: string; gratis?: boolean; virtual?: boolean } = {}): Promise<Activity[]> => {
    const qs = new URLSearchParams();
    if (filtros.estado) qs.set('estado', filtros.estado);
    if (filtros.tipo) qs.set('tipo', filtros.tipo);
    if (filtros.area) qs.set('area', filtros.area);
    if (filtros.gratis) qs.set('gratis', '1');
    if (filtros.virtual) qs.set('virtual', '1');
    const texto = qs.toString();
    return (await leer<Activity[]>(`/public/agenda${texto ? `?${texto}` : ''}`)).map((a) => ({ ...a, coverUrl: imagen(a.coverUrl) }));
  },
  activity: async (slug: string): Promise<ActivityDetail | null> => {
    const res = await fetch(`${API_URL}/public/agenda/${slug}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const a = (await res.json()) as ActivityDetail;
    return {
      ...a,
      coverUrl: imagen(a.coverUrl),
      qrInscripcionUrl: imagen(a.qrInscripcionUrl),
      qrSubidoUrl: imagen(a.qrSubidoUrl),
      galeria: a.galeria.map((g) => ({ ...g, imageUrl: imagen(g.imageUrl) as string })),
      personas: a.personas.map((p) => ({ ...p, photoUrl: imagen(p.photoUrl) })),
      sesiones: a.sesiones.map((s) => ({ ...s, programa: s.programa.map((p) => ({ ...p, persona: p.persona ? { ...p.persona, photoUrl: imagen(p.persona.photoUrl) } : null })) })),
    };
  },
  agendaFiltros: () => leer<AgendaFiltros>('/public/agenda/filtros'),
  inscribir: async (slug: string, datos: { fullName: string; phoneCode: string; phone: string; email: string }): Promise<string> => {
    const res = await fetch(`${API_URL}/public/agenda/${slug}/inscripciones`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...datos, website: "", origen: "app" }),
    });
    const cuerpo = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) throw new Error(cuerpo.message ?? 'No pudimos completar la inscripción. Intenta de nuevo.');
    return cuerpo.message ?? 'Listo.';
  },
  videos: () => leer<Video[]>('/public/videos'),
  stations: async (): Promise<Station[]> =>
    (await leer<Station[]>('/public/stations')).map((s) => ({ ...s, imageUrl: imagen(s.imageUrl) })),
  schedule: () => leer<ScheduleItem[]>('/public/schedule/today'),
  live: () => leer<LiveStatus>('/public/live'),
  donationMethods: () => leer<DonationMethod[]>('/public/donations/methods'),
  needs: () => leer<MinistryNeed[]>('/public/donations/needs'),
  site: () => leer<SiteInfo>('/public/site'),
  areas: () => leer<Area[]>('/public/areas').then((a) => a.map((x) => ({ ...x, coverUrl: imagen(x.coverUrl) }))),
  people: () => leer<Person[]>('/public/people').then((p) => p.map((x) => ({ ...x, photoUrl: imagen(x.photoUrl) }))),
};

/** Enlace a la miniatura de YouTube (no pasa por la API). */
export const miniaturaYoutube = (youtubeId: string) => `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
export const enlaceYoutube = (youtubeId: string) => `https://www.youtube.com/watch?v=${youtubeId}`;

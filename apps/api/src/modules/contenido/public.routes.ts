import { Hono } from 'hono';
import { and, asc, desc, eq, lte } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { radioApi } from '../radio/radio-sync.js';
import {
  areaGallery,
  areas,
  heroSlides,
  liveStatus,
  liveStreams,
  people,
  posts,
  programSlots,
  programs,
  siteSettings,
  stations,
  videoSeries,
  videos,
} from '../../db/schema.js';

// API pública de solo lectura para la web (sin sesión). Solo devuelve lo publicado.
// Las formas de respuesta siguen los tipos de apps/web/src/api/types.ts.
export const publicRoutes = new Hono();

const aHora = (t: string) => t.slice(0, 5); // "09:00:00" -> "09:00"
const parrafos = (texto: string | null) => (texto ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

// ---------- Portada ----------

publicRoutes.get('/slides', async (c) => {
  const rows = await db
    .select()
    .from(heroSlides)
    .where(eq(heroSlides.isPublished, true))
    .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.createdAt));
  return c.json(
    rows.map((s) => ({
      id: s.id,
      eyebrow: s.eyebrow,
      title: s.title,
      subtitle: s.subtitle,
      ghost: s.ghost,
      cta: { label: s.ctaLabel, to: s.ctaTo },
      imageUrl: s.imageUrl,
      tint: s.tint,
    })),
  );
});

// ---------- Áreas ----------

type FilaArea = typeof areas.$inferSelect;
function areaPublica(a: FilaArea, gallery: string[]) {
  return {
    slug: a.slug,
    name: a.name,
    template: a.template,
    summary: a.summary ?? '',
    content: a.content ?? '',
    color: a.color,
    icon: a.icon,
    coverUrl: a.coverUrl,
    gallery,
    whatsapp: a.whatsapp,
    eventEnabled: a.eventEnabled,
  };
}

publicRoutes.get('/areas', async (c) => {
  const rows = await db
    .select()
    .from(areas)
    .where(eq(areas.isPublished, true))
    .orderBy(asc(areas.sortOrder), asc(areas.name));
  return c.json(rows.map((a) => areaPublica(a, [])));
});

publicRoutes.get('/areas/:slug', async (c) => {
  const slug = c.req.param('slug') as string;
  const [area] = await db.select().from(areas).where(eq(areas.slug, slug));
  if (!area || !area.isPublished) return c.json(null, 404);
  const galeria = await db
    .select()
    .from(areaGallery)
    .where(eq(areaGallery.areaId, area.id))
    .orderBy(asc(areaGallery.sortOrder), asc(areaGallery.createdAt));
  return c.json(areaPublica(area, galeria.map((f) => f.imageUrl)));
});

// ---------- Personas ----------

publicRoutes.get('/people', async (c) => {
  const rows = await db
    .select()
    .from(people)
    .where(eq(people.isPublished, true))
    .orderBy(asc(people.sortOrder), asc(people.name));
  return c.json(rows.map((p) => ({ name: p.name, role: p.roleTitle, photoUrl: p.photoUrl, bio: p.bio ?? '' })));
});

// ---------- Noticias ----------

async function noticiasPublicadas() {
  return db
    .select({
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      coverUrl: posts.coverUrl,
      publishedAt: posts.publishedAt,
      areaSlug: areas.slug,
    })
    .from(posts)
    .leftJoin(areas, eq(posts.areaId, areas.id))
    .where(and(eq(posts.status, 'published'), lte(posts.publishedAt, new Date())))
    .orderBy(desc(posts.publishedAt));
}

const noticiaPublica = (n: Awaited<ReturnType<typeof noticiasPublicadas>>[number]) => ({
  slug: n.slug,
  title: n.title,
  excerpt: n.excerpt ?? '',
  coverUrl: n.coverUrl,
  areaSlug: n.areaSlug,
  publishedAt: n.publishedAt?.toISOString() ?? '',
  body: parrafos(n.content),
});

publicRoutes.get('/posts', async (c) => c.json((await noticiasPublicadas()).map(noticiaPublica)));

publicRoutes.get('/posts/:slug', async (c) => {
  const slug = c.req.param('slug') as string;
  const noticia = (await noticiasPublicadas()).find((n) => n.slug === slug);
  return noticia ? c.json(noticiaPublica(noticia)) : c.json(null, 404);
});

// ---------- Videos ----------

publicRoutes.get('/videos', async (c) => {
  const rows = await db
    .select({
      youtubeId: videos.youtubeId,
      title: videos.title,
      publishedAt: videos.publishedAt,
      isFeatured: videos.isFeatured,
      areaSlug: areas.slug,
      seriesName: videoSeries.name,
    })
    .from(videos)
    .innerJoin(areas, eq(videos.areaId, areas.id))
    .leftJoin(videoSeries, eq(videos.seriesId, videoSeries.id))
    .where(eq(videos.isPublished, true))
    .orderBy(desc(videos.publishedAt), desc(videos.createdAt));
  return c.json(
    rows.map((v) => ({
      youtubeId: v.youtubeId,
      title: v.title,
      areaSlug: v.areaSlug,
      seriesName: v.seriesName,
      publishedAt: v.publishedAt?.toISOString() ?? '',
      isFeatured: v.isFeatured,
    })),
  );
});

// ---------- En vivo ----------

publicRoutes.get('/live', async (c) => {
  const [fila] = await db.select().from(liveStatus).where(eq(liveStatus.id, 1));
  const transmisiones = await db.select().from(liveStreams).orderBy(asc(liveStreams.sortOrder));
  if (!fila?.isLive || transmisiones.length === 0) return c.json({ isLive: false, title: '', streams: [] });
  return c.json({
    isLive: true,
    title: fila.title ?? '',
    streams: transmisiones.map((t) => ({ platform: t.platform, url: t.url })),
  });
});

// ---------- Emisoras ----------

// Estado en vivo de las emisoras (oyentes y canción), leído de la radio-api.
// Caché de 10 s: el sitio y la app consultan seguido y la radio no tiene por qué recibir cada consulta.
type EstadoRadio = { online: boolean; listeners: number; title: string | null };
let cacheRadio: { en: number; datos: Map<string, EstadoRadio> } = { en: 0, datos: new Map() };
async function estadoDeRadio(): Promise<Map<string, EstadoRadio>> {
  if (Date.now() - cacheRadio.en < 10_000) return cacheRadio.datos;
  const datos = new Map<string, EstadoRadio>();
  try {
    const r = await radioApi<{ stations: { slug: string; status?: EstadoRadio }[] }>('/v1/stations');
    for (const e of r.stations) {
      if (e.status) datos.set(e.slug, { online: e.status.online, listeners: e.status.listeners, title: e.status.title });
    }
  } catch {
    // Radio apagada: la web sigue funcionando, sin oyentes ni canción
  }
  cacheRadio = { en: Date.now(), datos };
  return datos;
}

// Enlace de escucha: el mismo que usan los oyentes, con la IP de la red para que lo abran los celulares
const BASE_STREAM = (process.env.PUBLIC_STREAM_BASE ?? 'http://localhost:8000').replace(/\/$/, '');

publicRoutes.get('/stations', async (c) => {
  const rows = await db
    .select({
      mountPoint: stations.mountPoint,
      slug: stations.slug,
      isMain: stations.isMain,
      name: stations.name,
      description: stations.description,
      genre: stations.genre,
      imageUrl: stations.imageUrl,
      kind: stations.kind,
      visibleInMinistry: stations.visibleInMinistry,
      status: stations.status,
      sortOrder: stations.sortOrder,
      relleno: stations.relleno,
      areaSlug: areas.slug,
      areaColor: areas.color,
    })
    .from(stations)
    .leftJoin(areas, eq(stations.areaId, areas.id))
    .where(eq(stations.status, 'active'))
    .orderBy(desc(stations.isMain), asc(stations.sortOrder), asc(stations.name));
  const enRadio = await estadoDeRadio();
  return c.json(
    rows
      .filter((e) => e.kind === 'own' || e.visibleInMinistry)
      .map((e) => {
        const color = e.areaColor ?? '#e2a927';
        const estado = e.mountPoint ? enRadio.get(e.slug) : undefined;
        return {
          slug: e.slug,
          isMain: e.isMain,
          name: e.name,
          description: e.description ?? '',
          genre: e.genre ?? '',
          color,
          art: `linear-gradient(120deg, #0b1324 0%, ${color}66 60%, #0b1324 100%)`,
          imageUrl: e.imageUrl,
          // Sin punto de transmisión no hay enlace; con él, el stream en vivo (la radio decide qué suena)
          streamUrl: e.mountPoint ? `${BASE_STREAM}${e.mountPoint}` : '',
          areaSlug: e.areaSlug,
          nowPlaying: estado?.online ? estado.title : null,
          listeners: estado?.listeners ?? 0,
        };
      }),
  );
});

// ---------- Programación ----------

// Franjas de un día (0 = domingo … 6 = sábado), en la hora de Bolivia. Solo programas, sin relleno.
async function programacionDelDia(dia: number) {
  const filas = await db
    .select({
      start: programSlots.startTime,
      end: programSlots.endTime,
      isLive: programSlots.isLive,
      programName: programs.name,
      host: programs.hostName,
      stationSlug: stations.slug,
    })
    .from(programSlots)
    .innerJoin(programs, eq(programSlots.programId, programs.id))
    .innerJoin(stations, eq(programs.stationId, stations.id))
    .where(and(eq(programSlots.dayOfWeek, dia), eq(programs.isActive, true), eq(stations.status, 'active')))
    .orderBy(asc(programSlots.startTime));

  const programados = filas.map((f) => ({
    start: aHora(f.start),
    end: aHora(f.end),
    programName: f.programName,
    host: f.host,
    stationSlug: f.stationSlug,
    isLive: f.isLive,
    relleno: false,
  }));

  return programados.sort((a, b) => a.start.localeCompare(b.start));
}

const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
// 1440 = fin del día: se muestra como 23:59 (igual que en el resto de la programación)
const horaDeMinutos = (m: number) => (m >= 1440 ? '23:59' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);

const diaDeBolivia = () => {
  const corto = new Intl.DateTimeFormat('en-US', { timeZone: 'America/La_Paz', weekday: 'short' }).format(new Date());
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(corto);
};

publicRoutes.get('/schedule', async (c) => {
  const dia = Number(c.req.query('day'));
  if (!Number.isInteger(dia) || dia < 0 || dia > 6) return c.json({ error: 'dia_invalido' }, 422);
  return c.json(await programacionDelDia(dia));
});

publicRoutes.get('/schedule/today', async (c) => c.json(await programacionDelDia(diaDeBolivia())));

// ---------- Donar y sitio ----------

async function ajuste<T>(clave: string, fallback: T): Promise<T> {
  const [fila] = await db.select().from(siteSettings).where(eq(siteSettings.key, clave));
  return fila ? (fila.value as T) : fallback;
}

publicRoutes.get('/donations/methods', async (c) => c.json(await ajuste('donate.metodos', [])));

publicRoutes.get('/donations/needs', async (c) => {
  const necesidades = await ajuste<{ title: string; detail: string }[]>('donate.necesidades', []);
  return c.json(necesidades.map((n) => ({ title: n.title, body: n.detail })));
});

publicRoutes.get('/site', async (c) => {
  const info = await ajuste<Record<string, unknown> | null>('site.info', null);
  return info ? c.json(info) : c.json(null, 404);
});

import { Hono } from 'hono';
import { asc, desc, eq } from 'drizzle-orm';
import {
  actividadSchema,
  enVivoSchema,
  postSchema,
  serieSchema,
  datosMinisterioSchema,
  videoSchema,
  youtubeIdDe,
} from '@luz/shared';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { errorValidacion } from '../../lib/validar.js';
import { db } from '../../db/index.js';
import { activities, areas, liveStatus, liveStreams, people, posts, siteSettings, videoSeries, videos } from '../../db/schema.js';

// Noticias, actividades, series y videos, y el estado "en vivo" (permiso contenido:editar).
export const gestionRoutes = new Hono();
const PERMISO = 'contenido:editar';

const aFecha = (texto: string | null | undefined) => (texto ? new Date(texto) : null);

// Revisa que una referencia exista (área, persona, serie). Devuelve el mensaje de error o null.
async function referenciaInvalida(tabla: 'area' | 'persona' | 'serie', id: string | null | undefined, campo: string) {
  if (!id) return null;
  const tablaReal = tabla === 'area' ? areas : tabla === 'persona' ? people : videoSeries;
  const [fila] = await db.select({ id: tablaReal.id }).from(tablaReal).where(eq(tablaReal.id, id));
  return fila ? null : { error: 'validacion', campo, message: 'El elemento elegido ya no existe.' };
}

// ---------- Noticias ----------

gestionRoutes.get('/noticias', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt), desc(posts.createdAt));
  return c.json({ noticias: rows });
});

gestionRoutes.post('/noticias', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = postSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const dup = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, d.slug));
  if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una noticia con ese enlace.' }, 409);
  const ref = (await referenciaInvalida('area', d.areaId, 'areaId')) ?? (await referenciaInvalida('persona', d.authorPersonId, 'authorPersonId'));
  if (ref) return c.json(ref, 422);

  const [fila] = await db
    .insert(posts)
    .values({ ...d, publishedAt: aFecha(d.publishedAt), createdById: caller?.id ?? null })
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'noticia.crear', entidad: 'noticia', entidadId: fila.id, detalle: fila.title });
  return c.json({ noticia: fila }, 201);
});

gestionRoutes.patch('/noticias/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = postSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [actual] = await db.select().from(posts).where(eq(posts.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  if (d.slug !== actual.slug) {
    const dup = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, d.slug));
    if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una noticia con ese enlace.' }, 409);
  }
  const ref = (await referenciaInvalida('area', d.areaId, 'areaId')) ?? (await referenciaInvalida('persona', d.authorPersonId, 'authorPersonId'));
  if (ref) return c.json(ref, 422);

  const [fila] = await db
    .update(posts)
    .set({ ...d, publishedAt: aFecha(d.publishedAt), updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'noticia.editar', entidad: 'noticia', entidadId: id, detalle: fila.title });
  return c.json({ noticia: fila });
});

gestionRoutes.delete('/noticias/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(posts).where(eq(posts.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'noticia.eliminar', entidad: 'noticia', entidadId: id, detalle: borrada.title });
  return c.json({ ok: true });
});

// ---------- Actividades ----------

gestionRoutes.get('/actividades', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(activities).orderBy(asc(activities.startsAt));
  return c.json({ actividades: rows });
});

gestionRoutes.post('/actividades', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = actividadSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const dup = await db.select({ id: activities.id }).from(activities).where(eq(activities.slug, d.slug));
  if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una actividad con ese enlace.' }, 409);
  const ref = (await referenciaInvalida('area', d.areaId, 'areaId')) ?? (await referenciaInvalida('persona', d.presenterPersonId, 'presenterPersonId'));
  if (ref) return c.json(ref, 422);

  const [fila] = await db
    .insert(activities)
    .values({ ...d, startsAt: new Date(d.startsAt), endsAt: aFecha(d.endsAt) })
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'actividad.crear', entidad: 'actividad', entidadId: fila.id, detalle: fila.title });
  return c.json({ actividad: fila }, 201);
});

gestionRoutes.patch('/actividades/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = actividadSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [actual] = await db.select().from(activities).where(eq(activities.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  if (d.slug !== actual.slug) {
    const dup = await db.select({ id: activities.id }).from(activities).where(eq(activities.slug, d.slug));
    if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una actividad con ese enlace.' }, 409);
  }
  const ref = (await referenciaInvalida('area', d.areaId, 'areaId')) ?? (await referenciaInvalida('persona', d.presenterPersonId, 'presenterPersonId'));
  if (ref) return c.json(ref, 422);

  const [fila] = await db
    .update(activities)
    .set({ ...d, startsAt: new Date(d.startsAt), endsAt: aFecha(d.endsAt), updatedAt: new Date() })
    .where(eq(activities.id, id))
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'actividad.editar', entidad: 'actividad', entidadId: id, detalle: fila.title });
  return c.json({ actividad: fila });
});

gestionRoutes.delete('/actividades/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(activities).where(eq(activities.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'actividad.eliminar', entidad: 'actividad', entidadId: id, detalle: borrada.title });
  return c.json({ ok: true });
});

// ---------- Series de video ----------

gestionRoutes.get('/series', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(videoSeries).orderBy(asc(videoSeries.sortOrder), asc(videoSeries.name));
  return c.json({ series: rows });
});

gestionRoutes.post('/series', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = serieSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const dup = await db.select({ id: videoSeries.id }).from(videoSeries).where(eq(videoSeries.slug, d.slug));
  if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una serie con ese enlace.' }, 409);
  const ref = await referenciaInvalida('area', d.areaId, 'areaId');
  if (ref) return c.json(ref, 422);
  const [fila] = await db.insert(videoSeries).values(d).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'serie.crear', entidad: 'serie', entidadId: fila.id, detalle: fila.name });
  return c.json({ serie: fila }, 201);
});

gestionRoutes.patch('/series/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = serieSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [actual] = await db.select().from(videoSeries).where(eq(videoSeries.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  if (d.slug !== actual.slug) {
    const dup = await db.select({ id: videoSeries.id }).from(videoSeries).where(eq(videoSeries.slug, d.slug));
    if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una serie con ese enlace.' }, 409);
  }
  if (d.areaId !== actual.areaId) {
    // Si cambia de área, los videos que la usan deben cambiar también: se bloquea para no romper la regla
    const enUso = await db.select({ id: videos.id }).from(videos).where(eq(videos.seriesId, id));
    if (enUso.length) {
      return c.json({ error: 'validacion', campo: 'areaId', message: 'La serie tiene videos. Quítalos de la serie antes de cambiarla de área.' }, 422);
    }
  }
  const [fila] = await db.update(videoSeries).set(d).where(eq(videoSeries.id, id)).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'serie.editar', entidad: 'serie', entidadId: id, detalle: fila.name });
  return c.json({ serie: fila });
});

gestionRoutes.delete('/series/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(videoSeries).where(eq(videoSeries.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'serie.eliminar', entidad: 'serie', entidadId: id, detalle: borrada.name });
  return c.json({ ok: true });
});

// ---------- Videos ----------

gestionRoutes.get('/videos', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(videos).orderBy(desc(videos.publishedAt), desc(videos.createdAt));
  return c.json({ videos: rows });
});

// Entrada del panel: el ID o el enlace de YouTube (se normaliza aquí)
gestionRoutes.post('/videos', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const cuerpo = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof cuerpo.youtubeId === 'string') cuerpo.youtubeId = youtubeIdDe(cuerpo.youtubeId) ?? cuerpo.youtubeId;
  const parsed = videoSchema.safeParse(cuerpo);
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const dup = await db.select({ id: videos.id }).from(videos).where(eq(videos.youtubeId, d.youtubeId));
  if (dup.length) return c.json({ error: 'validacion', campo: 'youtubeId', message: 'Ese video ya está cargado.' }, 422);
  const ref = await validarVideo(d.areaId, d.seriesId);
  if (ref) return c.json(ref, 422);
  const [fila] = await db
    .insert(videos)
    .values({ ...d, publishedAt: aFecha(d.publishedAt) })
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'video.crear', entidad: 'video', entidadId: fila.id, detalle: fila.title });
  return c.json({ video: fila }, 201);
});

gestionRoutes.patch('/videos/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const cuerpo = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof cuerpo.youtubeId === 'string') cuerpo.youtubeId = youtubeIdDe(cuerpo.youtubeId) ?? cuerpo.youtubeId;
  const parsed = videoSchema.safeParse(cuerpo);
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [actual] = await db.select().from(videos).where(eq(videos.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  if (d.youtubeId !== actual.youtubeId) {
    const dup = await db.select({ id: videos.id }).from(videos).where(eq(videos.youtubeId, d.youtubeId));
    if (dup.length) return c.json({ error: 'validacion', campo: 'youtubeId', message: 'Ese video ya está cargado.' }, 422);
  }
  const ref = await validarVideo(d.areaId, d.seriesId);
  if (ref) return c.json(ref, 422);
  const [fila] = await db
    .update(videos)
    .set({ ...d, publishedAt: aFecha(d.publishedAt) })
    .where(eq(videos.id, id))
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'video.editar', entidad: 'video', entidadId: id, detalle: fila.title });
  return c.json({ video: fila });
});

gestionRoutes.delete('/videos/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrado] = await db.delete(videos).where(eq(videos.id, id)).returning();
  if (!borrado) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'video.eliminar', entidad: 'video', entidadId: id, detalle: borrado.title });
  return c.json({ ok: true });
});

// La serie debe existir y ser de la misma área del video (regla de docs/DATABASE.md)
async function validarVideo(areaId: string, seriesId: string | null) {
  const ref = await referenciaInvalida('area', areaId, 'areaId');
  if (ref) return ref;
  if (!seriesId) return null;
  const [serie] = await db.select({ areaId: videoSeries.areaId }).from(videoSeries).where(eq(videoSeries.id, seriesId));
  if (!serie) return { error: 'validacion', campo: 'seriesId', message: 'La serie elegida ya no existe.' };
  if (serie.areaId !== areaId) return { error: 'validacion', campo: 'seriesId', message: 'La serie debe ser de la misma área que el video.' };
  return null;
}

// ---------- En vivo: interruptor, título y un enlace por plataforma ----------

gestionRoutes.get('/en-vivo', requirePermission(PERMISO), async (c) => {
  const [fila] = await db.select().from(liveStatus).where(eq(liveStatus.id, 1));
  const transmisiones = await db.select().from(liveStreams).orderBy(asc(liveStreams.sortOrder));
  return c.json({
    estado: fila ?? { id: 1, isLive: false, title: null, startedAt: null, updatedAt: null },
    transmisiones: transmisiones.map((t) => ({ platform: t.platform, url: t.url })),
  });
});

gestionRoutes.put('/en-vivo', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = enVivoSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [previo] = await db.select().from(liveStatus).where(eq(liveStatus.id, 1));
  const iniciaAhora = d.isLive && !previo?.isLive;
  const valores = {
    isLive: d.isLive,
    title: d.title ?? null,
    startedAt: iniciaAhora ? new Date() : d.isLive ? (previo?.startedAt ?? new Date()) : null,
    updatedAt: new Date(),
  };
  // Estado y enlaces se guardan juntos: si uno falla, no queda a medias
  const fila = await db.transaction(async (tx) => {
    const [f] = await tx
      .insert(liveStatus)
      .values({ id: 1, ...valores })
      .onConflictDoUpdate({ target: liveStatus.id, set: valores })
      .returning();
    await tx.delete(liveStreams);
    if (d.streams.length > 0) {
      await tx.insert(liveStreams).values(d.streams.map((t, i) => ({ platform: t.platform, url: t.url, sortOrder: i })));
    }
    return f;
  });
  await registrarAuditoria({
    userId: caller?.id ?? null,
    accion: d.isLive ? 'en_vivo.activar' : 'en_vivo.desactivar',
    entidad: 'en_vivo',
    entidadId: '1',
    detalle: d.isLive ? d.streams.map((t) => t.platform).join(', ') : null,
  });
  return c.json({ estado: fila, transmisiones: d.streams });
});

// ---------- Datos del ministerio (contacto y redes) ----------

gestionRoutes.get('/sitio', requirePermission(PERMISO), async (c) => {
  const [fila] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'site.info'));
  const v = (fila?.value ?? {}) as Record<string, unknown> & { redes?: Record<string, string> };
  return c.json({
    datos: {
      whatsapp: String(v.whatsapp ?? ''),
      email: String(v.email ?? ''),
      address: String(v.address ?? ''),
      city: String(v.city ?? ''),
      redes: {
        youtube: v.redes?.youtube ?? '',
        tiktok: v.redes?.tiktok ?? '',
        facebook: v.redes?.facebook ?? '',
        appAndroid: v.redes?.appAndroid ?? '',
      },
    },
  });
});

gestionRoutes.put('/sitio', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = datosMinisterioSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [fila] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'site.info'));
  // Se conserva lo que no se edita aquí (misión e historia)
  const previo = (fila?.value ?? {}) as Record<string, unknown>;
  const valor = { ...previo, ...parsed.data, whatsappDisplay: parsed.data.whatsapp };
  await db
    .insert(siteSettings)
    .values({ key: 'site.info', value: valor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: valor, updatedAt: new Date() } });
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'sitio.editar', entidad: 'sitio', entidadId: 'site.info', detalle: 'Datos del ministerio' });
  return c.json({ datos: parsed.data });
});

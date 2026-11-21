import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import sharp from 'sharp';
import { areaSchema, heroSchema, personaSchema } from '@luz/shared';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { errorValidacion } from '../../lib/validar.js';
import { db } from '../../db/index.js';
import { areaGallery, areas, heroSlides, people } from '../../db/schema.js';

// Contenido de la web pública (permiso contenido:editar): portada, áreas y personas.
// Las imágenes se guardan en uploads/contenido y se sirven desde /imagenes/:nombre.
export const contenidoRoutes = new Hono();

const PERMISO = 'contenido:editar';
const CARPETA = join(process.cwd(), 'uploads', 'contenido');
const FORMATOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES_ORIGEN = 12 * 1024 * 1024;
const NOMBRE_VALIDO = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

const urlImagen = (nombre: string) => `/api/v1/contenido/imagenes/${nombre}`;

// ---------- Imágenes ----------

// Pública: la web muestra estas imágenes a cualquier visitante.
contenidoRoutes.get('/imagenes/:nombre', async (c) => {
  const nombre = c.req.param('nombre') as string;
  if (!NOMBRE_VALIDO.test(nombre)) return c.json({ error: 'no_encontrado' }, 404);
  const ext = nombre.split('.').pop()!;
  const tipo = Object.entries(FORMATOS).find(([, e]) => e === ext)![0];
  try {
    const bytes = await readFile(join(CARPETA, nombre));
    return new Response(bytes, { headers: { 'Content-Type': tipo, 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return c.json({ error: 'no_encontrado' }, 404);
  }
});

// Sube una imagen y la optimiza en el servidor: recorte centrado a la proporción del campo,
// reducción al ancho máximo y compresión JPEG. Así ninguna foto llega sin procesar.
contenidoRoutes.post('/imagenes', requirePermission(PERMISO), async (c) => {
  const body = await c.req.parseBody();
  const archivo = body['imagen'];
  if (!(archivo instanceof File)) return c.json({ error: 'validacion', campo: 'imagen', message: 'Selecciona una imagen.' }, 422);
  if (!FORMATOS[archivo.type]) return c.json({ error: 'validacion', campo: 'imagen', message: 'La imagen debe ser JPG, PNG o WebP.' }, 422);
  if (archivo.size > MAX_BYTES_ORIGEN) return c.json({ error: 'validacion', campo: 'imagen', message: 'La imagen original no puede pesar más de 12 MB.' }, 422);

  const ratio = Math.min(3, Math.max(0.3, Number(body['ratio']) || 16 / 9));
  const maxAncho = Math.min(2400, Math.max(200, Math.round(Number(body['maxAncho']) || 1600)));

  const entrada = Buffer.from(await archivo.arrayBuffer());
  let ancho: number;
  let alto: number;
  try {
    const meta = await sharp(entrada).rotate().metadata();
    ancho = meta.width ?? 0;
    alto = meta.height ?? 0;
    if (!ancho || !alto) throw new Error('sin dimensiones');
  } catch {
    return c.json({ error: 'validacion', campo: 'imagen', message: 'El archivo no es una imagen válida.' }, 422);
  }

  // Recorte centrado con la proporción pedida
  let recW = ancho;
  let recH = Math.round(ancho / ratio);
  if (recH > alto) {
    recH = alto;
    recW = Math.round(alto * ratio);
  }
  const izquierda = Math.floor((ancho - recW) / 2);
  const arriba = Math.floor((alto - recH) / 2);
  const anchoSalida = Math.min(maxAncho, recW);

  const salida = await sharp(entrada)
    .rotate()
    .extract({ left: izquierda, top: arriba, width: recW, height: recH })
    .resize({ width: anchoSalida })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();

  const nombre = `${randomUUID()}.jpg`;
  await mkdir(CARPETA, { recursive: true });
  await writeFile(join(CARPETA, nombre), salida);
  return c.json({ url: urlImagen(nombre), ancho: anchoSalida, bytes: salida.length }, 201);
});

// ---------- Portada (carrusel) ----------

contenidoRoutes.get('/hero', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(heroSlides).orderBy(asc(heroSlides.sortOrder), asc(heroSlides.createdAt));
  return c.json({ slides: rows });
});

contenidoRoutes.post('/hero', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = heroSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const { ghost, ...resto } = parsed.data;
  const [fila] = await db.insert(heroSlides).values({ ...resto, ghost }).returning();

  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'hero.crear', entidad: 'hero', entidadId: fila.id, detalle: fila.title });
  return c.json({ slide: fila }, 201);
});

contenidoRoutes.patch('/hero/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = heroSchema.partial().safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [actual] = await db.select().from(heroSlides).where(eq(heroSlides.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);

  const [fila] = await db
    .update(heroSlides)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(heroSlides.id, id))
    .returning();

  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'hero.editar', entidad: 'hero', entidadId: id, detalle: fila.title });
  return c.json({ slide: fila });
});

contenidoRoutes.delete('/hero/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(heroSlides).where(eq(heroSlides.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);

  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'hero.eliminar', entidad: 'hero', entidadId: id, detalle: borrada.title });
  return c.json({ ok: true });
});

// ---------- Áreas ----------

contenidoRoutes.get('/areas', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(areas).orderBy(asc(areas.sortOrder), asc(areas.name));
  const fotos = await db.select({ areaId: areaGallery.areaId }).from(areaGallery);
  const conteo = new Map<string, number>();
  for (const f of fotos) conteo.set(f.areaId, (conteo.get(f.areaId) ?? 0) + 1);
  return c.json({ areas: rows.map((a) => ({ ...a, fotosGaleria: conteo.get(a.id) ?? 0 })) });
});

contenidoRoutes.get('/areas/:id', requirePermission(PERMISO), async (c) => {
  const id = c.req.param('id') as string;
  const [area] = await db.select().from(areas).where(eq(areas.id, id));
  if (!area) return c.json({ error: 'no_encontrado' }, 404);
  const galeria = await db
    .select()
    .from(areaGallery)
    .where(eq(areaGallery.areaId, id))
    .orderBy(asc(areaGallery.sortOrder), asc(areaGallery.createdAt));
  return c.json({ area: { ...area, galeria } });
});

contenidoRoutes.post('/areas', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = areaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);

  const [existente] = await db.select({ id: areas.id }).from(areas).where(eq(areas.slug, parsed.data.slug));
  if (existente) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe un área con ese enlace.' }, 409);

  const [fila] = await db.insert(areas).values(parsed.data).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'area.crear', entidad: 'area', entidadId: fila.id, detalle: fila.name });
  return c.json({ area: fila }, 201);
});

contenidoRoutes.patch('/areas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = areaSchema.partial().safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [actual] = await db.select().from(areas).where(eq(areas.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);

  if (parsed.data.slug && parsed.data.slug !== actual.slug) {
    const [otra] = await db.select({ id: areas.id }).from(areas).where(eq(areas.slug, parsed.data.slug));
    if (otra) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe un área con ese enlace.' }, 409);
  }

  const [fila] = await db.update(areas).set({ ...parsed.data, updatedAt: new Date() }).where(eq(areas.id, id)).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'area.editar', entidad: 'area', entidadId: id, detalle: fila.name });
  return c.json({ area: fila });
});

contenidoRoutes.delete('/areas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(areas).where(eq(areas.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'area.eliminar', entidad: 'area', entidadId: id, detalle: borrada.name });
  return c.json({ ok: true });
});

// Galería de la plantilla "texto + galería"
contenidoRoutes.post('/areas/:id/galeria', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const body = (await c.req.json<{ imageUrl?: string; caption?: string | null }>().catch(() => ({}))) as { imageUrl?: string; caption?: string | null };
  if (!body.imageUrl || !body.imageUrl.startsWith('/api/v1/contenido/imagenes/')) {
    return c.json({ error: 'validacion', campo: 'imageUrl', message: 'Sube una imagen para la galería.' }, 422);
  }
  const [area] = await db.select({ id: areas.id, name: areas.name }).from(areas).where(eq(areas.id, id));
  if (!area) return c.json({ error: 'no_encontrado' }, 404);

  const existentes = await db.select({ id: areaGallery.id }).from(areaGallery).where(eq(areaGallery.areaId, id));
  const [foto] = await db
    .insert(areaGallery)
    .values({ areaId: id, imageUrl: body.imageUrl, caption: body.caption?.trim() || null, sortOrder: existentes.length })
    .returning();

  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'area.galeria.agregar', entidad: 'area', entidadId: id, detalle: area.name });
  return c.json({ foto }, 201);
});

contenidoRoutes.delete('/areas/:id/galeria/:fotoId', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const fotoId = c.req.param('fotoId') as string;
  const [borrada] = await db
    .delete(areaGallery)
    .where(eq(areaGallery.id, fotoId))
    .returning();
  if (!borrada || borrada.areaId !== id) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'area.galeria.quitar', entidad: 'area', entidadId: id, detalle: null });
  return c.json({ ok: true });
});

// ---------- Personas (predicadores, autores y equipo) ----------

contenidoRoutes.get('/personas', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(people).orderBy(asc(people.sortOrder), asc(people.name));
  return c.json({ personas: rows });
});

contenidoRoutes.post('/personas', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = personaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [fila] = await db.insert(people).values(parsed.data).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'persona.crear', entidad: 'persona', entidadId: fila.id, detalle: fila.name });
  return c.json({ persona: fila }, 201);
});

contenidoRoutes.patch('/personas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = personaSchema.partial().safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [fila] = await db
    .update(people)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(people.id, id))
    .returning();
  if (!fila) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'persona.editar', entidad: 'persona', entidadId: id, detalle: fila.name });
  return c.json({ persona: fila });
});

contenidoRoutes.delete('/personas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(people).where(eq(people.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'persona.eliminar', entidad: 'persona', entidadId: id, detalle: borrada.name });
  return c.json({ ok: true });
});

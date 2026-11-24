import { Hono } from 'hono';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { emisoraSchema, franjaSchema, programaSchema } from '@luz/shared';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { quitarTransmision } from './radio-sync.js';
import { errorValidacion } from '../../lib/validar.js';
import { db } from '../../db/index.js';
import { areas, programSlots, programs, stations } from '../../db/schema.js';

// Emisoras y programación semanal (permiso estaciones:todas). Sin transmisión todavía.
// Reglas (docs/DATABASE.md §3): una sola principal; máximo una emisora externa.
export const radioRoutes = new Hono();
const PERMISO = 'estaciones:todas';

async function violaReglas(id: string | null, d: { isMain: boolean; kind: 'own' | 'external' }) {
  if (d.isMain) {
    const otras = await db
      .select({ id: stations.id })
      .from(stations)
      .where(and(eq(stations.isMain, true), id ? ne(stations.id, id) : undefined));
    if (otras.length) return { error: 'validacion', campo: 'isMain', message: 'Ya hay una emisora principal. Quítale esa marca antes.' };
  }
  if (d.kind === 'external') {
    const otras = await db
      .select({ id: stations.id })
      .from(stations)
      .where(and(eq(stations.kind, 'external'), id ? ne(stations.id, id) : undefined));
    if (otras.length) return { error: 'validacion', campo: 'kind', message: 'Solo puede haber una emisora externa.' };
  }
  return null;
}

async function areaExiste(areaId: string | null) {
  if (!areaId) return null;
  const [a] = await db.select({ id: areas.id }).from(areas).where(eq(areas.id, areaId));
  return a ? null : { error: 'validacion', campo: 'areaId', message: 'El área elegida ya no existe.' };
}

radioRoutes.get('/emisoras', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(stations).orderBy(asc(stations.sortOrder), asc(stations.name));
  return c.json({ emisoras: rows });
});

radioRoutes.post('/emisoras', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = emisoraSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const dup = await db.select({ id: stations.id }).from(stations).where(eq(stations.slug, d.slug));
  if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una emisora con ese enlace.' }, 409);
  const error = (await violaReglas(null, d)) ?? (await areaExiste(d.areaId));
  if (error) return c.json(error, 422);
  const [fila] = await db.insert(stations).values(d).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'emisora.crear', entidad: 'emisora', entidadId: fila.id, detalle: fila.name });
  return c.json({ emisora: fila }, 201);
});

radioRoutes.patch('/emisoras/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = emisoraSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [actual] = await db.select().from(stations).where(eq(stations.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  if (d.slug !== actual.slug) {
    const dup = await db.select({ id: stations.id }).from(stations).where(eq(stations.slug, d.slug));
    if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una emisora con ese enlace.' }, 409);
  }
  const error = (await violaReglas(id, d)) ?? (await areaExiste(d.areaId));
  if (error) return c.json(error, 422);
  const [fila] = await db.update(stations).set({ ...d, updatedAt: new Date() }).where(eq(stations.id, id)).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'emisora.editar', entidad: 'emisora', entidadId: id, detalle: fila.name });
  return c.json({ emisora: fila });
});

radioRoutes.delete('/emisoras/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.select().from(stations).where(eq(stations.id, id));
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  if (borrada.isMain) return c.json({ error: 'validacion', message: 'No se puede eliminar la emisora principal.' }, 422);
  await db.delete(stations).where(eq(stations.id, id));
  // Quita la estación de la radio-api (los audios quedan en disco de la radio)
  if (borrada.mountPoint) await quitarTransmision(borrada.slug);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'emisora.eliminar', entidad: 'emisora', entidadId: id, detalle: borrada.name });
  return c.json({ ok: true });
});

// ---------- Programas y franjas ----------

radioRoutes.get('/emisoras/:id/programas', requirePermission(PERMISO), async (c) => {
  const id = c.req.param('id') as string;
  const progs = await db.select().from(programs).where(eq(programs.stationId, id)).orderBy(asc(programs.name));
  const ids = progs.map((p) => p.id);
  const franjas = ids.length
    ? await db.select().from(programSlots).where(inArray(programSlots.programId, ids)).orderBy(asc(programSlots.dayOfWeek), asc(programSlots.startTime))
    : [];
  return c.json({
    programas: progs.map((p) => ({ ...p, franjas: franjas.filter((f) => f.programId === p.id) })),
  });
});

radioRoutes.post('/emisoras/:id/programas', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = programaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [emisora] = await db.select({ id: stations.id }).from(stations).where(eq(stations.id, id));
  if (!emisora) return c.json({ error: 'no_encontrado' }, 404);
  const error = await areaExiste(parsed.data.areaId);
  if (error) return c.json(error, 422);
  const [fila] = await db.insert(programs).values({ ...parsed.data, stationId: id }).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'programa.crear', entidad: 'programa', entidadId: fila.id, detalle: fila.name });
  return c.json({ programa: fila }, 201);
});

radioRoutes.patch('/programas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = programaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const error = await areaExiste(parsed.data.areaId);
  if (error) return c.json(error, 422);
  const [fila] = await db.update(programs).set(parsed.data).where(eq(programs.id, id)).returning();
  if (!fila) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'programa.editar', entidad: 'programa', entidadId: id, detalle: fila.name });
  return c.json({ programa: fila });
});

radioRoutes.delete('/programas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrado] = await db.delete(programs).where(eq(programs.id, id)).returning();
  if (!borrado) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'programa.eliminar', entidad: 'programa', entidadId: id, detalle: borrado.name });
  return c.json({ ok: true });
});

radioRoutes.post('/programas/:id/franjas', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = franjaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const [programa] = await db.select({ id: programs.id, name: programs.name }).from(programs).where(eq(programs.id, id));
  if (!programa) return c.json({ error: 'no_encontrado' }, 404);
  // No se permiten franjas que se solapen el mismo día
  const existentes = await db.select().from(programSlots).where(eq(programSlots.programId, id));
  const d = parsed.data;
  const solapa = existentes.some((f) => f.dayOfWeek === d.dayOfWeek && d.startTime < f.endTime && f.startTime < d.endTime);
  if (solapa) return c.json({ error: 'validacion', campo: 'startTime', message: 'Esa franja se cruza con otra del mismo día.' }, 422);
  const [fila] = await db
    .insert(programSlots)
    .values({ programId: id, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime, isLive: d.isLive })
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'franja.crear', entidad: 'programa', entidadId: id, detalle: programa.name });
  return c.json({ franja: fila }, 201);
});

radioRoutes.delete('/franjas/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(programSlots).where(eq(programSlots.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'franja.eliminar', entidad: 'programa', entidadId: borrada.programId, detalle: null });
  return c.json({ ok: true });
});

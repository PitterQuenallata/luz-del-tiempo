import { Context, Hono } from 'hono';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { estacionSchema, franjaSchema, programaSchema, radioSchema } from '@luz/shared';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { enAirePorSlugRadio as enAirePorSlug, quitarTransmision, radioEncendida, sincronizarTransmision } from './radio-sync.js';
import { errorValidacion } from '../../lib/validar.js';
import { db } from '../../db/index.js';
import { areas, programSlots, programs, radios, stationPlaylists, stations } from '../../db/schema.js';
import { esAdmin, estacionParaRuta, puedeGestionarEmisora, requireEstacionesAcceso } from './acceso.js';

// Emisoras (contenedores) y sus estaciones. Solo admin y superadmin crean emisoras y estaciones.
// Cada estación tiene su programación semanal (programas y franjas).
export const radioRoutes = new Hono();
const PERMISO = 'estaciones:todas';

async function areaExiste(areaId: string | null) {
  if (!areaId) return null;
  const [a] = await db.select({ id: areas.id }).from(areas).where(eq(areas.id, areaId));
  return a ? null : { error: 'validacion', campo: 'areaId', message: 'El área elegida ya no existe.' };
}

async function slugLibre(slug: string, excepto: string | null) {
  const usados = await db.select({ id: stations.id }).from(stations).where(and(eq(stations.slug, slug), excepto ? ne(stations.id, excepto) : undefined));
  const radio = await db.select({ id: radios.id }).from(radios).where(eq(radios.slug, slug));
  return usados.length === 0 && radio.length === 0;
}

// ---------- Emisoras (contenedores) ----------

radioRoutes.get('/emisoras', requireEstacionesAcceso(), async (c) => {
  const user = (await loadCurrentUser(c.req.raw.headers))!;
  const todas = await esAdmin(user);
  const filas = await db.select().from(radios).orderBy(asc(radios.sortOrder), asc(radios.name));
  const visibles = todas ? filas : filas.filter((r) => r.ownerUserId === user.id);
  const estaciones = await db.select().from(stations).orderBy(asc(stations.sortOrder), asc(stations.name));
  return c.json({
    emisoras: visibles.map((r) => ({
      ...r,
      estaciones: estaciones
        .filter((s) => s.radioId === r.id)
        .map((s) => ({ id: s.id, name: s.name, slug: s.slug, status: s.status, autodjEnabled: s.autodjEnabled, mountPoint: s.mountPoint })),
    })),
  });
});

radioRoutes.post('/emisoras', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = radioSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  if (!(await slugLibre(d.slug, null))) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe un espacio con ese enlace.' }, 409);
  if (d.isMain) {
    const otra = await db.select({ id: radios.id }).from(radios).where(eq(radios.isMain, true));
    if (otra.length) return c.json({ error: 'validacion', campo: 'isMain', message: 'Ya hay una emisora principal.' }, 422);
  }
  const error = await areaExiste(d.areaId);
  if (error) return c.json(error, 422);
  const [fila] = await db.insert(radios).values({ ...d, ownerUserId: d.kind === 'external' ? d.ownerUserId ?? null : null }).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'emisora.crear', entidad: 'emisora', entidadId: fila.id, detalle: fila.name });
  return c.json({ emisora: fila }, 201);
});

radioRoutes.patch('/emisoras/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const parsed = radioSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [actual] = await db.select().from(radios).where(eq(radios.id, id));
  if (!actual) return c.json({ error: 'no_encontrado' }, 404);
  if (d.slug !== actual.slug && !(await slugLibre(d.slug, null))) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe un espacio con ese enlace.' }, 409);
  if (d.isMain) {
    const otra = await db.select({ id: radios.id }).from(radios).where(and(eq(radios.isMain, true), ne(radios.id, id)));
    if (otra.length) return c.json({ error: 'validacion', campo: 'isMain', message: 'Ya hay una emisora principal.' }, 422);
  }
  const error = await areaExiste(d.areaId);
  if (error) return c.json(error, 422);
  const [fila] = await db
    .update(radios)
    .set({ ...d, ownerUserId: d.kind === 'external' ? d.ownerUserId ?? null : null, updatedAt: new Date() })
    .where(eq(radios.id, id))
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'emisora.editar', entidad: 'emisora', entidadId: id, detalle: fila.name });
  // El estado de la emisora decide si sus estaciones suenan: se empuja a la radio
  for (const e of await db.select().from(stations).where(eq(stations.radioId, id))) if (e.mountPoint && e.livePasswordEnc) await sincronizarTransmision(e);
  return c.json({ emisora: fila });
});

radioRoutes.delete('/emisoras/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.select().from(radios).where(eq(radios.id, id));
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  if (borrada.isMain) return c.json({ error: 'validacion', message: 'No se puede eliminar la emisora principal.' }, 422);
  // Quita sus estaciones de la radio (los audios quedan en disco) y luego la emisora (las estaciones se borran en cascada)
  for (const e of await db.select().from(stations).where(eq(stations.radioId, id))) if (e.mountPoint) await quitarTransmision(e.slug);
  await db.delete(radios).where(eq(radios.id, id));
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'emisora.eliminar', entidad: 'emisora', entidadId: id, detalle: borrada.name });
  return c.json({ ok: true });
});

// ---------- Estaciones ----------

function vistaEstacion(e: typeof stations.$inferSelect, enAire: Map<string, { online: boolean; listeners: number; title: string | null }>, radioEnc: boolean) {
  const { livePasswordEnc: _secreto, ...resto } = e;
  return {
    ...resto,
    transmision: {
      mountPoint: e.mountPoint,
      livePasswordConfigurada: Boolean(_secreto),
      encendida: e.encendida,
      radioEncendida: radioEnc,
      enAire: enAire.get(e.slug)?.online ?? false,
      oyentes: enAire.get(e.slug)?.listeners ?? 0,
      autodjEnabled: e.autodjEnabled,
    },
  };
}

radioRoutes.get('/estaciones', requireEstacionesAcceso(), async (c) => {
  const user = (await loadCurrentUser(c.req.raw.headers))!;
  const filas = await db.select().from(stations).orderBy(asc(stations.sortOrder), asc(stations.name));
  const todas = await esAdmin(user);
  const propias = todas ? filas : (await Promise.all(filas.map(async (s) => ((await puedeGestionarEmisora(user, s.radioId)) ? s : null)))).filter((s): s is typeof filas[number] => s !== null);
  const enAire = await enAirePorSlug();
  const radioEnc = await radioEncendida();
  return c.json({ estaciones: propias.map((s) => vistaEstacion(s, enAire, radioEnc)), emisoras: [] });
});

radioRoutes.post('/estaciones', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = estacionSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [emisora] = await db.select().from(radios).where(eq(radios.id, d.radioId));
  if (!emisora) return c.json({ error: 'validacion', campo: 'radioId', message: 'La emisora elegida ya no existe.' }, 422);
  if (emisora.kind === 'external') {
    const yaTiene = await db.select({ id: stations.id }).from(stations).where(eq(stations.radioId, emisora.id));
    if (yaTiene.length) return c.json({ error: 'validacion', campo: 'radioId', message: 'Una emisora de un tercero tiene una sola estación.' }, 422);
  }
  if (!(await slugLibre(d.slug, null))) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una estación o emisora con ese enlace.' }, 409);
  // Punto de transmisión (/enlace) automático si está libre; la contraseña del locutor se pone en Configuración.
  let mountPoint: string | null = null;
  const ocupado = await db.select({ id: stations.id }).from(stations).where(eq(stations.mountPoint, `/${d.slug}`));
  if (!ocupado.length) mountPoint = `/${d.slug}`;
  const [fila] = await db
    .insert(stations)
    .values({
      radioId: emisora.id,
      kind: emisora.kind,
      slug: d.slug,
      name: d.name,
      status: d.status,
      autodjEnabled: d.autodjEnabled,
      visibleInMinistry: d.visibleInMinistry,
      sortOrder: d.sortOrder,
      mountPoint,
    })
    .returning();
  // Crear AutoDJ: la estación nace con su propia lista de música (vacía, para llenar). Sin AutoDJ, no tiene ninguna.
  if (d.autodjEnabled) {
    await db.insert(stationPlaylists).values({ stationId: fila.id, name: 'Música automática', mode: 'rotacion', weight: 50, shuffle: true, isActive: true });
  }
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'estacion.crear', entidad: 'estacion', entidadId: fila.id, detalle: `${emisora.name} · ${fila.name}` });
  return c.json({ estacion: fila }, 201);
});

radioRoutes.patch('/estaciones/:id', requireEstacionesAcceso(), async (c) => {
  const id = c.req.param('id') as string;
  const acceso = await estacionParaRuta(c, id);
  if (acceso instanceof Response) return acceso;
  const { estacion: actual, user } = acceso;
  const todas = await esAdmin(user);
  const parsed = estacionSchema.partial().safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  // Un responsable de tercero solo cambia el nombre y el AutoDJ; lo demás lo decide la administración
  const cambiaReservado =
    (d.radioId !== undefined && d.radioId !== actual.radioId) ||
    (d.status !== undefined && d.status !== actual.status) ||
    (d.slug !== undefined && d.slug !== actual.slug) ||
    (d.visibleInMinistry !== undefined && d.visibleInMinistry !== actual.visibleInMinistry) ||
    (d.sortOrder !== undefined && d.sortOrder !== actual.sortOrder);
  if (!todas && cambiaReservado) return c.json({ error: 'sin_permiso', message: 'Solo la administración cambia el estado, el enlace o la visibilidad de una estación.' }, 403);
  const permitidos = todas ? d : { name: d.name, autodjEnabled: d.autodjEnabled };
  if (d.slug && d.slug !== actual.slug && !(await slugLibre(d.slug, id))) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una estación o emisora con ese enlace.' }, 409);
  const [fila] = await db
    .update(stations)
    .set({ ...permitidos, updatedAt: new Date() })
    .where(eq(stations.id, id))
    .returning();
  await registrarAuditoria({ userId: user.id, accion: 'estacion.editar', entidad: 'estacion', entidadId: id, detalle: fila.name });
  if (fila.mountPoint && fila.livePasswordEnc) await sincronizarTransmision(fila);
  return c.json({ estacion: fila });
});

radioRoutes.delete('/estaciones/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.select().from(stations).where(eq(stations.id, id));
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await db.delete(stations).where(eq(stations.id, id));
  // Quita la estación de la radio-api (los audios quedan en disco)
  if (borrada.mountPoint) await quitarTransmision(borrada.slug);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'estacion.eliminar', entidad: 'estacion', entidadId: id, detalle: borrada.name });
  return c.json({ ok: true });
});

// ---------- Programas y franjas (de cada estación) ----------

radioRoutes.get('/estaciones/:id/programas', requireEstacionesAcceso(), async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const id = acceso.estacion.id;
  const progs = await db.select().from(programs).where(eq(programs.stationId, id)).orderBy(asc(programs.name));
  const ids = progs.map((p) => p.id);
  const franjas = ids.length
    ? await db.select().from(programSlots).where(inArray(programSlots.programId, ids)).orderBy(asc(programSlots.dayOfWeek), asc(programSlots.startTime))
    : [];
  return c.json({ programas: progs.map((p) => ({ ...p, franjas: franjas.filter((f) => f.programId === p.id) })) });
});

radioRoutes.post('/estaciones/:id/programas', requireEstacionesAcceso(), async (c) => {
  const acceso = await estacionParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const parsed = programaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const error = await areaExiste(parsed.data.areaId);
  if (error) return c.json(error, 422);
  const [fila] = await db.insert(programs).values({ ...parsed.data, stationId: acceso.estacion.id }).returning();
  await registrarAuditoria({ userId: acceso.user.id, accion: 'programa.crear', entidad: 'programa', entidadId: fila.id, detalle: fila.name });
  return c.json({ programa: fila }, 201);
});

/** Carga un programa y comprueba que el usuario puede tocar su estación. */
async function programaParaRuta(c: Context, id: string) {
  const [p] = await db.select().from(programs).where(eq(programs.id, id));
  if (!p) return c.json({ error: 'no_encontrado' }, 404) as unknown as Response;
  const acceso = await estacionParaRuta(c, p.stationId);
  if (acceso instanceof Response) return acceso;
  return { programa: p, user: acceso.user };
}

radioRoutes.patch('/programas/:id', requireEstacionesAcceso(), async (c) => {
  const acceso = await programaParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const parsed = programaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const error = await areaExiste(parsed.data.areaId);
  if (error) return c.json(error, 422);
  const [fila] = await db.update(programs).set(parsed.data).where(eq(programs.id, acceso.programa.id)).returning();
  await registrarAuditoria({ userId: acceso.user.id, accion: 'programa.editar', entidad: 'programa', entidadId: fila.id, detalle: fila.name });
  return c.json({ programa: fila });
});

radioRoutes.delete('/programas/:id', requireEstacionesAcceso(), async (c) => {
  const acceso = await programaParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  await db.delete(programs).where(eq(programs.id, acceso.programa.id));
  await registrarAuditoria({ userId: acceso.user.id, accion: 'programa.eliminar', entidad: 'programa', entidadId: acceso.programa.id, detalle: acceso.programa.name });
  return c.json({ ok: true });
});

radioRoutes.post('/programas/:id/franjas', requireEstacionesAcceso(), async (c) => {
  const acceso = await programaParaRuta(c, c.req.param('id') as string);
  if (acceso instanceof Response) return acceso;
  const parsed = franjaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const id = acceso.programa.id;
  // No se permiten franjas que se solapen el mismo día (en toda la estación)
  const mismaEstacion = await db.select({ id: programs.id }).from(programs).where(eq(programs.stationId, acceso.programa.stationId));
  const existentes = await db
    .select()
    .from(programSlots)
    .where(inArray(programSlots.programId, mismaEstacion.map((p) => p.id)));
  const d = parsed.data;
  const solapa = existentes.some((f) => f.dayOfWeek === d.dayOfWeek && d.startTime < f.endTime && f.startTime < d.endTime);
  if (solapa) return c.json({ error: 'validacion', campo: 'startTime', message: 'Esa franja se cruza con otra del mismo día en esta estación.' }, 422);
  const [fila] = await db
    .insert(programSlots)
    .values({ programId: id, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime, isLive: d.isLive })
    .returning();
  await registrarAuditoria({ userId: acceso.user.id, accion: 'franja.crear', entidad: 'programa', entidadId: id, detalle: acceso.programa.name });
  return c.json({ franja: fila }, 201);
});

radioRoutes.delete('/franjas/:id', requireEstacionesAcceso(), async (c) => {
  const id = c.req.param('id') as string;
  const [f] = await db.select().from(programSlots).where(eq(programSlots.id, id));
  if (!f) return c.json({ error: 'no_encontrado' }, 404);
  const acceso = await programaParaRuta(c, f.programId);
  if (acceso instanceof Response) return acceso;
  await db.delete(programSlots).where(eq(programSlots.id, id));
  await registrarAuditoria({ userId: acceso.user.id, accion: 'franja.eliminar', entidad: 'programa', entidadId: f.programId, detalle: null });
  return c.json({ ok: true });
});


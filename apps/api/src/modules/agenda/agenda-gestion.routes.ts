import { Hono } from 'hono';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { actividadSchema, inscripcionManualSchema, type ActividadInput } from '@luz/shared';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { errorValidacion } from '../../lib/validar.js';
import { db } from '../../db/index.js';
import {
  activities,
  activityAreas,
  activityChannels,
  activityGallery,
  activityPeople,
  activityProgramItems,
  activitySessions,
  areas,
  locations,
  people,
  registrations,
} from '../../db/schema.js';

// Agenda en el panel: actividades, sesiones, programa, personas, canales, galería, sedes e inscritos.
// Todo requiere el permiso contenido:editar (mismo que noticias y videos).
export const agendaGestionRoutes = new Hono();
const PERMISO = 'contenido:editar';

const aFecha = (texto: string | null | undefined) => (texto ? new Date(texto) : null);
const aHora = (t: string | null) => (t ? t.slice(0, 5) : null);

type Filas = { id: string }[];

// ¿Existen todos estos ids en la tabla? Devuelve el error de validación o null.
async function faltan(tabla: 'areas' | 'people' | 'locations', ids: string[], campo: string, mensaje: string) {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return null;
  const tablaReal = tabla === 'areas' ? areas : tabla === 'people' ? people : locations;
  const encontrados: Filas = await db.select({ id: tablaReal.id }).from(tablaReal).where(inArray(tablaReal.id, unicos));
  return encontrados.length === unicos.length ? null : { error: 'validacion', campo, message: mensaje };
}

// Actividad completa tal como la edita el panel
async function detalleGestion(id: string) {
  const [a] = await db.select().from(activities).where(eq(activities.id, id));
  if (!a) return null;
  const [areasFilas, sesiones, personas, canales, galeria, [total]] = await Promise.all([
    db.select({ areaId: activityAreas.areaId }).from(activityAreas).where(eq(activityAreas.activityId, id)),
    db.select().from(activitySessions).where(eq(activitySessions.activityId, id)).orderBy(asc(activitySessions.startsAt), asc(activitySessions.sortOrder)),
    db.select().from(activityPeople).where(eq(activityPeople.activityId, id)).orderBy(asc(activityPeople.sortOrder)),
    db.select().from(activityChannels).where(eq(activityChannels.activityId, id)).orderBy(asc(activityChannels.sortOrder)),
    db.select().from(activityGallery).where(eq(activityGallery.activityId, id)).orderBy(asc(activityGallery.sortOrder)),
    db.select({ n: sql<number>`count(*)::int` }).from(registrations).where(eq(registrations.activityId, id)),
  ]);
  const programa = sesiones.length
    ? await db
        .select()
        .from(activityProgramItems)
        .where(inArray(activityProgramItems.sessionId, sesiones.map((s) => s.id)))
        .orderBy(asc(activityProgramItems.sortOrder))
    : [];

  return {
    id: a.id,
    slug: a.slug,
    kind: a.kind,
    title: a.title,
    summary: a.summary,
    content: a.content,
    coverUrl: a.coverUrl,
    report: a.report,
    language: a.language,
    isVirtual: a.isVirtual,
    isFree: a.isFree,
    priceAmount: a.priceAmount,
    priceNote: a.priceNote,
    capacity: a.capacity,
    qrUrl: a.qrUrl,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    areaIds: areasFilas.map((f) => f.areaId),
    sesiones: sesiones.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt?.toISOString() ?? null,
      locationId: s.locationId,
      locationNote: s.locationNote,
      programa: programa
        .filter((p) => p.sessionId === s.id)
        .map((p) => ({
          startTime: aHora(p.startTime),
          durationMin: p.durationMin,
          title: p.title,
          description: p.description,
          personId: p.personId,
        })),
    })),
    personas: personas.map((p) => ({ personId: p.personId, role: p.role })),
    canales: canales.map((c) => ({ channel: c.channel, value: c.value ?? '', enabled: c.enabled })),
    galeria: galeria.map((g) => ({ imageUrl: g.imageUrl, caption: g.caption ?? '' })),
    inscritosTotal: total?.n ?? 0,
  };
}

// Guarda la actividad completa en una sola transacción (encabezado, sesiones, programa, personas, canales, galería)
async function guardarActividad(id: string | null, d: ActividadInput) {
  return db.transaction(async (tx) => {
    const valores = {
      slug: d.slug,
      kind: d.kind,
      title: d.title,
      summary: d.summary || null,
      content: d.content || null,
      coverUrl: d.coverUrl || null,
      report: d.report || null,
      language: d.language,
      isVirtual: d.isVirtual,
      isFree: d.isFree,
      priceAmount: d.isFree ? null : d.priceAmount,
      priceNote: d.priceNote || null,
      capacity: d.capacity,
      qrUrl: d.qrUrl || null,
      status: d.status,
      updatedAt: new Date(),
    };

    let actividadId = id;
    if (id) {
      await tx.update(activities).set(valores).where(eq(activities.id, id));
    } else {
      const [nueva] = await tx.insert(activities).values(valores).returning({ id: activities.id });
      actividadId = nueva.id;
    }
    const aId = actividadId as string;

    await tx.delete(activityAreas).where(eq(activityAreas.activityId, aId));
    if (d.areaIds.length) {
      await tx.insert(activityAreas).values([...new Set(d.areaIds)].map((areaId) => ({ activityId: aId, areaId })));
    }

    // Las sesiones se reemplazan completas; el programa se borra en cascada con ellas
    await tx.delete(activitySessions).where(eq(activitySessions.activityId, aId));
    for (const [i, s] of d.sesiones.entries()) {
      const [sesion] = await tx
        .insert(activitySessions)
        .values({
          activityId: aId,
          startsAt: new Date(s.startsAt),
          endsAt: aFecha(s.endsAt),
          locationId: s.locationId,
          locationNote: s.locationNote || null,
          sortOrder: i,
        })
        .returning({ id: activitySessions.id });
      if (s.programa.length) {
        await tx.insert(activityProgramItems).values(
          s.programa.map((p, j) => ({
            sessionId: sesion.id,
            startTime: p.startTime,
            durationMin: p.durationMin,
            title: p.title,
            description: p.description || null,
            personId: p.personId,
            sortOrder: j,
          })),
        );
      }
    }

    await tx.delete(activityPeople).where(eq(activityPeople.activityId, aId));
    if (d.personas.length) {
      await tx.insert(activityPeople).values(d.personas.map((p, i) => ({ activityId: aId, personId: p.personId, role: p.role, sortOrder: i })));
    }

    await tx.delete(activityChannels).where(eq(activityChannels.activityId, aId));
    if (d.canales.length) {
      await tx.insert(activityChannels).values(
        d.canales.map((c, i) => ({
          activityId: aId,
          channel: c.channel,
          value: c.channel === 'web' || c.channel === 'app' ? null : c.value || null,
          enabled: c.enabled,
          sortOrder: i,
        })),
      );
    }

    await tx.delete(activityGallery).where(eq(activityGallery.activityId, aId));
    if (d.galeria.length) {
      await tx.insert(activityGallery).values(d.galeria.map((g, i) => ({ activityId: aId, imageUrl: g.imageUrl, caption: g.caption || null, sortOrder: i })));
    }

    return aId;
  });
}

// Revisa que todas las referencias (áreas, sedes, personas) existan. Devuelve el error o null.
async function validarReferencias(d: ActividadInput) {
  const personasIds = [...d.personas.map((p) => p.personId), ...d.sesiones.flatMap((s) => s.programa.map((p) => p.personId).filter((x): x is string => Boolean(x)))];
  const sedesIds = d.sesiones.map((s) => s.locationId).filter((x): x is string => Boolean(x));
  return (
    (await faltan('areas', d.areaIds, 'areaIds', 'Una de las áreas elegidas ya no existe.')) ??
    (await faltan('locations', sedesIds, 'sesiones', 'Una de las sedes elegidas ya no existe.')) ??
    (await faltan('people', personasIds, 'personas', 'Una de las personas elegidas ya no existe.'))
  );
}

// ---------- Listado y ficha ----------

agendaGestionRoutes.get('/actividades', requirePermission(PERMISO), async (c) => {
  const filas = await db.select().from(activities).orderBy(desc(activities.updatedAt));
  const ids = filas.map((f) => f.id);
  const [sesiones, areasFilas, conteo] = ids.length
    ? await Promise.all([
        db.select().from(activitySessions).where(inArray(activitySessions.activityId, ids)),
        db.select().from(activityAreas).where(inArray(activityAreas.activityId, ids)),
        db
          .select({ activityId: registrations.activityId, n: sql<number>`count(*)::int` })
          .from(registrations)
          .where(inArray(registrations.activityId, ids))
          .groupBy(registrations.activityId),
      ])
    : [[], [], []];

  const lista = filas.map((a) => {
    const suyas = sesiones.filter((s) => s.activityId === a.id);
    const inicios = suyas.map((s) => s.startsAt.getTime());
    const fines = suyas.map((s) => (s.endsAt ?? s.startsAt).getTime());
    return {
      id: a.id,
      slug: a.slug,
      kind: a.kind,
      title: a.title,
      coverUrl: a.coverUrl,
      status: a.status,
      isFree: a.isFree,
      primeraFecha: inicios.length ? new Date(Math.min(...inicios)).toISOString() : null,
      ultimaFecha: fines.length ? new Date(Math.max(...fines)).toISOString() : null,
      sesiones: suyas.length,
      areaIds: areasFilas.filter((f) => f.activityId === a.id).map((f) => f.areaId),
      inscritos: conteo.find((x) => x.activityId === a.id)?.n ?? 0,
    };
  });
  return c.json({ actividades: lista });
});

agendaGestionRoutes.get('/actividades/:id', requirePermission(PERMISO), async (c) => {
  const detalle = await detalleGestion(c.req.param('id') as string);
  return detalle ? c.json({ actividad: detalle }) : c.json({ error: 'no_encontrado' }, 404);
});

agendaGestionRoutes.post('/actividades', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = actividadSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const dup = await db.select({ id: activities.id }).from(activities).where(eq(activities.slug, d.slug));
  if (dup.length) return c.json({ error: 'slug_existente', campo: 'slug', message: 'Ya existe una actividad con ese enlace.' }, 409);
  const ref = await validarReferencias(d);
  if (ref) return c.json(ref, 422);

  const id = await guardarActividad(null, d);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'actividad.crear', entidad: 'actividad', entidadId: id, detalle: d.title });
  return c.json({ actividad: await detalleGestion(id) }, 201);
});

agendaGestionRoutes.patch('/actividades/:id', requirePermission(PERMISO), async (c) => {
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
  const ref = await validarReferencias(d);
  if (ref) return c.json(ref, 422);

  await guardarActividad(id, d);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'actividad.editar', entidad: 'actividad', entidadId: id, detalle: d.title });
  return c.json({ actividad: await detalleGestion(id) });
});

agendaGestionRoutes.delete('/actividades/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(activities).where(eq(activities.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'actividad.eliminar', entidad: 'actividad', entidadId: id, detalle: borrada.title });
  return c.json({ ok: true });
});

// ---------- Sedes (lugares donde se realizan las sesiones) ----------

agendaGestionRoutes.get('/sedes', requirePermission(PERMISO), async (c) => {
  const rows = await db.select().from(locations).orderBy(asc(locations.name));
  return c.json({ sedes: rows });
});

const sedeCampos = (cuerpo: Record<string, unknown>) => ({
  name: String(cuerpo.name ?? '').trim(),
  address: String(cuerpo.address ?? '').trim() || null,
  city: String(cuerpo.city ?? '').trim() || null,
  mapUrl: String(cuerpo.mapUrl ?? '').trim() || null,
});

agendaGestionRoutes.post('/sedes', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const valores = sedeCampos((await c.req.json().catch(() => ({}))) as Record<string, unknown>);
  if (valores.name.length < 2) return c.json({ error: 'validacion', campo: 'name', message: 'Escribe el nombre de la sede.' }, 422);
  const [fila] = await db.insert(locations).values(valores).returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'sede.crear', entidad: 'sede', entidadId: fila.id, detalle: fila.name });
  return c.json({ sede: fila }, 201);
});

agendaGestionRoutes.patch('/sedes/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const valores = sedeCampos((await c.req.json().catch(() => ({}))) as Record<string, unknown>);
  if (valores.name.length < 2) return c.json({ error: 'validacion', campo: 'name', message: 'Escribe el nombre de la sede.' }, 422);
  const [fila] = await db.update(locations).set(valores).where(eq(locations.id, id)).returning();
  if (!fila) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'sede.editar', entidad: 'sede', entidadId: id, detalle: fila.name });
  return c.json({ sede: fila });
});

agendaGestionRoutes.delete('/sedes/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrada] = await db.delete(locations).where(eq(locations.id, id)).returning();
  if (!borrada) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'sede.eliminar', entidad: 'sede', entidadId: id, detalle: borrada.name });
  return c.json({ ok: true });
});

// ---------- Inscritos ----------

agendaGestionRoutes.get('/actividades/:id/inscritos', requirePermission(PERMISO), async (c) => {
  const id = c.req.param('id') as string;
  const rows = await db
    .select()
    .from(registrations)
    .where(eq(registrations.activityId, id))
    .orderBy(asc(registrations.fullName));
  return c.json({ inscritos: rows });
});

// Alta manual: alguien que llegó en persona o se inscribió por teléfono
agendaGestionRoutes.post('/actividades/:id/inscritos', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [actividad] = await db.select({ id: activities.id, title: activities.title }).from(activities).where(eq(activities.id, id));
  if (!actividad) return c.json({ error: 'no_encontrado' }, 404);
  const parsed = inscripcionManualSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const [fila] = await db
    .insert(registrations)
    .values({
      activityId: id,
      fullName: d.fullName,
      phoneCode: d.phone ? d.phoneCode : null,
      phone: d.phone || null,
      email: d.email || null,
      origin: 'manual',
      status: d.status,
      notes: d.notes || null,
    })
    .returning();
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'inscripcion.crear', entidad: 'inscripcion', entidadId: fila.id, detalle: `${d.fullName} · ${actividad.title}` });
  return c.json({ inscrito: fila }, 201);
});

agendaGestionRoutes.patch('/inscritos/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const cuerpo = (await c.req.json().catch(() => ({}))) as { status?: string };
  const estados = ['pendiente', 'confirmada', 'cancelada', 'asistio'];
  if (!cuerpo.status || !estados.includes(cuerpo.status)) return c.json({ error: 'validacion', campo: 'status', message: 'Estado no válido.' }, 422);
  const [fila] = await db
    .update(registrations)
    .set({ status: cuerpo.status as 'pendiente' | 'confirmada' | 'cancelada' | 'asistio' })
    .where(eq(registrations.id, id))
    .returning();
  if (!fila) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'inscripcion.editar', entidad: 'inscripcion', entidadId: id, detalle: `${fila.fullName}: ${fila.status}` });
  return c.json({ inscrito: fila });
});

agendaGestionRoutes.delete('/inscritos/:id', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const [borrado] = await db.delete(registrations).where(eq(registrations.id, id)).returning();
  if (!borrado) return c.json({ error: 'no_encontrado' }, 404);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'inscripcion.eliminar', entidad: 'inscripcion', entidadId: id, detalle: borrado.fullName });
  return c.json({ ok: true });
});

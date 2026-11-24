import { Hono } from 'hono';
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lte, or } from 'drizzle-orm';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { db } from '../../db/index.js';
import { broadcastSessions, stationBroadcasters, stations, users } from '../../db/schema.js';

// Lo que el panel ve y decide sobre el emisor de Windows: quién puede transmitir en cada emisora
// y quién está transmitiendo ahora (permiso estaciones:todas).
export const radioEmisorRoutes = new Hono();
const PERMISO = 'estaciones:todas';
/** Sin aviso del emisor durante este tiempo, la transmisión se da por terminada */
const VIGENCIA_MS = 90_000;

async function emisoraExiste(id: string) {
  const [e] = await db.select({ id: stations.id, name: stations.name }).from(stations).where(eq(stations.id, id));
  return e ?? null;
}

// Locutores autorizados de una emisora y usuarios del panel que se pueden agregar
radioEmisorRoutes.get('/emisoras/:id/locutores', requirePermission(PERMISO), async (c) => {
  const id = c.req.param('id') as string;
  if (!(await emisoraExiste(id))) return c.json({ error: 'no_encontrado' }, 404);
  const asignados = await db
    .select({ id: users.id, nombre: users.name, email: users.email })
    .from(stationBroadcasters)
    .innerJoin(users, eq(stationBroadcasters.userId, users.id))
    .where(eq(stationBroadcasters.stationId, id))
    .orderBy(asc(users.name));
  const candidatos = await db
    .select({ id: users.id, nombre: users.name, email: users.email })
    .from(users)
    .where(and(isNotNull(users.roleId), eq(users.isActive, true), isNull(users.deletedAt)))
    .orderBy(asc(users.name));
  return c.json({ asignados, candidatos });
});

radioEmisorRoutes.put('/emisoras/:id/locutores', requirePermission(PERMISO), async (c) => {
  const id = c.req.param('id') as string;
  const e = await emisoraExiste(id);
  if (!e) return c.json({ error: 'no_encontrado' }, 404);
  const cuerpo = (await c.req.json().catch(() => ({}))) as { usuarios?: unknown };
  if (!Array.isArray(cuerpo.usuarios) || !cuerpo.usuarios.every((u) => typeof u === 'string')) {
    return c.json({ error: 'validacion', campo: 'usuarios', message: 'Lista de usuarios inválida.' }, 422);
  }
  const ids = [...new Set(cuerpo.usuarios as string[])];
  const existentes = ids.length ? await db.select({ id: users.id }).from(users).where(inArray(users.id, ids)) : [];
  await db.transaction(async (tx) => {
    await tx.delete(stationBroadcasters).where(eq(stationBroadcasters.stationId, id));
    if (existentes.length) await tx.insert(stationBroadcasters).values(existentes.map((u) => ({ stationId: id, userId: u.id })));
  });
  const actor = await loadCurrentUser(c.req.raw.headers);
  await registrarAuditoria({
    userId: actor?.id ?? null,
    accion: 'radio.locutores',
    entidad: 'emisora',
    entidadId: id,
    detalle: `${e.name}: ${existentes.length} locutor(es) autorizados`,
  });
  return c.json({ ok: true, total: existentes.length });
});

const columnas = {
  id: broadcastSessions.id,
  emisoraId: broadcastSessions.stationId,
  emisora: stations.name,
  usuario: users.name,
  email: users.email,
  equipo: broadcastSessions.equipo,
  ip: broadcastSessions.ip,
  version: broadcastSessions.version,
  programa: broadcastSessions.programa,
  estado: broadcastSessions.estado,
  kbps: broadcastSessions.kbps,
  cortes: broadcastSessions.cortes,
  silencios: broadcastSessions.silencios,
  saturaciones: broadcastSessions.saturaciones,
  inicio: broadcastSessions.startedAt,
  ultimoAviso: broadcastSessions.lastSeenAt,
  fin: broadcastSessions.endedAt,
  motivoFin: broadcastSessions.motivoFin,
};

// Quién está transmitiendo ahora con el emisor, y las últimas transmisiones
radioEmisorRoutes.get('/en-vivo', requirePermission(PERMISO), async (c) => {
  const limite = new Date(Date.now() - VIGENCIA_MS);
  const ahora = await db
    .select(columnas)
    .from(broadcastSessions)
    .innerJoin(stations, eq(broadcastSessions.stationId, stations.id))
    .leftJoin(users, eq(broadcastSessions.userId, users.id))
    .where(and(isNull(broadcastSessions.endedAt), gt(broadcastSessions.lastSeenAt, limite)))
    .orderBy(desc(broadcastSessions.startedAt));
  const recientes = await db
    .select(columnas)
    .from(broadcastSessions)
    .innerJoin(stations, eq(broadcastSessions.stationId, stations.id))
    .leftJoin(users, eq(broadcastSessions.userId, users.id))
    .where(or(isNotNull(broadcastSessions.endedAt), lte(broadcastSessions.lastSeenAt, limite)))
    .orderBy(desc(broadcastSessions.startedAt))
    .limit(15);
  return c.json({
    ahora,
    // Las que dejaron de avisar sin cerrar se muestran como terminadas en su último aviso
    recientes: recientes.map((r) => (r.fin ? r : { ...r, fin: r.ultimoAviso, motivoFin: 'Dejó de responder (sin cierre)' })),
  });
});

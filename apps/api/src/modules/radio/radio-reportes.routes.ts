import { Hono } from 'hono';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { requirePermission } from '../../lib/authz.js';
import { db } from '../../db/index.js';
import { broadcastSessions, stations, users } from '../../db/schema.js';

// Reportes de las transmisiones hechas con el emisor: horas al aire por emisora y por locutor en un mes.
export const radioReportesRoutes = new Hono();
const ZONA = process.env.RADIO_TZ ?? 'America/La_Paz';

// Duración de cada transmisión: hasta su cierre o, si dejó de avisar, hasta el último aviso
const segundos = sql<number>`coalesce(sum(extract(epoch from (coalesce(${broadcastSessions.endedAt}, ${broadcastSessions.lastSeenAt}) - ${broadcastSessions.startedAt}))), 0)::int`;
const transmisiones = sql<number>`count(*)::int`;
const cortes = sql<number>`coalesce(sum(${broadcastSessions.cortes}), 0)::int`;
const silencios = sql<number>`coalesce(sum(${broadcastSessions.silencios}), 0)::int`;
const saturaciones = sql<number>`coalesce(sum(${broadcastSessions.saturaciones}), 0)::int`;

/** Primer instante del mes (YYYY-MM) y del siguiente, en la zona de la radio */
function rangoDelMes(mes: string) {
  const [a, m] = mes.split('-').map(Number);
  const siguiente = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
  return {
    desde: sql`(${`${mes}-01 00:00`}::timestamp at time zone ${ZONA})`,
    hasta: sql`(${`${siguiente}-01 00:00`}::timestamp at time zone ${ZONA})`,
  };
}

radioReportesRoutes.get('/reportes/transmisiones', requirePermission('estaciones:todas'), async (c) => {
  const mes = c.req.query('mes') ?? '';
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return c.json({ error: 'validacion', campo: 'mes', message: 'Indica el mes como 2026-11.' }, 422);
  const { desde, hasta } = rangoDelMes(mes);
  const enElMes = and(gte(broadcastSessions.startedAt, desde), lt(broadcastSessions.startedAt, hasta));

  const totales = { transmisiones, segundos, cortes, silencios, saturaciones };
  const [general] = await db.select(totales).from(broadcastSessions).where(enElMes);
  const porEmisora = await db
    .select({ id: stations.id, nombre: stations.name, ...totales })
    .from(broadcastSessions)
    .innerJoin(stations, eq(broadcastSessions.stationId, stations.id))
    .where(enElMes)
    .groupBy(stations.id, stations.name)
    .orderBy(sql`${segundos} desc`);
  const porLocutor = await db
    .select({ id: users.id, nombre: sql<string>`coalesce(${users.name}, 'Usuario eliminado')`, email: users.email, ...totales })
    .from(broadcastSessions)
    .leftJoin(users, eq(broadcastSessions.userId, users.id))
    .where(enElMes)
    .groupBy(users.id, users.name, users.email)
    .orderBy(sql`${segundos} desc`);
  const porPrograma = await db
    .select({ nombre: sql<string>`coalesce(${broadcastSessions.programa}, 'Sin programa')`, ...totales })
    .from(broadcastSessions)
    .where(enElMes)
    .groupBy(broadcastSessions.programa)
    .orderBy(sql`${segundos} desc`);

  return c.json({ mes, general, porEmisora, porLocutor, porPrograma });
});

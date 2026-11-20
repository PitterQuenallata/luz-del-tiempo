import { Hono } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import { requirePermission } from '../../lib/authz.js';
import { db } from '../../db/index.js';
import { auditLog, users } from '../../db/schema.js';

// Bitácora de actividad del panel (permiso logs:ver).
export const logsRoutes = new Hono();

logsRoutes.use('*', requirePermission('logs:ver'));

logsRoutes.get('/', async (c) => {
  const limite = Math.min(Number(c.req.query('limite') ?? 100), 500);
  const accion = c.req.query('accion');

  const base = db
    .select({
      id: auditLog.id,
      fecha: auditLog.fecha,
      accion: auditLog.accion,
      entidad: auditLog.entidad,
      entidadId: auditLog.entidadId,
      detalle: auditLog.detalle,
      cambios: auditLog.cambios,
      usuarioNombre: users.name,
      usuarioEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id));

  const filas = await (accion ? base.where(sql`${auditLog.accion} = ${accion}`) : base)
    .orderBy(desc(auditLog.fecha))
    .limit(limite);

  return c.json({ eventos: filas });
});

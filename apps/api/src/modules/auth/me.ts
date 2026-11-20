import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { auth } from '../../lib/auth.js';
import { db } from '../../db/index.js';
import { roles, users } from '../../db/schema.js';

export const meRoutes = new Hono();

// Usuario de la sesión actual con su rol. 401 sin sesión.
meRoutes.get('/', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'no_autenticado' }, 401);

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      roleKey: roles.key,
      roleName: roles.name,
      roleScope: roles.scope,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.user.id));

  if (!row) return c.json({ error: 'usuario_no_encontrado' }, 404);
  return c.json({ user: row });
});

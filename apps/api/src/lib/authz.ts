import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { auth } from './auth.js';
import { db } from '../db/index.js';
import { roles, users } from '../db/schema.js';

export interface CurrentUser {
  id: string;
  isActive: boolean;
  roleKey: string | null;
}

// Usuario de la sesión con su rol. Null si no hay sesión o la cuenta está desactivada.
export async function loadCurrentUser(headers: Headers): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  const [row] = await db
    .select({ id: users.id, isActive: users.isActive, roleKey: roles.key })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.user.id));

  if (!row || !row.isActive) return null;
  return row;
}

// Middleware: exige sesión y que el rol esté en la lista permitida (403 si no).
export function requireRole(allowed: string[]) {
  return async (c: Context, next: Next) => {
    const user = await loadCurrentUser(c.req.raw.headers);
    if (!user) return c.json({ error: 'no_autenticado' }, 401);
    if (!user.roleKey || !allowed.includes(user.roleKey)) {
      return c.json({ error: 'sin_permiso' }, 403);
    }
    await next();
  };
}

import type { Context, Next } from 'hono';
import { and, eq } from 'drizzle-orm';
import { auth } from './auth.js';
import { db } from '../db/index.js';
import { rolePermissions, roles, users } from '../db/schema.js';

export interface CurrentUser {
  id: string;
  isActive: boolean;
  roleId: string | null;
  roleKey: string | null;
  mustChangePassword: boolean;
}

// Usuario de la sesión con su rol. Null si no hay sesión o la cuenta está desactivada.
export async function loadCurrentUser(headers: Headers): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  const [row] = await db
    .select({ id: users.id, isActive: users.isActive, mustChangePassword: users.mustChangePassword, roleId: roles.id, roleKey: roles.key })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.user.id));

  if (!row || !row.isActive) return null;
  return row;
}

// ¿El rol tiene este permiso? El superadmin tiene todos (no se puede quitar).
export async function tienePermiso(user: CurrentUser, permiso: string): Promise<boolean> {
  if (user.roleKey === 'superadmin') return true;
  if (!user.roleId) return false;
  const [fila] = await db
    .select({ key: rolePermissions.permissionKey })
    .from(rolePermissions)
    .where(and(eq(rolePermissions.roleId, user.roleId), eq(rolePermissions.permissionKey, permiso)));
  return Boolean(fila);
}

// Middleware: exige sesión y el permiso indicado (401 sin sesión, 403 sin permiso).
export function requirePermission(permiso: string) {
  return async (c: Context, next: Next) => {
    const user = await loadCurrentUser(c.req.raw.headers);
    if (!user) return c.json({ error: 'no_autenticado' }, 401);
    // Primer inicio: hasta cambiar la contraseña inicial no se usa el panel
    if (user.mustChangePassword) {
      return c.json({ error: 'debe_cambiar_contrasena', message: 'Debes cambiar tu contraseña inicial antes de continuar.' }, 403);
    }
    if (!(await tienePermiso(user, permiso))) {
      return c.json({ error: 'sin_permiso', message: 'No tienes permiso para esta acción.' }, 403);
    }
    await next();
  };
}

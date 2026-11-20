import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { auth } from '../../lib/auth.js';
import { loadCurrentUser, requireRole } from '../../lib/authz.js';
import { db } from '../../db/index.js';
import { roles, users } from '../../db/schema.js';

// Gestión de usuarios del panel. Solo superadmin y admin (docs/PLAN.md §6).
// Reglas: solo el superadmin asigna o modifica al superadmin; nadie se desactiva a sí mismo.
export const usuariosRoutes = new Hono();

usuariosRoutes.use('*', requireRole(['superadmin', 'admin']));

const ROLE_KEYS_ASIGNABLES = ['superadmin', 'admin', 'editor', 'station_operator'];

usuariosRoutes.get('/roles', async (c) => {
  const rows = await db.select().from(roles).orderBy(roles.key);
  return c.json({ roles: rows.map((r) => ({ key: r.key, name: r.name, scope: r.scope })) });
});

usuariosRoutes.get('/', async (c) => {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
      roleKey: roles.key,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .orderBy(desc(users.createdAt));

  return c.json({ usuarios: rows });
});

usuariosRoutes.post('/', async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const body = await c.req.json<{ name?: string; email?: string; password?: string; phone?: string; roleKey?: string }>();

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  const roleKey = body.roleKey ?? '';

  if (!name || !email || password.length < 8) {
    return c.json({ error: 'datos_invalidos', message: 'Nombre, correo y contraseña (mín. 8 caracteres) son obligatorios.' }, 422);
  }
  if (!ROLE_KEYS_ASIGNABLES.includes(roleKey)) {
    return c.json({ error: 'rol_invalido' }, 422);
  }
  if (roleKey === 'superadmin' && caller?.roleKey !== 'superadmin') {
    return c.json({ error: 'sin_permiso', message: 'Solo el superadmin puede crear otro superadmin.' }, 403);
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return c.json({ error: 'correo_existente' }, 409);

  const [role] = await db.select().from(roles).where(eq(roles.key, roleKey));
  if (!role) return c.json({ error: 'rol_no_existe' }, 422);

  const created = await auth.api.signUpEmail({ body: { name, email, password } });

  await db
    .update(users)
    .set({ roleId: role.id, phone: body.phone?.trim() || null, emailVerified: true })
    .where(eq(users.id, created.user.id));

  return c.json({ usuario: { id: created.user.id, name, email, roleKey: role.key, roleName: role.name } }, 201);
});

usuariosRoutes.patch('/:id', async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id');
  const body = await c.req.json<{ roleKey?: string; isActive?: boolean }>();

  const [target] = await db
    .select({ id: users.id, isActive: users.isActive, roleKey: roles.key })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id));
  if (!target) return c.json({ error: 'no_encontrado' }, 404);

  const callerIsSuper = caller?.roleKey === 'superadmin';
  if (target.roleKey === 'superadmin' && !callerIsSuper) {
    return c.json({ error: 'sin_permiso', message: 'Solo el superadmin puede modificar al superadmin.' }, 403);
  }
  if (typeof body.isActive === 'boolean' && body.isActive === false && caller?.id === id) {
    return c.json({ error: 'auto_desactivacion', message: 'No puedes desactivar tu propia cuenta.' }, 422);
  }

  const patch: { roleId?: string | null; isActive?: boolean; updatedAt: Date } = { updatedAt: new Date() };

  if (body.roleKey !== undefined) {
    if (!ROLE_KEYS_ASIGNABLES.includes(body.roleKey)) return c.json({ error: 'rol_invalido' }, 422);
    if (body.roleKey === 'superadmin' && !callerIsSuper) {
      return c.json({ error: 'sin_permiso', message: 'Solo el superadmin puede asignar el rol superadmin.' }, 403);
    }
    const [role] = await db.select().from(roles).where(eq(roles.key, body.roleKey));
    if (!role) return c.json({ error: 'rol_no_existe' }, 422);
    patch.roleId = role.id;
  }
  if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

  await db.update(users).set(patch).where(eq(users.id, id));
  return c.json({ ok: true });
});

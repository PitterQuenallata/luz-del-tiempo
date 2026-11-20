import { Hono } from 'hono';
import { eq, inArray, sql } from 'drizzle-orm';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { db } from '../../db/index.js';
import { permissions, rolePermissions, roles, users } from '../../db/schema.js';

// Roles y permisos del panel (docs/PLAN.md §6).
// Leer: quien gestiona usuarios. Crear, editar y eliminar: solo quien tiene roles:gestionar (superadmin).
export const rolesRoutes = new Hono();

const CLAVE_VALIDA = /^[a-z][a-z0-9_]{1,40}$/;
const ROL_PROTEGIDO = 'superadmin';

interface RolInput {
  key?: string;
  name?: string;
  description?: string | null;
  scope?: 'global' | 'station';
  permisos?: string[];
}

async function permisosExistentes(keys: string[]): Promise<boolean> {
  if (keys.length === 0) return true;
  const filas = await db.select({ key: permissions.key }).from(permissions).where(inArray(permissions.key, keys));
  return filas.length === new Set(keys).size;
}

async function reemplazarPermisos(roleId: string, keys: string[]) {
  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (keys.length > 0) {
      await tx.insert(rolePermissions).values(keys.map((k) => ({ roleId, permissionKey: k })));
    }
  });
}

rolesRoutes.get('/permisos', requirePermission('usuarios:gestionar'), async (c) => {
  const rows = await db.select().from(permissions).orderBy(permissions.grupo, permissions.key);
  return c.json({ permisos: rows });
});

rolesRoutes.get('/', requirePermission('usuarios:gestionar'), async (c) => {
  const rows = await db.select().from(roles).orderBy(roles.key);
  const asignados = await db.select().from(rolePermissions);
  const miembros = await db
    .select({ roleId: users.roleId, total: sql<number>`count(*)::int` })
    .from(users)
    .groupBy(users.roleId);

  const conteo = new Map(miembros.map((m) => [m.roleId, m.total]));
  return c.json({
    roles: rows.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      scope: r.scope,
      isSystem: r.isSystem,
      miembros: conteo.get(r.id) ?? 0,
      permisos: asignados.filter((a) => a.roleId === r.id).map((a) => a.permissionKey).sort(),
    })),
  });
});

rolesRoutes.post('/', requirePermission('roles:gestionar'), async (c) => {
  const body = await c.req.json<RolInput>();
  const key = body.key?.trim();
  const name = body.name?.trim();
  const permisos = body.permisos ?? [];

  if (!key || !CLAVE_VALIDA.test(key) || key === ROL_PROTEGIDO) {
    return c.json({ error: 'clave_invalida', message: 'La clave debe empezar con letra y usar solo letras minúsculas, números o guion bajo (2–41 caracteres).' }, 422);
  }
  if (!name) return c.json({ error: 'nombre_requerido', message: 'El nombre del rol es obligatorio.' }, 422);
  if (!(await permisosExistentes(permisos))) return c.json({ error: 'permiso_invalido' }, 422);

  const [existe] = await db.select({ id: roles.id }).from(roles).where(eq(roles.key, key));
  if (existe) return c.json({ error: 'clave_existente', message: 'Ya existe un rol con esa clave.' }, 409);

  const [creado] = await db
    .insert(roles)
    .values({ key, name, description: body.description?.trim() || null, scope: body.scope ?? 'global', isSystem: false })
    .returning({ id: roles.id });
  await reemplazarPermisos(creado.id, permisos);
  return c.json({ id: creado.id, key }, 201);
});

rolesRoutes.patch('/:id', requirePermission('roles:gestionar'), async (c) => {
  const id: string = c.req.param('id') as string;
  const body = await c.req.json<RolInput>();
  const [rol] = await db.select().from(roles).where(eq(roles.id, id));
  if (!rol) return c.json({ error: 'no_encontrado' }, 404);
  if (rol.key === ROL_PROTEGIDO) {
    return c.json({ error: 'rol_protegido', message: 'El rol superadmin tiene todos los permisos y no se modifica.' }, 403);
  }

  const cambios: { name?: string; description?: string | null } = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return c.json({ error: 'nombre_requerido', message: 'El nombre del rol es obligatorio.' }, 422);
    cambios.name = name;
  }
  if (body.description !== undefined) cambios.description = body.description?.trim() || null;
  if (Object.keys(cambios).length > 0) await db.update(roles).set(cambios).where(eq(roles.id, id));

  if (body.permisos !== undefined) {
    if (!(await permisosExistentes(body.permisos))) return c.json({ error: 'permiso_invalido' }, 422);
    await reemplazarPermisos(id, body.permisos);
  }
  return c.json({ ok: true });
});

rolesRoutes.delete('/:id', requirePermission('roles:gestionar'), async (c) => {
  const id: string = c.req.param('id') as string;
  const [rol] = await db.select().from(roles).where(eq(roles.id, id));
  if (!rol) return c.json({ error: 'no_encontrado' }, 404);
  if (rol.isSystem || rol.key === ROL_PROTEGIDO) {
    return c.json({ error: 'rol_de_sistema', message: 'Los roles de sistema no se pueden eliminar.' }, 409);
  }
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(users).where(eq(users.roleId, id));
  if (total > 0) {
    return c.json({ error: 'rol_con_usuarios', message: `Este rol tiene ${total} usuario(s). Cámbialos a otro rol antes de eliminarlo.` }, 409);
  }
  await db.delete(roles).where(eq(roles.id, id));
  return c.json({ ok: true });
});

// Para la sesión actual (usado por la pantalla de permisos)
rolesRoutes.get('/yo', async (c) => {
  const user = await loadCurrentUser(c.req.raw.headers);
  if (!user) return c.json({ error: 'no_autenticado' }, 401);
  return c.json({ roleKey: user.roleKey });
});

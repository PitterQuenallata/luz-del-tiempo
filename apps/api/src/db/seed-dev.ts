// Datos de desarrollo: roles y cuentas de prueba para el panel.
// Uso: pnpm db:seed (desde apps/api, con .env cargado). Es idempotente.
// Solo para entorno local: NO ejecutar contra producción.

import { eq } from 'drizzle-orm';
import { auth } from '../lib/auth.js';
import { PERMISOS } from '../lib/permisos.js';
import { db, pool } from './index.js';
import { permissions, rolePermissions, roles, users } from './schema.js';

const ROLES = [
  { key: 'superadmin', name: 'Superadmin (Blakor)', scope: 'global' as const },
  { key: 'admin', name: 'Administrador del ministerio', scope: 'global' as const },
  { key: 'editor', name: 'Editor', scope: 'global' as const },
  { key: 'station_operator', name: 'Operador de estación', scope: 'station' as const },
];

const ACCOUNTS = [
  { email: 'mallku@gmail.com', name: 'Mallku', password: 'sopademani1', roleKey: 'superadmin' },
  { email: 'admin@luzdeltiempo.local', name: 'Admin de prueba', password: 'sopademani1', roleKey: 'admin' },
  { email: 'editor@luzdeltiempo.local', name: 'Editor de prueba', password: 'sopademani1', roleKey: 'editor' },
  { email: 'operador@luzdeltiempo.local', name: 'Operador de prueba', password: 'sopademani1', roleKey: 'station_operator' },
];

async function seedPermisos() {
  for (const p of PERMISOS) {
    await db
      .insert(permissions)
      .values({ key: p.key, descripcion: p.descripcion, grupo: p.key.split(':')[0] })
      .onConflictDoUpdate({ target: permissions.key, set: { descripcion: p.descripcion } });
  }
}

async function seedRoles() {
  for (const role of ROLES) {
    await db
      .insert(roles)
      .values({ ...role, isSystem: true })
      .onConflictDoUpdate({ target: roles.key, set: { name: role.name, scope: role.scope, isSystem: true } });
  }
  const rows = await db.select().from(roles);
  const ids = new Map(rows.map((r) => [r.key, r.id]));

  // Permisos por defecto solo si el rol aún no tiene ninguno (no se pisan los cambios hechos desde el panel)
  for (const role of ROLES) {
    const roleId = ids.get(role.key);
    if (!roleId) continue;
    const [existente] = await db.select({ k: rolePermissions.permissionKey }).from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (existente) continue;
    const defaults = PERMISOS.filter((p) => (p.roles as string[]).includes(role.key)).map((p) => p.key);
    if (defaults.length > 0) {
      await db.insert(rolePermissions).values(defaults.map((k) => ({ roleId, permissionKey: k })));
    }
  }
  return ids;
}

async function seedAccounts(roleIds: Map<string, string>) {
  for (const account of ACCOUNTS) {
    const roleId = roleIds.get(account.roleKey);
    if (!roleId) throw new Error(`Rol no encontrado: ${account.roleKey}`);

    const existing = await db.select().from(users).where(eq(users.email, account.email));
    if (existing.length === 0) {
      await auth.api.signUpEmail({
        body: { email: account.email, password: account.password, name: account.name },
      });
      console.log(`+ cuenta creada: ${account.email}`);
    } else {
      console.log(`= cuenta existente: ${account.email}`);
    }

    await db.update(users).set({ roleId, emailVerified: true }).where(eq(users.email, account.email));
  }
}

async function main() {
  await seedPermisos();
  const roleIds = await seedRoles();
  await seedAccounts(roleIds);
  console.log('Seed de desarrollo listo.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

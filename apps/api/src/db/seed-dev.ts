// Datos de desarrollo: roles y cuentas de prueba para el panel.
// Uso: pnpm db:seed (desde apps/api, con .env cargado). Es idempotente.
// Solo para entorno local: NO ejecutar contra producción.

import { eq } from 'drizzle-orm';
import { auth } from '../lib/auth.js';
import { db, pool } from './index.js';
import { roles, users } from './schema.js';

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

async function seedRoles() {
  for (const role of ROLES) {
    await db
      .insert(roles)
      .values(role)
      .onConflictDoUpdate({ target: roles.key, set: { name: role.name, scope: role.scope } });
  }
  const rows = await db.select().from(roles);
  return new Map(rows.map((r) => [r.key, r.id]));
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

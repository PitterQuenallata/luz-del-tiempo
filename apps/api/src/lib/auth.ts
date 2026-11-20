import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { registrarAuditoria } from './audit.js';

const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema, usePlural: true }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: corsOrigins,
  // Contraseña inicial de los usuarios del panel = apellido (puede ser corto)
  // Las cuentas las crea un administrador: no se inicia sesión al crearlas (no cuenta como actividad).
  emailAndPassword: { enabled: true, minPasswordLength: 4, autoSignIn: false },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, session.userId));
          await registrarAuditoria({ userId: session.userId, accion: 'sesion.iniciar', entidad: 'sesion' });
        },
      },
    },
  },
});

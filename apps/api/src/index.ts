import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sql } from 'drizzle-orm';
import { auth } from './lib/auth.js';
import { db } from './db/index.js';
import { meRoutes } from './modules/auth/me.js';
import { usuariosRoutes } from './modules/usuarios/usuarios.routes.js';
import { rolesRoutes } from './modules/roles/roles.routes.js';

const app = new Hono();

const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  '/api/*',
  cors({
    origin: corsOrigins,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// Autenticación (Better Auth): /api/auth/*
app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
  const res = await auth.handler(c.req.raw);
  if (res.status >= 500) {
    // Better Auth no lanza excepción en estos casos: se registra aquí para verlo en la terminal
    const cuerpo = await res.clone().text();
    console.error(`[auth ${res.status}] ${c.req.method} ${c.req.path} -> ${cuerpo.slice(0, 500)}`);
  }
  return res;
});

app.route('/api/v1/me', meRoutes);
app.route('/api/v1/usuarios', usuariosRoutes);
app.route('/api/v1/roles', rolesRoutes);

app.get('/api/v1/health', (c) => c.json({ status: 'ok' }));

app.get('/api/v1/ready', async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({ status: 'ready', database: 'ok' });
  } catch {
    return c.json({ status: 'not_ready', database: 'error' }, 503);
  }
});

app.onError((err, c) => {
  console.error(`[api error] ${c.req.method} ${c.req.path}`, err);
  return c.json({ error: 'error_interno', message: 'Error interno de la API. Revisa la terminal de pnpm dev.' }, 500);
});

const port = Number(process.env.API_PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API La Luz del Tiempo en http://localhost:${info.port}`);
});

export default app;

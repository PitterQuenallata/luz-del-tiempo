import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sql } from 'drizzle-orm';
import { auth } from './lib/auth.js';
import { db } from './db/index.js';
import { meRoutes } from './modules/auth/me.js';

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
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/api/v1/me', meRoutes);

app.get('/api/v1/health', (c) => c.json({ status: 'ok' }));

app.get('/api/v1/ready', async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({ status: 'ready', database: 'ok' });
  } catch {
    return c.json({ status: 'not_ready', database: 'error' }, 503);
  }
});

const port = Number(process.env.API_PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API La Luz del Tiempo en http://localhost:${info.port}`);
});

export default app;

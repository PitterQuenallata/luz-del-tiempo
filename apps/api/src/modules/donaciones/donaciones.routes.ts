import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { listaMetodosDonacionSchema, listaNecesidadesSchema } from '@luz/shared';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { errorValidacion } from '../../lib/validar.js';
import { db } from '../../db/index.js';
import { siteSettings } from '../../db/schema.js';

// Formas de donar y necesidades del ministerio (permiso donaciones:ver).
// Se guardan como ajustes del sitio (site_settings). Los recibos de donación vienen después.
export const donacionesRoutes = new Hono();
const PERMISO = 'donaciones:ver';
const CLAVE_METODOS = 'donate.metodos';
const CLAVE_NECESIDADES = 'donate.necesidades';

async function leerAjuste<T>(clave: string, fallback: T): Promise<T> {
  const [fila] = await db.select().from(siteSettings).where(eq(siteSettings.key, clave));
  return fila ? (fila.value as T) : fallback;
}

async function guardarAjuste(clave: string, valor: unknown) {
  await db
    .insert(siteSettings)
    .values({ key: clave, value: valor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: valor, updatedAt: new Date() } });
}

donacionesRoutes.get('/', requirePermission(PERMISO), async (c) => {
  const metodos = await leerAjuste(CLAVE_METODOS, []);
  const necesidades = await leerAjuste(CLAVE_NECESIDADES, []);
  return c.json({ metodos, necesidades });
});

donacionesRoutes.put('/metodos', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = listaMetodosDonacionSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const ids = parsed.data.map((m: { id: string }) => m.id);
  if (new Set(ids).size !== ids.length) return c.json({ error: 'validacion', campo: 'id', message: 'Cada forma de donar aparece una sola vez.' }, 422);
  await guardarAjuste(CLAVE_METODOS, parsed.data);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'donacion.metodos', entidad: 'donaciones', detalle: `${parsed.data.length} formas de donar` });
  return c.json({ metodos: parsed.data });
});

donacionesRoutes.put('/necesidades', requirePermission(PERMISO), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const parsed = listaNecesidadesSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return errorValidacion(c, parsed.error);
  await guardarAjuste(CLAVE_NECESIDADES, parsed.data);
  await registrarAuditoria({ userId: caller?.id ?? null, accion: 'donacion.necesidades', entidad: 'donaciones', detalle: `${parsed.data.length} necesidades` });
  return c.json({ necesidades: parsed.data });
});

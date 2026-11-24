import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { radios, stations } from '../../db/schema.js';
import { loadCurrentUser, tienePermiso, type CurrentUser } from '../../lib/authz.js';

// Quién puede gestionar qué:
// - estaciones:todas (superadmin y admin): todas las emisoras y estaciones.
// - estacion:propia (operador de un tercero): solo las estaciones de SU emisora (ownerUserId).

export const PERMISO_TODAS = 'estaciones:todas';
export const PERMISO_PROPIA = 'estacion:propia';

/** Entra si tiene cualquiera de los dos permisos. Lo que cada uno puede tocar se revisa en la ruta. */
export function requireEstacionesAcceso() {
  return async (c: Context, next: Next) => {
    const user = await loadCurrentUser(c.req.raw.headers);
    if (!user) return c.json({ error: 'no_autenticado' }, 401);
    if (user.mustChangePassword) return c.json({ error: 'debe_cambiar_contrasena', message: 'Debes cambiar tu contraseña inicial antes de continuar.' }, 403);
    if (!((await tienePermiso(user, PERMISO_TODAS)) || (await tienePermiso(user, PERMISO_PROPIA)))) {
      return c.json({ error: 'sin_permiso', message: 'No tienes permiso para esta acción.' }, 403);
    }
    await next();
  };
}

/** ¿Puede este usuario gestionar la emisora de esta estación? */
export async function puedeGestionarEmisora(user: CurrentUser, radioId: string): Promise<boolean> {
  if (await tienePermiso(user, PERMISO_TODAS)) return true;
  if (!(await tienePermiso(user, PERMISO_PROPIA))) return false;
  const [r] = await db.select({ owner: radios.ownerUserId }).from(radios).where(eq(radios.id, radioId));
  return Boolean(r && r.owner === user.id);
}

/** Solo admin y superadmin crean o cambian emisoras y estaciones. */
export async function esAdmin(user: CurrentUser) {
  return tienePermiso(user, PERMISO_TODAS);
}

/** Carga una estación y comprueba que el usuario puede gestionarla. Devuelve la respuesta de error si no. */
export async function estacionParaRuta(c: Context, estacionId: string) {
  const user = await loadCurrentUser(c.req.raw.headers);
  if (!user) return c.json({ error: 'no_autenticado' }, 401) as unknown as Response;
  const [estacion] = await db.select().from(stations).where(eq(stations.id, estacionId));
  if (!estacion) return c.json({ error: 'no_encontrado' }, 404) as unknown as Response;
  if (!(await puedeGestionarEmisora(user, estacion.radioId))) return c.json({ error: 'sin_permiso', message: 'No tienes permiso para esta estación.' }, 403) as unknown as Response;
  return { estacion, user };
}

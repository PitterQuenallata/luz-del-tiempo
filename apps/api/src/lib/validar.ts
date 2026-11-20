import type { Context } from 'hono';
import type { ZodError } from '@luz/shared';

// Respuesta 422 con el primer error del esquema (mismo formato que usa el panel)
export function errorValidacion(c: Context, error: ZodError) {
  const primero = error.issues[0];
  return c.json({ error: 'validacion', campo: primero.path.join('.'), message: primero.message }, 422);
}

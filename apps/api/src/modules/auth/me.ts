import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { auth } from '../../lib/auth.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { validarTelefono } from '../../lib/telefono.js';
import { separarNombreLegado, validarNombre } from '../../lib/validaciones.js';
import { separarTelefonoLegado } from '../../lib/telefono.js';
import { db } from '../../db/index.js';
import { roles, users } from '../../db/schema.js';

export const meRoutes = new Hono();

const fotoUrl = (u: { id: string; image: string | null; updatedAt: Date }) =>
  u.image ? `/api/v1/usuarios/${u.id}/foto?v=${u.updatedAt.getTime()}` : null;

const CAMPOS = {
  id: users.id,
  name: users.name,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  phoneCode: users.phoneCode,
  phone: users.phone,
  image: users.image,
  updatedAt: users.updatedAt,
  isActive: users.isActive,
  mustChangePassword: users.mustChangePassword,
  lastLoginAt: users.lastLoginAt,
  roleKey: roles.key,
  roleName: roles.name,
  roleScope: roles.scope,
};

async function cargarYo(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const [row] = await db.select(CAMPOS).from(users).leftJoin(roles, eq(users.roleId, roles.id)).where(eq(users.id, session.user.id));
  return row ?? null;
}

// Usuario de la sesión con su rol y su perfil. 401 sin sesión.
meRoutes.get('/', async (c) => {
  const row = await cargarYo(c.req.raw.headers);
  if (!row) return c.json({ error: 'no_autenticado' }, 401);
  const nombres = separarNombreLegado(row.name, row.firstName, row.lastName);
  const tel = separarTelefonoLegado(row.phone, row.phoneCode);
  return c.json({ user: { ...row, ...nombres, phoneCode: tel.codigo, phone: tel.numero, fotoUrl: fotoUrl(row) } });
});

// Editar mi perfil: nombres, apellidos y teléfono (no el rol ni el estado).
meRoutes.patch('/', async (c) => {
  const yo = await cargarYo(c.req.raw.headers);
  if (!yo) return c.json({ error: 'no_autenticado' }, 401);
  const body = await c.req.json<{ firstName?: string; lastName?: string; phoneCode?: string; phone?: string | null }>();

  const nombres = validarNombre(body.firstName ?? yo.firstName ?? '', 'Nombres');
  if (!nombres.ok) return c.json({ error: 'validacion', campo: 'firstName', message: nombres.mensaje }, 422);
  const apellidos = validarNombre(body.lastName ?? yo.lastName ?? '', 'Apellidos');
  if (!apellidos.ok) return c.json({ error: 'validacion', campo: 'lastName', message: apellidos.mensaje }, 422);
  const firstName = nombres.valor;
  const lastName = apellidos.valor;
  const tel = validarTelefono(body.phoneCode ?? yo.phoneCode, body.phone === undefined ? yo.phone : body.phone);
  if (!tel.ok) return c.json({ error: 'validacion', campo: 'phone', message: tel.mensaje }, 422);

  const name = `${firstName} ${lastName}`;
  await db
    .update(users)
    .set({ firstName, lastName, name, phoneCode: tel.codigo, phone: tel.numero, updatedAt: new Date() })
    .where(eq(users.id, yo.id));
  await registrarAuditoria({ userId: yo.id, accion: 'perfil.editar', entidad: 'usuario', entidadId: yo.id });
  return c.json({ ok: true });
});

// Cambiar mi contraseña (también la inicial). Validación del servidor: mínimo 8 caracteres, distinta de la actual.
meRoutes.post('/contrasena', async (c) => {
  const yo = await cargarYo(c.req.raw.headers);
  if (!yo) return c.json({ error: 'no_autenticado' }, 401);
  const body = await c.req.json<{ actual?: string; nueva?: string }>();
  const actual = body.actual ?? '';
  const nueva = body.nueva ?? '';
  if (!actual) return c.json({ error: 'validacion', campo: 'actual', message: 'Escribe tu contraseña actual.' }, 422);
  if (nueva.length < 8) return c.json({ error: 'validacion', campo: 'nueva', message: 'La nueva contraseña debe tener al menos 8 caracteres.' }, 422);
  if (nueva.length > 128) return c.json({ error: 'validacion', campo: 'nueva', message: 'La nueva contraseña es demasiado larga.' }, 422);
  if (nueva === actual) return c.json({ error: 'validacion', campo: 'nueva', message: 'La nueva contraseña debe ser distinta de la actual.' }, 422);

  try {
    await auth.api.changePassword({
      body: { currentPassword: actual, newPassword: nueva, revokeOtherSessions: false },
      headers: c.req.raw.headers,
    });
  } catch {
    return c.json({ error: 'contrasena_actual', campo: 'actual', message: 'La contraseña actual no es correcta.' }, 422);
  }
  await db.update(users).set({ mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, yo.id));
  return c.json({ ok: true });
});

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { cambioContrasenaSchema, datosPersonalesSchema, soloDigitos, PAIS_PREDETERMINADO } from '@luz/shared';
import { auth } from '../../lib/auth.js';
import { loadCurrentUser, permisosDe } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { separarNombreLegado } from '../../lib/validaciones.js';
import { separarTelefonoLegado } from '../../lib/telefono.js';
import { errorValidacion } from '../../lib/validar.js';
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
  const yoCompleto = await loadCurrentUser(c.req.raw.headers);
  const permisos = yoCompleto ? await permisosDe(yoCompleto) : [];
  return c.json({ user: { ...row, ...nombres, phoneCode: tel.codigo, phone: tel.numero, fotoUrl: fotoUrl(row), permisos } });
});

// Editar mi perfil: nombres, apellidos y teléfono (no el rol ni el estado).
meRoutes.patch('/', async (c) => {
  const yo = await cargarYo(c.req.raw.headers);
  if (!yo) return c.json({ error: 'no_autenticado' }, 401);
  const body = await c.req.json<{ firstName?: string; lastName?: string; phoneCode?: string; phone?: string | null }>().catch(() => ({} as any));
  const nombres = separarNombreLegado(yo.name, yo.firstName, yo.lastName);
  const parsed = datosPersonalesSchema.safeParse({
    firstName: body.firstName ?? nombres.firstName ?? '',
    lastName: body.lastName ?? nombres.lastName ?? '',
    phoneCode: body.phoneCode ?? yo.phoneCode ?? PAIS_PREDETERMINADO,
    phone: body.phone === undefined ? yo.phone ?? '' : body.phone ?? '',
  });
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const numero = d.phone ? soloDigitos(d.phone) : null;
  await db
    .update(users)
    .set({ firstName: d.firstName, lastName: d.lastName, name: `${d.firstName} ${d.lastName}`, phoneCode: numero ? d.phoneCode : null, phone: numero, updatedAt: new Date() })
    .where(eq(users.id, yo.id));
  await registrarAuditoria({ userId: yo.id, accion: 'perfil.editar', entidad: 'usuario', entidadId: yo.id });
  return c.json({ ok: true });
});

// Cambiar mi contraseña (también la inicial). Validación compartida con el panel.
meRoutes.post('/contrasena', async (c) => {
  const yo = await cargarYo(c.req.raw.headers);
  if (!yo) return c.json({ error: 'no_autenticado' }, 401);
  const body = await c.req.json<{ actual?: string; nueva?: string }>().catch(() => ({} as any));
  const parsed = cambioContrasenaSchema.safeParse({ actual: body.actual ?? '', nueva: body.nueva ?? '', repetir: body.nueva ?? '' });
  if (!parsed.success) return errorValidacion(c, parsed.error);

  try {
    await auth.api.changePassword({
      body: { currentPassword: parsed.data.actual, newPassword: parsed.data.nueva, revokeOtherSessions: false },
      headers: c.req.raw.headers,
    });
  } catch {
    return c.json({ error: 'contrasena_actual', campo: 'actual', message: 'La contraseña actual no es correcta.' }, 422);
  }
  await db.update(users).set({ mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, yo.id));
  return c.json({ ok: true });
});

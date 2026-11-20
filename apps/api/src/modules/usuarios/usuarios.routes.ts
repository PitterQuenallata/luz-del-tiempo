import { Hono } from 'hono';
import { desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { auth } from '../../lib/auth.js';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { PAISES, PAIS_PREDETERMINADO, contrasenaInicial, validarTelefono } from '../../lib/telefono.js';
import { db } from '../../db/index.js';
import { auditLog, roles, users } from '../../db/schema.js';

// Gestión de usuarios del panel (permiso usuarios:gestionar).
// Reglas: solo el superadmin asigna o modifica al superadmin; nadie se desactiva ni elimina a sí mismo.
// Eliminación: limpia si la cuenta nunca tuvo actividad; lógica si ya entró o hizo cambios.
export const usuariosRoutes = new Hono();

const CARPETA_FOTOS = join(process.cwd(), 'uploads', 'avatares');
const FORMATOS_FOTO: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_FOTO_BYTES = 2 * 1024 * 1024;

const nombreCompleto = (nombres: string, apellidos: string) => `${nombres} ${apellidos}`.replace(/\s+/g, ' ').trim();

const fotoUrl = (u: { id: string; image: string | null; updatedAt: Date }) =>
  u.image ? `/api/v1/usuarios/${u.id}/foto?v=${u.updatedAt.getTime()}` : null;

usuariosRoutes.get('/paises', requirePermission('usuarios:gestionar'), (c) =>
  c.json({ paises: PAISES, predeterminado: PAIS_PREDETERMINADO })
);

// Foto de perfil: el propio usuario o quien gestiona usuarios.
async function puedeVerCuenta(c: any, id: string): Promise<boolean> {
  const yo = await loadCurrentUser(c.req.raw.headers);
  if (!yo) return false;
  if (yo.id === id) return true;
  const [fila] = await db.select({ id: users.id }).from(users).where(eq(users.id, yo.id));
  return Boolean(fila) && (yo.roleKey === 'superadmin' || yo.roleKey === 'admin');
}

usuariosRoutes.get('/:id/foto', async (c) => {
  const id = c.req.param('id') as string;
  if (!(await puedeVerCuenta(c, id))) return c.json({ error: 'sin_permiso' }, 403);
  const [u] = await db.select({ image: users.image }).from(users).where(eq(users.id, id));
  if (!u?.image) return c.json({ error: 'sin_foto' }, 404);
  const ext = u.image;
  const tipo = Object.entries(FORMATOS_FOTO).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream';
  try {
    const bytes = await readFile(join(CARPETA_FOTOS, `${id}.${ext}`));
    return new Response(bytes, { headers: { 'Content-Type': tipo, 'Cache-Control': 'private, max-age=300' } });
  } catch {
    return c.json({ error: 'sin_foto' }, 404);
  }
});

usuariosRoutes.post('/:id/foto', async (c) => {
  const id = c.req.param('id') as string;
  if (!(await puedeVerCuenta(c, id))) return c.json({ error: 'sin_permiso' }, 403);
  const body = await c.req.parseBody();
  const archivo = body['foto'];
  if (!(archivo instanceof File)) return c.json({ error: 'datos_invalidos', message: 'Selecciona una imagen.' }, 422);
  const ext = FORMATOS_FOTO[archivo.type];
  if (!ext) return c.json({ error: 'formato', message: 'La foto debe ser JPG, PNG o WebP.' }, 422);
  if (archivo.size > MAX_FOTO_BYTES) return c.json({ error: 'tamano', message: 'La foto no puede pesar más de 2 MB.' }, 422);

  await mkdir(CARPETA_FOTOS, { recursive: true });
  for (const e of Object.values(FORMATOS_FOTO)) {
    await unlink(join(CARPETA_FOTOS, `${id}.${e}`)).catch(() => undefined);
  }
  await writeFile(join(CARPETA_FOTOS, `${id}.${ext}`), Buffer.from(await archivo.arrayBuffer()));
  await db.update(users).set({ image: ext, updatedAt: new Date() }).where(eq(users.id, id));
  return c.json({ ok: true });
});

usuariosRoutes.get('/', requirePermission('usuarios:gestionar'), async (c) => {
  const estado = c.req.query('estado') ?? 'vigentes'; // vigentes | eliminados | todos
  const filtro =
    estado === 'eliminados' ? isNotNull(users.deletedAt) : estado === 'todos' ? undefined : isNull(users.deletedAt);

  const rows = await db
    .select({
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
      deletedAt: users.deletedAt,
      mustChangePassword: users.mustChangePassword,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      roleKey: roles.key,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(filtro)
    .orderBy(desc(users.createdAt));

  return c.json({ usuarios: rows.map((r) => ({ ...r, fotoUrl: fotoUrl(r) })) });
});

usuariosRoutes.post('/', requirePermission('usuarios:gestionar'), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const body = await c.req.json<{
    firstName?: string; lastName?: string; email?: string; phoneCode?: string; phone?: string; roleKey?: string;
  }>();

  const firstName = body.firstName?.trim() ?? '';
  const lastName = body.lastName?.trim() ?? '';
  const email = body.email?.trim().toLowerCase() ?? '';
  const roleKey = body.roleKey ?? '';

  if (!firstName || !lastName || !email) {
    return c.json({ error: 'datos_invalidos', message: 'Nombres, apellidos y correo son obligatorios.' }, 422);
  }
  const tel = validarTelefono(body.phoneCode, body.phone);
  if (!tel.ok) return c.json({ error: 'telefono_invalido', message: tel.mensaje }, 422);

  const password = contrasenaInicial(lastName);
  if (password.length < 4) {
    return c.json({ error: 'apellido_corto', message: 'El apellido es muy corto para la contraseña inicial (mínimo 4 letras).' }, 422);
  }

  if (roleKey === 'superadmin' && caller?.roleKey !== 'superadmin') {
    return c.json({ error: 'sin_permiso', message: 'Solo el superadmin puede crear otro superadmin.' }, 403);
  }
  const [role] = await db.select().from(roles).where(eq(roles.key, roleKey));
  if (!role) return c.json({ error: 'rol_no_existe', message: 'El rol seleccionado no existe.' }, 422);

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return c.json({ error: 'correo_existente', message: 'Ya existe una cuenta con ese correo.' }, 409);

  const nombre = nombreCompleto(firstName, lastName);
  const created = await auth.api.signUpEmail({ body: { name: nombre, email, password } });

  await db
    .update(users)
    .set({
      firstName, lastName, roleId: role.id, phoneCode: tel.codigo, phone: tel.numero,
      emailVerified: true, mustChangePassword: true,
    })
    .where(eq(users.id, created.user.id));

  await registrarAuditoria({
    userId: caller?.id ?? null, accion: 'usuario.crear', entidad: 'usuario', entidadId: created.user.id,
    detalle: `${nombre} <${email}> (${role.name})`,
  });

  return c.json({ usuario: { id: created.user.id, name: nombre, email, roleKey: role.key, roleName: role.name }, contrasenaInicial: password }, 201);
});

usuariosRoutes.patch('/:id', requirePermission('usuarios:gestionar'), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  const body = await c.req.json<{
    firstName?: string; lastName?: string; phoneCode?: string; phone?: string | null;
    roleKey?: string; isActive?: boolean;
  }>();

  const [target] = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, phoneCode: users.phoneCode, phone: users.phone, isActive: users.isActive, roleId: users.roleId, roleKey: roles.key, roleName: roles.name, deletedAt: users.deletedAt })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id));
  if (!target || target.deletedAt) return c.json({ error: 'no_encontrado' }, 404);

  const callerIsSuper = caller?.roleKey === 'superadmin';
  if (target.roleKey === 'superadmin' && !callerIsSuper) {
    return c.json({ error: 'sin_permiso', message: 'Solo el superadmin puede modificar al superadmin.' }, 403);
  }
  if (body.isActive === false && caller?.id === id) {
    return c.json({ error: 'auto_desactivacion', message: 'No puedes desactivar tu propia cuenta.' }, 422);
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  const cambios: Record<string, unknown> = {};

  if (body.firstName !== undefined || body.lastName !== undefined) {
    const firstName = (body.firstName ?? target.firstName ?? '').trim();
    const lastName = (body.lastName ?? target.lastName ?? '').trim();
    if (!firstName || !lastName) return c.json({ error: 'datos_invalidos', message: 'Nombres y apellidos son obligatorios.' }, 422);
    patch.firstName = firstName;
    patch.lastName = lastName;
    patch.name = nombreCompleto(firstName, lastName);
    cambios.nombre = { de: target.firstName && target.lastName ? nombreCompleto(target.firstName, target.lastName) : null, a: patch.name };
  }
  if (body.phone !== undefined || body.phoneCode !== undefined) {
    const tel = validarTelefono(body.phoneCode ?? target.phoneCode, body.phone === undefined ? target.phone : body.phone);
    if (!tel.ok) return c.json({ error: 'telefono_invalido', message: tel.mensaje }, 422);
    patch.phoneCode = tel.codigo;
    patch.phone = tel.numero;
    cambios.telefono = { a: tel.codigo && tel.numero ? `${tel.codigo} ${tel.numero}` : null };
  }
  if (body.roleKey !== undefined && body.roleKey !== target.roleKey) {
    if (body.roleKey === 'superadmin' && !callerIsSuper) {
      return c.json({ error: 'sin_permiso', message: 'Solo el superadmin puede asignar el rol superadmin.' }, 403);
    }
    const [role] = await db.select().from(roles).where(eq(roles.key, body.roleKey));
    if (!role) return c.json({ error: 'rol_no_existe', message: 'El rol seleccionado no existe.' }, 422);
    patch.roleId = role.id;
    cambios.rol = { de: target.roleName, a: role.name };
  }
  if (typeof body.isActive === 'boolean' && body.isActive !== target.isActive) {
    patch.isActive = body.isActive;
    cambios.estado = { de: target.isActive ? 'Activo' : 'Inactivo', a: body.isActive ? 'Activo' : 'Inactivo' };
  }

  await db.update(users).set(patch).where(eq(users.id, id));
  if (Object.keys(cambios).length > 0) {
    await registrarAuditoria({
      userId: caller?.id ?? null,
      accion: typeof body.isActive === 'boolean' && Object.keys(cambios).length === 1 ? (body.isActive ? 'usuario.activar' : 'usuario.desactivar') : 'usuario.editar',
      entidad: 'usuario', entidadId: id, cambios,
    });
  }
  return c.json({ ok: true });
});

// Eliminar: limpio si la cuenta nunca tuvo actividad; lógico si ya entró o hizo cambios.
usuariosRoutes.delete('/:id', requirePermission('usuarios:gestionar'), async (c) => {
  const caller = await loadCurrentUser(c.req.raw.headers);
  const id = c.req.param('id') as string;
  if (caller?.id === id) return c.json({ error: 'auto_eliminacion', message: 'No puedes eliminar tu propia cuenta.' }, 422);

  const [target] = await db
    .select({ id: users.id, email: users.email, name: users.name, lastLoginAt: users.lastLoginAt, roleKey: roles.key })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id));
  if (!target) return c.json({ error: 'no_encontrado' }, 404);
  if (target.roleKey === 'superadmin' && caller?.roleKey !== 'superadmin') {
    return c.json({ error: 'sin_permiso', message: 'Solo el superadmin puede eliminar al superadmin.' }, 403);
  }

  const [{ acciones }] = await db
    .select({ acciones: sql<number>`count(*)::int` })
    .from(auditLog)
    .where(eq(auditLog.userId, id));
  const tuvoActividad = Boolean(target.lastLoginAt) || acciones > 0;

  if (tuvoActividad) {
    await db.update(users).set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() }).where(eq(users.id, id));
    await registrarAuditoria({
      userId: caller?.id ?? null, accion: 'usuario.eliminar_logico', entidad: 'usuario', entidadId: id,
      detalle: `${target.name} <${target.email}>`,
    });
    return c.json({ ok: true, tipo: 'logica' });
  }

  await db.delete(users).where(eq(users.id, id));
  for (const e of Object.values(FORMATOS_FOTO)) await unlink(join(CARPETA_FOTOS, `${id}.${e}`)).catch(() => undefined);
  await registrarAuditoria({
    userId: caller?.id ?? null, accion: 'usuario.eliminar', entidad: 'usuario', entidadId: id,
    detalle: `${target.name} <${target.email}> (sin actividad: borrado limpio)`,
  });
  return c.json({ ok: true, tipo: 'limpia' });
});

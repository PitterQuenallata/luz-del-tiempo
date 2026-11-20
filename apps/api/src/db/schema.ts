// Esquema de la base de datos de la API 1.
// Tablas de autenticación en formato Better Auth (usePlural: true), según docs/DATABASE.md.
// Las demás tablas (áreas, publicaciones, hero, predicadores, etc.) se agregan en pasos siguientes.

import { boolean, index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Roles del panel (docs/DATABASE.md §1). El alcance 'station' se usa para operadores de radio.
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  scope: text('scope', { enum: ['global', 'station'] }).notNull(),
  // Roles de sistema: no se pueden eliminar ni cambiar su clave (el superadmin no se edita).
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Catálogo de permisos (se siembra desde lib/permisos.ts)
export const permissions = pgTable('permissions', {
  key: text('key').primaryKey(),
  descripcion: text('descripcion').notNull(),
  grupo: text('grupo').notNull().default('general'),
});

// Permisos asignados a cada rol
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionKey: text('permission_key')
      .notNull()
      .references(() => permissions.key, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionKey] })],
);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // nombre completo (nombres + apellidos), lo usa Better Auth
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'), // ruta de la foto de perfil (null = iniciales)
  phoneCode: text('phone_code'), // p. ej. '+591'
  phone: text('phone'), // solo el número nacional (Bolivia: 8 dígitos)
  // NULL = sin acceso al panel (p. ej. usuario de la app móvil)
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  // Estado de la cuenta: activa o inactiva (se puede reactivar)
  isActive: boolean('is_active').notNull().default(true),
  // Eliminación lógica: la cuenta ya tuvo actividad y se conserva el historial
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Bitácora de actividad (docs/PLAN.md §7: audit_log)
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // quién hizo la acción
    accion: text('accion').notNull(), // p. ej. usuario.crear, sesion.iniciar
    entidad: text('entidad').notNull(), // p. ej. usuario, rol, sesion
    entidadId: text('entidad_id'),
    detalle: text('detalle'),
    cambios: jsonb('cambios'),
    fecha: timestamp('fecha', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_log_fecha_idx').on(t.fecha), index('audit_log_user_idx').on(t.userId)],
);


export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('accounts_user_id_idx').on(t.userId)],
);

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
);

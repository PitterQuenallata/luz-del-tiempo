// Esquema de la base de datos de la API 1.
// Tablas de autenticación en formato Better Auth (usePlural: true), según docs/DATABASE.md.
// Las demás tablas (áreas, publicaciones, hero, predicadores, etc.) se agregan en pasos siguientes.

import { boolean, index, integer, jsonb, pgTable, primaryKey, smallint, text, time, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

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

// ---------- Contenido de la web (docs/DATABASE.md §2) ----------

// Áreas: padre de todo el contenido (la página pública es /areas/:slug)
export const areas = pgTable('areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  template: text('template', { enum: ['hero', 'gallery', 'simple'] }).notNull().default('simple'),
  summary: text('summary'),
  content: text('content'),
  color: text('color').notNull().default('#e2a927'),
  icon: text('icon').notNull().default('radio'),
  coverUrl: text('cover_url'),
  whatsapp: text('whatsapp'),
  eventEnabled: boolean('event_enabled').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Fotos de la plantilla "texto + galería"
export const areaGallery = pgTable(
  'area_gallery',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    areaId: uuid('area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    caption: text('caption'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('area_gallery_area_idx').on(t.areaId)],
);

// Carrusel de la portada
export const heroSlides = pgTable('hero_slides', {
  id: uuid('id').primaryKey().defaultRandom(),
  eyebrow: text('eyebrow').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  ghost: jsonb('ghost').$type<string[]>().notNull(), // texto grande y tenue (3 líneas)
  ctaLabel: text('cta_label').notNull(),
  ctaTo: text('cta_to').notNull(),
  imageUrl: text('image_url'),
  tint: text('tint').notNull().default('#0b1324'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Equipo: predicadores, autores y personas de la radio (no necesariamente tienen cuenta)
export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  roleTitle: text('role_title').notNull(),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Noticias (docs/DATABASE.md §2)
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    content: text('content'),
    coverUrl: text('cover_url'),
    areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['draft', 'scheduled', 'published', 'archived'] }).notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    authorPersonId: uuid('author_person_id').references(() => people.id, { onDelete: 'set null' }),
    createdById: text('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('posts_status_idx').on(t.status, t.publishedAt)],
);

// Actividades: escuelas, talleres, campañas y estudios
export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
    type: text('type', {
      enum: ['vacation_school', 'health_school', 'music_school', 'workshop', 'health_campaign', 'bible_campaign', 'bible_study', 'other'],
    }).notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    content: text('content'),
    coverUrl: text('cover_url'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    scheduleText: text('schedule_text'),
    isVirtual: boolean('is_virtual').notNull().default(false),
    locationName: text('location_name'),
    locationAddress: text('location_address'),
    registrationType: text('registration_type', { enum: ['none', 'whatsapp', 'link'] }).notNull().default('none'),
    registrationValue: text('registration_value'),
    capacity: integer('capacity'),
    presenterPersonId: uuid('presenter_person_id').references(() => people.id, { onDelete: 'set null' }),
    cost: text('cost'),
    agenda: jsonb('agenda').$type<{ day: string; items: string[] }[]>().notNull().default([]),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('activities_starts_idx').on(t.startsAt)],
);

// Series de video (siempre pertenecen a un área)
export const videoSeries = pgTable('video_series', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  areaId: uuid('area_id')
    .notNull()
    .references(() => areas.id, { onDelete: 'restrict' }),
  youtubePlaylistId: text('youtube_playlist_id'),
  sortOrder: integer('sort_order').notNull().default(0),
});

// Videos de YouTube (siempre pertenecen a un área; la serie, si hay, debe ser de la misma área)
export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  youtubeId: text('youtube_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  areaId: uuid('area_id')
    .notNull()
    .references(() => areas.id, { onDelete: 'restrict' }),
  seriesId: uuid('series_id').references(() => videoSeries.id, { onDelete: 'set null' }),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// En vivo: una sola fila (id = 1)
export const liveStatus = pgTable('live_status', {
  id: smallint('id').primaryKey().default(1),
  isLive: boolean('is_live').notNull().default(false),
  title: text('title'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Enlaces de la transmisión: una fila por plataforma (YouTube, TikTok, Facebook, radio)
export const liveStreams = pgTable(
  'live_streams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: text('platform', { enum: ['youtube', 'tiktok', 'facebook', 'radio'] }).notNull(),
    url: text('url').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('live_streams_platform_idx').on(t.platform)],
);

// Emisoras: la principal, las del ministerio y (máximo una) externa. Sin datos de transmisión todavía.
export const stations = pgTable('stations', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  genre: text('genre'),
  kind: text('kind', { enum: ['own', 'external'] }).notNull().default('own'),
  imageUrl: text('image_url'), // foto de la emisora (16:9)
  // Qué suena en las franjas sin programa: música, historias, ambas o nada (configurable por emisora)
  relleno: text('relleno', { enum: ['ninguno', 'musica', 'historias', 'musica_historias'] }).notNull().default('musica'),
  isMain: boolean('is_main').notNull().default(false),
  areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
  operatedByName: text('operated_by_name'),
  visibleInMinistry: boolean('visible_in_ministry').notNull().default(true),
  status: text('status', { enum: ['active', 'suspended', 'disabled'] }).notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Programas de una emisora y sus franjas semanales
export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id')
    .notNull()
    .references(() => stations.id, { onDelete: 'cascade' }),
  areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  hostName: text('host_name'),
  isActive: boolean('is_active').notNull().default(true),
});

export const programSlots = pgTable(
  'program_slots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id, { onDelete: 'cascade' }),
    dayOfWeek: smallint('day_of_week').notNull(), // 0 = domingo … 6 = sábado
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    isLive: boolean('is_live').notNull().default(false),
  },
  (t) => [index('program_slots_program_idx').on(t.programId)],
);

// Ajustes del sitio en pares clave/valor (donaciones: métodos y necesidades)
export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

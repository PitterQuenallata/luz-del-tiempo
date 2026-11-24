// Esquema de la base de datos de la API 1.
// Tablas de autenticación en formato Better Auth (usePlural: true), según docs/DATABASE.md.
// Las demás tablas (áreas, publicaciones, hero, predicadores, etc.) se agregan en pasos siguientes.

import { boolean, index, integer, jsonb, pgTable, primaryKey, smallint, text, time, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { AGENDA_CANALES, AGENDA_ROLES, AGENDA_TIPOS } from '@luz/shared';

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

// ---------- Agenda (actividades): campañas, escuelas, talleres, cursos, eventos ----------
// Una actividad tiene sesiones (fechas y lugar), programa por sesión, personas con rol,
// canales de inscripción (web, WhatsApp, correo, enlace), inscritos, galería y crónica.

// Sedes y lugares donde se realizan las sesiones
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  mapUrl: text('map_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    kind: text('kind', { enum: AGENDA_TIPOS }).notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    content: text('content'), // descripción completa
    coverUrl: text('cover_url'),
    report: text('report'), // crónica: qué se hizo (se llena después de la actividad)
    language: text('language').notNull().default('es'),
    isVirtual: boolean('is_virtual').notNull().default(false),
    isFree: boolean('is_free').notNull().default(true),
    priceAmount: integer('price_amount'), // en bolivianos, entero
    priceNote: text('price_note'),
    capacity: integer('capacity'),
    // QR subido por el ministerio (p. ej. el QR del banco para pagar). El de inscripción se genera solo.
    qrUrl: text('qr_url'),
    status: text('status', { enum: ['borrador', 'publicada', 'cancelada'] }).notNull().default('borrador'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('activities_status_idx').on(t.status)],
);

// Áreas de una actividad (muchos a muchos)
export const activityAreas = pgTable(
  'activity_areas',
  {
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    areaId: uuid('area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.activityId, t.areaId] })],
);

// Fechas de la actividad: un evento tiene una sesión; una escuela o campaña, varias
export const activitySessions = pgTable(
  'activity_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
    locationNote: text('location_note'), // p. ej. "Salón 2" o un lugar que no es sede fija
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('activity_sessions_activity_idx').on(t.activityId, t.startsAt)],
);

// Programa dentro de una sesión: bloques con hora, título y quién lo presenta
export const activityProgramItems = pgTable(
  'activity_program_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => activitySessions.id, { onDelete: 'cascade' }),
    startTime: time('start_time'),
    durationMin: integer('duration_min'),
    title: text('title').notNull(),
    description: text('description'),
    personId: uuid('person_id').references(() => people.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('activity_program_session_idx').on(t.sessionId)],
);

// Personas de la actividad con su rol (predicador, invitado, traductor...). Muchas por actividad.
export const activityPeople = pgTable(
  'activity_people',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    personId: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    role: text('role', { enum: AGENDA_ROLES }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('activity_people_activity_idx').on(t.activityId)],
);

// Canales de inscripción: una fila por canal (web, WhatsApp, correo, enlace). Se pueden activar varios.
export const activityChannels = pgTable(
  'activity_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    channel: text('channel', { enum: AGENDA_CANALES }).notNull(),
    value: text('value'), // número de WhatsApp, correo o enlace (vacío para la web)
    enabled: boolean('enabled').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('activity_channels_unique_idx').on(t.activityId, t.channel)],
);

// Inscritos: los que se inscriben por la web y los que el panel anota a mano
export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    phoneCode: text('phone_code'),
    phone: text('phone'),
    email: text('email'),
    origin: text('origin', { enum: ['web', 'app', 'manual'] }).notNull().default('web'),
    status: text('status', { enum: ['pendiente', 'confirmada', 'cancelada', 'asistio'] }).notNull().default('pendiente'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('registrations_activity_idx').on(t.activityId)],
);

// Galería de fotos de la actividad (después de realizarla)
export const activityGallery = pgTable(
  'activity_gallery',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    caption: text('caption'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('activity_gallery_activity_idx').on(t.activityId)],
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

// Emisora (contenedor): «Radio La Luz del Tiempo», o la de un tercero. Dentro tiene sus estaciones.
// Lleva el archivo de la emisora y sus listas de producción, que todas sus estaciones pueden usar.
export const radios = pgTable('radios', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  genre: text('genre'),
  imageUrl: text('image_url'),
  kind: text('kind', { enum: ['own', 'external'] }).notNull().default('own'),
  isMain: boolean('is_main').notNull().default(false),
  areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
  operatedByName: text('operated_by_name'),
  // Responsable de una emisora externa: su usuario solo ve esta emisora y su única estación
  ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  visibleInMinistry: boolean('visible_in_ministry').notNull().default(true),
  status: text('status', { enum: ['draft', 'active', 'suspended', 'disabled'] }).notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Estaciones: cada una transmite (mount, contraseña), tiene su AutoDJ y su archivo, y pertenece a una emisora.
export const stations = pgTable('stations', {
  id: uuid('id').primaryKey().defaultRandom(),
  radioId: uuid('radio_id').notNull().references(() => radios.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  genre: text('genre'),
  kind: text('kind', { enum: ['own', 'external'] }).notNull().default('own'),
  imageUrl: text('image_url'), // foto de la emisora (16:9)
  // Transmisión (Icecast/Liquidsoap en la radio-api). Sin mount no hay transmisión.
  mountPoint: text('mount_point').unique(),
  livePasswordEnc: text('live_password_enc'), // AES-256-GCM; nunca sale de la API
  bitrateKbps: smallint('bitrate_kbps').notNull().default(128),
  autodjEnabled: boolean('autodj_enabled').notNull().default(true),
  maxListeners: integer('max_listeners').notNull().default(100),
  storageQuotaMb: integer('storage_quota_mb').notNull().default(5120),
  // Qué suena en las franjas sin programa: música, historias, ambas o nada (configurable por emisora)
  // Interruptor de la emisora («al aire» / «apagada»). Con la radio completa apagada, no suena aunque esté en true.
  encendida: boolean('encendida').notNull().default(true),
  isMain: boolean('is_main').notNull().default(false),
  areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
  operatedByName: text('operated_by_name'),
  // Nombre de salida que ven los oyentes (Icecast). Vacío = «Radio La Luz del Tiempo - <nombre>»
  streamName: text('stream_name'),
  visibleInMinistry: boolean('visible_in_ministry').notNull().default(true),
  status: text('status', { enum: ['draft', 'active', 'suspended', 'disabled'] }).notNull().default('active'),
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

// Audios del AutoDJ de una emisora. El archivo vive en la radio-api (storage_key = nombre en disco).
// Ajustes globales de la radio (una sola fila): interruptor de toda la radio.
export const radioAjustes = pgTable('radio_ajustes', {
  id: text('id').primaryKey(), // siempre 'global'
  encendida: boolean('encendida').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stationTracks = pgTable(
  'station_tracks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Archivo de la ESTACIÓN (stationId) o archivo de la EMISORA entera (radioId). Siempre uno de los dos.
    stationId: uuid('station_id').references(() => stations.id, { onDelete: 'cascade' }),
    radioId: uuid('radio_id').references(() => radios.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    title: text('title').notNull(),
    artist: text('artist'),
    album: text('album'),
    year: smallint('year'),
    genre: text('genre'),
    // Carpeta del panel (organización, no afecta a la radio). '' = sin carpeta
    folder: text('folder').notNull().default(''),
    durationSec: integer('duration_sec'),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('station_tracks_key_idx').on(t.stationId, t.storageKey)],
);

// Playlists del AutoDJ. Modos (lenguaje del panel):
// - rotacion: se mezcla con otras playlists según su peso (p. ej. 70 % música, 30 % historias)
// - secuencial: suena en el orden fijo de la lista
// - programada: solo suena en los horarios que se le asignan
export const stationPlaylists = pgTable(
  'station_playlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Lista de la ESTACIÓN (stationId) o lista de la EMISORA (radioId), que sus estaciones pueden activar. Siempre una de las dos.
    stationId: uuid('station_id').references(() => stations.id, { onDelete: 'cascade' }),
    radioId: uuid('radio_id').references(() => radios.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    mode: text('mode', { enum: ['rotacion', 'secuencial', 'programada'] }).notNull().default('rotacion'),
    weight: smallint('weight').notNull().default(50), // 1–100, solo en modo rotación
    shuffle: boolean('shuffle').notNull().default(true), // en rotación/programada: orden aleatorio
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('station_playlists_station_idx').on(t.stationId)],
);

// Qué emisoras propias usan cada playlist de la biblioteca institucional
export const stationPlaylistLinks = pgTable(
  'station_playlist_links',
  {
    stationId: uuid('station_id')
      .notNull()
      .references(() => stations.id, { onDelete: 'cascade' }),
    playlistId: uuid('playlist_id')
      .notNull()
      .references(() => stationPlaylists.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.stationId, t.playlistId] })],
);

export const playlistTracks = pgTable(
  'playlist_tracks',
  {
    playlistId: uuid('playlist_id')
      .notNull()
      .references(() => stationPlaylists.id, { onDelete: 'cascade' }),
    trackId: uuid('track_id')
      .notNull()
      .references(() => stationTracks.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (t) => [primaryKey({ columns: [t.playlistId, t.trackId] }), index('playlist_tracks_position_idx').on(t.playlistId, t.position)],
);

export const playlistSchedules = pgTable(
  'playlist_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playlistId: uuid('playlist_id')
      .notNull()
      .references(() => stationPlaylists.id, { onDelete: 'cascade' }),
    dayOfWeek: smallint('day_of_week').notNull(), // 0 = domingo … 6 = sábado
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
  },
  (t) => [index('playlist_schedules_playlist_idx').on(t.playlistId)],
);

// Muestras de oyentes (una cada 1–5 min, leídas de Icecast por la radio-api)
export const stationListenerSamples = pgTable(
  'station_listener_samples',
  {
    stationId: uuid('station_id')
      .notNull()
      .references(() => stations.id, { onDelete: 'cascade' }),
    sampledAt: timestamp('sampled_at', { withTimezone: true }).notNull(),
    listeners: integer('listeners').notNull(),
  },
  (t) => [primaryKey({ columns: [t.stationId, t.sampledAt] })],
);

// Locutores autorizados: qué usuarios pueden transmitir con el emisor en cada emisora.
// Quien tiene "estaciones:todas" puede transmitir en todas sin estar en esta lista.
export const stationBroadcasters = pgTable(
  'station_broadcasters',
  {
    stationId: uuid('station_id')
      .notNull()
      .references(() => stations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.stationId, t.userId] })],
);

// Transmisiones hechas con el emisor: quién, desde qué PC, en qué emisora y cómo fue.
// El emisor avisa al empezar, cada 60 s y al terminar. Sin aviso por 150 s se da por terminada.
export const broadcastSessions = pgTable(
  'broadcast_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stationId: uuid('station_id')
      .notNull()
      .references(() => stations.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    equipo: text('equipo'), // nombre de la PC
    ip: text('ip'),
    version: text('version'), // versión del emisor
    sistema: text('sistema'), // p. ej. windows
    programa: text('programa'),
    estado: text('estado', { enum: ['conectando', 'al_aire', 'reconectando'] }).notNull().default('conectando'),
    kbps: smallint('kbps'),
    cortes: integer('cortes').notNull().default(0),
    silencios: integer('silencios').notNull().default(0),
    saturaciones: integer('saturaciones').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    motivoFin: text('motivo_fin'),
  },
  (t) => [index('broadcast_sessions_station_idx').on(t.stationId, t.startedAt), index('broadcast_sessions_activa_idx').on(t.endedAt)],
);

// Ajustes del sitio en pares clave/valor (donaciones: métodos y necesidades)
export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Esquemas y reglas compartidos por la API (apps/api) y el panel (apps/panel).
// Un solo archivo a propósito: se importa directamente desde TypeScript en ambos lados.
import { z } from 'zod';

export type { ZodError } from 'zod';

// ---------- Teléfono por país ----------
export interface Pais {
  codigo: string; // +591
  iso: string; // BO
  nombre: string;
  digitosMin: number;
  digitosMax: number;
}

export const PAISES: Pais[] = [
  { codigo: '+591', iso: 'BO', nombre: 'Bolivia', digitosMin: 8, digitosMax: 8 },
  { codigo: '+51', iso: 'PE', nombre: 'Perú', digitosMin: 9, digitosMax: 9 },
  { codigo: '+54', iso: 'AR', nombre: 'Argentina', digitosMin: 10, digitosMax: 10 },
  { codigo: '+55', iso: 'BR', nombre: 'Brasil', digitosMin: 10, digitosMax: 11 },
  { codigo: '+56', iso: 'CL', nombre: 'Chile', digitosMin: 9, digitosMax: 9 },
  { codigo: '+57', iso: 'CO', nombre: 'Colombia', digitosMin: 10, digitosMax: 10 },
  { codigo: '+593', iso: 'EC', nombre: 'Ecuador', digitosMin: 9, digitosMax: 9 },
  { codigo: '+595', iso: 'PY', nombre: 'Paraguay', digitosMin: 9, digitosMax: 9 },
  { codigo: '+598', iso: 'UY', nombre: 'Uruguay', digitosMin: 8, digitosMax: 8 },
  { codigo: '+34', iso: 'ES', nombre: 'España', digitosMin: 9, digitosMax: 9 },
  { codigo: '+52', iso: 'MX', nombre: 'México', digitosMin: 10, digitosMax: 10 },
  { codigo: '+1', iso: 'US', nombre: 'Estados Unidos', digitosMin: 10, digitosMax: 10 },
];

export const PAIS_PREDETERMINADO = '+591';

export const paisDe = (codigo: string | null | undefined) => PAISES.find((p) => p.codigo === codigo);

// Solo dígitos del número nacional
export const soloDigitos = (texto: string) => texto.replace(/\D/g, '');

// ---------- Nombres ----------
// Espacios limpios y cada palabra con inicial mayúscula: "  mamani   CHOQUE-lópez " -> "Mamani Choque-López"
export function normalizarNombre(texto: string): string {
  return texto
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s'-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('es'));
}

// Contraseña inicial: primer apellido con inicial mayúscula + "*." Ej.: "QUISPE mamani" -> "Quispe*."
export function contrasenaInicial(apellidos: string): string {
  const primero = normalizarNombre(apellidos).split(' ')[0] ?? '';
  return `${primero}*.`;
}

const NOMBRE_RE = /^\p{L}[\p{L}' .-]*\p{L}$/u;

export const nombreSchema = (campo: string) =>
  z
    .string({ required_error: `${campo} es obligatorio.` })
    .transform((v) => normalizarNombre(v))
    .pipe(
      z
        .string()
        .min(1, `${campo} es obligatorio.`)
        .min(2, `${campo} debe tener al menos 2 letras.`)
        .max(60, `${campo} no puede pasar de 60 caracteres.`)
        .regex(NOMBRE_RE, `${campo} solo puede tener letras, espacios, guion y apóstrofe.`)
    );

// ---------- Correo ----------
export const emailSchema = z
  .string({ required_error: 'El correo es obligatorio.' })
  .transform((v) => v.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, 'El correo es obligatorio.')
      .max(254, 'El correo no puede pasar de 254 caracteres.')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'El correo no es válido.')
  );

// ---------- Teléfono (código + número) ----------
// Número opcional: si viene vacío no se valida. Si viene, debe cumplir el país.
export function validarTelefono(codigo: string, numero: string): string | null {
  if (!numero) return null;
  const pais = paisDe(codigo);
  if (!pais) return 'Elige un código de país válido.';
  const largo = soloDigitos(numero).length;
  if (largo < pais.digitosMin || largo > pais.digitosMax) {
    return pais.digitosMin === pais.digitosMax
      ? `El número de ${pais.nombre} debe tener ${pais.digitosMin} dígitos.`
      : `El número de ${pais.nombre} debe tener entre ${pais.digitosMin} y ${pais.digitosMax} dígitos.`;
  }
  return null;
}

// ---------- Esquemas de formulario ----------
const telefonoRefine = <T extends { phoneCode: string; phone: string }>(schema: z.ZodType<T>) =>
  schema.superRefine((datos, ctx) => {
    const error = validarTelefono(datos.phoneCode, datos.phone);
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: error });
  });

// Alta de usuario
export const usuarioAltaSchema = telefonoRefine(
  z.object({
    firstName: nombreSchema('Nombres'),
    lastName: nombreSchema('Apellidos'),
    email: emailSchema,
    phoneCode: z.string().min(1, 'Elige un código de país.'),
    phone: z.string(),
    roleKey: z.string({ required_error: 'Elige un rol.' }).min(1, 'Elige un rol.'),
  })
);

// Datos personales (detalle de usuario y perfil propio)
export const datosPersonalesSchema = telefonoRefine(
  z.object({
    firstName: nombreSchema('Nombres'),
    lastName: nombreSchema('Apellidos'),
    phoneCode: z.string().min(1, 'Elige un código de país.'),
    phone: z.string(),
  })
);

// Cambio de contraseña (primer ingreso y perfil)
export const cambioContrasenaSchema = z
  .object({
    actual: z.string().min(1, 'Escribe tu contraseña actual.'),
    nueva: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
      .max(128, 'La nueva contraseña es demasiado larga.'),
    repetir: z.string().min(1, 'Repite la nueva contraseña.'),
  })
  .superRefine((datos, ctx) => {
    if (datos.nueva && datos.nueva === datos.actual) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nueva'], message: 'La nueva contraseña debe ser distinta de la actual.' });
    }
    if (datos.repetir && datos.repetir !== datos.nueva) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['repetir'], message: 'Las contraseñas no coinciden.' });
    }
  });

// Rol: clave, nombre y descripción
export const rolSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{1,40}$/, 'Usa letras minúsculas, números o guion bajo, y empieza con letra.'),
  name: nombreSchema('El nombre'),
  description: z.string().max(200, 'La descripción no puede pasar de 200 caracteres.').optional(),
});

// Edición de usuario desde el panel (datos personales, rol y estado)
export const usuarioEditarSchema = telefonoRefine(
  z.object({
    firstName: nombreSchema('Nombres'),
    lastName: nombreSchema('Apellidos'),
    phoneCode: z.string().min(1, 'Elige un código de país.'),
    phone: z.string(),
    roleKey: z.string().min(1, 'Elige un rol.'),
    isActive: z.boolean(),
  })
);

// ---------- Contenido de la web (docs/DATABASE.md §2) ----------

export const AREA_TEMPLATES = ['hero', 'gallery', 'simple'] as const;
export const AREA_ICONOS = ['health', 'music', 'bible', 'kids', 'family', 'radio'] as const;

const slugSchema = z
  .string()
  .min(1, 'El enlace (slug) es obligatorio.')
  .max(60, 'El enlace no puede pasar de 60 caracteres.')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Usa solo minúsculas, números y guiones (ej. escuela-salud).');

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'El color debe tener formato #rrggbb.');

// Portada: diapositiva del carrusel
export const heroSchema = z.object({
  eyebrow: z.string().trim().min(1, 'El texto superior es obligatorio.').max(60, 'Máximo 60 caracteres.'),
  title: z.string().trim().min(1, 'El título es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  subtitle: z.string().trim().min(1, 'El subtítulo es obligatorio.').max(300, 'Máximo 300 caracteres.'),
  ghost: z.tuple([
    z.string().trim().max(30, 'Máximo 30 caracteres.'),
    z.string().trim().max(30, 'Máximo 30 caracteres.'),
    z.string().trim().max(30, 'Máximo 30 caracteres.'),
  ]),
  ctaLabel: z.string().trim().min(1, 'El texto del botón es obligatorio.').max(40, 'Máximo 40 caracteres.'),
  ctaTo: z.string().trim().min(1, 'El enlace del botón es obligatorio.').max(200, 'Máximo 200 caracteres.'),
  imageUrl: z.string().nullable(),
  tint: colorSchema,
  sortOrder: z.number().int().min(0),
  isPublished: z.boolean(),
});

// Áreas
export const areaSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 letras.').max(80, 'Máximo 80 caracteres.'),
  template: z.enum(AREA_TEMPLATES, { errorMap: () => ({ message: 'Elige una plantilla.' }) }),
  summary: z.string().trim().max(200, 'Máximo 200 caracteres.').nullable(),
  content: z.string().trim().max(5000, 'Máximo 5000 caracteres.').nullable(),
  color: colorSchema,
  icon: z.enum(AREA_ICONOS, { errorMap: () => ({ message: 'Elige un ícono.' }) }),
  coverUrl: z.string().nullable(),
  whatsapp: z.string().trim().regex(/^\+?[0-9 ]{7,20}$/, 'Revisa el número de WhatsApp.').nullable(),
  eventEnabled: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0),
});

// Personas: predicadores, autores y equipo
export const personaSchema = z.object({
  name: nombreSchema('El nombre'),
  roleTitle: z.string().trim().min(2, 'El cargo es obligatorio.').max(80, 'Máximo 80 caracteres.'),
  bio: z.string().trim().max(600, 'Máximo 600 caracteres.').nullable(),
  photoUrl: z.string().nullable(),
  sortOrder: z.number().int().min(0),
  isPublished: z.boolean(),
});

export type HeroInput = z.infer<typeof heroSchema>;
export type AreaInput = z.infer<typeof areaSchema>;
export type PersonaInput = z.infer<typeof personaSchema>;

// ---------- Gestión de contenido: noticias, actividades, videos, en vivo, emisoras, donaciones ----------

const uuidSchema = z.string().uuid('Elige una opción válida.');
const fechaIso = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Revisa la fecha.');
const horaSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa formato HH:MM.');
const opcionalTexto = (max: number, mensaje: string) => z.string().trim().max(max, mensaje).nullable();

export const POST_ESTADOS = ['draft', 'scheduled', 'published', 'archived'] as const;

// Noticias
export const postSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(2, 'El título debe tener al menos 2 letras.').max(140, 'Máximo 140 caracteres.'),
    excerpt: opcionalTexto(300, 'Máximo 300 caracteres.'),
    content: opcionalTexto(20000, 'Máximo 20 000 caracteres.'),
    coverUrl: z.string().nullable(),
    areaId: uuidSchema.nullable(),
    status: z.enum(POST_ESTADOS),
    publishedAt: fechaIso.nullable(),
    authorPersonId: uuidSchema.nullable(),
  })
  .refine((d) => d.status === 'draft' || d.status === 'archived' || d.publishedAt, {
    message: 'Pon la fecha de publicación.',
    path: ['publishedAt'],
  });

// ---------- Agenda ----------
// Tipo = qué es la actividad. Área = el tema (se elige aparte, puede ser más de una).
export const AGENDA_TIPOS = [
  'campana_evangelistica', 'escuela_vacaciones', 'expo_salud', 'seminario', 'dia_impacto',
  'taller', 'curso', 'estudio_biblico', 'evento', 'otro',
] as const;
export type AgendaTipo = (typeof AGENDA_TIPOS)[number];
export const AGENDA_TIPO_ETIQUETA: Record<AgendaTipo, string> = {
  campana_evangelistica: 'Campaña evangelística',
  escuela_vacaciones: 'Escuela de vacaciones',
  expo_salud: 'Expo de salud',
  seminario: 'Seminario',
  dia_impacto: 'Día de impacto',
  taller: 'Taller',
  curso: 'Curso',
  estudio_biblico: 'Estudio bíblico',
  evento: 'Evento especial',
  otro: 'Otra actividad',
};

// Papel de cada persona en la actividad. Una actividad puede tener muchas.
export const AGENDA_ROLES = ['predicador', 'invitado', 'traductor', 'moderador', 'musica', 'maestro', 'otro'] as const;
export type AgendaRol = (typeof AGENDA_ROLES)[number];
export const AGENDA_ROL_ETIQUETA: Record<AgendaRol, string> = {
  predicador: 'Predicador',
  invitado: 'Invitado',
  traductor: 'Traductor',
  moderador: 'Moderador',
  musica: 'Música',
  maestro: 'Maestro',
  otro: 'Otro',
};

// Cómo se inscriben: se pueden activar varios a la vez
export const AGENDA_CANALES = ['web', 'app', 'whatsapp', 'correo', 'enlace'] as const;
export type AgendaCanal = (typeof AGENDA_CANALES)[number];
export const AGENDA_CANAL_ETIQUETA: Record<AgendaCanal, string> = {
  web: 'Formulario en la web',
  app: 'Formulario en la app',
  whatsapp: 'Inscripción por WhatsApp',
  correo: 'Inscripción por correo',
  enlace: 'Inscripción por enlace',
};

export const AGENDA_ESTADOS = ['borrador', 'publicada', 'cancelada'] as const;
export const INSCRIPCION_ESTADOS = ['pendiente', 'confirmada', 'cancelada', 'asistio'] as const;

const horaHHMM = z.string().regex(/^\d{2}:\d{2}$/, 'Usa la hora en formato HH:MM.');

const sesionSchema = z
  .object({
    id: uuidSchema.optional(),
    startsAt: fechaIso,
    endsAt: fechaIso.nullable(),
    locationId: uuidSchema.nullable(),
    locationNote: opcionalTexto(120, 'Máximo 120 caracteres.'),
    programa: z
      .array(
        z.object({
          startTime: horaHHMM.nullable(),
          durationMin: z.number().int().positive().max(1440).nullable(),
          title: z.string().trim().min(1, 'Escribe el título del bloque.').max(160, 'Máximo 160 caracteres.'),
          description: opcionalTexto(500, 'Máximo 500 caracteres.'),
          personId: uuidSchema.nullable(),
        }),
      )
      .max(60, 'Máximo 60 bloques por sesión.'),
  })
  .refine((s) => !s.endsAt || Date.parse(s.endsAt) >= Date.parse(s.startsAt), {
    message: 'La hora de fin no puede ser antes del inicio.',
    path: ['endsAt'],
  });

export const actividadSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(2, 'El título debe tener al menos 2 letras.').max(140, 'Máximo 140 caracteres.'),
    kind: z.enum(AGENDA_TIPOS),
    areaIds: z.array(uuidSchema).max(10, 'Máximo 10 áreas.'),
    summary: opcionalTexto(300, 'Máximo 300 caracteres.'),
    content: opcionalTexto(20000, 'Máximo 20 000 caracteres.'),
    coverUrl: z.string().nullable(),
    report: opcionalTexto(20000, 'Máximo 20 000 caracteres.'),
    language: z.enum(['es', 'en', 'pt']),
    isVirtual: z.boolean(),
    isFree: z.boolean(),
    priceAmount: z.number().int().min(0, 'El precio no puede ser negativo.').nullable(),
    priceNote: opcionalTexto(160, 'Máximo 160 caracteres.'),
    capacity: z.number().int().positive('La capacidad debe ser mayor que cero.').nullable(),
    qrUrl: z.string().nullable(),
    status: z.enum(AGENDA_ESTADOS),
    sesiones: z.array(sesionSchema).min(1, 'Agrega al menos una fecha.').max(60, 'Máximo 60 sesiones.'),
    personas: z
      .array(
        z.object({
          personId: uuidSchema,
          role: z.enum(AGENDA_ROLES),
        }),
      )
      .max(50, 'Máximo 50 personas.'),
    canales: z
      .array(
        z.object({
          channel: z.enum(AGENDA_CANALES),
          value: opcionalTexto(300, 'Máximo 300 caracteres.'),
          enabled: z.boolean(),
        }),
      )
      .max(5),
    galeria: z
      .array(z.object({ imageUrl: z.string().min(1), caption: opcionalTexto(160, 'Máximo 160 caracteres.') }))
      .max(60, 'Máximo 60 fotos.'),
  })
  .refine((d) => !d.isFree || d.priceAmount === null || d.priceAmount === 0, {
    message: 'Si es gratis, deja el precio vacío.',
    path: ['priceAmount'],
  })
  .refine((d) => d.isFree || (d.priceAmount !== null && d.priceAmount > 0), {
    message: 'Pon el precio de la actividad.',
    path: ['priceAmount'],
  })
  .refine(
    (d) => d.canales.every((c) => !c.enabled || (c.channel === 'web' || c.channel === 'app') || (c.value && c.value.trim().length > 0)),
    { message: 'Escribe el número, correo o enlace del canal activado.', path: ['canales'] },
  );

// Inscripción pública (desde la web o la app)
export const inscripcionPublicaSchema = z.object({
  fullName: z.string().trim().min(3, 'Escribe tu nombre completo.').max(120, 'Máximo 120 caracteres.'),
  phoneCode: z.string().trim().max(6).optional().default('+591'),
  phone: z.string().trim().max(20).optional().default(''),
  email: z.string().trim().max(160).optional().default(''),
});

// Inscripción anotada a mano por el panel
export const inscripcionManualSchema = inscripcionPublicaSchema.extend({
  status: z.enum(INSCRIPCION_ESTADOS).default('confirmada'),
  notes: opcionalTexto(300, 'Máximo 300 caracteres.'),
});

// Series de video y videos
export const serieSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 letras.').max(120, 'Máximo 120 caracteres.'),
  description: opcionalTexto(500, 'Máximo 500 caracteres.'),
  areaId: uuidSchema,
  youtubePlaylistId: opcionalTexto(60, 'Máximo 60 caracteres.'),
  sortOrder: z.number().int().min(0),
});

// Acepta el ID (11 caracteres) o un enlace de YouTube, y devuelve solo el ID
export const youtubeIdDe = (texto: string): string | null => {
  const t = texto.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
  const m = t.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

export const videoSchema = z.object({
  youtubeId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{11}$/, 'Pega el enlace de YouTube o su ID de 11 caracteres.'),
  title: z.string().trim().min(2, 'El título debe tener al menos 2 letras.').max(160, 'Máximo 160 caracteres.'),
  description: opcionalTexto(2000, 'Máximo 2000 caracteres.'),
  areaId: uuidSchema,
  seriesId: uuidSchema.nullable(),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  publishedAt: fechaIso.nullable(),
});

// En vivo: interruptor general, título y un enlace por plataforma
export const PLATAFORMAS_EN_VIVO = ['youtube', 'tiktok', 'facebook', 'radio'] as const;
export const PLATAFORMA_ETIQUETA: Record<(typeof PLATAFORMAS_EN_VIVO)[number], string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  radio: 'Radio',
};

export const transmisionSchema = z.object({
  platform: z.enum(PLATAFORMAS_EN_VIVO),
  url: z.string().trim().url('Revisa el enlace de la transmisión.'),
});

export const enVivoSchema = z
  .object({
    isLive: z.boolean(),
    title: opcionalTexto(120, 'Máximo 120 caracteres.'),
    streams: z.array(transmisionSchema).max(4),
  })
  .refine((d) => new Set(d.streams.map((t) => t.platform)).size === d.streams.length, {
    message: 'Cada plataforma solo puede aparecer una vez.',
    path: ['streams'],
  })
  .refine((d) => !d.isLive || d.streams.length > 0, {
    message: 'Para estar en vivo agrega al menos un enlace.',
    path: ['streams'],
  });

// Emisoras y programación
// Emisora: el contenedor (p. ej. «Radio La Luz del Tiempo», o la de un tercero). Dentro tiene sus estaciones.
export const radioSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 letras.').max(80, 'Máximo 80 caracteres.'),
    description: opcionalTexto(500, 'Máximo 500 caracteres.'),
    genre: opcionalTexto(60, 'Máximo 60 caracteres.'),
    kind: z.enum(['own', 'external']),
    imageUrl: z.string().nullable(),
    isMain: z.boolean(),
    areaId: uuidSchema.nullable(),
    operatedByName: opcionalTexto(80, 'Máximo 80 caracteres.'),
    // Usuario responsable de una emisora externa: solo ve esta emisora y su única estación
    ownerUserId: z.string().nullable().optional(),
    visibleInMinistry: z.boolean(),
    status: z.enum(['draft', 'active', 'suspended', 'disabled']),
    sortOrder: z.number().int().min(0),
    contactName: opcionalTexto(80, 'Máximo 80 caracteres.'),
    contactPhone: opcionalTexto(30, 'Máximo 30 caracteres.'),
    contactEmail: z.string().trim().email('Revisa el correo.').nullable().or(z.literal('').transform(() => null)),
    notes: opcionalTexto(1000, 'Máximo 1000 caracteres.'),
  })
  .refine((d) => d.kind !== 'external' || !d.isMain, {
    message: 'Una emisora externa no puede ser la principal.',
    path: ['isMain'],
  });

// Estación: lo que transmite dentro de una emisora (con su AutoDJ y su archivo).
export const estacionSchema = z.object({
  radioId: uuidSchema,
  slug: slugSchema,
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 letras.').max(80, 'Máximo 80 caracteres.'),
  status: z.enum(['draft', 'active', 'suspended', 'disabled']),
  // Crear AutoDJ (su propia lista de música). Desmarcado = solo transmisión, sin música automática.
  autodjEnabled: z.boolean(),
  visibleInMinistry: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export const programaSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 letras.').max(120, 'Máximo 120 caracteres.'),
  description: opcionalTexto(500, 'Máximo 500 caracteres.'),
  hostName: opcionalTexto(80, 'Máximo 80 caracteres.'),
  areaId: uuidSchema.nullable(),
  isActive: z.boolean(),
});

export const franjaSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: horaSchema,
    endTime: horaSchema,
    isLive: z.boolean(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'La hora de fin debe ser después del inicio. Si cruza la medianoche, crea dos franjas.',
    path: ['endTime'],
  });

// Transmisión de una emisora: lo que necesita quien va a transmitir (mount, contraseña, AutoDJ, límites)
export const emisionSchema = z.object({
  mountPoint: z
    .string()
    .trim()
    .regex(/^\/[a-z0-9][a-z0-9-]{0,39}$/, 'Usa minúsculas, números y guiones, empezando con /. Ej.: /salud'),
  // Solo se envía cuando se cambia. Vacío = conservar la actual.
  livePassword: z.string().min(8, 'La contraseña tiene al menos 8 caracteres.').max(128).optional(),
  bitrateKbps: z.number().int().min(32, 'Mínimo 32 kbps.').max(320, 'Máximo 320 kbps.'),
  autodjEnabled: z.boolean(),
  maxListeners: z.number().int().min(1, 'Mínimo 1 oyente.').max(2000, 'Máximo 2000 oyentes.'),
  storageQuotaMb: z.number().int().min(100, 'Mínimo 100 MB.').max(10240, 'Máximo 10 GB.'),
  // Nombre de salida (lo que ve el oyente). Vacío = «Radio La Luz del Tiempo - <nombre de la emisora>»
  streamName: z.string().trim().max(80, 'Máximo 80 caracteres.').optional(),
});

// Nombre de salida por defecto: «Radio La Luz del Tiempo - <emisora>». Si la emisora ya lleva ese nombre, no se repite.
export const nombreSalidaPorDefecto = (emisora: string) =>
  /radio la luz del tiempo/i.test(emisora) ? emisora.trim() : `Radio La Luz del Tiempo - ${emisora.trim()}`;

// Audios del AutoDJ: el título sale del nombre del archivo y se puede corregir
export const pistaEditarSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  artist: opcionalTexto(120, 'Máximo 120 caracteres.').optional(),
  album: opcionalTexto(120, 'Máximo 120 caracteres.').optional(),
  year: z.number().int('El año debe ser un número entero.').min(1900, 'Año no válido.').max(2100, 'Año no válido.').nullable().optional(),
  genre: opcionalTexto(60, 'Máximo 60 caracteres.').optional(),
  folder: z.string().trim().max(80, 'Máximo 80 caracteres.').optional(),
});

// Encender o apagar: una emisora o toda la radio
export const interruptorSchema = z.object({ encendida: z.boolean() });
// Usar o dejar de usar una playlist de la biblioteca en una emisora
export const usoPlaylistSchema = z.object({ usar: z.boolean() });
// Playlist nueva: de la estación, o de la emisora entera (que sus estaciones pueden activar)
export const ambitoSchema = z.enum(['estacion', 'emisora']);

export const pistasCarpetaSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'Elige al menos un audio.').max(2000),
  folder: z.string().trim().max(80, 'Máximo 80 caracteres.'),
});

export const MODOS_PLAYLIST = ['rotacion', 'secuencial', 'programada'] as const;

export const horarioPlaylistSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: horaSchema,
    endTime: horaSchema,
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'La hora de fin debe ser después del inicio. Si cruza la medianoche, crea dos horarios.',
    path: ['endTime'],
  });

// Playlist del AutoDJ. El modo decide cómo suena (ver "Cómo suena" en el panel).
export const playlistSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 letras.').max(80, 'Máximo 80 caracteres.'),
    description: opcionalTexto(300, 'Máximo 300 caracteres.').optional(),
    mode: z.enum(MODOS_PLAYLIST),
    weight: z.number().int().min(1, 'Mínimo 1.').max(100, 'Máximo 100.'),
    isActive: z.boolean(),
    trackIds: z.array(uuidSchema).max(5000, 'Máximo 5000 audios por playlist.'),
    schedules: z.array(horarioPlaylistSchema).max(50, 'Máximo 50 horarios.'),
  })
  .refine((d) => d.mode !== 'programada' || d.schedules.length > 0, {
    message: 'Una playlist programada necesita al menos un horario.',
    path: ['schedules'],
  });

// Donaciones: métodos y necesidades (ajustes del sitio)
export const DONACION_METODOS = ['qr', 'bank', 'paypal', 'remittance'] as const;

export const donacionMetodoSchema = z.object({
  id: z.enum(DONACION_METODOS),
  title: z.string().trim().min(2, 'El título es obligatorio.').max(80, 'Máximo 80 caracteres.'),
  detail: z.string().trim().max(200, 'Máximo 200 caracteres.'),
  lines: z.array(z.string().trim().min(1)).max(10, 'Máximo 10 líneas.'),
});

export const necesidadSchema = z.object({
  title: z.string().trim().min(2, 'El título es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  detail: z.string().trim().max(400, 'Máximo 400 caracteres.'),
});

export type PostInput = z.infer<typeof postSchema>;
export type ActividadInput = z.infer<typeof actividadSchema>;
export type SerieInput = z.infer<typeof serieSchema>;
export type VideoInput = z.infer<typeof videoSchema>;
export type EnVivoInput = z.infer<typeof enVivoSchema>;
export type TransmisionInput = z.infer<typeof transmisionSchema>;
export type RadioInput = z.infer<typeof radioSchema>;
export type EstacionInput = z.infer<typeof estacionSchema>;
export type ProgramaInput = z.infer<typeof programaSchema>;
export type FranjaInput = z.infer<typeof franjaSchema>;
export type EmisionInput = z.infer<typeof emisionSchema>;
export type PistaEditarInput = z.infer<typeof pistaEditarSchema>;
export type PistasCarpetaInput = z.infer<typeof pistasCarpetaSchema>;
export type InterruptorInput = z.infer<typeof interruptorSchema>;
export type PlaylistInput = z.infer<typeof playlistSchema>;
export type DonacionMetodoInput = z.infer<typeof donacionMetodoSchema>;
export type NecesidadInput = z.infer<typeof necesidadSchema>;

export const listaMetodosDonacionSchema = z.array(donacionMetodoSchema).max(4, 'Máximo 4 formas de donar.');
export const listaNecesidadesSchema = z.array(necesidadSchema).max(20, 'Máximo 20 necesidades.');

// Lo que suena cuando no hay programa: el AutoDJ de la emisora, o nada
export const RELLENO_ETIQUETA: Record<'ninguno' | 'musica', string> = {
  ninguno: 'Nada (franja vacía)',
  musica: 'AutoDJ (música de sus playlists)',
};

// ---------- Datos del ministerio (contacto y redes) ----------
// Los campos vacíos no se muestran en la web.
const urlOpcional = z.string().trim().max(300).refine((v) => v === '' || /^https?:\/\/\S+$/.test(v), 'Revisa el enlace (debe empezar con https://).');

export const datosMinisterioSchema = z.object({
  whatsapp: z.string().trim().max(20).refine((v) => v === '' || /^\+?[0-9 ]{7,20}$/.test(v), 'Revisa el número de WhatsApp (solo números, con código de país).'),
  email: z.string().trim().max(120).refine((v) => v === '' || z.string().email().safeParse(v).success, 'Revisa el correo.'),
  address: z.string().trim().max(200),
  city: z.string().trim().max(80),
  redes: z.object({
    youtube: urlOpcional,
    tiktok: urlOpcional,
    facebook: urlOpcional,
    appAndroid: urlOpcional,
  }),
});
export type DatosMinisterioInput = z.infer<typeof datosMinisterioSchema>;

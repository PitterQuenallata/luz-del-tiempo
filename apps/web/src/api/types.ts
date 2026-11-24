/**
 * Tipos públicos que devolverá la API. Siguen docs/DATABASE.md
 * (solo los campos que la web pública necesita, en camelCase).
 */

export type AreaTemplate = "hero" | "gallery" | "simple";
export type AreaIcon = "health" | "music" | "bible" | "kids" | "family" | "radio";

export type Area = {
  slug: string;
  name: string;
  template: AreaTemplate;
  summary: string;
  content: string;
  color: string;
  icon: AreaIcon;
  coverUrl: string | null;
  /** Fotos de la plantilla "texto + galería" (area_gallery). */
  gallery: string[];
  whatsapp: string | null;
  eventEnabled: boolean;
};

/** Emisora de un tercero: página propia con su única estación. */
export type PublicEmisora = {
  slug: string;
  name: string;
  description: string;
  genre: string;
  imageUrl: string | null;
  color: string;
  art: string;
  streamUrl: string;
  nowPlaying: string | null;
  listeners: number;
  online: boolean;
  estacionSlug: string;
};

export type Station = {
  slug: string;
  /** La radio principal (Radio La Luz del Tiempo). Las demás son emisoras temáticas. */
  isMain: boolean;
  name: string;
  description: string;
  genre: string;
  color: string;
  /** Fondo de la tarjeta grande de la emisora (degradado CSS o URL de imagen). */
  art: string;
  /** Foto opcional sobre el degradado (si no carga, queda el degradado). */
  imageUrl: string | null;
  streamUrl: string;
  areaSlug: string | null;
  nowPlaying: string | null;
  listeners: number;
};

// ---------- Agenda (campañas, escuelas, talleres, cursos y eventos) ----------
export type AgendaKind =
  | "campana_evangelistica"
  | "escuela_vacaciones"
  | "expo_salud"
  | "seminario"
  | "dia_impacto"
  | "taller"
  | "curso"
  | "estudio_biblico"
  | "evento"
  | "otro";

export type AreaRef = { slug: string; name: string };

/** Una actividad en la lista de la agenda (tarjeta). */
export type Activity = {
  slug: string;
  kind: AgendaKind;
  kindLabel: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  language: "es" | "en" | "pt";
  isVirtual: boolean;
  isFree: boolean;
  priceAmount: number | null;
  priceNote: string | null;
  areas: AreaRef[];
  /** Primera y última fecha (ISO). */
  inicio: string | null;
  fin: string | null;
  cantidadSesiones: number;
  lugar: string | null;
  pasada: boolean;
};

export type Sede = { name: string; address: string | null; city: string | null; mapUrl: string | null };

/** Ficha completa de una actividad. */
export type ActivityDetail = Activity & {
  content: string;
  report: string;
  galeria: { imageUrl: string; caption: string }[];
  sesiones: {
    startsAt: string;
    endsAt: string | null;
    lugar: Sede | null;
    locationNote: string | null;
    programa: {
      startTime: string | null;
      durationMin: number | null;
      title: string;
      description: string | null;
      persona: { name: string; roleTitle: string; photoUrl: string | null } | null;
    }[];
  }[];
  personas: { name: string; roleTitle: string; role: string; roleLabel: string; photoUrl: string | null; bio: string }[];
  canales: { channel: "whatsapp" | "correo" | "enlace"; value: string }[];
  inscripcionWeb: boolean;
  cupo: { capacidad: number | null; lugaresLibres: number | null; lleno: boolean };
  /** QR que genera la API (lleva a la inscripción) y QR subido por el ministerio (pago). */
  qrInscripcionUrl: string | null;
  qrSubidoUrl: string | null;
};

export type AgendaFiltros = { tipos: { valor: AgendaKind; etiqueta: string }[]; areas: AreaRef[] };

export type Video = {
  youtubeId: string;
  title: string;
  areaSlug: string | null;
  seriesName: string | null;
  publishedAt: string;
  isFeatured: boolean;
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  areaSlug: string | null;
  publishedAt: string;
  /** Párrafos del cuerpo (en la API vendrá como HTML saneado). */
  body: string[];
};

/** Transmisión en vivo: el aviso general y un enlace por plataforma (puede haber varias a la vez). */
export type LiveStatus = {
  isLive: boolean;
  title: string;
  streams: { platform: "youtube" | "tiktok" | "facebook" | "radio"; url: string }[];
};

/** Franja de la programación de hoy (program_slots + programs). */
export type ScheduleItem = {
  start: string; // "HH:MM"
  end: string;
  programName: string;
  host: string | null;
  stationSlug: string;
  isLive: boolean;
  /** Contenido de relleno (música, historias) en una franja sin programa. */
  relleno: boolean;
};

/** Diapositiva de la portada (destacados que elige el equipo en el panel). */
export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Texto grande y tenue a la derecha, como marca de agua. */
  ghost: [string, string, string];
  cta: { label: string; to: string };
  imageUrl: string | null;
  tint: string;
};


/** Integrantes del equipo (predicadores, locutores, conductores). */
export type Person = {
  name: string;
  role: string;
  photoUrl: string | null;
  bio: string;
};

export type DonationMethod = {
  /** qr = QR interbancario · bank = transferencia o depósito · paypal · remittance = Western Union / MoneyGram */
  id: "qr" | "bank" | "paypal" | "remittance";
  title: string;
  detail: string;
  lines: string[];
};

/** "Necesidades del ministerio": texto para leer (sin montos), como en SUMtv. */
export type MinistryNeed = {
  title: string;
  body: string;
};

/** Datos generales (site_settings). */
export type SiteRedes = {
  youtube: string;
  tiktok: string;
  facebook: string;
  appAndroid: string;
};

export type SiteInfo = {
  redes?: Partial<SiteRedes>;
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  address: string;
  city: string;
  mission: string;
  history: string[];
};

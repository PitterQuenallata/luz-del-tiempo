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

export type ActivityType =
  | "vacation_school"
  | "health_school"
  | "music_school"
  | "workshop"
  | "health_campaign"
  | "bible_campaign"
  | "bible_study"
  | "other";

export type Activity = {
  slug: string;
  areaSlug: string | null;
  type: ActivityType;
  title: string;
  summary: string;
  coverUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  scheduleText: string | null;
  isVirtual: boolean;
  locationName: string | null;
  locationAddress: string | null;
  /** Quién dirige la actividad. */
  presenter: string | null;
  /** "Gratis", "Bs 50 por persona"… */
  cost: string | null;
  capacity: number | null;
  /** Horario por día, como el "horario diario" de los eventos de SUMtv. */
  agenda: { day: string; items: string[] }[];
  registration: { type: "none" } | { type: "whatsapp"; value: string } | { type: "link"; value: string };
};

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

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  vacation_school: "Escuela de vacaciones",
  health_school: "Escuela de salud",
  music_school: "Escuela de música",
  workshop: "Taller",
  health_campaign: "Campaña de salud",
  bible_campaign: "Campaña bíblica",
  bible_study: "Estudio bíblico",
  other: "Actividad",
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

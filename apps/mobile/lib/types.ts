/**
 * Tipos de la API pública. Copia de apps/web/src/api/types.ts (solo lo que usa la app).
 * Pendiente: moverlos a @luz/shared cuando la app y la web los compartan.
 */

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  areaSlug: string | null;
  publishedAt: string;
  body: string[];
};

// Agenda: tarjeta de la lista y ficha completa (misma forma que la API pública)
export type AreaRef = { slug: string; name: string };

export type Activity = {
  slug: string;
  kind: string;
  kindLabel: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  language: 'es' | 'en' | 'pt';
  isVirtual: boolean;
  isFree: boolean;
  priceAmount: number | null;
  priceNote: string | null;
  areas: AreaRef[];
  inicio: string | null;
  fin: string | null;
  cantidadSesiones: number;
  lugar: string | null;
  pasada: boolean;
};

export type ActivityDetail = Activity & {
  content: string;
  report: string;
  galeria: { imageUrl: string; caption: string }[];
  sesiones: {
    startsAt: string;
    endsAt: string | null;
    lugar: { name: string; address: string | null; city: string | null; mapUrl: string | null } | null;
    locationNote: string | null;
    programa: {
      startTime: string | null;
      durationMin: number | null;
      title: string;
      description: string | null;
      persona: { name: string; roleTitle: string; photoUrl: string | null } | null;
    }[];
  }[];
  personas: { name: string; roleTitle: string; roleLabel: string; photoUrl: string | null; bio: string }[];
  canales: { channel: 'whatsapp' | 'correo' | 'enlace'; value: string }[];
  inscripcionWeb: boolean;
  inscripcionApp: boolean;
  cupo: { capacidad: number | null; lugaresLibres: number | null; lleno: boolean };
  qrInscripcionUrl: string | null;
  qrSubidoUrl: string | null;
};

export type AgendaFiltros = { tipos: { valor: string; etiqueta: string }[]; areas: AreaRef[] };

export type Video = {
  youtubeId: string;
  title: string;
  areaSlug: string | null;
  seriesName: string | null;
  publishedAt: string;
  isFeatured: boolean;
};


/** Emisora de radio (la principal y las temáticas). */
export type Station = {
  slug: string;
  isMain: boolean;
  name: string;
  description: string;
  genre: string;
  color: string;
  art: string;
  /** Área a la que pertenece la emisora (null si es la principal). */
  areaSlug: string | null;
  imageUrl: string | null;
  /** Vacío mientras no exista el enlace de audio: la app no puede reproducir todavía. */
  streamUrl: string;
  /** HLS adaptable: la app elige la calidad (live.m3u8, alta.m3u8 o baja.m3u8). Vacío si no hay transmisión. */
  hlsUrl?: string;
  nowPlaying: string | null;
  listeners: number;
};

/** Calidad elegida por quien escucha. «baja» = red inestable o datos móviles. */
export type Calidad = 'auto' | 'alta' | 'baja';

/** Enlace de la calidad elegida. Sin HLS, queda el stream MP3 de siempre. */
export function enlaceDe(emisora: { streamUrl: string; hlsUrl?: string }, calidad: Calidad): string {
  if (!emisora.hlsUrl) return emisora.streamUrl;
  if (calidad === 'auto') return emisora.hlsUrl;
  return emisora.hlsUrl.replace(/live\.m3u8$/, calidad === 'alta' ? 'alta.m3u8' : 'baja.m3u8');
}

/** Franja de la programación de hoy. */
export type ScheduleItem = {
  start: string;
  end: string;
  programName: string;
  host: string | null;
  stationSlug: string;
  isLive: boolean;
  relleno: boolean;
};

export type LiveStatus = {
  isLive: boolean;
  title: string;
  streams: { platform: 'youtube' | 'tiktok' | 'facebook' | 'radio'; url: string }[];
};

/** Forma de donar: qr, transferencia o depósito, PayPal, Western Union / MoneyGram. */
export type DonationMethod = {
  id: 'qr' | 'bank' | 'paypal' | 'remittance';
  title: string;
  detail: string;
  lines: string[];
};

/** Para qué se usa la donación. */
export type MinistryNeed = {
  title: string;
  body: string;
};

/** Datos del ministerio para contacto y redes. */
export type SiteInfo = {
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  address: string;
  city: string;
  redes?: Partial<Record<'tiktok' | 'youtube' | 'facebook' | 'appAndroid', string>>;
};

/** Área del ministerio (Salud, Música, Biblia, Niños…). */
export type Area = {
  slug: string;
  name: string;
  summary: string;
  content: string;
  color: string;
  coverUrl: string | null;
  whatsapp: string | null;
};

/** Integrante del equipo (predicador, locutor, conductor). */
export type Person = {
  name: string;
  role: string;
  photoUrl: string | null;
  bio: string;
};

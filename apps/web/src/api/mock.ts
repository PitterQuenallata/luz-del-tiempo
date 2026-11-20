/**
 * Datos de prueba mientras la API se construye. Misma forma que devolverá la API.
 * Las fechas se calculan desde "hoy" para que siempre haya eventos próximos.
 */
import type { Activity, Area, HeroSlide, LiveStatus, Post, ScheduleItem, Station, Video } from "./types";

const day = 86_400_000;
const at = (daysFromNow: number, hour = 9) => {
  const d = new Date(Date.now() + daysFromNow * day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const areas: Area[] = [
  {
    slug: "salud",
    name: "Salud",
    template: "hero",
    summary: "Hábitos sanos, prevención y campañas médicas para toda la familia",
    content:
      "Promovemos un estilo de vida saludable con charlas, escuelas de salud en vacaciones, campañas médicas gratuitas y programas de radio con profesionales.",
    color: "#16a34a",
    icon: "health",
    coverUrl: null,
    gallery: [],
    whatsapp: "59170000000",
    eventEnabled: true,
  },
  {
    slug: "musica",
    name: "Música",
    template: "gallery",
    summary: "Escuela de música, coros y alabanza para niños, jóvenes y adultos",
    content:
      "Enseñamos instrumentos, canto y dirección coral. Nuestros alumnos participan en la radio y en los cultos especiales.",
    color: "#7c3aed",
    icon: "music",
    coverUrl: null,
    gallery: [],
    whatsapp: "59170000000",
    eventEnabled: true,
  },
  {
    slug: "biblia",
    name: "Biblia",
    template: "hero",
    summary: "Estudios bíblicos, campañas y la Palabra al alcance de todos",
    content: "Estudios bíblicos semanales presenciales y virtuales, campañas de evangelismo y material gratuito.",
    color: "#1e5bd8",
    icon: "bible",
    coverUrl: null,
    gallery: [],
    whatsapp: null,
    eventEnabled: false,
  },
  {
    slug: "ninos",
    name: "Niños",
    template: "simple",
    summary: "Escuela cristiana de vacaciones, historias y valores para los más pequeños",
    content: "Cada vacación abrimos la escuela cristiana con juegos, manualidades, música e historias bíblicas.",
    color: "#ea580c",
    icon: "kids",
    coverUrl: null,
    gallery: [],
    whatsapp: "59170000000",
    eventEnabled: true,
  },
];

export const stations: Station[] = [
  {
    slug: "principal",
    isMain: true,
    name: "Radio La Luz del Tiempo",
    description: "Nuestra señal principal: programas, música y mensajes las 24 horas",
    genre: "General",
    color: "#e2a927",
    art: "linear-gradient(120deg, #2a1608 0%, #6b3a12 55%, #2a1608 100%)",
    imageUrl: null,
    streamUrl: "https://stream.laluzdeltiempo.bolivia.bo/principal",
    areaSlug: null,
    nowPlaying: "Amanecer con esperanza",
    listeners: 128,
  },
  {
    slug: "musica",
    isMain: false,
    name: "Luz Música",
    description: "Alabanza y música cristiana sin interrupciones",
    genre: "Música",
    color: "#5b8fe0",
    art: "linear-gradient(120deg, #0b2a5c 0%, #123f86 60%, #0b2a5c 100%)",
    imageUrl: null,
    streamUrl: "https://stream.laluzdeltiempo.bolivia.bo/musica",
    areaSlug: "musica",
    nowPlaying: "Himnos de siempre",
    listeners: 64,
  },
  {
    slug: "salud",
    isMain: false,
    name: "Luz Salud",
    description: "Consejos de salud, nutrición y vida sana",
    genre: "Salud",
    color: "#2bb39a",
    art: "linear-gradient(120deg, #06302e 0%, #0f5a52 55%, #06302e 100%)",
    imageUrl: null,
    streamUrl: "https://stream.laluzdeltiempo.bolivia.bo/salud",
    areaSlug: "salud",
    nowPlaying: "Cocina saludable",
    listeners: 31,
  },
  {
    slug: "predicas",
    isMain: false,
    name: "Luz Palabra",
    description: "Prédicas y estudios bíblicos todo el día",
    genre: "Prédicas",
    color: "#a78bfa",
    art: "linear-gradient(120deg, #1a1a2c 0%, #2b2350 55%, #1a1a2c 100%)",
    imageUrl: null,
    streamUrl: "https://stream.laluzdeltiempo.bolivia.bo/predicas",
    areaSlug: "biblia",
    nowPlaying: "Estudio: el libro de Daniel",
    listeners: 47,
  },
];

export const activities: Activity[] = [
  {
    slug: "escuela-salud-verano",
    areaSlug: "salud",
    type: "health_school",
    title: "Escuela de salud de verano",
    summary: "Cinco días de charlas, cocina saludable y chequeos gratuitos",
    coverUrl: null,
    startsAt: at(3, 9),
    endsAt: at(7, 12),
    scheduleText: "Lunes a viernes, 09:00 a 12:00",
    isVirtual: false,
    locationName: "Templo central",
    locationAddress: null,
    presenter: null,
    cost: null,
    capacity: null,
    agenda: [],
    registration: { type: "whatsapp", value: "59170000000" },
  },
  {
    slug: "escuela-vacaciones-ninos",
    areaSlug: "ninos",
    type: "vacation_school",
    title: "Escuela cristiana de vacaciones",
    summary: "Juegos, manualidades, música e historias bíblicas para niños de 4 a 12 años",
    coverUrl: null,
    startsAt: at(10, 15),
    endsAt: at(14, 18),
    scheduleText: "Tardes, 15:00 a 18:00",
    isVirtual: false,
    locationName: "Salón de actividades",
    locationAddress: null,
    presenter: null,
    cost: null,
    capacity: null,
    agenda: [],
    registration: { type: "whatsapp", value: "59170000000" },
  },
  {
    slug: "taller-guitarra",
    areaSlug: "musica",
    type: "music_school",
    title: "Taller de guitarra para principiantes",
    summary: "Aprende acordes básicos y acompaña la alabanza en ocho clases",
    coverUrl: null,
    startsAt: at(17, 16),
    endsAt: null,
    scheduleText: "Sábados, 16:00",
    isVirtual: false,
    locationName: "Aula de música",
    locationAddress: null,
    presenter: null,
    cost: null,
    capacity: null,
    agenda: [],
    registration: { type: "link", value: "https://forms.gle/ejemplo" },
  },
  {
    slug: "estudio-biblico-daniel",
    areaSlug: "biblia",
    type: "bible_study",
    title: "Estudio bíblico: Daniel y Apocalipsis",
    summary: "Estudio semanal en vivo por la radio y por Zoom",
    coverUrl: null,
    startsAt: at(2, 20),
    endsAt: null,
    scheduleText: "Miércoles, 20:00",
    isVirtual: true,
    locationName: null,
    locationAddress: null,
    presenter: null,
    cost: null,
    capacity: null,
    agenda: [],
    registration: { type: "none" },
  },
];

/**
 * Videos públicos del canal de SUMtv Latino (mismo mensaje), solo para la demo:
 * se incrustan desde YouTube como permite la plataforma. Los nombres de serie
 * son de ejemplo; en producción el panel guarda los videos del canal del ministerio.
 */
const v = (youtubeId: string, title: string, seriesName: string, daysAgo: number, areaSlug: string | null = "biblia"): Video => ({
  youtubeId,
  title,
  areaSlug,
  seriesName,
  publishedAt: at(-daysAgo),
  isFeatured: false,
});

export const videos: Video[] = [
  { ...v("FNcS-ilEjjg", "¿Cuál es el verdadero mensaje del libro de Abdías?", "Preguntas bíblicas", 1), isFeatured: true },
  v("FhmnTYdj7Nc", "¿Fue literal el terremoto de Apocalipsis 11?", "Preguntas bíblicas", 8),
  v("ypFX0LV6Dwk", "¿Cuál es el mensaje de 1888?", "Preguntas bíblicas", 15),
  v("U8T_Ao6Ja9w", "¿Los fósiles humanos contradicen la Biblia?", "Preguntas bíblicas", 22),
  v("F60LS3QsJ4w", "¡Escucha esto! El don de profecía", "Estudios bíblicos", 2),
  v("1Ax5HAnzTn8", "Los escritos proféticos", "Estudios bíblicos", 9),
  v("Um0R14GCUFc", "Revelación e inspiración", "Estudios bíblicos", 16),
  v("LWV6Xmx-prA", "Profetas del Nuevo Testamento", "Estudios bíblicos", 23),
  v("V2Uo7UAu4B4", "Cómo los padres generan traumas en los hijos", "Vida en familia", 3, "ninos"),
  v("H3hfI-TaYmU", "Lo que Dios pide de una madre y esposa", "Vida en familia", 10, "ninos"),
  v("D5sXP4B-wUU", "Lo que Dios pide de un padre y esposo", "Vida en familia", 17, "ninos"),
  v("ZZaLlJ0E9qc", "Cómo controlar la ira", "Vida en familia", 24, "salud"),
  v("GTaeSJQirtw", "El maltrato físico", "Vida en familia", 31, "salud"),
  v("gAEMoqhp39Y", "¿Qué busca el Papa visitando la cuna del ateísmo?", "Actualidad y profecía", 4),
  v("KiXftpQpdfY", "La libertad religiosa en riesgo", "Actualidad y profecía", 11),
  v("dH66ZNVj2Gs", "El peligro del ecumenismo", "Actualidad y profecía", 18),
  v("V00WoEFzp0I", "¿Por qué Meta pagará 18 mil millones?", "Actualidad y profecía", 25),
  v("Ia8BHYDWUig", "Métodos parlamentarios", "Escuela de líderes", 5),
  v("rMyNyv_mw7k", "La junta de iglesia como motor de crecimiento", "Escuela de líderes", 12),
  v("IhFqU0DxRac", "Cómo manejar conflictos en la junta de iglesia", "Escuela de líderes", 19),
  v("ahDClH7FZqo", "Cómo tomar decisiones sabias en la junta", "Escuela de líderes", 26),
];

export const posts: Post[] = [
  {
    slug: "campana-salud-noviembre",
    title: "Más de 200 personas atendidas en la campaña de salud",
    excerpt: "Médicos voluntarios realizaron chequeos gratuitos de presión, glucosa y vista",
    coverUrl: null,
    areaSlug: "salud",
    publishedAt: at(-1),
    body: [],
  },
  {
    slug: "nueva-estacion-musica",
    title: "Nace Luz Música, nuestra nueva estación 24/7",
    excerpt: "Alabanza sin interrupciones en la web, la app y tu celular",
    coverUrl: null,
    areaSlug: "musica",
    publishedAt: at(-4),
    body: [],
  },
  {
    slug: "inscripciones-escuela-vacaciones",
    title: "Abrimos inscripciones para la escuela de vacaciones",
    excerpt: "Cupos limitados. Inscribe a tus hijos por WhatsApp",
    coverUrl: null,
    areaSlug: "ninos",
    publishedAt: at(-6),
    body: [],
  },
];

// Todavía no hacen transmisiones en vivo por YouTube/TikTok: el aviso queda apagado.
export const live: LiveStatus = { isLive: false };

export const slides: HeroSlide[] = [
  {
    id: "radio",
    eyebrow: "Radio en vivo",
    title: "Una luz que no se apaga",
    subtitle: "Música, prédicas y salud las 24 horas, sin anuncios",
    ghost: ["La Luz", "del", "Tiempo"],
    cta: { label: "Escuchar ahora", to: "#envivo" },
    imageUrl: null,
    tint: "#22376a",
  },
  {
    id: "escuela-vacaciones",
    eyebrow: "Inscripciones abiertas",
    title: "Escuela cristiana de vacaciones",
    subtitle: "Juegos, música e historias bíblicas para niños de 4 a 12 años",
    ghost: ["Escuela", "de", "vacaciones"],
    cta: { label: "Ver detalles", to: "/actividades" },
    imageUrl: null,
    tint: "#5a3410",
  },
  {
    id: "vida-sana",
    eyebrow: "Nuevo programa semanal",
    title: "Vida sana",
    subtitle: "Consejos de salud y nutrición con profesionales, cada mediodía",
    ghost: ["Vida", "y", "salud"],
    cta: { label: "Ver programa", to: "/videos" },
    imageUrl: null,
    tint: "#0f4f48",
  },
];

export const schedule: ScheduleItem[] = [
  { start: "06:00", end: "09:00", programName: "Amanecer con esperanza", host: "Equipo de locutores", stationSlug: "principal", isLive: true },
  { start: "09:00", end: "10:00", programName: "Estudio bíblico", host: "Pr. Daniel Mamani", stationSlug: "predicas", isLive: true },
  { start: "10:00", end: "12:00", programName: "Alabanza de la mañana", host: "Programación automática", stationSlug: "musica", isLive: false },
  { start: "12:00", end: "13:00", programName: "Vida sana", host: "Dra. Lucía Quispe", stationSlug: "salud", isLive: true },
  { start: "13:00", end: "15:00", programName: "Himnos de siempre", host: "Programación automática", stationSlug: "musica", isLive: false },
  { start: "15:00", end: "17:00", programName: "Tarde en familia", host: "Marco Choque", stationSlug: "principal", isLive: true },
  { start: "19:00", end: "20:00", programName: "Mensaje de la noche", host: "Pr. Rubén Vargas", stationSlug: "predicas", isLive: true },
  { start: "22:00", end: "23:59", programName: "Música para descansar", host: "Programación automática", stationSlug: "musica", isLive: false },
];

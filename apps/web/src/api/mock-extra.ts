/**
 * Contenido extra de prueba para las páginas internas (equipo, donar,
 * programación semanal, cuerpo de noticias, detalle de actividades) y las
 * rutas de las imágenes de la demo.
 */
import { activities, areas, posts, schedule, slides, stations } from "./mock";
import type { Activity, DonationMethod, MinistryNeed, Person, ScheduleItem, SiteInfo } from "./types";

export const site: SiteInfo = {
  whatsapp: "59170000000",
  whatsappDisplay: "+591 700 00000",
  email: "contacto@laluzdeltiempo.bolivia.bo",
  address: "Av. Principal 123, zona Central",
  city: "Bolivia",
  mission: "Llevar esperanza, salud y la Palabra de Dios a cada hogar, por la radio y en persona",
  history: [
    "Empezamos como una radio pequeña con un propósito claro: que la Palabra de Dios y los consejos de salud llegaran a cada hogar, de día y de noche.",
    "Con los años la radio creció en emisoras y en oyentes, y el ministerio también: hoy abrimos escuelas de vacaciones para niños, una escuela de música, talleres y campañas de salud gratuitas.",
    "Todo lo hacemos con voluntarios y con el apoyo de quienes creen en esta obra.",
  ],
};

export const people: Person[] = [
  { name: "Pr. Daniel Mamani", role: "Predicador · Estudio bíblico", photoUrl: "/demo/persona-predicador-1.jpg", bio: "Dirige el estudio bíblico de los miércoles y los mensajes de la mañana" },
  { name: "Pr. Rubén Vargas", role: "Predicador · Mensaje de la noche", photoUrl: "/demo/persona-predicador-2.jpg", bio: "Cada noche comparte un mensaje breve para terminar el día en paz" },
  { name: "Marco Choque", role: "Locutor", photoUrl: "/demo/persona-locutor.jpg", bio: "Acompaña las tardes con música, saludos y noticias del ministerio" },
  { name: "Dra. Lucía Quispe", role: "Conductora de Vida sana", photoUrl: "/demo/persona-conductora-salud.jpg", bio: "Médica y nutricionista, conduce el programa de salud del mediodía" },
];

// Datos de ejemplo: el ministerio debe confirmar banco, cuenta, PayPal y remesas antes de publicar.
export const donationMethods: DonationMethod[] = [
  { id: "qr", title: "QR desde tu banco", detail: "Escanea el código con la app de cualquier banco de Bolivia", lines: ["Rápido y sin comisión"] },
  { id: "bank", title: "Transferencia o depósito", detail: "Desde tu banca por internet o en ventanilla", lines: ["Banco Unión", "Cuenta 1-1234567", "Ministerio La Luz del Tiempo"] },
  { id: "paypal", title: "PayPal", detail: "Con tarjeta o cuenta PayPal, desde cualquier país", lines: ["donaciones@laluzdeltiempo.bolivia.bo"] },
  { id: "remittance", title: "Remesas", detail: "Western Union o MoneyGram, a nombre del ministerio", lines: ["Escríbenos y te pasamos los datos del beneficiario"] },
];

export const needs: MinistryNeed[] = [
  {
    title: "Que la radio no se apague",
    body: "Cada día, a cualquier hora, alguien enciende la radio buscando una palabra de esperanza: un enfermo en el hospital, un conductor en la carretera, una madre que se levanta de madrugada. Mantener la señal al aire las 24 horas tiene un costo de servidores, equipos y energía que cubrimos mes a mes con tu ayuda.",
  },
  {
    title: "Escuelas para niños y jóvenes",
    body: "En cada vacación recibimos a más de cien niños en la escuela cristiana, y durante el año enseñamos música a jóvenes que hoy cantan en la radio. Necesitamos materiales, refrigerios, instrumentos y transporte para que ningún niño se quede afuera por falta de recursos.",
  },
  {
    title: "Salud para quien más lo necesita",
    body: "En nuestras campañas gratuitas tomamos la presión, medimos la glucosa y orientamos a familias que no tienen acceso fácil a un médico. Con tu aporte compramos insumos y medicamentos básicos, y llegamos a más barrios y comunidades.",
  },
  {
    title: "Llevar la Palabra más lejos",
    body: "Producimos estudios bíblicos, videos y programas que se escuchan en Bolivia y en otros países. Tu donación nos permite grabar con mejor calidad, imprimir material de estudio y responder a cada persona que nos escribe.",
  },
];

/** Programación semanal: entre semana la de siempre; sábado y domingo cambian algunos programas. */
export function scheduleFor(dayOfWeek: number): ScheduleItem[] {
  if (dayOfWeek === 6) {
    return [
      { start: "08:00", end: "10:00", programName: "Alabanza", host: "Coro juvenil", stationSlug: "musica", isLive: true },
      { start: "10:00", end: "12:00", programName: "Culto de sábado", host: "Pr. Daniel Mamani", stationSlug: "principal", isLive: true },
      { start: "15:00", end: "17:00", programName: "Historias para niños", host: "Escuela de vacaciones", stationSlug: "principal", isLive: false },
      { start: "19:00", end: "20:00", programName: "Mensaje de la noche", host: "Pr. Rubén Vargas", stationSlug: "predicas", isLive: true },
    ];
  }
  if (dayOfWeek === 0) {
    return [
      { start: "07:00", end: "09:00", programName: "Himnos de siempre", host: "Programación automática", stationSlug: "musica", isLive: false },
      { start: "09:00", end: "11:00", programName: "Familia y salud", host: "Dra. Lucía Quispe", stationSlug: "salud", isLive: true },
      { start: "19:00", end: "20:00", programName: "Mensaje de la noche", host: "Pr. Rubén Vargas", stationSlug: "predicas", isLive: true },
    ];
  }
  return schedule;
}

// Cuerpo de las noticias
const bodies: Record<string, string[]> = {
  "campana-salud-noviembre": [
    "Más de 200 personas pasaron por la campaña de salud gratuita que organizamos el fin de semana en la plaza principal.",
    "Médicos y enfermeras voluntarios tomaron la presión, midieron la glucosa y revisaron la vista. Quienes lo necesitaban recibieron orientación y una cita de seguimiento.",
    "Gracias a cada voluntario y a quienes donaron los insumos. La próxima campaña será en enero.",
  ],
  "nueva-estacion-musica": [
    "Desde esta semana Luz Música transmite alabanza e himnos las 24 horas, sin interrupciones ni anuncios.",
    "Puedes escucharla en la web, en la app y en tu celular. Elige la emisora en el reproductor de abajo.",
  ],
  "inscripciones-escuela-vacaciones": [
    "Ya están abiertas las inscripciones para la escuela cristiana de vacaciones, para niños de 4 a 12 años.",
    "Habrá juegos, manualidades, música e historias bíblicas. Los cupos son limitados: inscribe a tus hijos por WhatsApp.",
  ],
};
for (const p of posts) p.body = bodies[p.slug] ?? [p.excerpt];

// Detalle de las actividades (como el "horario diario" de los eventos de SUMtv)
const extra: Record<string, Partial<Activity>> = {
  "escuela-salud-verano": {
    locationAddress: "Av. Principal 123, zona Central",
    presenter: "Dra. Lucía Quispe y equipo de salud",
    cost: "Gratis",
    capacity: 80,
    agenda: [
      { day: "Lunes", items: ["09:00 Bienvenida y chequeo de presión", "10:00 Charla: alimentación sana", "11:00 Taller de cocina"] },
      { day: "Martes a jueves", items: ["09:00 Ejercicio guiado", "10:00 Charla del día", "11:00 Preguntas y respuestas"] },
      { day: "Viernes", items: ["09:00 Chequeo final", "10:30 Entrega de certificados"] },
    ],
  },
  "escuela-vacaciones-ninos": {
    locationAddress: "Av. Principal 123, zona Central",
    presenter: "Equipo de la escuela de vacaciones",
    cost: "Gratis",
    capacity: 120,
    agenda: [{ day: "Cada tarde", items: ["15:00 Canciones", "15:30 Historia bíblica", "16:15 Manualidades", "17:00 Juegos y refrigerio"] }],
  },
  "taller-guitarra": {
    locationAddress: "Aula de música, Av. Principal 123",
    presenter: "Prof. Andrés Flores",
    cost: "Bs 50 por mes",
    capacity: 15,
    agenda: [{ day: "Sábados", items: ["16:00 Técnica y acordes", "17:00 Práctica con canciones de alabanza"] }],
  },
  "estudio-biblico-daniel": {
    presenter: "Pr. Daniel Mamani",
    cost: "Gratis",
    agenda: [{ day: "Miércoles", items: ["20:00 Estudio en vivo por la radio y por Zoom", "21:00 Preguntas de los oyentes"] }],
  },
};
for (const a of activities) Object.assign(a, extra[a.slug]);

// ---------------------------------------------------------------------------
// Imágenes de la demo (docs/PROMPTS-IMAGENES-GEMINI.md) en apps/web/public/demo/.
// Si un archivo todavía no existe, cada componente muestra su diseño sin foto.
// ---------------------------------------------------------------------------
const demo = (file: string) => `/demo/${file}`;
for (const s of slides) s.imageUrl = demo(`hero-${s.id}.jpg`);
for (const s of stations) s.imageUrl = demo(`emisora-${s.slug}.jpg`);
for (const a of areas) {
  a.coverUrl = demo(`area-${a.slug}.jpg`);
  a.gallery = [1, 2, 3, 4].map((n) => demo(`galeria-${a.slug}-${n}.jpg`));
}
const activityImage: Record<string, string> = {
  "escuela-salud-verano": "actividad-escuela-salud.jpg",
  "escuela-vacaciones-ninos": "actividad-escuela-vacaciones.jpg",
  "taller-guitarra": "actividad-taller-guitarra.jpg",
  "estudio-biblico-daniel": "actividad-estudio-biblico.jpg",
};
for (const a of activities) {
  const file = activityImage[a.slug];
  a.coverUrl = file ? demo(file) : null;
}
const postImage: Record<string, string> = {
  "campana-salud-noviembre": "noticia-campana-salud.jpg",
  "nueva-estacion-musica": "noticia-nueva-emisora.jpg",
  "inscripciones-escuela-vacaciones": "noticia-inscripciones.jpg",
};
for (const p of posts) {
  const file = postImage[p.slug];
  p.coverUrl = file ? demo(file) : null;
}

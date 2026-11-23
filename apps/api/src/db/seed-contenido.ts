// Siembra el contenido inicial de la web (portada, áreas y personas) y sube sus imágenes a la API.
// Uso: pnpm db:seed-contenido   (desde apps/api, con el .env cargado)
// Es idempotente: si una tabla ya tiene filas, no la toca.
// Las imágenes salen de apps/web/public/demo/ y se copian a uploads/contenido/.
// Los textos y personas son los de muestra de la web; el ministerio debe confirmarlos.
import { copyFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { count } from 'drizzle-orm';
import { db } from './index.js';
import { eq, isNull, sql } from 'drizzle-orm';
import { existsSync } from 'node:fs';
import {
  activities, activityAreas, activityChannels, activityPeople, activityProgramItems, activitySessions, areaGallery, areas, heroSlides, locations, people, posts, programSlots, programs, siteSettings, stations, videoSeries, videos,
} from './schema.js';

const DEMO = resolve(process.cwd(), '../web/public/demo');
const CARPETA = join(process.cwd(), 'uploads', 'contenido');

// Copia una imagen de la demo a uploads/contenido y devuelve su URL pública de la API
async function subirDemo(archivo: string): Promise<string> {
  const ext = archivo.split('.').pop()!;
  const nombre = `${randomUUID()}.${ext}`;
  await mkdir(CARPETA, { recursive: true });
  await copyFile(join(DEMO, archivo), join(CARPETA, nombre));
  return `/api/v1/contenido/imagenes/${nombre}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hayFilas(tabla: any): Promise<boolean> {
  const [{ total }] = await db.select({ total: count() }).from(tabla);
  return Number(total) > 0;
}

async function sembrarPortada() {
  if (await hayFilas(heroSlides)) return console.log('Portada: ya tiene diapositivas, no se toca.');
  const slides = [
    { eyebrow: 'Radio en vivo', title: 'Una luz que no se apaga', subtitle: 'Música, prédicas y salud las 24 horas, sin anuncios', ghost: ['La Luz', 'del', 'Tiempo'], ctaLabel: 'Escuchar ahora', ctaTo: '#envivo', img: 'hero-radio.jpg', tint: '#22376a' },
    { eyebrow: 'Inscripciones abiertas', title: 'Escuela cristiana de vacaciones', subtitle: 'Juegos, música e historias bíblicas para niños de 4 a 12 años', ghost: ['Escuela', 'de', 'vacaciones'], ctaLabel: 'Ver detalles', ctaTo: '/actividades', img: 'hero-escuela-vacaciones.jpg', tint: '#5a3410' },
    { eyebrow: 'Nuevo programa semanal', title: 'Vida sana', subtitle: 'Consejos de salud y nutrición con profesionales, cada mediodía', ghost: ['Vida', 'y', 'salud'], ctaLabel: 'Ver programa', ctaTo: '/videos', img: 'hero-vida-sana.jpg', tint: '#0f4f48' },
  ];
  for (const [i, s] of slides.entries()) {
    await db.insert(heroSlides).values({
      eyebrow: s.eyebrow, title: s.title, subtitle: s.subtitle, ghost: s.ghost,
      ctaLabel: s.ctaLabel, ctaTo: s.ctaTo, imageUrl: await subirDemo(s.img), tint: s.tint, sortOrder: i,
    });
  }
  console.log(`Portada: ${slides.length} diapositivas.`);
}

async function sembrarAreas() {
  if (await hayFilas(areas)) return console.log('Áreas: ya tiene áreas, no se toca.');
  const lista = [
    { slug: 'salud', name: 'Salud', template: 'hero' as const, summary: 'Hábitos sanos, prevención y campañas médicas para toda la familia', content: 'Promovemos un estilo de vida saludable con charlas, escuelas de salud en vacaciones, campañas médicas gratuitas y programas de radio con profesionales.', color: '#16a34a', icon: 'health' as const, eventEnabled: true },
    { slug: 'musica', name: 'Música', template: 'gallery' as const, summary: 'Escuela de música, coros y alabanza para niños, jóvenes y adultos', content: 'Enseñamos instrumentos, canto y dirección coral. Nuestros alumnos participan en la radio y en los cultos especiales.', color: '#7c3aed', icon: 'music' as const, eventEnabled: true },
    { slug: 'biblia', name: 'Biblia', template: 'hero' as const, summary: 'Estudios bíblicos, campañas y la Palabra al alcance de todos', content: 'Estudios bíblicos semanales presenciales y virtuales, campañas de evangelismo y material gratuito.', color: '#1e5bd8', icon: 'bible' as const, eventEnabled: false },
    { slug: 'ninos', name: 'Niños', template: 'simple' as const, summary: 'Escuela cristiana de vacaciones, historias y valores para los más pequeños', content: 'Cada vacación abrimos la escuela cristiana con juegos, manualidades, música e historias bíblicas.', color: '#ea580c', icon: 'kids' as const, eventEnabled: true },
  ];
  for (const [i, a] of lista.entries()) {
    const [fila] = await db
      .insert(areas)
      .values({ ...a, coverUrl: await subirDemo(`area-${a.slug}.jpg`), whatsapp: null, sortOrder: i })
      .returning();
    for (let n = 1; n <= 4; n++) {
      await db.insert(areaGallery).values({
        areaId: fila.id,
        imageUrl: await subirDemo(`galeria-${a.slug}-${n}.jpg`),
        sortOrder: n - 1,
      });
    }
  }
  console.log(`Áreas: ${lista.length} áreas con 4 fotos de galería cada una.`);
}

async function sembrarPersonas() {
  if (await hayFilas(people)) return console.log('Personas: ya tiene personas, no se toca.');
  // Personas de muestra (nombres inventados). Se reemplazan por el equipo real desde el panel.
  const lista = [
    { name: 'Pr. Daniel Mamani', roleTitle: 'Predicador · Estudio bíblico', bio: 'Dirige el estudio bíblico de los miércoles y los mensajes de la mañana', img: 'persona-predicador-1.jpg' },
    { name: 'Pr. Rubén Vargas', roleTitle: 'Predicador · Mensaje de la noche', bio: 'Cada noche comparte un mensaje breve para terminar el día en paz', img: 'persona-predicador-2.jpg' },
    { name: 'Marco Choque', roleTitle: 'Locutor', bio: 'Acompaña las tardes con música, saludos y noticias del ministerio', img: 'persona-locutor.jpg' },
    { name: 'Dra. Lucía Quispe', roleTitle: 'Conductora de Vida sana', bio: 'Médica y nutricionista, conduce el programa de salud del mediodía', img: 'persona-conductora-salud.jpg' },
  ];
  for (const [i, p] of lista.entries()) {
    await db.insert(people).values({ name: p.name, roleTitle: p.roleTitle, bio: p.bio, photoUrl: await subirDemo(p.img), sortOrder: i });
  }
  console.log(`Personas: ${lista.length} de muestra.`);
}


// Busca el id de un área o persona por su enlace o nombre (para enlazar las filas del seed)
async function areaId(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const [a] = await db.select({ id: areas.id }).from(areas).where(eq(areas.slug, slug));
  return a?.id ?? null;
}

async function sembrarNoticias() {
  if (await hayFilas(posts)) return console.log('Noticias: ya tiene noticias, no se toca.');
  // Textos de muestra: el ministerio los reemplaza desde el panel
  const lista = [
    { slug: 'campana-salud-noviembre', title: 'Más de 200 personas atendidas en la campaña de salud', excerpt: 'Médicos voluntarios realizaron chequeos gratuitos de presión, glucosa y vista', area: 'salud', dias: 1, img: 'noticia-campana-salud.jpg' },
    { slug: 'nueva-estacion-musica', title: 'Nace Luz Música, nuestra nueva estación 24/7', excerpt: 'Alabanza sin interrupciones en la web, la app y tu celular', area: 'musica', dias: 4, img: 'noticia-nueva-emisora.jpg' },
    { slug: 'inscripciones-escuela-vacaciones', title: 'Abrimos inscripciones para la escuela de vacaciones', excerpt: 'Cupos limitados. Inscribe a tus hijos en el salón de la iglesia', area: 'ninos', dias: 6, img: 'noticia-inscripciones.jpg' },
  ];
  for (const n of lista) {
    await db.insert(posts).values({
      slug: n.slug, title: n.title, excerpt: n.excerpt,
      content: `${n.excerpt}.\n\nTexto de muestra: el equipo lo reemplaza desde el panel.`,
      coverUrl: await subirDemo(n.img), areaId: await areaId(n.area), status: 'published',
      publishedAt: new Date(Date.now() - n.dias * 86400000),
    });
  }
  console.log(`Noticias: ${lista.length} de muestra.`);
}

async function sembrarActividades() {
  if (await hayFilas(activities)) return console.log('Agenda: ya tiene actividades, no se toca.');
  const [daniel] = await db.select({ id: people.id }).from(people).where(eq(people.name, 'Pr. Daniel Mamani'));
  const [sedePrincipal] = await db
    .insert(locations)
    .values({ name: 'Templo central', address: 'Av. principal s/n', city: 'La Paz' })
    .returning({ id: locations.id });
  const [salon] = await db.insert(locations).values({ name: 'Salón de actividades', address: 'Templo central, patio', city: 'La Paz' }).returning({ id: locations.id });

  // Fechas de muestra: sesiones a partir de dentro de n días, a una hora fija
  const dia = (dias: number, hora: number, horas = 3) => {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + dias);
    inicio.setHours(hora, 0, 0, 0);
    return { inicio, fin: new Date(inicio.getTime() + horas * 3_600_000) };
  };

  type Muestra = {
    slug: string; title: string; kind: 'curso' | 'escuela_vacaciones' | 'taller' | 'estudio_biblico';
    summary: string; areas: string[]; img: string; isVirtual: boolean; isFree: boolean; precio: number | null;
    sesiones: { dias: number; hora: number; horas: number; lugar: string | null; programa: { hora: string; min: number; titulo: string; persona?: boolean }[] }[];
    canales: { channel: 'web' | 'whatsapp' | 'correo' | 'enlace'; value: string | null; enabled: boolean }[];
    personas?: { role: 'predicador' | 'maestro'; nombre: string }[];
  };

  const lista: Muestra[] = [
    {
      slug: 'escuela-salud-verano', title: 'Curso de salud de verano', kind: 'curso', summary: 'Charlas y chequeos gratuitos para toda la familia', areas: ['salud'], img: 'actividad-escuela-salud.jpg',
      isVirtual: false, isFree: true, precio: null,
      sesiones: [
        { dias: 3, hora: 9, horas: 3, lugar: 'sede', programa: [{ hora: '09:00', min: 60, titulo: 'Charla de salud' }, { hora: '10:30', min: 60, titulo: 'Cocina saludable' }, { hora: '11:30', min: 30, titulo: 'Chequeos gratuitos' }] },
        { dias: 4, hora: 9, horas: 3, lugar: 'sede', programa: [{ hora: '09:00', min: 60, titulo: 'Alimentación' }, { hora: '11:30', min: 30, titulo: 'Chequeos gratuitos' }] },
      ],
      canales: [{ channel: 'web', value: null, enabled: true }, { channel: 'whatsapp', value: '+591 70000001', enabled: false }],
    },
    {
      slug: 'escuela-vacaciones-ninos', title: 'Escuela de vacaciones bíblicas', kind: 'escuela_vacaciones', summary: 'Juegos, manualidades, música e historias bíblicas para niños', areas: ['ninos', 'musica'], img: 'actividad-escuela-vacaciones.jpg',
      isVirtual: false, isFree: true, precio: null,
      sesiones: [
        { dias: 10, hora: 15, horas: 3, lugar: 'sala', programa: [{ hora: '15:00', min: 20, titulo: 'Bienvenida' }, { hora: '15:20', min: 40, titulo: 'Historia bíblica' }, { hora: '16:00', min: 60, titulo: 'Manualidades' }] },
        { dias: 11, hora: 15, horas: 3, lugar: 'sala', programa: [{ hora: '15:00', min: 20, titulo: 'Bienvenida' }, { hora: '15:20', min: 40, titulo: 'Historia bíblica' }] },
        { dias: 12, hora: 15, horas: 3, lugar: 'sala', programa: [{ hora: '15:00', min: 20, titulo: 'Bienvenida' }, { hora: '16:00', min: 60, titulo: 'Música' }] },
      ],
      canales: [{ channel: 'web', value: null, enabled: true }, { channel: 'enlace', value: 'https://forms.gle/ejemplo', enabled: false }],
    },
    {
      slug: 'taller-guitarra', title: 'Taller de guitarra para principiantes', kind: 'taller', summary: 'Aprende acordes y ritmos básicos en cuatro clases', areas: ['musica'], img: 'actividad-taller-guitarra.jpg',
      isVirtual: false, isFree: false, precio: 50,
      sesiones: [
        { dias: 3, hora: 16, horas: 1, lugar: 'sala', programa: [{ hora: '16:00', min: 60, titulo: 'Acordes básicos' }] },
        { dias: 10, hora: 16, horas: 1, lugar: 'sala', programa: [{ hora: '16:00', min: 60, titulo: 'Ritmos' }] },
      ],
      canales: [{ channel: 'web', value: null, enabled: true }, { channel: 'enlace', value: 'https://forms.gle/ejemplo', enabled: false }],
    },
    {
      slug: 'estudio-biblico-daniel', title: 'Estudio bíblico: Daniel y Apocalipsis', kind: 'estudio_biblico', summary: 'Estudio semanal en vivo por la radio y por Zoom', areas: ['biblia'], img: 'actividad-estudio-biblico.jpg',
      isVirtual: true, isFree: true, precio: null,
      sesiones: [
        { dias: 2, hora: 20, horas: 1, lugar: null, programa: [{ hora: '20:00', min: 60, titulo: 'Estudio en vivo', persona: true }, { hora: '21:00', min: 20, titulo: 'Preguntas de los oyentes' }] },
      ],
      canales: [{ channel: 'web', value: null, enabled: true }],
      personas: [{ role: 'predicador', nombre: 'Pr. Daniel Mamani' }],
    },
  ];

  for (const a of lista) {
    const [fila] = await db
      .insert(activities)
      .values({
        slug: a.slug, kind: a.kind, title: a.title, summary: a.summary, content: null,
        coverUrl: await subirDemo(a.img), isVirtual: a.isVirtual, isFree: a.isFree, priceAmount: a.precio,
        priceNote: a.precio ? 'Incluye materiales' : null, capacity: a.slug === 'taller-guitarra' ? 20 : null, status: 'publicada',
      })
      .returning({ id: activities.id });
    for (const areaSlug of a.areas) {
      const id = await areaId(areaSlug);
      if (id) await db.insert(activityAreas).values({ activityId: fila.id, areaId: id });
    }
    for (const [i, s] of a.sesiones.entries()) {
      const { inicio, fin } = dia(s.dias, s.hora, s.horas);
      const [sesion] = await db
        .insert(activitySessions)
        .values({
          activityId: fila.id, startsAt: inicio, endsAt: fin,
          locationId: s.lugar === 'sede' ? sedePrincipal.id : s.lugar === 'sala' ? salon.id : null,
          sortOrder: i,
        })
        .returning({ id: activitySessions.id });
      await db.insert(activityProgramItems).values(
        s.programa.map((p, j) => ({
          sessionId: sesion.id, startTime: p.hora, durationMin: p.min, title: p.titulo,
          personId: p.persona ? daniel?.id ?? null : null, sortOrder: j,
        })),
      );
    }
    for (const c of a.canales) {
      await db.insert(activityChannels).values({ activityId: fila.id, channel: c.channel, value: c.value, enabled: c.enabled });
    }
    if (a.personas && daniel) {
      await db.insert(activityPeople).values(a.personas.map((p, i) => ({ activityId: fila.id, personId: daniel.id, role: p.role, sortOrder: i })));
    }
  }
  console.log(`Agenda: ${lista.length} actividades de muestra.`);
}

async function sembrarEmisoras() {
  if (await hayFilas(stations)) return console.log('Emisoras: ya tiene emisoras, no se toca.');
  const lista = [
    { slug: 'principal', name: 'Radio La Luz del Tiempo', description: 'Nuestra señal principal: programas, música y mensajes las 24 horas', genre: 'General', area: null, isMain: true },
    { slug: 'musica', name: 'Luz Música', description: 'Alabanza y música cristiana sin interrupciones', genre: 'Música', area: 'musica', isMain: false },
    { slug: 'salud', name: 'Luz Salud', description: 'Consejos de salud, nutrición y vida sana', genre: 'Salud', area: 'salud', isMain: false },
    { slug: 'predicas', name: 'Luz Palabra', description: 'Prédicas y estudios bíblicos todo el día', genre: 'Prédicas', area: 'biblia', isMain: false },
  ];
  const idPorSlug = new Map<string, string>();
  for (const [i, e] of lista.entries()) {
    const [fila] = await db
      .insert(stations)
      .values({ slug: e.slug, name: e.name, description: e.description, genre: e.genre, kind: 'own', isMain: e.isMain, areaId: await areaId(e.area), sortOrder: i })
      .returning();
    idPorSlug.set(e.slug, fila.id);
  }

  // Programación semanal de muestra (franjas por día: 0 = domingo … 6 = sábado)
  type F = [string, string, string, string, string, boolean];
  const semana: Record<number, F[]> = {
    1: [['06:00', '09:00', 'Amanecer con esperanza', 'Equipo de locutores', 'principal', true], ['09:00', '10:00', 'Estudio bíblico', 'Pr. Daniel Mamani', 'predicas', true], ['10:00', '12:00', 'Alabanza de la mañana', 'Programación automática', 'musica', false], ['12:00', '13:00', 'Vida sana', 'Dra. Lucía Quispe', 'salud', true], ['13:00', '15:00', 'Himnos de siempre', 'Programación automática', 'musica', false], ['15:00', '17:00', 'Tarde en familia', 'Marco Choque', 'principal', true], ['19:00', '20:00', 'Mensaje de la noche', 'Pr. Rubén Vargas', 'predicas', true], ['22:00', '23:59', 'Música para descansar', 'Programación automática', 'musica', false]],
    6: [['08:00', '10:00', 'Alabanza', 'Coro juvenil', 'musica', true], ['10:00', '12:00', 'Culto de sábado', 'Pr. Daniel Mamani', 'principal', true], ['15:00', '17:00', 'Historias para niños', 'Escuela de vacaciones', 'principal', false], ['19:00', '20:00', 'Mensaje de la noche', 'Pr. Rubén Vargas', 'predicas', true]],
    0: [['07:00', '09:00', 'Himnos de siempre', 'Programación automática', 'musica', false], ['09:00', '11:00', 'Familia y salud', 'Dra. Lucía Quispe', 'salud', true], ['19:00', '20:00', 'Mensaje de la noche', 'Pr. Rubén Vargas', 'predicas', true]],
  };
  // Los días 2 a 5 usan la misma programación que el lunes
  for (const d of [2, 3, 4, 5]) semana[d] = semana[1];

  const programaPorClave = new Map<string, string>();
  for (const dia of Object.keys(semana).map(Number)) {
    for (const [inicio, fin, nombre, conductor, emisora, enVivo] of semana[dia]) {
      const clave = `${emisora}|${nombre}|${conductor}`;
      let programaId = programaPorClave.get(clave);
      if (!programaId) {
        const [p] = await db
          .insert(programs)
          .values({ stationId: idPorSlug.get(emisora)!, name: nombre, hostName: conductor, isActive: true })
          .returning();
        programaId = p.id;
        programaPorClave.set(clave, programaId);
      }
      await db.insert(programSlots).values({ programId: programaId, dayOfWeek: dia, startTime: inicio, endTime: fin, isLive: enVivo });
    }
  }
  console.log(`Emisoras: ${lista.length} con programación semanal de muestra.`);
}

async function sembrarDonaciones() {
  const [existe] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'donate.metodos'));
  if (existe && Array.isArray(existe.value) && existe.value.length > 0) return console.log('Donaciones: ya tiene datos, no se toca.');
  await db.insert(siteSettings).values([
    {
      key: 'donate.metodos',
      value: [
        { id: 'qr', title: 'QR desde tu banco', detail: 'Escanea el código con la app de cualquier banco de Bolivia', lines: ['Rápido y sin comisión'] },
        { id: 'bank', title: 'Transferencia o depósito', detail: 'Desde tu banca por internet o en ventanilla', lines: ['Banco Unión', 'Cuenta 1-1234567', 'Ministerio La Luz del Tiempo'] },
        { id: 'paypal', title: 'PayPal', detail: 'Con tarjeta o cuenta PayPal, desde cualquier país', lines: ['donaciones@laluzdeltiempo.bolivia.bo'] },
        { id: 'remittance', title: 'Remesas', detail: 'Western Union o MoneyGram, a nombre del ministerio', lines: ['Escríbenos y te pasamos los datos del beneficiario'] },
      ],
    },
    {
      key: 'donate.necesidades',
      value: [
        { title: 'Que la radio no se apague', detail: 'Mantener la señal al aire las 24 horas tiene un costo de servidores, equipos y energía.' },
        { title: 'Escuelas para niños y jóvenes', detail: 'Materiales, refrigerios, instrumentos y transporte para la escuela de vacaciones y la escuela de música.' },
        { title: 'Salud para quien más lo necesita', detail: 'Insumos y medicamentos básicos para las campañas gratuitas.' },
        { title: 'Llevar la Palabra más lejos', detail: 'Material de estudio, grabaciones y respuesta a cada persona que nos escribe.' },
      ],
    },
  ]).onConflictDoUpdate({ target: siteSettings.key, set: { value: sql`excluded.value`, updatedAt: new Date() } });
  console.log('Donaciones: formas de donar y necesidades de muestra.');
}

async function sembrarSitio() {
  const [existe] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'site.info'));
  if (existe) return console.log('Sitio: ya tiene datos, no se toca.');
  await db.insert(siteSettings).values({
    key: 'site.info',
    value: {
      whatsapp: '',
      whatsappDisplay: '',
      email: '',
      address: '',
      city: 'Bolivia',
      redes: {
        youtube: 'https://www.youtube.com/@radiolaluzdeltiempo-go4mc',
        tiktok: 'https://www.tiktok.com/@radiolaluzdeltiempo',
        facebook: 'https://www.facebook.com/share/1EybTA3gNC/',
        appAndroid: 'https://play.google.com/store/apps/details?id=com.vidastudio.laluzdeltiempo',
      },
      mission: 'Llevar esperanza, salud y la Palabra de Dios a cada hogar, por la radio y en persona',
      history: [
        'Empezamos como una radio pequeña con un propósito claro: que la Palabra de Dios y los consejos de salud llegaran a cada hogar, de día y de noche.',
        'Con los años la radio creció en emisoras y en oyentes, y el ministerio también: hoy abrimos escuelas de vacaciones para niños, una escuela de música, talleres y campañas de salud gratuitas.',
        'Todo lo hacemos con voluntarios y con el apoyo de quienes creen en esta obra.',
      ],
    },
  });
  console.log('Sitio: datos generales de muestra (completar WhatsApp, correo y dirección).');
}

// Foto de cada emisora (solo si todavía no tiene una)
async function sembrarFotosEmisoras() {
  const sinFoto = await db.select({ id: stations.id, slug: stations.slug }).from(stations).where(isNull(stations.imageUrl));
  for (const e of sinFoto) {
    const archivo = `emisora-${e.slug}.jpg`;
    if (!existsSync(join(DEMO, archivo))) continue;
    await db.update(stations).set({ imageUrl: await subirDemo(archivo) }).where(eq(stations.id, e.id));
  }
  if (sinFoto.length) console.log(`Emisoras: fotos cargadas para ${sinFoto.length}.`);
}

// Videos de MUESTRA (canal de SUMtv Latino) para la demo de desarrollo.
// ANTES DE PUBLICAR: se reemplazan por los videos del canal del ministerio desde el panel.
const VIDEOS_DEMO: { id: string; titulo: string; serie: string; dias: number; area: string; destacado?: boolean }[] = [
  { id: 'FNcS-ilEjjg', titulo: '¿Cuál es el verdadero mensaje del libro de Abdías?', serie: 'preguntas-biblicas', dias: 1, area: 'biblia', destacado: true },
  { id: 'FhmnTYdj7Nc', titulo: '¿Fue literal el terremoto de Apocalipsis 11?', serie: 'preguntas-biblicas', dias: 8, area: 'biblia' },
  { id: 'ypFX0LV6Dwk', titulo: '¿Cuál es el mensaje de 1888?', serie: 'preguntas-biblicas', dias: 15, area: 'biblia' },
  { id: 'U8T_Ao6Ja9w', titulo: '¿Los fósiles humanos contradicen la Biblia?', serie: 'preguntas-biblicas', dias: 22, area: 'biblia' },
  { id: 'F60LS3QsJ4w', titulo: '¡Escucha esto! El don de profecía', serie: 'estudios-biblicos', dias: 2, area: 'biblia' },
  { id: '1Ax5HAnzTn8', titulo: 'Los escritos proféticos', serie: 'estudios-biblicos', dias: 9, area: 'biblia' },
  { id: 'Um0R14GCUFc', titulo: 'Revelación e inspiración', serie: 'estudios-biblicos', dias: 16, area: 'biblia' },
  { id: 'LWV6Xmx-prA', titulo: 'Profetas del Nuevo Testamento', serie: 'estudios-biblicos', dias: 23, area: 'biblia' },
  { id: 'V2Uo7UAu4B4', titulo: 'Cómo los padres generan traumas en los hijos', serie: 'vida-en-familia-ninos', dias: 3, area: 'ninos' },
  { id: 'H3hfI-TaYmU', titulo: 'Lo que Dios pide de una madre y esposa', serie: 'vida-en-familia-ninos', dias: 10, area: 'ninos' },
  { id: 'D5sXP4B-wUU', titulo: 'Lo que Dios pide de un padre y esposo', serie: 'vida-en-familia-ninos', dias: 17, area: 'ninos' },
  { id: 'ZZaLlJ0E9qc', titulo: 'Cómo controlar la ira', serie: 'vida-en-familia-salud', dias: 24, area: 'salud' },
  { id: 'GTaeSJQirtw', titulo: 'El maltrato físico', serie: 'vida-en-familia-salud', dias: 31, area: 'salud' },
  { id: 'gAEMoqhp39Y', titulo: '¿Qué busca el Papa visitando la cuna del ateísmo?', serie: 'actualidad-y-profecia', dias: 4, area: 'biblia' },
  { id: 'KiXftpQpdfY', titulo: 'La libertad religiosa en riesgo', serie: 'actualidad-y-profecia', dias: 11, area: 'biblia' },
  { id: 'dH66ZNVj2Gs', titulo: 'El peligro del ecumenismo', serie: 'actualidad-y-profecia', dias: 18, area: 'biblia' },
  { id: 'V00WoEFzp0I', titulo: '¿Por qué Meta pagará 18 mil millones?', serie: 'actualidad-y-profecia', dias: 25, area: 'biblia' },
  { id: 'Ia8BHYDWUig', titulo: 'Métodos parlamentarios', serie: 'escuela-de-lideres', dias: 5, area: 'biblia' },
  { id: 'rMyNyv_mw7k', titulo: 'La junta de iglesia como motor de crecimiento', serie: 'escuela-de-lideres', dias: 12, area: 'biblia' },
  { id: 'IhFqU0DxRac', titulo: 'Cómo manejar conflictos en la junta de iglesia', serie: 'escuela-de-lideres', dias: 19, area: 'biblia' },
  { id: 'ahDClH7FZqo', titulo: 'Cómo tomar decisiones sabias en la junta', serie: 'escuela-de-lideres', dias: 26, area: 'biblia' },
];

const NOMBRE_SERIE: Record<string, string> = {
  'preguntas-biblicas': 'Preguntas bíblicas',
  'estudios-biblicos': 'Estudios bíblicos',
  'vida-en-familia-ninos': 'Vida en familia',
  'vida-en-familia-salud': 'Vida en familia',
  'actualidad-y-profecia': 'Actualidad y profecía',
  'escuela-de-lideres': 'Escuela de líderes',
};

async function sembrarVideos() {
  if (await hayFilas(videos)) return console.log('Videos: ya tiene videos, no se toca.');
  const idSerie = new Map<string, string>();
  for (const [slug, nombre] of Object.entries(NOMBRE_SERIE)) {
    const area = VIDEOS_DEMO.find((v) => v.serie === slug)!.area;
    const [fila] = await db
      .insert(videoSeries)
      .values({ slug, name: nombre, areaId: (await areaId(area))!, sortOrder: idSerie.size })
      .returning();
    idSerie.set(slug, fila.id);
  }
  for (const v of VIDEOS_DEMO) {
    await db.insert(videos).values({
      youtubeId: v.id,
      title: v.titulo,
      areaId: (await areaId(v.area))!,
      seriesId: idSerie.get(v.serie) ?? null,
      isFeatured: Boolean(v.destacado),
      isPublished: true,
      publishedAt: new Date(Date.now() - v.dias * 86400000),
    });
  }
  console.log(`Videos: ${VIDEOS_DEMO.length} de muestra (canal SUMtv, solo demo) en ${idSerie.size} series.`);
}

await sembrarPortada();
await sembrarAreas();
await sembrarPersonas();
await sembrarNoticias();
await sembrarActividades();
await sembrarEmisoras();
await sembrarDonaciones();
await sembrarSitio();
await sembrarFotosEmisoras();
await sembrarVideos();
process.exit(0);

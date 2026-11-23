import { Hono } from 'hono';
import QRCode from 'qrcode';
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { AGENDA_TIPO_ETIQUETA, AGENDA_ROL_ETIQUETA, inscripcionPublicaSchema, paisDe, soloDigitos, type AgendaRol, type AgendaTipo } from '@luz/shared';
import { errorValidacion } from '../../lib/validar.js';
import { db } from '../../db/index.js';
import {
  activities,
  activityAreas,
  activityChannels,
  activityGallery,
  activityPeople,
  activityProgramItems,
  activitySessions,
  areas,
  locations,
  people,
  registrations,
} from '../../db/schema.js';

// API pública de la agenda (web y app). Sin sesión y solo lo publicado.
// Una actividad es "próxima" si su última sesión aún no termina; si no, es "pasada".
export const agendaPublicoRoutes = new Hono();

const aHora = (t: string | null) => (t ? t.slice(0, 5) : null);
type Estado = 'proximas' | 'pasadas' | 'todas';

// Carga las actividades publicadas con sus sesiones, áreas y sedes (en pocas consultas)
async function cargarPublicadas() {
  const filas = await db.select().from(activities).where(eq(activities.status, 'publicada'));
  const ids = filas.map((f) => f.id);
  if (ids.length === 0) return [];
  const [sesiones, areasFilas, areasNombres, sedes, conteo] = await Promise.all([
    db.select().from(activitySessions).where(inArray(activitySessions.activityId, ids)).orderBy(asc(activitySessions.startsAt)),
    db.select().from(activityAreas).where(inArray(activityAreas.activityId, ids)),
    db.select({ id: areas.id, slug: areas.slug, name: areas.name }).from(areas),
    db.select().from(locations),
    db
      .select({ activityId: registrations.activityId, n: sql<number>`count(*)::int` })
      .from(registrations)
      .where(inArray(registrations.activityId, ids))
      .groupBy(registrations.activityId),
  ]);
  const area = new Map(areasNombres.map((a) => [a.id, a]));
  const sede = new Map(sedes.map((s) => [s.id, s]));

  return filas.map((a) => {
    const suyas = sesiones.filter((s) => s.activityId === a.id);
    const inicio = suyas[0]?.startsAt ?? null;
    const fin = suyas.length ? new Date(Math.max(...suyas.map((s) => (s.endsAt ?? s.startsAt).getTime()))) : null;
    const primera = suyas[0];
    return {
      fila: a,
      sesiones: suyas,
      inicio,
      fin,
      pasada: fin ? fin.getTime() < Date.now() : false,
      areas: areasFilas.filter((f) => f.activityId === a.id).map((f) => area.get(f.areaId)).filter((x): x is { id: string; slug: string; name: string } => Boolean(x)),
      lugar: primera?.locationId ? (sede.get(primera.locationId)?.name ?? null) : (primera?.locationNote ?? null),
      inscritos: conteo.find((x) => x.activityId === a.id)?.n ?? 0,
    };
  });
}

type Publicada = Awaited<ReturnType<typeof cargarPublicadas>>[number];

const tarjeta = (p: Publicada) => ({
  slug: p.fila.slug,
  kind: p.fila.kind,
  kindLabel: AGENDA_TIPO_ETIQUETA[p.fila.kind as AgendaTipo],
  title: p.fila.title,
  summary: p.fila.summary ?? '',
  coverUrl: p.fila.coverUrl,
  language: p.fila.language,
  isVirtual: p.fila.isVirtual,
  isFree: p.fila.isFree,
  priceAmount: p.fila.priceAmount,
  priceNote: p.fila.priceNote,
  areas: p.areas.map((a) => ({ slug: a.slug, name: a.name })),
  inicio: p.inicio?.toISOString() ?? null,
  fin: p.fin?.toISOString() ?? null,
  cantidadSesiones: p.sesiones.length,
  lugar: p.lugar,
  pasada: p.pasada,
});

// ---------- Listado ----------

agendaPublicoRoutes.get('/agenda', async (c) => {
  const tipo = c.req.query('tipo');
  const area = c.req.query('area');
  const estado = (c.req.query('estado') ?? 'proximas') as Estado;
  const soloGratis = c.req.query('gratis') === '1';
  const soloVirtual = c.req.query('virtual') === '1';

  let lista = await cargarPublicadas();
  if (tipo) lista = lista.filter((p) => p.fila.kind === tipo);
  if (area) lista = lista.filter((p) => p.areas.some((a) => a.slug === area));
  if (soloGratis) lista = lista.filter((p) => p.fila.isFree);
  if (soloVirtual) lista = lista.filter((p) => p.fila.isVirtual);
  if (estado === 'proximas') lista = lista.filter((p) => !p.pasada);
  if (estado === 'pasadas') lista = lista.filter((p) => p.pasada);

  // Próximas: la más cercana primero. Pasadas: la más reciente primero.
  lista.sort((a, b) => {
    const ta = a.inicio?.getTime() ?? 0;
    const tb = b.inicio?.getTime() ?? 0;
    return estado === 'pasadas' ? tb - ta : ta - tb;
  });
  return c.json(lista.map(tarjeta));
});

// ---------- Tipos y áreas para los filtros de la web y la app ----------

agendaPublicoRoutes.get('/agenda/filtros', async (c) => {
  const areasLista = await db.select({ slug: areas.slug, name: areas.name }).from(areas).orderBy(asc(areas.sortOrder), asc(areas.name));
  return c.json({
    tipos: Object.entries(AGENDA_TIPO_ETIQUETA).map(([valor, etiqueta]) => ({ valor, etiqueta })),
    areas: areasLista,
  });
});

// ---------- Ficha ----------

agendaPublicoRoutes.get('/agenda/:slug', async (c) => {
  const slug = c.req.param('slug') as string;
  const p = (await cargarPublicadas()).find((x) => x.fila.slug === slug);
  if (!p) return c.json(null, 404);

  const id = p.fila.id;
  const [personas, canales, galeria, sedes, programa] = await Promise.all([
    db
      .select({ role: activityPeople.role, name: people.name, roleTitle: people.roleTitle, photoUrl: people.photoUrl, bio: people.bio, isPublished: people.isPublished, personId: people.id })
      .from(activityPeople)
      .innerJoin(people, eq(activityPeople.personId, people.id))
      .where(eq(activityPeople.activityId, id))
      .orderBy(asc(activityPeople.sortOrder)),
    db.select().from(activityChannels).where(eq(activityChannels.activityId, id)).orderBy(asc(activityChannels.sortOrder)),
    db.select().from(activityGallery).where(eq(activityGallery.activityId, id)).orderBy(asc(activityGallery.sortOrder)),
    db.select().from(locations),
    p.sesiones.length
      ? db
          .select({
            sessionId: activityProgramItems.sessionId,
            startTime: activityProgramItems.startTime,
            durationMin: activityProgramItems.durationMin,
            title: activityProgramItems.title,
            description: activityProgramItems.description,
            personId: activityProgramItems.personId,
          })
          .from(activityProgramItems)
          .where(inArray(activityProgramItems.sessionId, p.sesiones.map((s) => s.id)))
          .orderBy(asc(activityProgramItems.sortOrder))
      : Promise.resolve([]),
  ]);
  const sede = new Map(sedes.map((s) => [s.id, s]));
  const personaPorId = new Map(personas.map((x) => [x.personId, x]));
  const web = canales.find((c) => c.channel === 'web' && c.enabled);
  const inscritos = p.inscritos;
  const lugares = p.fila.capacity ? Math.max(p.fila.capacity - inscritos, 0) : null;

  return c.json({
    ...tarjeta(p),
    content: p.fila.content ?? '',
    report: p.fila.report ?? '',
    galeria: galeria.map((g) => ({ imageUrl: g.imageUrl, caption: g.caption ?? '' })),
    sesiones: p.sesiones.map((s) => {
      const lugar = s.locationId ? sede.get(s.locationId) : undefined;
      return {
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt?.toISOString() ?? null,
        lugar: lugar ? { name: lugar.name, address: lugar.address, city: lugar.city, mapUrl: lugar.mapUrl } : null,
        locationNote: s.locationNote,
        programa: programa
          .filter((x) => x.sessionId === s.id)
          .map((x) => {
            const persona = x.personId ? personaPorId.get(x.personId) : undefined;
            return {
              startTime: aHora(x.startTime),
              durationMin: x.durationMin,
              title: x.title,
              description: x.description,
              persona: persona?.isPublished ? { name: persona.name, roleTitle: persona.roleTitle, photoUrl: persona.photoUrl } : null,
            };
          }),
      };
    }),
    personas: personas
      .filter((x) => x.isPublished)
      .map((x) => ({ name: x.name, roleTitle: x.roleTitle, role: x.role, roleLabel: AGENDA_ROL_ETIQUETA[x.role as AgendaRol], photoUrl: x.photoUrl, bio: x.bio ?? '' })),
    // Canales activos. El de la web se muestra como formulario; el resto como contacto.
    canales: canales
      .filter((c) => c.enabled && c.channel !== 'web' && c.channel !== 'app')
      .map((c) => ({ channel: c.channel, value: c.value ?? '' })),
    inscripcionWeb: Boolean(web) && p.fila.status === 'publicada' && !p.pasada,
    cupo: { capacidad: p.fila.capacity, lugaresLibres: lugares, lleno: lugares === 0 },
    // QR de inscripción: se genera solo (lleva a la ficha, a la sección de inscripción).
    qrInscripcionUrl: Boolean(web) && p.fila.status === 'publicada' && !p.pasada ? `/api/v1/public/agenda/${slug}/qr.png` : null,
    // Formulario de la app: se activa aparte del de la web
    inscripcionApp: canales.some((c) => c.channel === 'app' && c.enabled) && p.fila.status === 'publicada' && !p.pasada,
    // QR subido por el ministerio (por ejemplo, el de pago)
    qrSubidoUrl: p.fila.qrUrl ?? null,
  });
});

// ---------- QR de inscripción (PNG): lleva a la sección de inscripción de la ficha ----------

agendaPublicoRoutes.get('/agenda/:slug/qr.png', async (c) => {
  const slug = c.req.param('slug') as string;
  const p = (await cargarPublicadas()).find((x) => x.fila.slug === slug);
  if (!p || p.pasada) return c.json(null, 404);
  const [web] = await db
    .select({ enabled: activityChannels.enabled })
    .from(activityChannels)
    .where(and(eq(activityChannels.activityId, p.fila.id), eq(activityChannels.channel, 'web')));
  if (!web?.enabled) return c.json(null, 404);

  const base = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  const png = await QRCode.toBuffer(`${base}/agenda/${slug}#inscribirme`, {
    type: 'png',
    width: 600,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b1324', light: '#ffffff' },
  });
  return c.body(new Uint8Array(png), 200, {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=300',
  });
});

// ---------- Inscripción desde el formulario de la web o de la app ----------
// El cuerpo trae "origen": 'web' o 'app'. Solo se acepta si ese formulario está activado en la actividad.

agendaPublicoRoutes.post('/agenda/:slug/inscripciones', async (c) => {
  const slug = c.req.param('slug') as string;
  const cuerpo = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  // Campo trampa: los robots lo llenan, las personas no lo ven
  if (typeof cuerpo.website === 'string' && cuerpo.website.trim() !== '') return c.json({ ok: true }, 201);

  const p = (await cargarPublicadas()).find((x) => x.fila.slug === slug);
  if (!p) return c.json({ error: 'no_encontrado' }, 404);
  if (p.pasada) return c.json({ error: 'cerrada', message: 'Esta actividad ya terminó.' }, 409);

  const origen = cuerpo.origen === 'app' ? 'app' : 'web';
  const [canal] = await db
    .select({ enabled: activityChannels.enabled })
    .from(activityChannels)
    .where(and(eq(activityChannels.activityId, p.fila.id), eq(activityChannels.channel, origen)));
  if (!canal?.enabled) {
    const mensaje = origen === 'app' ? 'Esta actividad no se inscribe desde la app.' : 'Esta actividad no se inscribe desde la web.';
    return c.json({ error: 'sin_inscripcion', message: mensaje }, 409);
  }

  if (p.fila.capacity && p.inscritos >= p.fila.capacity) {
    return c.json({ error: 'cupo_lleno', message: 'Ya no hay lugares disponibles.' }, 409);
  }

  const parsed = inscripcionPublicaSchema.safeParse(cuerpo);
  if (!parsed.success) return errorValidacion(c, parsed.error);
  const d = parsed.data;
  const telefono = soloDigitos(d.phone ?? '');
  const email = (d.email ?? '').trim();
  if (!telefono && !email) return c.json({ error: 'validacion', campo: 'phone', message: 'Escribe tu teléfono o tu correo para confirmarte.' }, 422);
  if (telefono) {
    const pais = paisDe(d.phoneCode);
    if (!pais) return c.json({ error: 'validacion', campo: 'phoneCode', message: 'Elige el país del teléfono.' }, 422);
    if (telefono.length < pais.digitosMin || telefono.length > pais.digitosMax) {
      return c.json({ error: 'validacion', campo: 'phone', message: `El número debe tener entre ${pais.digitosMin} y ${pais.digitosMax} dígitos.` }, 422);
    }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'validacion', campo: 'email', message: 'Revisa el correo.' }, 422);
  }

  await db.insert(registrations).values({
    activityId: p.fila.id,
    fullName: d.fullName,
    phoneCode: telefono ? d.phoneCode : null,
    phone: telefono || null,
    email: email || null,
    origin: origen,
    status: 'pendiente',
  });
  return c.json({ ok: true, message: 'Recibimos tu inscripción. Te confirmaremos pronto.' }, 201);
});

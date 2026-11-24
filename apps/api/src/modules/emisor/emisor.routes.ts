import { Hono, type Context } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import { loadCurrentUser, tienePermiso, type CurrentUser } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { descifrar } from '../../lib/cifrado.js';
import { db } from '../../db/index.js';
import { broadcastSessions, programSlots, programs, stationBroadcasters, stations, users } from '../../db/schema.js';

// Rutas del emisor de Windows (la app con la que los locutores salen al aire).
// El emisor inicia sesión con un usuario del panel (Better Auth + token bearer) y aquí recibe
// las emisoras en las que puede transmitir, con los datos de conexión; y avisa cuándo transmite.
export const emisorRoutes = new Hono<{ Variables: { usuario: CurrentUser } }>();
const PERMISO = 'radio:transmitir';
const ZONA = process.env.RADIO_TZ ?? 'America/La_Paz';

// Sesión + permiso de transmitir. Mensajes pensados para mostrarse tal cual en el emisor.
emisorRoutes.use('*', async (c, next) => {
  const usuario = await loadCurrentUser(c.req.raw.headers);
  if (!usuario) return c.json({ error: 'no_autenticado', message: 'La sesión terminó. Vuelve a iniciar sesión.' }, 401);
  if (usuario.mustChangePassword) {
    return c.json({ error: 'debe_cambiar_contrasena', message: 'Debes cambiar tu contraseña inicial en el panel antes de usar el emisor.' }, 403);
  }
  if (!(await tienePermiso(usuario, PERMISO))) {
    return c.json({ error: 'sin_permiso', message: 'Tu usuario no tiene permiso para transmitir. Pídeselo al administrador.' }, 403);
  }
  c.set('usuario', usuario);
  await next();
});

/** IP con la que llega el emisor (detrás de Caddy, la del encabezado X-Forwarded-For) */
function ipDe(c: Context) {
  const reenviada = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  if (reenviada) return reenviada;
  try {
    return getConnInfo(c).remote.address ?? null;
  } catch {
    return null;
  }
}

/** Día (0 = domingo) y hora "HH:MM:SS" actuales en la zona de la radio */
function ahoraEnRadio() {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: ZONA, weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date());
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? '00';
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hora = v('hour') === '24' ? '00' : v('hour');
  return { dia: dias.indexOf(v('weekday')), hora: `${hora}:${v('minute')}:${v('second')}` };
}

/** Programa que corresponde ahora según la programación semanal del panel */
export async function programaActual(stationId: string): Promise<{ nombre: string; conductor: string | null } | null> {
  const { dia, hora } = ahoraEnRadio();
  const filas = await db
    .select({ nombre: programs.name, conductor: programs.hostName, inicio: programSlots.startTime, fin: programSlots.endTime })
    .from(programSlots)
    .innerJoin(programs, eq(programSlots.programId, programs.id))
    .where(and(eq(programs.stationId, stationId), eq(programs.isActive, true), eq(programSlots.dayOfWeek, dia)))
    .orderBy(asc(programSlots.startTime));
  // Una franja que termina a las 00:00 dura hasta la medianoche
  const f = filas.find((x) => x.inicio <= hora && (x.fin === '00:00:00' || hora < x.fin));
  return f ? { nombre: f.nombre, conductor: f.conductor } : null;
}

/** Puerto de oyentes (Icecast) a partir de PUBLIC_STREAM_BASE */
function puertoOyentes() {
  try {
    const u = new URL(process.env.PUBLIC_STREAM_BASE ?? 'http://localhost:8000');
    return Number(u.port || (u.protocol === 'https:' ? 443 : 80));
  } catch {
    return 8000;
  }
}

/** Emisoras en las que el usuario puede transmitir: todas si administra estaciones; si no, las asignadas */
async function emisorasDe(usuario: CurrentUser) {
  const base = and(eq(stations.status, 'active'), eq(stations.kind, 'own'), isNotNull(stations.mountPoint), isNotNull(stations.livePasswordEnc));
  if (await tienePermiso(usuario, 'estaciones:todas')) {
    return db.select().from(stations).where(base).orderBy(asc(stations.sortOrder), asc(stations.name));
  }
  const filas = await db
    .select({ s: stations })
    .from(stationBroadcasters)
    .innerJoin(stations, eq(stationBroadcasters.stationId, stations.id))
    .where(and(eq(stationBroadcasters.userId, usuario.id), base))
    .orderBy(asc(stations.sortOrder), asc(stations.name));
  return filas.map((f) => f.s);
}

async function puedeTransmitirEn(usuario: CurrentUser, stationId: string) {
  return (await emisorasDe(usuario)).some((e) => e.id === stationId);
}

// Quién inició sesión (para mostrarlo en el emisor)
emisorRoutes.get('/yo', async (c) => {
  const usuario = c.get('usuario');
  const [u] = await db.select({ nombre: users.name, email: users.email }).from(users).where(eq(users.id, usuario.id));
  return c.json({ id: usuario.id, nombre: u?.nombre ?? '', email: u?.email ?? '' });
});

// Emisoras con todo lo necesario para conectarse. La contraseña del locutor viaja solo aquí,
// al emisor de un usuario autorizado, que la guarda en el llavero del sistema.
emisorRoutes.get('/emisoras', async (c) => {
  const usuario = c.get('usuario');
  const lista = await emisorasDe(usuario);
  // Por defecto, el servidor de la radio es el mismo host con el que el emisor llegó a la API
  const servidor = process.env.RADIO_HARBOR_HOST || new URL(c.req.url).hostname;
  const puerto = Number(process.env.RADIO_HARBOR_PORT ?? 8005);
  const salida = [];
  for (const e of lista) {
    let contrasena: string;
    try {
      contrasena = descifrar(e.livePasswordEnc!);
    } catch {
      continue; // contraseña ilegible (clave cambiada): no se ofrece
    }
    salida.push({
      id: e.id,
      slug: e.slug,
      nombre: e.name,
      principal: e.isMain,
      // Liquidsoap publica la entrada en vivo de cada emisora en /<slug> del puerto de locutores
      servidor,
      puerto,
      mount: `/${e.slug}`,
      puertoOyentes: puertoOyentes(),
      mountOyentes: e.mountPoint,
      contrasena,
      programa: await programaActual(e.id),
    });
  }
  salida.sort((a, b) => Number(b.principal) - Number(a.principal));
  return c.json({ emisoras: salida });
});

// ---------- Transmisiones ----------

function entero(v: unknown, max = 1_000_000) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.round(n), max) : null;
}
function texto(v: unknown, max = 120) {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}
const ESTADOS = ['conectando', 'al_aire', 'reconectando'] as const;
type EstadoTransmision = (typeof ESTADOS)[number];

// El emisor sale al aire: se abre una transmisión
emisorRoutes.post('/transmisiones', async (c) => {
  const usuario = c.get('usuario');
  const cuerpo = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const stationId = texto(cuerpo.emisoraId, 64);
  if (!stationId || !(await puedeTransmitirEn(usuario, stationId))) {
    return c.json({ error: 'sin_permiso', message: 'No puedes transmitir en esta emisora.' }, 403);
  }
  // Si quedó abierta una transmisión anterior de esta PC (apagón), se cierra
  const equipo = texto(cuerpo.equipo);
  if (equipo) {
    await db
      .update(broadcastSessions)
      .set({ endedAt: new Date(), motivoFin: 'Sin cierre: el emisor se cerró de golpe' })
      .where(and(eq(broadcastSessions.stationId, stationId), eq(broadcastSessions.equipo, equipo), isNull(broadcastSessions.endedAt)));
  }
  const programa = await programaActual(stationId);
  const [fila] = await db
    .insert(broadcastSessions)
    .values({
      stationId,
      userId: usuario.id,
      equipo,
      ip: ipDe(c),
      version: texto(cuerpo.version, 32),
      sistema: texto(cuerpo.sistema, 32),
      programa: texto(cuerpo.programa) ?? programa?.nombre ?? null,
    })
    .returning({ id: broadcastSessions.id });
  await registrarAuditoria({ userId: usuario.id, accion: 'radio.transmitir', entidad: 'emisora', entidadId: stationId, detalle: `Salió al aire desde ${equipo ?? 'una PC'}` });
  return c.json({ id: fila.id, programa }, 201);
});

async function transmisionPropia(c: Context<{ Variables: { usuario: CurrentUser } }>) {
  const [t] = await db.select().from(broadcastSessions).where(eq(broadcastSessions.id, c.req.param('id') ?? ''));
  if (!t || t.userId !== c.get('usuario').id) return null;
  return t;
}

// Cada 30 s mientras transmite: estado, envío y contadores
emisorRoutes.put('/transmisiones/:id', async (c) => {
  const t = await transmisionPropia(c);
  if (!t) return c.json({ error: 'no_encontrado' }, 404);
  const cuerpo = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const estado = ESTADOS.includes(cuerpo.estado as EstadoTransmision) ? (cuerpo.estado as EstadoTransmision) : t.estado;
  await db
    .update(broadcastSessions)
    .set({
      estado,
      kbps: entero(cuerpo.kbps, 1000) ?? t.kbps,
      cortes: entero(cuerpo.cortes) ?? t.cortes,
      silencios: entero(cuerpo.silencios) ?? t.silencios,
      saturaciones: entero(cuerpo.saturaciones) ?? t.saturaciones,
      programa: texto(cuerpo.programa) ?? t.programa,
      ip: ipDe(c) ?? t.ip,
      lastSeenAt: new Date(),
      // Un aviso después de darla por terminada (p. ej. la API estuvo caída) la reabre
      endedAt: null,
      motivoFin: null,
    })
    .where(eq(broadcastSessions.id, t.id));
  return c.json({ programa: await programaActual(t.stationId) });
});

// Fin de la transmisión
emisorRoutes.post('/transmisiones/:id/fin', async (c) => {
  const t = await transmisionPropia(c);
  if (!t) return c.json({ error: 'no_encontrado' }, 404);
  const cuerpo = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  await db
    .update(broadcastSessions)
    .set({ endedAt: new Date(), lastSeenAt: new Date(), motivoFin: texto(cuerpo.motivo, 300) ?? 'Terminada por el locutor' })
    .where(eq(broadcastSessions.id, t.id));
  return c.json({ ok: true });
});

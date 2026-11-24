import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { desc, isNotNull, sql } from 'drizzle-orm';
import { loadCurrentUser, requirePermission } from '../../lib/authz.js';
import { registrarAuditoria } from '../../lib/audit.js';
import { db } from '../../db/index.js';
import { broadcastSessions } from '../../db/schema.js';

// Versiones del emisor de Windows y actualizaciones automáticas.
// El superadmin sube desde el panel el instalador (.exe) y su firma (.sig, generada al compilar con la clave de
// actualizaciones). El emisor consulta /public/emisor/actualizacion/... y, si hay una versión más nueva, la
// descarga, verifica la firma y la instala. Archivos en uploads/emisor; la versión vigente en ultima.json.
const CARPETA = join(process.cwd(), 'uploads', 'emisor');
const MANIFIESTO = join(CARPETA, 'ultima.json');
const NOMBRE_VALIDO = /^emisor-\d+\.\d+\.\d+-setup\.exe$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const MAX_BYTES = 80 * 1024 * 1024;

interface Publicada {
  version: string;
  notas: string;
  fecha: string;
  archivo: string;
  firma: string;
  bytes: number;
}

async function publicada(): Promise<Publicada | null> {
  try {
    return JSON.parse(await readFile(MANIFIESTO, 'utf8')) as Publicada;
  } catch {
    return null;
  }
}

/** 1 si a > b, -1 si a < b, 0 si son iguales ("0.10.0" > "0.9.3") */
function comparar(a: string, b: string) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0) ? 1 : -1;
  }
  return 0;
}

/** Dirección pública de la API (detrás de Caddy llega como http: se respeta X-Forwarded-Proto) */
function basePublica(c: Context) {
  if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL.replace(/\/$/, '');
  const u = new URL(c.req.url);
  const proto = c.req.header('x-forwarded-proto') ?? u.protocol.replace(':', '');
  const host = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? u.host;
  return `${proto}://${host}`;
}

// ---------- Público (lo usa el emisor, sin sesión) ----------

export const emisorPublicoRoutes = new Hono();

// Formato del actualizador de Tauri: 204 si no hay nada nuevo; si no, versión, notas, URL y firma
emisorPublicoRoutes.get('/actualizacion/:target/:arch/:actual', async (c) => {
  const v = await publicada();
  const actual = c.req.param('actual') ?? '0.0.0';
  if (!v || c.req.param('target') !== 'windows' || !VERSION.test(actual.split('-')[0]) || comparar(v.version, actual.split('-')[0]) <= 0) {
    return c.body(null, 204);
  }
  return c.json({
    version: v.version,
    notes: v.notas,
    pub_date: v.fecha,
    url: `${basePublica(c)}/api/v1/public/emisor/descargas/${v.archivo}`,
    signature: v.firma,
  });
});

// Última versión publicada (para el enlace de descarga del panel)
emisorPublicoRoutes.get('/ultima', async (c) => {
  const v = await publicada();
  if (!v) return c.json({ version: null });
  return c.json({ version: v.version, notas: v.notas, fecha: v.fecha, bytes: v.bytes, url: `${basePublica(c)}/api/v1/public/emisor/descargas/${v.archivo}` });
});

emisorPublicoRoutes.get('/descargas/:archivo', async (c) => {
  const archivo = c.req.param('archivo') ?? '';
  if (!NOMBRE_VALIDO.test(archivo)) return c.json({ error: 'no_encontrado' }, 404);
  try {
    const bytes = await readFile(join(CARPETA, archivo));
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/vnd.microsoft.portable-executable',
        'Content-Disposition': `attachment; filename="Emisor La Luz del Tiempo ${archivo.replace('emisor-', '').replace('-setup.exe', '')}.exe"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return c.json({ error: 'no_encontrado' }, 404);
  }
});

// ---------- Panel ----------

export const emisorVersionesRoutes = new Hono();

// Versión publicada y qué versión tiene cada PC (según sus transmisiones)
emisorVersionesRoutes.get('/emisor/versiones', requirePermission('estaciones:todas'), async (c) => {
  const equipos = await db
    .select({
      equipo: broadcastSessions.equipo,
      version: sql<string>`(array_agg(${broadcastSessions.version} order by ${broadcastSessions.lastSeenAt} desc))[1]`,
      ultimaVez: sql<string>`max(${broadcastSessions.lastSeenAt})`,
    })
    .from(broadcastSessions)
    .where(isNotNull(broadcastSessions.equipo))
    .groupBy(broadcastSessions.equipo)
    .orderBy(desc(sql`max(${broadcastSessions.lastSeenAt})`));
  return c.json({ publicada: await publicada(), equipos });
});

// Publicar una versión: instalador NSIS (*-setup.exe) y su firma (*-setup.exe.sig)
emisorVersionesRoutes.post(
  '/emisor/versiones',
  requirePermission('servidores:configurar'),
  bodyLimit({ maxSize: MAX_BYTES, onError: (c) => c.json({ error: 'validacion', message: 'El instalador pesa más de 80 MB.' }, 413) }),
  async (c) => {
    const body = await c.req.parseBody();
    const version = String(body.version ?? '').trim();
    const notas = String(body.notas ?? '').trim().slice(0, 2000);
    const instalador = body.instalador;
    const firma = body.firma;
    if (!VERSION.test(version)) return c.json({ error: 'validacion', campo: 'version', message: 'La versión debe tener el formato 0.2.0.' }, 422);
    if (!(instalador instanceof File) || !instalador.name.toLowerCase().endsWith('.exe')) {
      return c.json({ error: 'validacion', campo: 'instalador', message: 'Sube el instalador .exe (el que termina en -setup.exe).' }, 422);
    }
    if (!(firma instanceof File) || !firma.name.toLowerCase().endsWith('.sig')) {
      return c.json({ error: 'validacion', campo: 'firma', message: 'Sube la firma .sig que está junto al instalador.' }, 422);
    }
    const anterior = await publicada();
    if (anterior && comparar(version, anterior.version) <= 0) {
      return c.json({ error: 'validacion', campo: 'version', message: `Ya está publicada la ${anterior.version}. La nueva debe ser mayor.` }, 422);
    }
    // Sin la versión del instalador en su nombre, se confía en la indicada (el actualizador verifica la firma)
    const marca = instalador.name.match(/_(\d+\.\d+\.\d+)_/)?.[1];
    if (marca && marca !== version) {
      return c.json({ error: 'validacion', campo: 'version', message: `El instalador es de la versión ${marca}, no de la ${version}.` }, 422);
    }
    const textoFirma = (await firma.text()).trim();
    if (textoFirma.length < 40) return c.json({ error: 'validacion', campo: 'firma', message: 'La firma está vacía o no es válida.' }, 422);

    await mkdir(CARPETA, { recursive: true });
    const archivo = `emisor-${version}-setup.exe`;
    const bytes = Buffer.from(await instalador.arrayBuffer());
    await writeFile(join(CARPETA, archivo), bytes);
    const nueva: Publicada = { version, notas, fecha: new Date().toISOString(), archivo, firma: textoFirma, bytes: bytes.length };
    // Escritura atómica del manifiesto: el emisor nunca lee uno a medias
    await writeFile(`${MANIFIESTO}.tmp`, JSON.stringify(nueva, null, 2));
    await rename(`${MANIFIESTO}.tmp`, MANIFIESTO);

    const actor = await loadCurrentUser(c.req.raw.headers);
    await registrarAuditoria({ userId: actor?.id ?? null, accion: 'emisor.publicar', entidad: 'emisor', entidadId: version, detalle: `Versión ${version} publicada` });
    return c.json({ publicada: nueva }, 201);
  },
);

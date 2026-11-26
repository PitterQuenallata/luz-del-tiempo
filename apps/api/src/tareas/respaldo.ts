// Copias de seguridad (como AzuraCast): un archivo .tar.gz con la base de datos y la configuración de la radio.
// Se guardan en RESPALDOS_DIR. Se descargan desde el panel (superadmin), así llegan al PC.
// La base se exporta con pg_dump (PG_DUMP_BIN si no está en el PATH). Los audios NO van: son muy grandes.
import { spawn } from 'node:child_process';
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const CARPETA_RESPALDOS = process.env.RESPALDOS_DIR ?? path.resolve(process.cwd(), 'respaldos');
export const RETENCION_DIAS = Number(process.env.RESPALDOS_DIAS ?? 14);
const CONFIG_RADIO = process.env.RADIO_CONFIG_DIR ?? path.resolve(process.cwd(), '../../infra/radio/data/config');
const PATRON = /^respaldo-[0-9T-]+\.tar\.gz$/;

function ejecutar(comando: string, args: string[], opciones: { env?: NodeJS.ProcessEnv; salida?: string } = {}): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const hijo = spawn(comando, args, { env: opciones.env ?? process.env, stdio: ['ignore', opciones.salida ? 'pipe' : 'ignore', 'pipe'] });
    let errores = '';
    hijo.stderr?.on('data', (d) => (errores += d.toString()));
    hijo.on('error', rechazar);
    hijo.on('close', (codigo) => (codigo === 0 ? resolver() : rechazar(new Error(`${comando} salió con ${codigo}: ${errores.slice(0, 300)}`))));
  });
}

/** Crea una copia nueva. Devuelve el nombre del archivo. */
export async function crearRespaldo(): Promise<string> {
  await mkdir(CARPETA_RESPALDOS, { recursive: true });
  const marca = new Date().toISOString().slice(0, 16).replace(/:/g, '');
  const nombre = `respaldo-${marca}.tar.gz`;
  const tmp = path.join(CARPETA_RESPALDOS, `tmp-${marca}`);
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  try {
    // 1. Base de datos (formato SQL, legible y restaurable con psql)
    const pgDump = process.env.PG_DUMP_BIN ?? 'pg_dump';
    await ejecutar(pgDump, ['--no-owner', '--no-privileges', '-f', path.join(tmp, 'base-de-datos.sql'), process.env.DATABASE_URL ?? '']);
    // 2. Configuración de la radio (emisoras, listas, horarios, estado); sin audios
    await cp(CONFIG_RADIO, path.join(tmp, 'radio-config'), { recursive: true, filter: (origen) => !origen.includes(`${path.sep}ahora`) });
    // 3. Índice con lo que contiene
    await writeFile(path.join(tmp, 'LEEME.txt'), `Copia de La Luz del Tiempo\nFecha: ${new Date().toISOString()}\nContenido: base de datos (SQL) y configuración de la radio. Sin audios.\n`);
    // 4. Comprimir
    await ejecutar('tar', ['-czf', path.join(CARPETA_RESPALDOS, nombre), '-C', tmp, '.']);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  await limpiarViejos();
  return nombre;
}

export interface RespaldoInfo { nombre: string; bytes: number; creado: string }

export async function listarRespaldos(): Promise<RespaldoInfo[]> {
  try {
    const nombres = (await readdir(CARPETA_RESPALDOS)).filter((n) => PATRON.test(n));
    const filas = await Promise.all(nombres.map(async (nombre) => {
      const s = await stat(path.join(CARPETA_RESPALDOS, nombre));
      return { nombre, bytes: s.size, creado: s.mtime.toISOString() };
    }));
    return filas.sort((a, b) => (a.creado < b.creado ? 1 : -1));
  } catch {
    return [];
  }
}

/** Ruta de un respaldo, o null si el nombre no es válido o no existe (evita salir de la carpeta). */
export function rutaRespaldo(nombre: string): string | null {
  if (!PATRON.test(nombre)) return null;
  return path.join(CARPETA_RESPALDOS, nombre);
}

async function limpiarViejos() {
  const limite = Date.now() - RETENCION_DIAS * 86_400_000;
  for (const r of await listarRespaldos()) {
    if (new Date(r.creado).getTime() < limite) await rm(path.join(CARPETA_RESPALDOS, r.nombre), { force: true });
  }
}

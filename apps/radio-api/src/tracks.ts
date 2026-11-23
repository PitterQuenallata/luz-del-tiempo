import { mkdir, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

export const EXTENSIONES = ['.mp3', '.ogg', '.opus', '.m4a', '.aac', '.flac', '.wav'];

const carpeta = (slug: string) => path.join(config.musicDir, slug);

/** Nombre de archivo seguro: sin rutas, sin caracteres raros. */
export function nombreSeguro(original: string): string | null {
  const ext = path.extname(original).toLowerCase();
  if (!EXTENSIONES.includes(ext)) return null;
  const base = path
    .basename(original, path.extname(original))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._ -]/g, '')
    .trim()
    .slice(0, 100);
  return `${base || 'audio'}${ext}`;
}

export async function listarAudios(slug: string) {
  try {
    const nombres = await readdir(carpeta(slug));
    const audios = await Promise.all(
      nombres
        .filter((n) => EXTENSIONES.includes(path.extname(n).toLowerCase()))
        .map(async (nombre) => {
          const s = await stat(path.join(carpeta(slug), nombre));
          return { file: nombre, sizeBytes: s.size, uploadedAt: s.mtime.toISOString() };
        }),
    );
    return audios.sort((a, b) => a.file.localeCompare(b.file));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function espacioUsado(slug: string) {
  return (await listarAudios(slug)).reduce((total, a) => total + a.sizeBytes, 0);
}

/** Guarda con un temporal oculto y renombra, para que el AutoDJ no tome un archivo a medias. */
export async function guardarAudio(slug: string, nombre: string, datos: ArrayBuffer) {
  await mkdir(carpeta(slug), { recursive: true });
  let final = nombre;
  const ext = path.extname(nombre);
  for (let n = 2; await existe(path.join(carpeta(slug), final)); n++) {
    final = `${path.basename(nombre, ext)} (${n})${ext}`;
  }
  const tmp = path.join(carpeta(slug), `.subiendo-${Date.now()}`);
  await writeFile(tmp, Buffer.from(datos));
  await rename(tmp, path.join(carpeta(slug), final));
  return final;
}

export async function borrarAudio(slug: string, nombre: string) {
  if (nombre !== path.basename(nombre)) return false;
  try {
    await unlink(path.join(carpeta(slug), nombre));
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw err;
  }
}

async function existe(ruta: string) {
  try {
    await stat(ruta);
    return true;
  } catch {
    return false;
  }
}

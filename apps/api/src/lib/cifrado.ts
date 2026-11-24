import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Cifrado de secretos guardados en la base (contraseñas de locutor).
// AES-256-GCM con una clave de 32 bytes en base64 en RADIO_SECRET_KEY.
// Formato: v1.<iv>.<tag>.<texto>

function clave(): Buffer {
  const raw = process.env.RADIO_SECRET_KEY;
  if (!raw) throw new Error('Falta la variable RADIO_SECRET_KEY (32 bytes en base64).');
  const k = Buffer.from(raw, 'base64');
  if (k.length !== 32) throw new Error('RADIO_SECRET_KEY debe tener 32 bytes en base64.');
  return k;
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', clave(), iv);
  const cifrado = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), cifrado.toString('base64')].join('.');
}

export function descifrar(valor: string): string {
  const [version, iv, tag, cuerpo] = valor.split('.');
  if (version !== 'v1' || !iv || !tag || !cuerpo) throw new Error('Valor cifrado inválido.');
  const d = createDecipheriv('aes-256-gcm', clave(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(cuerpo, 'base64')), d.final()]).toString('utf8');
}

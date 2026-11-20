// Validaciones del servidor. Las mismas reglas están en apps/panel/src/shared/lib/validaciones.ts.

export type Resultado<T> = { ok: true; valor: T } | { ok: false; mensaje: string; campo: string };

const ok = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
const fallo = (campo: string, mensaje: string): Resultado<never> => ({ ok: false, campo, mensaje });

const NOMBRE_RE = /^\p{L}[\p{L}' .-]*\p{L}$/u;

// Espacios limpios y cada palabra con inicial mayúscula: "  mamani   CHOQUE-lópez " -> "Mamani Choque-López"
export function normalizarNombre(texto: string): string {
  return texto
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s'-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('es'));
}

export function validarNombre(texto: string | undefined, campo: string): Resultado<string> {
  const valor = normalizarNombre(texto ?? '');
  if (valor.length < 2) return fallo(campo, `${campo} debe tener al menos 2 letras.`);
  if (valor.length > 60) return fallo(campo, `${campo} no puede pasar de 60 caracteres.`);
  if (!NOMBRE_RE.test(valor)) return fallo(campo, `${campo} solo puede tener letras, espacios, guion y apóstrofe.`);
  return ok(valor);
}

export function validarEmail(texto: string | undefined): Resultado<string> {
  const valor = (texto ?? '').trim().toLowerCase();
  if (valor.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
    return fallo('correo', 'El correo no es válido.');
  }
  return ok(valor);
}

export function validarTexto(texto: string | null | undefined, campo: string, min: number, max: number, obligatorio: boolean): Resultado<string | null> {
  const valor = (texto ?? '').trim();
  if (!valor) return obligatorio ? fallo(campo, `${campo} es obligatorio.`) : ok(null);
  if (valor.length < min) return fallo(campo, `${campo} debe tener al menos ${min} caracteres.`);
  if (valor.length > max) return fallo(campo, `${campo} no puede pasar de ${max} caracteres.`);
  return ok(valor);
}

// Cuentas creadas antes de separar nombres: se toma el primer nombre y el resto como apellidos.
export function separarNombreLegado(name: string, firstName: string | null, lastName: string | null) {
  if (firstName && lastName) return { firstName, lastName };
  const partes = normalizarNombre(name).split(' ').filter(Boolean);
  return { firstName: firstName ?? partes[0] ?? null, lastName: lastName ?? (partes.slice(1).join(' ') || null) };
}

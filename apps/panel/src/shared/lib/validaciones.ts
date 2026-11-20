// Validaciones del panel. Las mismas reglas están en apps/api/src/lib/validaciones.ts.

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

// Mensaje de error o null si el nombre es válido
export function errorNombre(texto: string, campo: string): string | null {
  const valor = normalizarNombre(texto);
  if (!valor) return `${campo} es obligatorio.`;
  if (valor.length < 2) return `${campo} debe tener al menos 2 letras.`;
  if (valor.length > 60) return `${campo} no puede pasar de 60 caracteres.`;
  if (!NOMBRE_RE.test(valor)) return `${campo} solo puede tener letras, espacios, guion y apóstrofe.`;
  return null;
}

export function errorEmail(texto: string): string | null {
  const valor = texto.trim().toLowerCase();
  if (!valor) return 'El correo es obligatorio.';
  if (valor.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) return 'El correo no es válido.';
  return null;
}

export function errorTexto(texto: string, campo: string, min: number, max: number, obligatorio: boolean): string | null {
  const valor = texto.trim();
  if (!valor) return obligatorio ? `${campo} es obligatorio.` : null;
  if (valor.length < min) return `${campo} debe tener al menos ${min} caracteres.`;
  if (valor.length > max) return `${campo} no puede pasar de ${max} caracteres.`;
  return null;
}

// Países para el teléfono: código, bandera (ISO), nombre y cantidad de dígitos del número nacional.
// Bolivia es el predeterminado y su número tiene exactamente 8 dígitos.
export interface Pais {
  codigo: string; // +591
  iso: string; // BO
  nombre: string;
  digitosMin: number;
  digitosMax: number;
}

export const PAISES: Pais[] = [
  { codigo: '+591', iso: 'BO', nombre: 'Bolivia', digitosMin: 8, digitosMax: 8 },
  { codigo: '+51', iso: 'PE', nombre: 'Perú', digitosMin: 9, digitosMax: 9 },
  { codigo: '+54', iso: 'AR', nombre: 'Argentina', digitosMin: 10, digitosMax: 10 },
  { codigo: '+55', iso: 'BR', nombre: 'Brasil', digitosMin: 10, digitosMax: 11 },
  { codigo: '+56', iso: 'CL', nombre: 'Chile', digitosMin: 9, digitosMax: 9 },
  { codigo: '+57', iso: 'CO', nombre: 'Colombia', digitosMin: 10, digitosMax: 10 },
  { codigo: '+593', iso: 'EC', nombre: 'Ecuador', digitosMin: 9, digitosMax: 9 },
  { codigo: '+595', iso: 'PY', nombre: 'Paraguay', digitosMin: 9, digitosMax: 9 },
  { codigo: '+598', iso: 'UY', nombre: 'Uruguay', digitosMin: 8, digitosMax: 8 },
  { codigo: '+34', iso: 'ES', nombre: 'España', digitosMin: 9, digitosMax: 9 },
  { codigo: '+52', iso: 'MX', nombre: 'México', digitosMin: 10, digitosMax: 10 },
  { codigo: '+1', iso: 'US', nombre: 'Estados Unidos', digitosMin: 10, digitosMax: 10 },
];

export const PAIS_PREDETERMINADO = '+591';

// Valida código y número. Devuelve el número limpio (solo dígitos) o un mensaje de error.
export function validarTelefono(codigo: string | null | undefined, numero: string | null | undefined):
  | { ok: true; codigo: string | null; numero: string | null }
  | { ok: false; mensaje: string } {
  const digitos = (numero ?? '').replace(/\D/g, '');
  if (!digitos) return { ok: true, codigo: null, numero: null };
  const pais = PAISES.find((p) => p.codigo === codigo);
  if (!pais) return { ok: false, mensaje: 'Elige un código de país válido.' };
  if (digitos.length < pais.digitosMin || digitos.length > pais.digitosMax) {
    const esperado = pais.digitosMin === pais.digitosMax ? `${pais.digitosMin}` : `${pais.digitosMin} a ${pais.digitosMax}`;
    return { ok: false, mensaje: `El número de ${pais.nombre} debe tener ${esperado} dígitos.` };
  }
  return { ok: true, codigo: pais.codigo, numero: digitos };
}

// Contraseña inicial: el primer apellido con inicial mayúscula. Ej.: "QUISPE mamani" -> "Quispe"
export function contrasenaInicial(apellidos: string): string {
  const primero = apellidos.trim().split(/\s+/)[0] ?? '';
  const minus = primero.toLocaleLowerCase('es');
  return minus.charAt(0).toLocaleUpperCase('es') + minus.slice(1);
}

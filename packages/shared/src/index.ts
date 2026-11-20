// Esquemas y reglas compartidos por la API (apps/api) y el panel (apps/panel).
// Un solo archivo a propósito: se importa directamente desde TypeScript en ambos lados.
import { z } from 'zod';

export type { ZodError } from 'zod';

// ---------- Teléfono por país ----------
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

export const paisDe = (codigo: string | null | undefined) => PAISES.find((p) => p.codigo === codigo);

// Solo dígitos del número nacional
export const soloDigitos = (texto: string) => texto.replace(/\D/g, '');

// ---------- Nombres ----------
// Espacios limpios y cada palabra con inicial mayúscula: "  mamani   CHOQUE-lópez " -> "Mamani Choque-López"
export function normalizarNombre(texto: string): string {
  return texto
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s'-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('es'));
}

// Contraseña inicial: primer apellido con inicial mayúscula + "*." Ej.: "QUISPE mamani" -> "Quispe*."
export function contrasenaInicial(apellidos: string): string {
  const primero = normalizarNombre(apellidos).split(' ')[0] ?? '';
  return `${primero}*.`;
}

const NOMBRE_RE = /^\p{L}[\p{L}' .-]*\p{L}$/u;

export const nombreSchema = (campo: string) =>
  z
    .string({ required_error: `${campo} es obligatorio.` })
    .transform((v) => normalizarNombre(v))
    .pipe(
      z
        .string()
        .min(1, `${campo} es obligatorio.`)
        .min(2, `${campo} debe tener al menos 2 letras.`)
        .max(60, `${campo} no puede pasar de 60 caracteres.`)
        .regex(NOMBRE_RE, `${campo} solo puede tener letras, espacios, guion y apóstrofe.`)
    );

// ---------- Correo ----------
export const emailSchema = z
  .string({ required_error: 'El correo es obligatorio.' })
  .transform((v) => v.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, 'El correo es obligatorio.')
      .max(254, 'El correo no puede pasar de 254 caracteres.')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'El correo no es válido.')
  );

// ---------- Teléfono (código + número) ----------
// Número opcional: si viene vacío no se valida. Si viene, debe cumplir el país.
export function validarTelefono(codigo: string, numero: string): string | null {
  if (!numero) return null;
  const pais = paisDe(codigo);
  if (!pais) return 'Elige un código de país válido.';
  const largo = soloDigitos(numero).length;
  if (largo < pais.digitosMin || largo > pais.digitosMax) {
    return pais.digitosMin === pais.digitosMax
      ? `El número de ${pais.nombre} debe tener ${pais.digitosMin} dígitos.`
      : `El número de ${pais.nombre} debe tener entre ${pais.digitosMin} y ${pais.digitosMax} dígitos.`;
  }
  return null;
}

// ---------- Esquemas de formulario ----------
const telefonoRefine = <T extends { phoneCode: string; phone: string }>(schema: z.ZodType<T>) =>
  schema.superRefine((datos, ctx) => {
    const error = validarTelefono(datos.phoneCode, datos.phone);
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: error });
  });

// Alta de usuario
export const usuarioAltaSchema = telefonoRefine(
  z.object({
    firstName: nombreSchema('Nombres'),
    lastName: nombreSchema('Apellidos'),
    email: emailSchema,
    phoneCode: z.string().min(1, 'Elige un código de país.'),
    phone: z.string(),
    roleKey: z.string({ required_error: 'Elige un rol.' }).min(1, 'Elige un rol.'),
  })
);

// Datos personales (detalle de usuario y perfil propio)
export const datosPersonalesSchema = telefonoRefine(
  z.object({
    firstName: nombreSchema('Nombres'),
    lastName: nombreSchema('Apellidos'),
    phoneCode: z.string().min(1, 'Elige un código de país.'),
    phone: z.string(),
  })
);

// Cambio de contraseña (primer ingreso y perfil)
export const cambioContrasenaSchema = z
  .object({
    actual: z.string().min(1, 'Escribe tu contraseña actual.'),
    nueva: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
      .max(128, 'La nueva contraseña es demasiado larga.'),
    repetir: z.string().min(1, 'Repite la nueva contraseña.'),
  })
  .superRefine((datos, ctx) => {
    if (datos.nueva && datos.nueva === datos.actual) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nueva'], message: 'La nueva contraseña debe ser distinta de la actual.' });
    }
    if (datos.repetir && datos.repetir !== datos.nueva) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['repetir'], message: 'Las contraseñas no coinciden.' });
    }
  });

// Rol: clave, nombre y descripción
export const rolSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{1,40}$/, 'Usa letras minúsculas, números o guion bajo, y empieza con letra.'),
  name: nombreSchema('El nombre'),
  description: z.string().max(200, 'La descripción no puede pasar de 200 caracteres.').optional(),
});

// Edición de usuario desde el panel (datos personales, rol y estado)
export const usuarioEditarSchema = telefonoRefine(
  z.object({
    firstName: nombreSchema('Nombres'),
    lastName: nombreSchema('Apellidos'),
    phoneCode: z.string().min(1, 'Elige un código de país.'),
    phone: z.string(),
    roleKey: z.string().min(1, 'Elige un rol.'),
    isActive: z.boolean(),
  })
);

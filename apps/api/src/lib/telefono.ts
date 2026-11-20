// Contraseña inicial y teléfono: la lógica de países vive en @luz/shared.
import { contrasenaInicial as contrasenaInicialShared } from '@luz/shared';

export { PAISES, PAIS_PREDETERMINADO, soloDigitos } from '@luz/shared';

export const contrasenaInicial = (apellidos: string) => contrasenaInicialShared(apellidos);

// Cuentas creadas antes de separar los campos: el teléfono venía como "+591 70000001" en un solo campo.
import { PAISES as PAISES_LOCAL } from '@luz/shared';
export function separarTelefonoLegado(telefono: string | null, codigo: string | null): { codigo: string | null; numero: string | null } {
  if (codigo || !telefono || !telefono.trim().startsWith('+')) return { codigo, numero: telefono };
  const limpio = telefono.trim();
  const pais = [...PAISES_LOCAL].sort((a, b) => b.codigo.length - a.codigo.length).find((p) => limpio.startsWith(p.codigo));
  if (!pais) return { codigo, numero: telefono };
  return { codigo: pais.codigo, numero: limpio.slice(pais.codigo.length).replace(/\D/g, '') || null };
}

// Nombres legados y reglas que aún usa la API directamente. Las reglas de formulario están en @luz/shared.
import { normalizarNombre } from '@luz/shared';

export { normalizarNombre };

// Cuentas creadas antes de separar nombres: se toma el primer nombre y el resto como apellidos.
export function separarNombreLegado(name: string, firstName: string | null, lastName: string | null) {
  if (firstName && lastName) return { firstName, lastName };
  const partes = normalizarNombre(name).split(' ').filter(Boolean);
  return { firstName: firstName ?? partes[0] ?? null, lastName: lastName ?? (partes.slice(1).join(' ') || null) };
}

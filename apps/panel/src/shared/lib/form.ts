// Mensaje de error de un campo de TanStack Form (texto o issue de Zod).
export const mensajeCampo = (errores: unknown[] | undefined): string | null => {
  const primero = errores?.[0];
  if (!primero) return null;
  if (typeof primero === 'string') return primero;
  const msg = (primero as { message?: string }).message;
  return msg ?? null;
};

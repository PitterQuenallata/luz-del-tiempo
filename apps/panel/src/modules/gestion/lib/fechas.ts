// Conversión entre los campos de fecha del navegador (hora local) y las fechas ISO de la API.

// ISO (UTC) -> valor para <input type="datetime-local"> en hora local
export const aInputFecha = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Valor de <input type="datetime-local"> -> ISO (UTC), o null si está vacío
export const desdeInputFecha = (valor: string): string | null => {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export const fechaLegible = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

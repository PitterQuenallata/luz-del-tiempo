// Utilidades de usuario: último acceso, banderas de países, iniciales.

export const formatoUltimoAcceso = (iso: string | null): string => {
  if (!iso) return 'Nunca';
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) return `Hace ${dias} d`;
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Bandera a partir del código ISO del país (BO -> 🇧🇴)
export const bandera = (iso: string): string =>
  String.fromCodePoint(...iso.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));

// Contraseña inicial que muestra el panel: primer apellido con inicial mayúscula + "*." (Ej.: Mamani*.)
export const contrasenaInicialPreview = (apellidos: string): string => {
  const primero = apellidos.trim().split(/\s+/)[0] ?? '';
  const minus = primero.toLocaleLowerCase('es');
  return minus ? minus.charAt(0).toLocaleUpperCase('es') + minus.slice(1) + '*.' : '';
};

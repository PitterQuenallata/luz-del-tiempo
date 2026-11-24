// Catálogo de permisos del panel (docs/PLAN.md §6.1).
// Catálogo inicial: se siembra en la base (tabla permissions) y roles por defecto.
// "aplicado" indica si la API ya lo hace cumplir hoy; el resto está previsto para su módulo.

export type RoleKey = 'superadmin' | 'admin' | 'editor' | 'station_operator';

export const ROLE_KEYS: RoleKey[] = ['superadmin', 'admin', 'editor', 'station_operator'];

export interface PermisoDef {
  key: string;
  descripcion: string;
  roles: RoleKey[];
  aplicado: boolean;
}

export const PERMISOS: PermisoDef[] = [
  { key: 'logs:ver', descripcion: 'Ver la bitácora de actividad', roles: ['superadmin', 'admin'], aplicado: true },
  { key: 'roles:gestionar', descripcion: 'Crear, editar y eliminar roles y sus permisos', roles: ['superadmin'], aplicado: true },
  { key: 'panel:acceso', descripcion: 'Entrar al panel', roles: ['superadmin', 'admin', 'editor', 'station_operator'], aplicado: true },
  { key: 'usuarios:gestionar', descripcion: 'Crear, editar y desactivar usuarios', roles: ['superadmin', 'admin'], aplicado: true },
  { key: 'superadmin:gestionar', descripcion: 'Asignar o modificar al superadmin', roles: ['superadmin'], aplicado: true },
  { key: 'contenido:editar', descripcion: 'Noticias, áreas, actividades, videos y en vivo', roles: ['superadmin', 'admin', 'editor'], aplicado: true },
  { key: 'donaciones:ver', descripcion: 'Donaciones', roles: ['superadmin', 'admin'], aplicado: true },
  { key: 'estaciones:todas', descripcion: 'Ver y gestionar todas las estaciones', roles: ['superadmin', 'admin'], aplicado: true },
  { key: 'radio:transmitir', descripcion: 'Transmitir en vivo con el emisor de Windows', roles: ['superadmin', 'admin', 'station_operator'], aplicado: true },
  { key: 'estacion:propia', descripcion: 'Gestionar solo su estación', roles: ['station_operator'], aplicado: false },
  { key: 'servidores:configurar', descripcion: 'Servidores, Icecast/Liquidsoap y límites', roles: ['superadmin'], aplicado: false },
];



import { LayoutDashboard, Newspaper, FileText, CalendarDays, Video, Radio, RadioTower, HeartHandshake, Users, ScrollText, Settings2, FolderOpen, LayoutGrid, LucideIcon, DatabaseBackup } from 'lucide-react';

export type NavigationCategoryKey = 'principal' | 'sitio' | 'radio' | 'administracion' | 'configuracion';

export interface NavigationCategory {
  key: NavigationCategoryKey;
  title: string;
}

export const navigationCategories: NavigationCategory[] = [
  { key: 'principal', title: 'Principal' },
  { key: 'sitio', title: 'Sitio web' },
  { key: 'radio', title: 'Radio' },
  { key: 'administracion', title: 'Administración' },
  { key: 'configuracion', title: 'Configuración' },
];

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  category: NavigationCategoryKey;
  // Permiso que hace falta para ver este ítem y entrar a la ruta (ver app-router)
  permiso?: string | string[];
}

// Solo las secciones del alcance (docs/PLAN.md).
export const navItems: NavItem[] = [
  { id: 'dashboard', title: 'Inicio', path: '/dashboard', icon: LayoutDashboard, category: 'principal', permiso: 'panel:acceso' },
  { id: 'contenido', title: 'Portada y áreas', path: '/contenido', icon: Newspaper, category: 'sitio', permiso: 'contenido:editar' },
  { id: 'noticias', title: 'Noticias', path: '/noticias', icon: FileText, category: 'sitio', permiso: 'contenido:editar' },
  { id: 'agenda', title: 'Agenda', path: '/agenda', icon: CalendarDays, category: 'sitio', permiso: 'contenido:editar' },
  { id: 'videos', title: 'Videos', path: '/videos', icon: Video, category: 'sitio', permiso: 'contenido:editar' },
  { id: 'en-vivo', title: 'En vivo', path: '/en-vivo', icon: RadioTower, category: 'sitio', permiso: 'contenido:editar' },
  { id: 'datos', title: 'Datos del ministerio', path: '/datos-ministerio', icon: Users, category: 'sitio', permiso: 'contenido:editar' },
  { id: 'emisoras', title: 'Emisoras', path: '/emisoras', icon: Radio, category: 'radio', permiso: ['estaciones:todas', 'estacion:propia'] },
  { id: 'archivos', title: 'Archivos', path: '/archivos', icon: FolderOpen, category: 'radio', permiso: ['estaciones:todas', 'estacion:propia'] },
  { id: 'configuracion-radio', title: 'Radio', path: '/configuracion-radio', icon: Settings2, category: 'configuracion', permiso: ['estaciones:todas', 'estacion:propia'] },
  { id: 'usuarios', title: 'Usuarios y roles', path: '/usuarios', icon: Users, category: 'administracion', permiso: 'usuarios:gestionar' },
  { id: 'donaciones', title: 'Donaciones', path: '/donaciones', icon: HeartHandshake, category: 'administracion', permiso: 'donaciones:ver' },
  { id: 'logs', title: 'Auditoría', path: '/logs', icon: ScrollText, category: 'administracion', permiso: 'logs:ver' },
  { id: 'sistema', title: 'Sistema', path: '/sistema', icon: DatabaseBackup, category: 'administracion', permiso: 'sistema:respaldos' },
];

// Permisos del usuario actual. Lo actualiza el shell al tener la sesión.
let permisosActivos: string[] = [];
export const setPermisosActivos = (permisos: string[]) => {
  permisosActivos = permisos;
};

// Ítems del menú a los que el usuario tiene acceso
export const navItemsVisibles = (): NavItem[] =>
  navItems.filter((item) => !item.permiso || (Array.isArray(item.permiso) ? item.permiso.some((p) => permisosActivos.includes(p)) : permisosActivos.includes(item.permiso)));

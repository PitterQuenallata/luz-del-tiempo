import { LayoutDashboard, Users, ScrollText, LucideIcon } from 'lucide-react';

export type NavigationCategoryKey = 'principal' | 'administracion';

export interface NavigationCategory {
  key: NavigationCategoryKey;
  title: string;
}

export const navigationCategories: NavigationCategory[] = [
  { key: 'principal', title: 'Principal' },
  { key: 'administracion', title: 'Administración' },
];

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  category: NavigationCategoryKey;
  // Permiso que hace falta para ver este ítem y entrar a la ruta (ver app-router)
  permiso?: string;
}

// Solo las secciones del alcance (docs/PLAN.md).
export const navItems: NavItem[] = [
  { id: 'dashboard', title: 'Inicio', path: '/dashboard', icon: LayoutDashboard, category: 'principal', permiso: 'panel:acceso' },
  { id: 'usuarios', title: 'Usuarios y roles', path: '/usuarios', icon: Users, category: 'administracion', permiso: 'usuarios:gestionar' },
  { id: 'logs', title: 'Auditoría', path: '/logs', icon: ScrollText, category: 'administracion', permiso: 'logs:ver' },
];

// Permisos del usuario actual. Lo actualiza el shell al tener la sesión.
let permisosActivos: string[] = [];
export const setPermisosActivos = (permisos: string[]) => {
  permisosActivos = permisos;
};

// Ítems del menú a los que el usuario tiene acceso
export const navItemsVisibles = (): NavItem[] =>
  navItems.filter((item) => !item.permiso || permisosActivos.includes(item.permiso));

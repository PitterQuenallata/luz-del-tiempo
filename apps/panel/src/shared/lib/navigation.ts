import { LayoutDashboard, Users, ShieldCheck, LucideIcon } from 'lucide-react';

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
}

// Solo las secciones del alcance (docs/PLAN.md).
export const navItems: NavItem[] = [
  { id: 'dashboard', title: 'Inicio', path: '/dashboard', icon: LayoutDashboard, category: 'principal' },
  { id: 'usuarios', title: 'Usuarios', path: '/usuarios', icon: Users, category: 'administracion' },
  { id: 'staff', title: 'Staff & Permisos', path: '/staff', icon: ShieldCheck, category: 'administracion' },
];

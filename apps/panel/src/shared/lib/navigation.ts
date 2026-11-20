import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  History,
  Layers,
  Settings,
  Smartphone,
  FileQuestion,
  ServerCrash,
  LockKeyhole,
  LucideIcon,
} from 'lucide-react';

export type NavigationCategoryKey = 'principal' | 'auth' | 'seguridad';

export interface NavigationCategory {
  key: NavigationCategoryKey;
  title: string;
}

export const navigationCategories: NavigationCategory[] = [
  { key: 'principal', title: 'Principal' },
  { key: 'auth', title: 'Autenticación & Auth' },
  { key: 'seguridad', title: 'Seguridad & RBAC' },
];

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  category: NavigationCategoryKey;
}

export const navItems: NavItem[] = [
  // PRINCIPAL
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    category: 'principal',
  },

  // AUTENTICACIÓN & AUTH
  {
    id: 'auth-showcase',
    title: 'Portal de Auth (Hub)',
    path: '/auth',
    icon: LockKeyhole,
    badge: 'Hub',
    category: 'auth',
  },
  {
    id: 'auth-card',
    title: 'Versión 1: Card iOS (DALI)',
    path: '/auth/card',
    icon: Smartphone,
    badge: 'iOS',
    category: 'auth',
  },
  {
    id: 'auth-split',
    title: 'Versión 2: Split Screen (Efferd)',
    path: '/auth/split',
    icon: Layers,
    badge: 'Split',
    category: 'auth',
  },
  {
    id: 'auth-forgot',
    title: 'Recuperar Contraseña',
    path: '/auth?tab=forgot-password',
    icon: KeyRound,
    category: 'auth',
  },
  {
    id: 'auth-2fa',
    title: 'Verificación 2FA / OTP',
    path: '/auth?tab=two-factor',
    icon: ShieldCheck,
    badge: '2FA',
    category: 'auth',
  },
  {
    id: 'auth-404',
    title: 'Error 404 (Not Found)',
    path: '/auth/404',
    icon: FileQuestion,
    badge: '404',
    category: 'auth',
  },
  {
    id: 'auth-505',
    title: 'Error 505 / 500 (Server)',
    path: '/auth/505',
    icon: ServerCrash,
    badge: '505',
    category: 'auth',
  },

  // SEGURIDAD & RBAC
  {
    id: 'usuarios',
    title: 'Usuarios del Sistema',
    path: '/usuarios',
    icon: Users,
    category: 'seguridad',
  },
  {
    id: 'staff',
    title: 'Staff & Permisos',
    path: '/staff',
    icon: ShieldCheck,
    badge: 'Roles',
    category: 'seguridad',
  },
  {
    id: 'auditoria',
    title: 'Auditoría & Logs',
    path: '/auditoria',
    icon: History,
    category: 'seguridad',
  },
  {
    id: 'configuracion',
    title: 'Configuración del Sistema',
    path: '/configuracion',
    icon: Settings,
    badge: 'Core',
    category: 'seguridad',
  },
];

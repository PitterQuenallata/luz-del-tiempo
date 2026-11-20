import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  KeyRound,
  BarChart3,
  History,
  TableProperties,
  FileCheck2,
  Component,
  Layers,
  Bell,
  ShoppingBag,
  FolderKanban,
  MessageSquare,
  Newspaper,
  LifeBuoy,
  LayoutGrid,
  Settings,
  Shield,
  LockKeyhole,
  Smartphone,
  FileQuestion,
  ServerCrash,
  Zap,
  BookOpen,
  LucideIcon,
} from 'lucide-react';

export type NavigationCategoryKey =
  | 'principal'
  | 'auth'
  | 'negocio'
  | 'finanzas'
  | 'seguridad'
  | 'showcase';

export interface NavigationCategory {
  key: NavigationCategoryKey;
  title: string;
}

export const navigationCategories: NavigationCategory[] = [
  { key: 'principal', title: 'Principal' },
  { key: 'auth', title: 'Autenticación & Auth' },
  { key: 'negocio', title: 'Aplicaciones & Negocio' },
  { key: 'finanzas', title: 'Finanzas & Facturación' },
  { key: 'seguridad', title: 'Seguridad & RBAC' },
  { key: 'showcase', title: 'UI Kit & Componentes' },
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
  // 1. PRINCIPAL
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    category: 'principal',
  },
  {
    id: 'reportes',
    title: 'Reportes & Métricas',
    path: '/reportes',
    icon: BarChart3,
    badge: 'KPIs',
    category: 'principal',
  },
  {
    id: 'documentacion',
    title: 'Documentación & Manual',
    path: '/documentacion',
    icon: BookOpen,
    badge: 'Docs',
    category: 'principal',
  },

  // 2. AUTENTICACIÓN & AUTH
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

  // 3. APLICACIONES & NEGOCIO
  {
    id: 'ecommerce',
    title: 'eCommerce Suite',
    path: '/ecommerce',
    icon: ShoppingBag,
    badge: 'Pro',
    category: 'negocio',
  },
  {
    id: 'proyectos',
    title: 'Proyectos & Kanban',
    path: '/proyectos',
    icon: FolderKanban,
    badge: 'Agile',
    category: 'negocio',
  },
  {
    id: 'comunicaciones',
    title: 'Chat & Correo',
    path: '/comunicaciones',
    icon: MessageSquare,
    badge: 'Live',
    category: 'negocio',
  },
  {
    id: 'blog',
    title: 'Blog & Contenido',
    path: '/blog',
    icon: Newspaper,
    badge: 'CMS',
    category: 'negocio',
  },
  {
    id: 'automatizaciones',
    title: 'Flujos & Automatizaciones',
    path: '/automatizaciones',
    icon: Zap,
    badge: 'Flow',
    category: 'negocio',
  },
  {
    id: 'soporte',
    title: 'Soporte & Mesa Ayuda',
    path: '/soporte',
    icon: LifeBuoy,
    badge: 'SLA',
    category: 'negocio',
  },

  // 3. FINANZAS & FACTURACIÓN
  {
    id: 'pagos',
    title: 'Facturación & Pagos',
    path: '/pagos',
    icon: CreditCard,
    badge: 'Stripe',
    category: 'finanzas',
  },
  {
    id: 'licencias',
    title: 'Licencias & Planes SaaS',
    path: '/licencias',
    icon: KeyRound,
    badge: 'MRR',
    category: 'finanzas',
  },

  // 4. SEGURIDAD & RBAC
  {
    id: 'usuarios',
    title: 'Usuarios del Sistema',
    path: '/usuarios',
    icon: Users,
    badge: '1.4k',
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

  // 5. UI KIT & COMPONENTES
  {
    id: 'tables',
    title: 'Data Tables',
    path: '/tables',
    icon: TableProperties,
    badge: 'v8',
    category: 'showcase',
  },
  {
    id: 'forms',
    title: 'Formularios & Zod',
    path: '/forms',
    icon: FileCheck2,
    badge: 'Zod',
    category: 'showcase',
  },
  {
    id: 'widgets',
    title: 'Widgets Hub',
    path: '/widgets',
    icon: LayoutGrid,
    badge: 'Live',
    category: 'showcase',
  },
  {
    id: 'components',
    title: 'UI Kit Primitivas',
    path: '/components',
    icon: Component,
    badge: 'Apple',
    category: 'showcase',
  },
  {
    id: 'modales',
    title: 'Modales & Glass',
    path: '/modales',
    icon: Layers,
    badge: 'HIG',
    category: 'showcase',
  },
  {
    id: 'alerts',
    title: 'Alertas & Toasts',
    path: '/alerts',
    icon: Bell,
    badge: 'Sileo',
    category: 'showcase',
  },
];

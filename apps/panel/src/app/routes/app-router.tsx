import React, { Suspense, lazy } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  createHashHistory,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { BlakorShell } from '../../shared/components/layout/blakor-shell';
import { IOSSpinner } from '../../components/ui/ios-spinner';
import { useSession } from '../../modules/auth/hooks/use-session';

// Fallback loader for smooth Apple-style deferred loading
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground animate-in fade-in duration-200">
      <IOSSpinner size="md" />
      <span className="text-xs font-medium tracking-wide">Cargando módulo...</span>
    </div>
  );
}

const withSuspense = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>) => {
  return function SuspenseWrappedRoute(props: any) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};

// Route-level code splitting: drops initial bundle by >80%
const DashboardPage = withSuspense(lazy(() => import('../../modules/dashboard/pages/dashboard-page').then((m) => ({ default: m.DashboardPage }))));
const UsuariosPage = withSuspense(lazy(() => import('../../modules/usuarios/pages/usuarios-page').then((m) => ({ default: m.UsuariosPage }))));
const StaffPage = withSuspense(lazy(() => import('../../modules/staff/pages/staff-page').then((m) => ({ default: m.StaffPage }))));
const PagosPage = withSuspense(lazy(() => import('../../modules/pagos/pages/pagos-page').then((m) => ({ default: m.PagosPage }))));
const LicenciasPage = withSuspense(lazy(() => import('../../modules/licencias/pages/licencias-page').then((m) => ({ default: m.LicenciasPage }))));
const ReportesPage = withSuspense(lazy(() => import('../../modules/reportes/pages/reportes-page').then((m) => ({ default: m.ReportesPage }))));
const AuditoriaPage = withSuspense(lazy(() => import('../../modules/auditoria/pages/auditoria-page').then((m) => ({ default: m.AuditoriaPage }))));
const TablesShowcasePage = withSuspense(lazy(() => import('../../modules/tables/pages/tables-showcase-page').then((m) => ({ default: m.TablesShowcasePage }))));
const FormsShowcasePage = withSuspense(lazy(() => import('../../modules/forms/pages/forms-showcase-page').then((m) => ({ default: m.FormsShowcasePage }))));
const ComponentsShowcasePage = withSuspense(lazy(() => import('../../modules/components/pages/components-showcase-page').then((m) => ({ default: m.ComponentsShowcasePage }))));
const ModalesPage = withSuspense(lazy(() => import('../../modules/modales/pages/modales-page').then((m) => ({ default: m.ModalesPage }))));
const AlertsPage = withSuspense(lazy(() => import('../../modules/alerts/pages/alerts-page').then((m) => ({ default: m.AlertsPage }))));
const EcommercePage = withSuspense(lazy(() => import('../../modules/ecommerce/pages/ecommerce-page').then((m) => ({ default: m.EcommercePage }))));
const ProyectosPage = withSuspense(lazy(() => import('../../modules/proyectos/pages/proyectos-page').then((m) => ({ default: m.ProyectosPage }))));
const ComunicacionesPage = withSuspense(lazy(() => import('../../modules/comunicaciones/pages/comunicaciones-page').then((m) => ({ default: m.ComunicacionesPage }))));
const BlogPage = withSuspense(lazy(() => import('../../modules/blog/pages/blog-page').then((m) => ({ default: m.BlogPage }))));
const AutomatizacionesPage = withSuspense(lazy(() => import('../../modules/automatizaciones/pages/automatizaciones-page').then((m) => ({ default: m.AutomatizacionesPage }))));
const DocumentacionPage = withSuspense(lazy(() => import('../../modules/documentacion/pages/documentacion-page').then((m) => ({ default: m.DocumentacionPage }))));
const SoportePage = withSuspense(lazy(() => import('../../modules/soporte/pages/soporte-page').then((m) => ({ default: m.SoportePage }))));
const WidgetsPage = withSuspense(lazy(() => import('../../modules/widgets/pages/widgets-page').then((m) => ({ default: m.WidgetsPage }))));
const ConfiguracionPage = withSuspense(lazy(() => import('../../modules/configuracion/pages/configuracion-page').then((m) => ({ default: m.ConfiguracionPage }))));
const AuthShowcasePage = withSuspense(lazy(() => import('../../modules/auth/pages/auth-showcase-page').then((m) => ({ default: m.AuthShowcasePage }))));
const AuthCardFullscreenPage = withSuspense(lazy(() => import('../../modules/auth/pages/auth-card-fullscreen-page').then((m) => ({ default: m.AuthCardFullscreenPage }))));
const AuthSplitFullscreenPage = withSuspense(lazy(() => import('../../modules/auth/pages/auth-split-fullscreen-page').then((m) => ({ default: m.AuthSplitFullscreenPage }))));
const AuthErrorFullscreenPage = withSuspense(lazy(() => import('../../modules/auth/pages/auth-error-fullscreen-page').then((m) => ({ default: m.AuthErrorFullscreenPage }))));

// 1. Root Route with Shell Layout
const rootRoute = createRootRoute({
  component: function RootLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const session = useSession();

    // Current path including search params
    const searchStr = location.searchStr || '';
    const fullPath = searchStr ? `${location.pathname}?${searchStr}` : location.pathname;

    const handleNavigate = (path: string) => {
      const cleanPath = path.replace(/^#/, '');
      const [to, query] = cleanPath.split('?');
      if (query) {
        const searchParams = Object.fromEntries(new URLSearchParams(query));
        navigate({ to, search: searchParams });
      } else {
        navigate({ to });
      }
    };

    // If viewing standalone fullscreen auth or error pages, omit BlakorShell
    const isStandalonePage =
      location.pathname === '/auth/card' ||
      location.pathname === '/auth/split' ||
      location.pathname === '/auth/404' ||
      location.pathname === '/auth/505' ||
      location.pathname === '/auth/500' ||
      location.pathname === '/404' ||
      location.pathname === '/505' ||
      location.pathname === '/500';

    if (isStandalonePage) {
      return <Outlet />;
    }

    // Sin sesión no se entra al panel: se manda al login (/auth/card)
    if (session.isPending) {
      return <PageLoader />;
    }
    if (session.isError) {
      return <Navigate to="/auth/card" />;
    }

    return (
      <BlakorShell currentPath={fullPath} onNavigate={handleNavigate}>
        <Outlet />
      </BlakorShell>
    );
  },
  notFoundComponent: () => <AuthErrorFullscreenPage forcedCode="404" />,
});

// 2. Define All Route Nodes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const usuariosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/usuarios',
  component: UsuariosPage,
});

const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/staff',
  component: StaffPage,
});

const pagosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagos',
  component: PagosPage,
});

const licenciasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/licencias',
  component: LicenciasPage,
});

const reportesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reportes',
  component: ReportesPage,
});

const auditoriaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auditoria',
  component: AuditoriaPage,
});

const tablesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tables',
  component: TablesShowcasePage,
});

const formsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms',
  component: FormsShowcasePage,
});

const componentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/components',
  component: ComponentsShowcasePage,
});

const modalesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/modales',
  component: ModalesPage,
});

const alertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/alerts',
  component: AlertsPage,
});

const ecommerceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ecommerce',
  component: EcommercePage,
});

const proyectosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/proyectos',
  component: ProyectosPage,
});

const comunicacionesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/comunicaciones',
  component: ComunicacionesPage,
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blog',
  component: BlogPage,
});

const automatizacionesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/automatizaciones',
  component: AutomatizacionesPage,
});

const documentacionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documentacion',
  component: DocumentacionPage,
});

const soporteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/soporte',
  component: SoportePage,
});

const widgetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/widgets',
  component: WidgetsPage,
});

const chartsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/charts',
  component: DashboardPage,
});

const configuracionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/configuracion',
  component: ConfiguracionPage,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthShowcasePage,
});

const authCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/card',
  component: AuthCardFullscreenPage,
});

const authSplitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/split',
  component: AuthSplitFullscreenPage,
});

const auth404Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/404',
  component: () => <AuthErrorFullscreenPage forcedCode="404" />,
});

const auth505Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/505',
  component: () => <AuthErrorFullscreenPage forcedCode="505" />,
});

const auth500Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/500',
  component: () => <AuthErrorFullscreenPage forcedCode="500" />,
});

const direct404Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/404',
  component: () => <AuthErrorFullscreenPage forcedCode="404" />,
});

const direct505Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/505',
  component: () => <AuthErrorFullscreenPage forcedCode="505" />,
});

const direct500Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/500',
  component: () => <AuthErrorFullscreenPage forcedCode="500" />,
});

// 3. Assemble Full Route Tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  usuariosRoute,
  staffRoute,
  pagosRoute,
  licenciasRoute,
  reportesRoute,
  auditoriaRoute,
  tablesRoute,
  formsRoute,
  componentsRoute,
  modalesRoute,
  alertsRoute,
  ecommerceRoute,
  proyectosRoute,
  comunicacionesRoute,
  blogRoute,
  automatizacionesRoute,
  documentacionRoute,
  soporteRoute,
  widgetsRoute,
  chartsRoute,
  configuracionRoute,
  authRoute,
  authCardRoute,
  authSplitRoute,
  auth404Route,
  auth505Route,
  auth500Route,
  direct404Route,
  direct505Route,
  direct500Route,
]);

// 4. Create Router with Hash History
const hashHistory = createHashHistory();

export const router = createRouter({
  routeTree,
  history: hashHistory,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// 5. Main Type-Safe TanStack Router Root Component
export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

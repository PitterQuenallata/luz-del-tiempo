import React, { Suspense, lazy } from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  createHashHistory,
  RouterProvider,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { BlakorShell } from '../../shared/components/layout/blakor-shell';
import { IOSSpinner } from '../../components/ui/ios-spinner';

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

// Route-level code splitting
const DashboardPage = withSuspense(lazy(() => import('../../modules/dashboard/pages/dashboard-page').then((m) => ({ default: m.DashboardPage }))));
const UsuariosPage = withSuspense(lazy(() => import('../../modules/usuarios/pages/usuarios-page').then((m) => ({ default: m.UsuariosPage }))));
const StaffPage = withSuspense(lazy(() => import('../../modules/staff/pages/staff-page').then((m) => ({ default: m.StaffPage }))));
const AuditoriaPage = withSuspense(lazy(() => import('../../modules/auditoria/pages/auditoria-page').then((m) => ({ default: m.AuditoriaPage }))));
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

const auditoriaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auditoria',
  component: AuditoriaPage,
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
  auditoriaRoute,
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

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
const AuthCardFullscreenPage = withSuspense(lazy(() => import('../../modules/auth/pages/auth-card-fullscreen-page').then((m) => ({ default: m.AuthCardFullscreenPage }))));
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

const authCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/card',
  component: AuthCardFullscreenPage,
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
  authCardRoute,
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

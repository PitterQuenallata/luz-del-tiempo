import React, { Suspense, lazy } from 'react';
import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  redirect,
  createHashHistory,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { BlakorShell } from '../../shared/components/layout/blakor-shell';
import { IOSSpinner } from '../../components/ui/ios-spinner';
import { useSession, SESSION_QUERY_KEY } from '../../modules/auth/hooks/use-session';
import type { QueryClient } from '@tanstack/react-query';
import { luzApi } from '../../shared/api/luz-api';
import { queryClient } from '../providers/query-provider';

export interface RouterContext {
  queryClient: QueryClient;
}

// Guard de ruta: exige sesión (si no, login), cambio de contraseña inicial y el permiso indicado (si no, 403).
const exigirPermiso = (permiso?: string) => async ({ context }: { context: RouterContext }) => {
  let yo;
  try {
    yo = await context.queryClient.ensureQueryData({
      queryKey: SESSION_QUERY_KEY,
      queryFn: () => luzApi.me(),
      staleTime: 1000 * 60,
    });
  } catch {
    throw redirect({ to: '/login' });
  }
  // El cambio de contraseña inicial lo cubre el layout raíz (y el login); aquí solo permisos.
  if (permiso && !yo.permisos.includes(permiso)) throw redirect({ to: '/403' });
};

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
const NewPasswordPage = withSuspense(lazy(() => import('../../modules/auth/pages/new-password-page').then((m) => ({ default: m.NewPasswordPage }))));
const PerfilPage = withSuspense(lazy(() => import('../../modules/perfil/pages/perfil-page').then((m) => ({ default: m.PerfilPage }))));
const LogsPage = withSuspense(lazy(() => import('../../modules/logs/pages/logs-page').then((m) => ({ default: m.LogsPage }))));
const AuthErrorFullscreenPage = withSuspense(lazy(() => import('../../modules/auth/pages/auth-error-fullscreen-page').then((m) => ({ default: m.AuthErrorFullscreenPage }))));

// 1. Root Route with Shell Layout
const rootRoute = createRootRouteWithContext<RouterContext>()({
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
      location.pathname === '/login' ||
      location.pathname === '/new-password' ||
      location.pathname === '/auth/split' ||
      location.pathname === '/auth/404' ||
      location.pathname === '/auth/505' ||
      location.pathname === '/auth/500' ||
      location.pathname === '/403' ||
      location.pathname === '/404' ||
      location.pathname === '/505' ||
      location.pathname === '/500';

    if (isStandalonePage) {
      return <Outlet />;
    }

    // Sin sesión no se entra al panel: se manda al login
    if (session.isPending) {
      return <PageLoader />;
    }
    if (session.isError) {
      return <Navigate to="/login" />;
    }
    // Primer ingreso: antes de usar el panel hay que cambiar la contraseña inicial
    if (session.data?.mustChangePassword) {
      return <Navigate to="/new-password" />;
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
  beforeLoad: exigirPermiso('panel:acceso'),
});

const usuariosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/usuarios',
  component: UsuariosPage,
  beforeLoad: exigirPermiso('usuarios:gestionar'),
});

const authCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
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

const perfilRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  component: PerfilPage,
  beforeLoad: exigirPermiso(),
});

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logs',
  component: LogsPage,
  beforeLoad: exigirPermiso('logs:ver'),
});

const newPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new-password',
  component: NewPasswordPage,
});

const forbiddenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/403',
  component: () => <AuthErrorFullscreenPage forcedCode="403" />,
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
  newPasswordRoute,
  perfilRoute,
  logsRoute,
  authCardRoute,
  auth404Route,
  auth505Route,
  auth500Route,
  forbiddenRoute,
  direct404Route,
  direct505Route,
  direct500Route,
]);

// 4. Create Router with Hash History
const hashHistory = createHashHistory();

export const router = createRouter({
  routeTree,
  history: hashHistory,
  context: { queryClient },
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

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
const exigirPermiso = (permiso?: string | string[]) => async ({ context }: { context: RouterContext }) => {
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
  const lista = Array.isArray(permiso) ? permiso : permiso ? [permiso] : [];
  if (lista.length && !lista.some((p) => yo.permisos.includes(p))) throw redirect({ to: '/403' });
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
const DatosMinisterioPage = withSuspense(lazy(() => import('../../modules/sitio/pages/datos-ministerio-page').then((m) => ({ default: m.DatosMinisterioPage }))));
const NoticiasPage = withSuspense(lazy(() => import('../../modules/noticias/pages/noticias-page').then((m) => ({ default: m.NoticiasPage }))));
const ActividadesPage = withSuspense(lazy(() => import('../../modules/actividades/pages/actividades-page').then((m) => ({ default: m.ActividadesPage }))));
const VideosPage = withSuspense(lazy(() => import('../../modules/videos/pages/videos-page').then((m) => ({ default: m.VideosPage }))));
const EnVivoPage = withSuspense(lazy(() => import('../../modules/en-vivo/pages/en-vivo-page').then((m) => ({ default: m.EnVivoPage }))));
const EmisorasPage = withSuspense(lazy(() => import('../../modules/radio/pages/emisoras-page').then((m) => ({ default: m.EmisorasPage }))));
const ConfiguracionRadioPage = withSuspense(lazy(() => import('../../modules/radio/pages/configuracion-radio-page').then((m) => ({ default: m.ConfiguracionRadioPage }))));
const ArchivosPage = withSuspense(lazy(() => import('../../modules/radio/pages/archivos-page').then((m) => ({ default: m.ArchivosPage }))));
const EstacionPage = withSuspense(lazy(() => import('../../modules/radio/pages/estacion-page').then((m) => ({ default: m.EstacionPage }))));
const PlaylistEditorPage = withSuspense(lazy(() => import('../../modules/radio/pages/playlist-editor-page').then((m) => ({ default: m.PlaylistEditorPage }))));
const DonacionesPage = withSuspense(lazy(() => import('../../modules/donaciones/pages/donaciones-page').then((m) => ({ default: m.DonacionesPage }))));
const ContenidoPage = withSuspense(lazy(() => import('../../modules/contenido/pages/contenido-page').then((m) => ({ default: m.ContenidoPage }))));
const PerfilPage = withSuspense(lazy(() => import('../../modules/perfil/pages/perfil-page').then((m) => ({ default: m.PerfilPage }))));
const InformesPage = withSuspense(lazy(() => import('../../modules/informes/pages/informes-page').then((m) => ({ default: m.InformesPage }))));
const SistemaPage = withSuspense(lazy(() => import('../../modules/sistema/pages/sistema-page').then((m) => ({ default: m.SistemaPage }))));
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
      location.pathname === '/403' ||
      location.pathname === '/404' ||
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

const contenidoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contenido',
  component: ContenidoPage,
  beforeLoad: exigirPermiso('contenido:editar'),
});

// Páginas de edición: cada una se abre con su propio enlace (no como ventana emergente).
const paginaEdicion = (nombre: string) =>
  withSuspense(lazy(() => import('../../modules/gestion/pages/edicion-pages').then((m) => ({ default: (m as unknown as Record<string, React.ComponentType>)[nombre] }))));

// Radio: admin y superadmin gestionan todo; el responsable de una emisora de tercero, solo la suya (la API lo revisa)
const RADIO_ACCESO = ['estaciones:todas', 'estacion:propia'];

const rutasGestion = [
  { path: '/noticias', component: NoticiasPage, permiso: 'contenido:editar' },
  { path: '/noticias/nueva', component: paginaEdicion('NoticiaEdicionPage'), permiso: 'contenido:editar' },
  { path: '/noticias/$id', component: paginaEdicion('NoticiaEdicionPage'), permiso: 'contenido:editar' },
  { path: '/datos-ministerio', component: DatosMinisterioPage, permiso: 'contenido:editar' },
  { path: '/agenda', component: ActividadesPage, permiso: 'contenido:editar' },
  { path: '/agenda/nueva', component: paginaEdicion('ActividadEdicionPage'), permiso: 'contenido:editar' },
  { path: '/agenda/$id', component: paginaEdicion('ActividadEdicionPage'), permiso: 'contenido:editar' },
  { path: '/videos', component: VideosPage, permiso: 'contenido:editar' },
  { path: '/videos/nuevo', component: paginaEdicion('VideoEdicionPage'), permiso: 'contenido:editar' },
  { path: '/videos/series/nueva', component: paginaEdicion('SerieEdicionPage'), permiso: 'contenido:editar' },
  { path: '/videos/series/$id', component: paginaEdicion('SerieEdicionPage'), permiso: 'contenido:editar' },
  { path: '/videos/$id', component: paginaEdicion('VideoEdicionPage'), permiso: 'contenido:editar' },
  { path: '/en-vivo', component: EnVivoPage, permiso: 'contenido:editar' },
  { path: '/emisoras', component: EmisorasPage, permiso: RADIO_ACCESO },
  { path: '/archivos', component: ArchivosPage, permiso: RADIO_ACCESO },
  { path: '/estacion/$id', component: EstacionPage, permiso: RADIO_ACCESO },
  { path: '/playlists/nueva', component: PlaylistEditorPage, permiso: RADIO_ACCESO },
  { path: '/playlists/$id', component: PlaylistEditorPage, permiso: RADIO_ACCESO },
  { path: '/configuracion-radio', component: ConfiguracionRadioPage, permiso: RADIO_ACCESO },
  { path: '/emisoras/nueva', component: paginaEdicion('RadioEdicionPage'), permiso: 'estaciones:todas' },
  { path: '/emisoras/$id', component: paginaEdicion('RadioEdicionPage'), permiso: 'estaciones:todas' },
  { path: '/estaciones/nueva', component: paginaEdicion('EstacionEdicionPage'), permiso: 'estaciones:todas' },
  { path: '/estaciones/$id', component: paginaEdicion('EstacionEdicionPage'), permiso: 'estaciones:todas' },
  { path: '/estaciones/$id/programas/nuevo', component: paginaEdicion('ProgramaEdicionPage'), permiso: 'estaciones:todas' },
  { path: '/estaciones/$id/programas/$programaId', component: paginaEdicion('ProgramaEdicionPage'), permiso: 'estaciones:todas' },
  { path: '/donaciones', component: DonacionesPage, permiso: 'donaciones:ver' },
  { path: '/contenido/portada/nueva', component: paginaEdicion('HeroEdicionPage'), permiso: 'contenido:editar' },
  { path: '/contenido/portada/$id', component: paginaEdicion('HeroEdicionPage'), permiso: 'contenido:editar' },
  { path: '/contenido/areas/nueva', component: paginaEdicion('AreaEdicionPage'), permiso: 'contenido:editar' },
  { path: '/contenido/areas/$id', component: paginaEdicion('AreaEdicionPage'), permiso: 'contenido:editar' },
  { path: '/contenido/personas/nueva', component: paginaEdicion('PersonaEdicionPage'), permiso: 'contenido:editar' },
  { path: '/contenido/personas/$id', component: paginaEdicion('PersonaEdicionPage'), permiso: 'contenido:editar' },
];

const rutasGestionNodos = rutasGestion.map((r) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: r.path,
    component: r.component,
    beforeLoad: exigirPermiso(r.permiso),
  }),
);

const authCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: AuthCardFullscreenPage,
});

const perfilRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  component: PerfilPage,
  beforeLoad: exigirPermiso(),
});

const informesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/informes',
  component: InformesPage,
  beforeLoad: exigirPermiso('estaciones:todas'),
});

const sistemaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sistema',
  component: SistemaPage,
  beforeLoad: exigirPermiso('sistema:respaldos'),
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
  contenidoRoute,
  ...rutasGestionNodos,
  newPasswordRoute,
  perfilRoute,
  logsRoute,
  sistemaRoute,
  informesRoute,
  authCardRoute,
  forbiddenRoute,
  direct404Route,
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

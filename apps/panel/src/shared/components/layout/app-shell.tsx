import React from 'react';
import { Toaster } from 'sileo';
import { Moon, Sun, LogOut } from 'lucide-react';
import { SonnerToaster } from '../ui/sonner';
import { PillToaster } from '../ui/pill-toast';
import { useTheme } from '../../context/theme-context';
import { Logo } from '../brand/logo';
import { LeftSidebar } from './left-sidebar';
import { useSession, useSignOut } from '../../../modules/auth/hooks/use-session';
import { iniciales } from '../../lib/utils';

interface AppShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

// Estructura única del panel: barra superior (logo, tema, usuario) + menú lateral.
export const AppShell: React.FC<AppShellProps> = ({ currentPath, onNavigate, children }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const session = useSession();
  const signOut = useSignOut();
  const usuario = session.data;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-4 px-4 border-b border-border/70 bg-card/85 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onNavigate('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <Logo className="h-8 w-8" />
          <span className="font-heading text-sm font-semibold tracking-tight">La Luz del Tiempo</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Cambiar tema"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted/70 hover:text-foreground cursor-pointer"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-border/60">
            <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
              {iniciales(usuario?.name ?? '')}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium">{usuario?.name ?? ''}</span>
              <span className="text-[10px] text-muted-foreground">{usuario?.roleName ?? ''}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              signOut.mutate(undefined, {
                onSettled: () => {
                  window.location.hash = '/login';
                },
              })
            }
            aria-label="Cerrar sesión"
            className="h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <LeftSidebar currentPath={currentPath} onNavigate={onNavigate} />
        <main className="flex-1 min-w-0 p-4 sm:p-6">{children}</main>
      </div>

      <Toaster position="top-center" theme={resolvedTheme} options={{ duration: 3500 }} />
      <SonnerToaster position="bottom-right" />
      <PillToaster position="top-right" />
    </div>
  );
};

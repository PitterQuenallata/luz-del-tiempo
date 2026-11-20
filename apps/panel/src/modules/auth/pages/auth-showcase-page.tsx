import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import {
  ShieldCheck,
  Maximize2,
  Copy,
  Check,
  Layers,
  Smartphone,
  Sparkles,
  KeyRound,
  FileCode2,
  FileQuestion,
  ServerCrash,
} from 'lucide-react';
import { LoginCardSection, AuthCardView } from '../../../components/ui/login-signup';
import { AuthPage, SplitAuthView } from '../../../components/ui/auth-page';
import { ErrorPage, ErrorCode } from '../../../components/ui/error-page';
import { Button } from '../../../shared/components/ui/button';
import { Card } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

export const AuthShowcasePage: React.FC = () => {
  const { play } = useSound();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedVersion, setSelectedVersion] = useState<'card' | 'split' | 'error'>('card');
  const [activeSubpage, setActiveSubpage] = useState<AuthCardView>('login');
  const [activeErrorCode, setActiveErrorCode] = useState<ErrorCode>('404');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.searchStr || window.location.hash.split('?')[1] || '');
    const tab = searchParams.get('tab');
    if (tab && ['login', 'register', 'forgot-password', 'reset-password', 'two-factor'].includes(tab)) {
      setActiveSubpage(tab as AuthCardView);
    } else if (tab && ['404', '505', '500', '403'].includes(tab)) {
      setSelectedVersion('error');
      setActiveErrorCode(tab as ErrorCode);
    }
    const version = searchParams.get('version');
    if (version && (version === 'card' || version === 'split' || version === 'error')) {
      setSelectedVersion(version);
    }
  }, [location.searchStr]);

  const authSubpages: { id: AuthCardView; label: string }[] = [
    { id: 'login', label: '1. Iniciar Sesión' },
    { id: 'register', label: '2. Registro' },
    { id: 'forgot-password', label: '3. Recuperar Clave' },
    { id: 'reset-password', label: '4. Nueva Clave' },
    { id: 'two-factor', label: '5. Verificación 2FA' },
  ];

  const errorSubpages: { id: ErrorCode; label: string }[] = [
    { id: '404', label: '1. Error 404 (Not Found)' },
    { id: '505', label: '2. Error 505 (Version)' },
    { id: '500', label: '3. Error 500 (Server)' },
    { id: '403', label: '4. Error 403 (Forbidden)' },
  ];

  const handleCopySnippet = () => {
    play('pop');
    let snippet = '';
    if (selectedVersion === 'card') {
      snippet = `import LoginCardSection from "@/components/ui/login-signup";\n\nexport default function LoginPage() {\n  return <LoginCardSection initialView="${activeSubpage}" />;\n}`;
    } else if (selectedVersion === 'split') {
      snippet = `import AuthPage from "@/components/ui/auth-page";\n\nexport default function SplitAuthPage() {\n  return <AuthPage initialView="${activeSubpage}" />;\n}`;
    } else {
      snippet = `import ErrorPage from "@/components/ui/error-page";\n\nexport default function Error${activeErrorCode}Page() {\n  return <ErrorPage code="${activeErrorCode}" fullscreen />;\n}`;
    }

    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    pillToast.success('Código copiado', 'Snippet del componente copiado al portapapeles.');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleOpenFullscreen = () => {
    play('click');
    if (selectedVersion === 'card') {
      navigate({ to: '/auth/card' });
    } else if (selectedVersion === 'split') {
      navigate({ to: '/auth/split' });
    } else {
      navigate({ to: `/auth/${activeErrorCode}` });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <span>Showcase UI Kit</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Autenticación & Auth</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Módulo de Autenticación & Páginas de Error</span>
            <Badge variant="outline" className="font-mono text-xs">
              3 Suites + 9 Vistas
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Componentes tipo Apple y 21st.dev: Tarjeta flotante iOS (DALI), pantalla dividida Split-Screen (Asme) y pantallas de error de alta fidelidad (404, 505, 500, 403).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySnippet}
            className="rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-xs">Copiar Import</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenFullscreen}
            className="rounded-xl flex items-center gap-1.5 cursor-pointer bg-primary text-primary-foreground"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Abrir Pantalla Completa</span>
          </Button>
        </div>
      </div>

      {/* Version Selector (Pill Segmented Control) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl bg-muted/40 border border-border/60">
        <div className="inline-flex rounded-xl bg-card p-1 border border-border/80 shadow-xs flex-wrap">
          <button
            type="button"
            onClick={() => {
              play('tab');
              setSelectedVersion('card');
            }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
              selectedVersion === 'card'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Smartphone className="h-4 w-4" />
            <span>Versión 1: iOS Card (DALI)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              play('tab');
              setSelectedVersion('split');
            }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
              selectedVersion === 'split'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Versión 2: Split-Screen (Efferd)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              play('tab');
              setSelectedVersion('error');
            }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
              selectedVersion === 'error'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileQuestion className="h-4 w-4" />
            <span>Errores: 404 & 505</span>
          </button>
        </div>

        {/* Subpage Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {selectedVersion === 'error'
            ? errorSubpages.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => {
                    play('tab');
                    setActiveErrorCode(sp.id);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                    activeErrorCode === sp.id
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {sp.label}
                </button>
              ))
            : authSubpages.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => {
                    play('tab');
                    setActiveSubpage(sp.id);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                    activeSubpage === sp.id
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {sp.label}
                </button>
              ))}
        </div>
      </div>

      {/* Live Interactive Preview Container */}
      <div className="rounded-3xl border border-border/80 overflow-hidden shadow-2xl relative bg-black/95">
        {selectedVersion === 'card' ? (
          <LoginCardSection
            key={`card-${activeSubpage}`}
            initialView={activeSubpage}
            brandName="DALI / BLAKOR"
            onNavigateHome={() => navigate({ to: '/dashboard' })}
            fullscreen={false}
          />
        ) : selectedVersion === 'split' ? (
          <AuthPage
            key={`split-${activeSubpage}`}
            initialView={activeSubpage}
            brandName="Asme Enterprise"
            onNavigateHome={() => navigate({ to: '/dashboard' })}
            fullscreen={false}
          />
        ) : (
          <ErrorPage
            key={`error-${activeErrorCode}`}
            code={activeErrorCode}
            fullscreen={false}
            showSwitcher={false}
            onGoHome={() => navigate({ to: '/dashboard' })}
            onExplore={() => navigate({ to: '/auth' })}
          />
        )}
      </div>

      {/* Integration Code & Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <Card className="p-5 space-y-3 border-border/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Versión 1: LoginCardSection</h2>
              <p className="text-xs text-muted-foreground font-mono">@/components/ui/login-signup</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tarjeta central suspendida con micro-estrellas y malla de puntos sutil. Diseñada para paneles y modales centrados en una experiencia pura de iOS.
          </p>
          <div className="p-3 rounded-xl bg-muted/60 font-mono text-[11px] text-foreground/90 overflow-x-auto">
            <code>{`import LoginCardSection from "@/components/ui/login-signup";\n\n<LoginCardSection initialView="login" />`}</code>
          </div>
        </Card>

        <Card className="p-5 space-y-3 border-border/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Versión 2: AuthPage (Split-Screen)</h2>
              <p className="text-xs text-muted-foreground font-mono">21st.dev/r/efferd/auth-page</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Layout a dos columnas con ondas vectoriales dinámicas en el lado izquierdo y botones sociales apilados con acceso rápido de email en el lado derecho.
          </p>
          <div className="p-3 rounded-xl bg-muted/60 font-mono text-[11px] text-foreground/90 overflow-x-auto">
            <code>{`import AuthPage from "@/components/ui/auth-page";\n\n<AuthPage initialView="login" brandName="Asme" />`}</code>
          </div>
        </Card>

        <Card className="p-5 space-y-3 border-border/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileQuestion className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Páginas de Error (404 & 505)</h2>
              <p className="text-xs text-muted-foreground font-mono">@/components/ui/error-page</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Páginas de error minimalistas con número gigante en degradé especular, botones Apple ("Go Home", "Explore", "Retry") y soporte multi-código (404, 505, 500, 403).
          </p>
          <div className="p-3 rounded-xl bg-muted/60 font-mono text-[11px] text-foreground/90 overflow-x-auto">
            <code>{`import ErrorPage from "@/components/ui/error-page";\n\n<ErrorPage code="404" fullscreen />`}</code>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthShowcasePage;

import React, { useState } from 'react';
import {
  Layers,
  PanelBottom,
  ShieldAlert,
  Sliders,
  Sparkles,
  Share2,
  Trash2,
  Download,
  Copy,
  ExternalLink,
  Plus,
  Key,
  CheckCircle2,
  Info,
  Maximize2,
  Check,
  ChevronRight,
  RefreshCw,
  Palette,
  Eye,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Modal } from '../../../shared/components/ui/modal';
import { Sheet } from '../../../shared/components/ui/sheet';
import { AlertDialog } from '../../../shared/components/ui/alert-dialog';
import { ActionSheet, ActionSheetOption } from '../../../shared/components/ui/action-sheet';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { sonnerNotify } from '../../../shared/components/ui/sonner';
import { useSound } from '../../../shared/context/sound-context';
import { useTheme } from '../../../shared/context/theme-context';
import { cn } from '../../../shared/lib/utils';

export const ModalesPage: React.FC = () => {
  const { play } = useSound();
  const { resolvedTheme } = useTheme();

  // Modal states
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
  const [isMultiStepModalOpen, setIsMultiStepModalOpen] = useState(false);
  const [multiStep, setMultiStep] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetDetent, setSheetDetent] = useState<'sm' | 'md' | 'lg'>('md');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Liquid Glass Sandbox Controls
  const [sandboxBackground, setSandboxBackground] = useState<'mesh' | 'aurora' | 'geometric' | 'table'>('mesh');
  const [glassBlur, setGlassBlur] = useState<number>(24);
  const [glassOpacity, setGlassOpacity] = useState<number>(85);
  const [hasSpecularBorder, setHasSpecularBorder] = useState<boolean>(true);
  const [hasSaturationBoost, setHasSaturationBoost] = useState<boolean>(true);

  // Form states inside modals
  const [newKeyName, setNewKeyName] = useState('Prod-Gateway-2026');
  const [newKeyEnv, setNewKeyEnv] = useState('production');
  const [newKeyReadonly, setNewKeyReadonly] = useState(false);

  const showToast = (title: string, desc?: string) => {
    pillToast.success(title, desc || 'Acción ejecutada correctamente.');
  };

  const actionSheetOptions: ActionSheetOption[] = [
    {
      id: 'export-csv',
      label: 'Exportar Reporte a CSV',
      description: 'Datos tabulares completos con sumarios',
      icon: Download,
      onClick: () => showToast('Exportando reporte a formato CSV...'),
    },
    {
      id: 'copy-link',
      label: 'Copiar Enlace Seguro',
      description: 'Expira en 24 horas con cifrado de extremo a extremo',
      icon: Copy,
      onClick: () => showToast('Enlace seguro copiado al portapapeles.'),
    },
    {
      id: 'share-slack',
      label: 'Compartir en Canal de Operaciones',
      description: 'Notificar automáticamente al canal de guardias',
      icon: Share2,
      onClick: () => showToast('Notificación enviada al canal de operaciones.'),
    },
    {
      id: 'revoke-key',
      label: 'Revocar Credenciales Inmediatamente',
      description: 'Invalida tokens de sesión activos',
      icon: Trash2,
      isDestructive: true,
      onClick: () => showToast('Credenciales revocadas con éxito.'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Showcase</span>
          <span>/</span>
          <span className="text-foreground">Modales & Liquid Glass</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Modales & Liquid Glass
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Arquitectura de capas de Apple HIG: separación estricta entre la <strong className="text-foreground font-semibold">Capa de Contenido</strong> (cards y tablas sólidas) y la <strong className="text-foreground font-semibold">Capa Funcional Flotante</strong> con material dinámico Liquid Glass.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs py-1 px-2.5 bg-blue-500/10 text-blue-500 border-blue-500/20">
              Apple HIG 2026
            </Badge>
          </div>
        </div>
      </div>

      {/* Clarification Callout: What CAN vs CANNOT be Liquid Glass */}
      <Card className="border-border bg-gradient-to-br from-card via-card to-card/90 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="pb-3 border-b border-border/50">
          <div>
            <CardTitle className="text-base font-bold">Arquitectura de Capas de Apple HIG: Superficies Sólidas vs Liquid Glass</CardTitle>
            <CardDescription className="text-xs">
              Por qué los modales con telón oscuro deben ser sólidos y dónde aplica el cristal esmerilado óptico
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                Superficie Sólida Elevada (bg-card)
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">Sin Glass</Badge>
            </div>
            <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
              <li>
                <strong className="text-foreground">Modales y Diálogos con Backdrop:</strong> Al superponerse a un telón oscurecido (<code className="font-mono text-[10px] text-foreground">bg-black/50</code>), cualquier filtro glass refractaría ese fondo negro, ensuciando la interfaz en tema claro.
              </li>
              <li>
                <strong className="text-foreground">Tablas de Datos Densas:</strong> El texto de 11px/12px y cifras tabulares necesitan fondo neutro para contraste WCAG AAA.
              </li>
              <li>
                <strong className="text-foreground">Formularios e Inputs:</strong> Superficies definidas y opacas para concentrar la atención sin distracción visual.
              </li>
              <li>
                <strong className="text-foreground">Cards de Contenido Primario:</strong> Apple HIG prohíbe el glass en el cuerpo de página.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-primary/[0.04] border border-primary/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">
                Liquid Glass Aprobado (Functional Chrome)
              </span>
              <Badge variant="default" className="text-[10px] font-mono">Liquid Glass</Badge>
            </div>
            <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
              <li>
                <strong className="text-foreground">Top Navigation Bar:</strong> Flota directamente sobre el contenido que hace scroll, difuminando el flujo dinámico.
              </li>
              <li>
                <strong className="text-foreground">Bottom Dock (iOS style):</strong> Flota sobre el pie sin oscurecimiento de fondo, con bisel refractivo de 1px.
              </li>
              <li>
                <strong className="text-foreground">Dynamic Island & Toasts:</strong> Pastillas compactas flotantes directamente sobre la vista activa.
              </li>
              <li>
                <strong className="text-foreground">Floating Drawers & Menús sin Scrim:</strong> Controles que no bloquean ni oscurecen toda la pantalla.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Modal Patterns Showcase */}
      <div>
        <div className="mb-4">
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
            Patrones de Modales Interactivos
          </h2>
          <p className="text-xs text-muted-foreground">
            Modales estructurados según Apple HIG: superficies sólidas de alta fidelidad, elevación suave, física elástica y feedback sonoro cuelume sincronizado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Standard Liquid Glass Modal */}
          <Card className="flex flex-col justify-between hover:border-foreground/20 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-sm font-semibold">Modal Estándar</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">Centrado</Badge>
              </div>
              <CardDescription className="text-xs line-clamp-2">
                Diálogo flotante con desenfoque 2xl, bisel de luz y cabecera estructurada.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full text-xs justify-center"
                soundType="click"
                onClick={() => {
                  play('click');
                  setIsStandardModalOpen(true);
                }}
              >
                Abrir Modal Estándar
              </Button>
            </CardContent>
          </Card>

          {/* 2. Apple iOS Bottom Sheet */}
          <Card className="flex flex-col justify-between hover:border-foreground/20 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-sm font-semibold">iOS Bottom Sheet</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">Grabber & Detents</Badge>
              </div>
              <CardDescription className="text-xs line-clamp-2">
                Hoja deslizable con indicador de agarre, soporte para detents y swipe hacia abajo.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full text-xs justify-center"
                soundType="click"
                onClick={() => {
                  play('click');
                  setIsSheetOpen(true);
                }}
              >
                Abrir Bottom Sheet
              </Button>
            </CardContent>
          </Card>

          {/* 3. Apple Critical Alert Dialog */}
          <Card className="flex flex-col justify-between hover:border-foreground/20 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-sm font-semibold">Alert Dialog Destructivo</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono text-red-500 border-red-500/20">Crítico</Badge>
              </div>
              <CardDescription className="text-xs line-clamp-2">
                Alerta de confirmación de acción crítica con feedback de audio de advertencia.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full text-xs justify-center hover:text-red-500 hover:border-red-500/30"
                soundType="alert"
                onClick={() => {
                  setIsAlertOpen(true);
                }}
              >
                Abrir Alert Dialog
              </Button>
            </CardContent>
          </Card>

          {/* 4. Apple iOS Action Sheet */}
          <Card className="flex flex-col justify-between hover:border-foreground/20 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-sm font-semibold">iOS Action Sheet</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">Pills</Badge>
              </div>
              <CardDescription className="text-xs line-clamp-2">
                Opciones contextuales agrupadas en cristal con botón Cancelar independiente.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full text-xs justify-center"
                soundType="click"
                onClick={() => {
                  play('click');
                  setIsActionSheetOpen(true);
                }}
              >
                Abrir Action Sheet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-Step Modal Quick Trigger Banner */}
      <Card className="border-border bg-card">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Flujo Multi-Paso con Transición Suave</h3>
            <CardDescription className="text-xs mt-0.5">
              Modal con estado secuencial (Paso 1: Parámetros / Paso 2: Permisos / Paso 3: Confirmación) sin recarga.
            </CardDescription>
          </div>
          <Button
            variant="default"
            soundType="click"
            onClick={() => {
              play('click');
              setMultiStep(1);
              setIsMultiStepModalOpen(true);
            }}
            className="shrink-0 text-xs"
          >
            Iniciar Asistente Multi-Paso
          </Button>
        </CardContent>
      </Card>

      {/* Interactive Liquid Glass Live Refraction Sandbox */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
            Laboratorio de Refracción Liquid Glass en Tiempo Real
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comprueba cómo el material dinámico difumina y refleja la luz del fondo que pasa por debajo, respetando los estándares de Apple.
          </p>
        </div>

        {/* Sandbox Canvas & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Top 2 Cols: The Visual Sandbox Viewport */}
          <div className="lg:col-span-2 rounded-3xl border border-border overflow-hidden relative min-h-[380px] flex items-center justify-center p-6 sm:p-10 select-none">
            {/* Background Selector Canvas */}
            <div className="absolute inset-0 z-0">
              {sandboxBackground === 'mesh' && (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-900 via-rose-700 to-amber-500 relative overflow-hidden">
                  <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-400 rounded-full mix-blend-screen filter blur-2xl opacity-70 animate-pulse" />
                  <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-80" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-2xl opacity-50" />
                </div>
              )}

              {sandboxBackground === 'aurora' && (
                <div className="w-full h-full bg-[#0a0f1d] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
                  <div className="absolute -top-20 left-1/4 w-96 h-96 bg-emerald-500/40 rounded-full filter blur-3xl opacity-60" />
                  <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/30 rounded-full filter blur-3xl opacity-70" />
                </div>
              )}

              {sandboxBackground === 'geometric' && (
                <div className="w-full h-full bg-neutral-950 p-6 grid grid-cols-3 gap-4 opacity-90">
                  <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-4 text-white text-xs font-bold">
                    Módulo de Análisis
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 p-4 text-white text-xs font-bold">
                    Flujo de Usuarios
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-4 text-white text-xs font-bold">
                    Conexiones Activas
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-4 text-white text-xs font-bold col-span-2">
                    Ingresos Mensuales en Tiempo Real
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 p-4 text-white text-xs font-bold">
                    Alertas
                  </div>
                </div>
              )}

              {sandboxBackground === 'table' && (
                <div className="w-full h-full bg-background p-6 font-mono text-[11px] text-muted-foreground overflow-hidden">
                  <div className="font-semibold text-foreground mb-2">TABLA DE AUDITORÍA RAW (CAPA DE CONTENIDO):</div>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="py-1 border-b border-border/40 flex justify-between">
                      <span>SEC-REQ-904{i} [AUTH_BEARER] OK</span>
                      <span className="text-foreground tabular-nums">192.168.1.{10 + i}:443</span>
                      <span className="text-emerald-500 font-bold">200 OK</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* The Floating Liquid Glass Card (Functional Layer) */}
            <div
              className={cn(
                'relative z-10 w-full max-w-md rounded-[28px] p-6 transition-all duration-200',
                hasSpecularBorder
                  ? resolvedTheme === 'dark'
                    ? 'border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.65)]'
                    : 'border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_20px_50px_rgba(0,0,0,0.18)]'
                  : 'border border-border shadow-xl'
              )}
              style={{
                backdropFilter: `blur(${glassBlur}px) ${hasSaturationBoost ? 'saturate(160%)' : ''}`,
                WebkitBackdropFilter: `blur(${glassBlur}px) ${hasSaturationBoost ? 'saturate(160%)' : ''}`,
                backgroundColor:
                  resolvedTheme === 'dark'
                    ? `rgba(24, 24, 30, ${glassOpacity / 100})`
                    : `rgba(255, 255, 255, ${glassOpacity / 100})`,
                color: resolvedTheme === 'dark' ? '#F4F4F6' : '#18181B',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold tracking-tight">Liquid Glass Panel</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-muted/40 border-border">
                  {glassBlur}px blur / {glassOpacity}% opacidad
                </Badge>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <p className="font-medium leading-relaxed opacity-90">
                  Observa cómo los colores vivos y las formas del fondo se difuminan con suavidad mientras el texto y controles mantienen máxima legibilidad.
                </p>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 font-mono text-[11px] flex items-center justify-between">
                  <span>Refracción Óptica</span>
                  <span className="font-bold">Activa (1.6x Sat)</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                <span className="text-[11px] opacity-75 font-mono">Apple HIG Spec 2026</span>
                <Button
                  variant="default"
                  size="sm"
                  soundType="click"
                  onClick={() => showToast('Interacción dentro de Liquid Glass confirmada.')}
                  className="rounded-full text-xs shadow-md"
                >
                  Confirmar Acción
                </Button>
              </div>
            </div>
          </div>

          {/* Right Col: Interactive Parameter Sliders & Background Switcher */}
          <Card className="border-border bg-card flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold">
                Parámetros de Refracción
              </CardTitle>
              <CardDescription className="text-xs">
                Ajusta las variables de desenfoque y saturación
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-5 text-xs">
              {/* Background selector */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">
                  Fondo de Prueba:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      play('click');
                      setSandboxBackground('mesh');
                    }}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all',
                      sandboxBackground === 'mesh'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-secondary/40'
                    )}
                  >
                    Mesh Colorido
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      play('click');
                      setSandboxBackground('aurora');
                    }}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all',
                      sandboxBackground === 'aurora'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-secondary/40'
                    )}
                  >
                    Aurora Oscura
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      play('click');
                      setSandboxBackground('geometric');
                    }}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all',
                      sandboxBackground === 'geometric'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-secondary/40'
                    )}
                  >
                    Cards & Bloques
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      play('click');
                      setSandboxBackground('table');
                    }}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all',
                      sandboxBackground === 'table'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-secondary/40'
                    )}
                  >
                    Texto & Tabla Raw
                  </button>
                </div>
              </div>

              {/* Blur Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Desenfoque (Backdrop Blur):</span>
                  <span className="font-mono text-foreground font-semibold tabular-nums">{glassBlur}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  step="2"
                  value={glassBlur}
                  onChange={(e) => setGlassBlur(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>4px (Clear)</span>
                  <span>24px (Regular HIG)</span>
                  <span>64px (Heavy)</span>
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Opacidad de Superficie:</span>
                  <span className="font-mono text-foreground font-semibold tabular-nums">{glassOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  step="5"
                  value={glassOpacity}
                  onChange={(e) => setGlassOpacity(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>20% (Ultra Clear)</span>
                  <span>85% (Apple HIG)</span>
                  <span>95% (Opaque)</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Bisel Especular Superior</div>
                    <div className="text-[11px] text-muted-foreground">Luz reflejada en borde de 1px</div>
                  </div>
                  <Switch
                    checked={hasSpecularBorder}
                    onCheckedChange={(checked: boolean) => setHasSpecularBorder(checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Realce de Saturación (160%)</div>
                    <div className="text-[11px] text-muted-foreground">Evita tonos apagados bajo el vidrio</div>
                  </div>
                  <Switch
                    checked={hasSaturationBoost}
                    onCheckedChange={(checked: boolean) => setHasSaturationBoost(checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================= MODAL INSTANCES ================= */}

      {/* 1. Standard Modal: Crear Llave API */}
      <Modal
        isOpen={isStandardModalOpen}
        onClose={() => setIsStandardModalOpen(false)}
        title="Crear Nueva Llave de Acceso API"
        description="Emisión de credencial criptográfica de alta seguridad para servicios externos."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              soundType="click"
              onClick={() => {
                play('click');
                setIsStandardModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              soundType="click"
              onClick={() => {
                play('click');
                setIsStandardModalOpen(false);
                showToast(`Llave API "${newKeyName}" generada exitosamente.`);
              }}
            >
              Generar Llave
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-foreground block mb-1.5">Identificador de la Llave</label>
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="ej. Prod-Ingress-Gateway"
              className="text-xs"
            />
          </div>

          <div>
            <label className="font-medium text-foreground block mb-1.5">Entorno de Ejecución</label>
            <div className="grid grid-cols-3 gap-2">
              {(['development', 'staging', 'production'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => {
                    play('click');
                    setNewKeyEnv(env);
                  }}
                  className={cn(
                    'py-2 px-3 rounded-xl border text-center font-mono capitalize transition-all',
                    newKeyEnv === env
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'border-border text-muted-foreground hover:bg-secondary/40'
                  )}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 border border-border">
            <div>
              <div className="font-medium text-foreground">Modo Solo Lectura</div>
              <div className="text-[11px] text-muted-foreground">Inhabilita operaciones de mutación (POST/PUT/DELETE)</div>
            </div>
            <Switch
              checked={newKeyReadonly}
              onCheckedChange={(checked: boolean) => setNewKeyReadonly(checked)}
            />
          </div>
        </div>
      </Modal>

      {/* 2. Apple iOS Bottom Sheet: Filtros Rápidos */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Filtros Rápidos & Segmentación"
        description="Ajusta los criterios de búsqueda en la capa flotante de iOS sin perder el contexto principal."
        detent={sheetDetent}
        footer={
          <>
            <Button
              variant="outline"
              soundType="click"
              onClick={() => {
                play('click');
                setIsSheetOpen(false);
              }}
            >
              Restablecer
            </Button>
            <Button
              variant="default"
              soundType="click"
              onClick={() => {
                play('click');
                setIsSheetOpen(false);
                showToast('Filtros aplicados a la vista actual.');
              }}
            >
              Aplicar Filtros
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 border border-border">
            <span className="text-muted-foreground font-medium">Tamaño del Detent:</span>
            <div className="flex gap-1.5">
              {(['sm', 'md', 'lg'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    play('click');
                    setSheetDetent(d);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-mono uppercase text-[10px] transition-all',
                    sheetDetent === d
                      ? 'bg-foreground text-background font-bold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-3">
            <span className="font-medium text-foreground block">Estado de Licencias Activas:</span>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-primary" />
                <span>Enterprise Tier (SLA 99.99%)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-primary" />
                <span>Pro Tier (Equipos Medianos)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" className="rounded accent-primary" />
                <span>Prueba Gratuita (Evaluación)</span>
              </label>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed italic">
            Tip de interacción de Apple: Puedes arrastrar suavemente el indicador superior hacia abajo para cerrar esta hoja en cualquier momento.
          </p>
        </div>
      </Sheet>

      {/* 3. Apple Critical Alert Dialog: Confirmación Destructiva */}
      <AlertDialog
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Revocar Licencia de Organización"
        description="Esta acción invalidará inmediatamente todos los certificados de seguridad emitidos para el nodo central y desconectará a los 42 miembros activos del clúster."
        variant="danger"
        confirmText="Revocar Inmediatamente"
        cancelText="Conservar Licencia"
        onConfirm={() => {
          setIsAlertOpen(false);
          showToast('Licencia de organización revocada.');
        }}
      />

      {/* 4. Apple iOS Action Sheet: Compartir / Exportar */}
      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title="Opciones de Auditoría y Reportes"
        description="Selecciona una acción rápida para compartir o exportar"
        options={actionSheetOptions}
        cancelText="Cerrar Opciones"
      />

      {/* 5. Multi-Step Form Modal */}
      <Modal
        isOpen={isMultiStepModalOpen}
        onClose={() => setIsMultiStepModalOpen(false)}
        title={`Asistente de Despliegue (Paso ${multiStep} de 3)`}
        description="Configuración guiada para el aprovisionamiento de un nuevo entorno seguro."
        size="lg"
        footer={
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <span className={cn('h-2 w-2 rounded-full', multiStep >= 1 ? 'bg-primary' : 'bg-muted')} />
              <span className={cn('h-2 w-2 rounded-full', multiStep >= 2 ? 'bg-primary' : 'bg-muted')} />
              <span className={cn('h-2 w-2 rounded-full', multiStep >= 3 ? 'bg-primary' : 'bg-muted')} />
              <span className="ml-2">Paso {multiStep}/3</span>
            </div>

            <div className="flex items-center gap-2">
              {multiStep > 1 && (
                <Button
                  variant="outline"
                  soundType="click"
                  onClick={() => {
                    play('click');
                    setMultiStep((s) => s - 1);
                  }}
                >
                  Atrás
                </Button>
              )}

              {multiStep < 3 ? (
                <Button
                  variant="default"
                  soundType="click"
                  onClick={() => {
                    play('click');
                    setMultiStep((s) => s + 1);
                  }}
                  className="gap-1.5"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  soundType="click"
                  onClick={() => {
                    play('click');
                    setIsMultiStepModalOpen(false);
                    pillToast.success(
                      'Despliegue Finalizado con Éxito',
                      'El clúster us-east-secure-vault fue aprovisionado y certificado.'
                    );
                  }}
                  className="gap-1.5"
                >
                  Finalizar Despliegue
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs py-2">
          {multiStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-semibold text-foreground text-sm">Paso 1: Parámetros del Entorno</h4>
              <div>
                <label className="font-medium text-foreground block mb-1.5">Nombre del Clúster</label>
                <Input defaultValue="us-east-secure-vault" className="text-xs font-mono" />
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1.5">Región Geográfica</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border border-primary bg-primary/5 text-primary font-medium flex items-center justify-between">
                    <span>US-East (N. Virginia)</span>
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="p-3 rounded-xl border border-border text-muted-foreground flex items-center justify-between">
                    <span>EU-Central (Frankfurt)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {multiStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-semibold text-foreground text-sm">Paso 2: Políticas de Acceso y Red</h4>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Aislamiento de VPC Privada</div>
                    <div className="text-[11px] text-muted-foreground">Sin IPs públicas expuestas a internet</div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Cifrado con Llaves Administradas (KMS)</div>
                    <div className="text-[11px] text-muted-foreground">Rotación automática anual de secretos</div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </div>
            </div>
          )}

          {multiStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-semibold text-foreground text-sm">Paso 3: Verificación y Despliegue</h4>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Listo para aprovisionamiento
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Todos los controles de seguridad y certificados han superado la validación previa. El despliegue tomará aproximadamente 15 segundos en la nube privada.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

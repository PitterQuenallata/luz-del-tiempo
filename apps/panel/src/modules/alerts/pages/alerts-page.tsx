import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Sliders,
  X,
  Clock,
  Sparkles,
  Layers,
  Key,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { notify } from '../../../shared/lib/notify';
import { sonnerNotify, toast } from '../../../shared/components/ui/sonner';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { SweetAlert, SweetAlertOptions } from '../../../shared/components/ui/sweet-alert';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

export const AlertsPage: React.FC = () => {
  const { play } = useSound();
  const [activeTab, setActiveTab] = useState<'all' | 'pill' | 'sonner' | 'sileo' | 'sweetalert' | 'banners'>('all');
  const [dismissedBanners, setDismissedBanners] = useState<Record<string, boolean>>({});

  // SweetAlert modal state
  const [sweetAlertConfig, setSweetAlertConfig] = useState<SweetAlertOptions | null>(null);
  const [isSweetAlertOpen, setIsSweetAlertOpen] = useState(false);

  const openSweetAlert = (config: SweetAlertOptions) => {
    setSweetAlertConfig(config);
    setIsSweetAlertOpen(true);
  };

  const handleDismissBanner = (id: string) => {
    play('click');
    setDismissedBanners((prev) => ({ ...prev, [id]: true }));
  };

  const handleRestoreBanners = () => {
    play('pop');
    setDismissedBanners({});
  };

  // Sonner Promise Demo
  const triggerSonnerPromise = () => {
    const fakeAsyncAction = new Promise<{ id: string }>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.2) {
          resolve({ id: 'ORD-9824' });
        } else {
          reject(new Error('Fallo de red al conectar con el servidor'));
        }
      }, 2000);
    });

    sonnerNotify.promise(fakeAsyncAction, {
      loading: 'Sincronizando registros con el servidor central...',
      success: (data) => `Transacción ${data.id} validada y almacenada con éxito.`,
      error: (err) => `Error de sincronización: ${err instanceof Error ? err.message : 'Error desconocido'}`,
    });
  };

  // Sileo Promise Demo
  const triggerSileoPromise = () => {
    const fakeAsyncAction = new Promise<{ id: string }>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.15) {
          resolve({ id: 'DEPLOY-8491' });
        } else {
          reject(new Error('Timeout de conexión con el nodo'));
        }
      }, 2200);
    });

    notify.promise(fakeAsyncAction, {
      loading: {
        title: 'Desplegando Clúster Seguro',
        description: 'Aprovisionando contenedores en US-East...',
      },
      success: (data: unknown) => {
        const payload = data as { id?: string } | undefined;
        return {
          title: 'Despliegue Finalizado',
          description: `Entorno ${payload?.id || 'PROD-8491'} verificado y en línea.`,
        };
      },
      error: () => ({
        title: 'Fallo de Aprovisionamiento',
        description: 'Revisa las credenciales de la VPC.',
      }),
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Showcase</span>
          <span>/</span>
          <span className="text-foreground">Suite de Notificaciones & Alertas</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Suite de 5 Sistemas de Notificación
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Colección completa de 5 niveles de feedback conforme a Apple HIG: pastillas flotantes de alto contraste (<strong className="text-foreground">Pill Toasts</strong>), toasts tradicionales apilables (<strong className="text-foreground">Sonner</strong>), pastillas elásticas (<strong className="text-foreground">Sileo React</strong>), diálogos modales interactivos (<strong className="text-foreground">SweetAlert Apple</strong>) y banners contextuales integrados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs py-1 px-2.5 bg-blue-500/10 text-blue-500 border-blue-500/20">
              5 Versiones Activas
            </Badge>
            <Badge variant="outline" className="font-mono text-xs py-1 px-2.5 bg-primary/10 text-primary border-primary/20">
              Zero Emojis
            </Badge>
          </div>
        </div>
      </div>

      {/* Segmented Filter Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            play('tab');
            setActiveTab('all');
          }}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'all'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Ver Todas las 5 Versiones
        </button>
        <button
          type="button"
          onClick={() => {
            play('tab');
            setActiveTab('pill');
          }}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'pill'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          1. Pill Toasts (Apple Invertido)
        </button>
        <button
          type="button"
          onClick={() => {
            play('tab');
            setActiveTab('sonner');
          }}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'sonner'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          2. Toasts Tradicionales (Sonner)
        </button>
        <button
          type="button"
          onClick={() => {
            play('tab');
            setActiveTab('sileo');
          }}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'sileo'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          3. Sileo (Dynamic Island)
        </button>
        <button
          type="button"
          onClick={() => {
            play('tab');
            setActiveTab('sweetalert');
          }}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'sweetalert'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          4. SweetAlert (Modales Apple)
        </button>
        <button
          type="button"
          onClick={() => {
            play('tab');
            setActiveTab('banners');
          }}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'banners'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          5. Banners Contextuales (HIG)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VERSION 1: PILL TOASTS FLOTANTES (APPLE HIGH-CONTRAST INVERTED)            */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'pill') && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    Versión 1
                  </Badge>
                  <CardTitle className="text-base font-bold">Pill Toasts Flotantes (Apple High-Contrast Inverted)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  La pastilla minimalista de alta visibilidad: flota en la esquina superior derecha (<code className="font-mono text-[10px] text-foreground">top-20 right-6</code>) con fondo invertido de alto contraste (<code className="font-mono text-[10px] text-foreground">bg-foreground text-background</code>), sombras profundas de 24px, auto-cierre con animación spring y feedback acústico cuelume.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                soundType="click"
                onClick={() => pillToast.pill.dismiss()}
                className="text-xs self-start sm:self-auto shrink-0"
              >
                Limpiar Pastillas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. Success Pill */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-emerald-500/40"
                soundType="none"
                onClick={() => {
                  pillToast.pill.success(
                    'Despliegue Finalizado con Éxito',
                    'El clúster us-east-secure-vault fue aprovisionado y certificado.'
                  );
                }}
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 mr-3 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pill Éxito (Success)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Pastilla invertida con sonido D5</div>
                </div>
              </Button>

              {/* 2. Error Pill */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-red-500/40"
                soundType="none"
                onClick={() => {
                  pillToast.pill.error(
                    'Fallo de Validación HMAC',
                    'La firma criptográfica recibida no coincide con la llave secreta.'
                  );
                }}
              >
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 mr-3 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pill Error (Crítico)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Alerta con tono grave de atención</div>
                </div>
              </Button>

              {/* 3. Warning Pill */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-amber-500/40"
                soundType="none"
                onClick={() => {
                  pillToast.pill.warning(
                    'Renovación Anual en 5 Días',
                    'Actualiza los datos del método de pago para evitar interrupciones.'
                  );
                }}
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 mr-3 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pill Advertencia (Warning)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Aviso preventivo con icono ámbar</div>
                </div>
              </Button>

              {/* 4. Info Pill */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-blue-500/40"
                soundType="none"
                onClick={() => {
                  pillToast.pill.info(
                    'Copia de Seguridad Realizada',
                    'Snapshot inmutable almacenado con hash SHA-256 verificado.'
                  );
                }}
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 mr-3 shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pill Informativo (Info)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Mensaje de confirmación de fondo</div>
                </div>
              </Button>

              {/* 5. Copy Link Pill */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-purple-500/40"
                soundType="none"
                onClick={() => {
                  pillToast.pill.success(
                    'Enlace Seguro Copiado al Portapapeles',
                    'El enlace expira en 24 horas y cuenta con cifrado E2E.'
                  );
                }}
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 mr-3 shrink-0">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pill Credencial / Enlace</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Feedback de copiado instantáneo</div>
                </div>
              </Button>

              {/* 6. Multiple Sequential Pills */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-primary/40"
                soundType="none"
                onClick={() => {
                  pillToast.pill.info('Iniciando sincronización...', 'Verificando estados de réplicas...');
                  setTimeout(() => {
                    pillToast.pill.success('Sincronización Completada', '3 nodos actualizados sin tiempo de inactividad.');
                  }, 1200);
                }}
              >
                <div className="p-2 rounded-xl bg-primary/10 text-primary mr-3 shrink-0">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Secuencia de 2 Pastillas</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Demostración de apilado fluido</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VERSION 1: TOASTS TRADICIONALES (SONNER ENTERPRISE)                        */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'sonner') && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
                    Versión 1
                  </Badge>
                  <CardTitle className="text-base font-bold">Toasts Tradicionales (Sonner Enterprise)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Notificaciones clásicas apiladas en la esquina inferior derecha con soporte de acciones ("Deshacer"), descripciones expandidas y retroalimentación sonora cuelume.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                soundType="click"
                onClick={() => toast.dismiss()}
                className="text-xs self-start sm:self-auto shrink-0"
              >
                Cerrar Toasts
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. Success Toast */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-emerald-500/40"
                soundType="none"
                onClick={() => {
                  sonnerNotify.success('Configuración Guardada', {
                    description: 'Las reglas del cortafuegos WAF se aplicaron en 4 nodos.',
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 mr-3 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Toast Éxito (Success)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Notificación de guardado con sonido D5</div>
                </div>
              </Button>

              {/* 2. Error Toast */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-red-500/40"
                soundType="none"
                onClick={() => {
                  sonnerNotify.error('Error de Comunicación [504]', {
                    description: 'No se obtuvo respuesta del gateway en el límite de tiempo.',
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 mr-3 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Toast Error (Crítico)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Alerta acústica con detalle técnico</div>
                </div>
              </Button>

              {/* 3. Warning Toast */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-amber-500/40"
                soundType="none"
                onClick={() => {
                  sonnerNotify.warning('Límite de Consultas Próximo', {
                    description: 'Has consumido el 85% de tu cuota mensual de API.',
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 mr-3 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Toast Advertencia (Warning)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Aviso de cuota con sugerencia</div>
                </div>
              </Button>

              {/* 4. Info Toast */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-blue-500/40"
                soundType="none"
                onClick={() => {
                  sonnerNotify.info('Nueva Versión Disponible', {
                    description: 'Blakor Admin Pro v2.4 está lista para instalar.',
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 mr-3 shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Toast Informativo (Info)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Detalle contextual discreto</div>
                </div>
              </Button>

              {/* 5. Action Toast (Undo) */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-purple-500/40"
                soundType="none"
                onClick={() => {
                  sonnerNotify.success('Certificado SSL Desactivado', {
                    description: 'El certificado wildcard fue puesto en suspensión temporal.',
                    action: {
                      label: 'Deshacer',
                      onClick: () => sonnerNotify.info('Certificado SSL restablecido correctamente.'),
                    },
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 mr-3 shrink-0">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Toast con Botón Deshacer</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Acción interactiva de reversión</div>
                </div>
              </Button>

              {/* 6. Promise Async Toast */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-primary/40"
                soundType="none"
                onClick={triggerSonnerPromise}
              >
                <div className="p-2 rounded-xl bg-primary/10 text-primary mr-3 shrink-0">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Toast de Promesa Asíncrona</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Carga inicial con resolución de éxito</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VERSION 2: SILEO REACT (DYNAMIC ISLAND STYLE)                             */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'sileo') && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20">
                    Versión 2
                  </Badge>
                  <CardTitle className="text-base font-bold">Sileo React (Dynamic Island Style)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Pastillas dinámicas en la parte superior central con morphing SVG fluido, física elástica de resortes nativa y retroalimentación sonora cuelume sincronizada.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                soundType="click"
                onClick={() => notify.clear()}
                className="text-xs self-start sm:self-auto shrink-0"
              >
                Limpiar Pastillas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. Sileo Success */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-emerald-500/40"
                soundType="none"
                onClick={() => {
                  notify.success({
                    title: 'Usuario Aprobado',
                    description: 'La cuenta corporativa fue verificada con éxito.',
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 mr-3 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pastilla Éxito (Success)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Cápsula fluida con chime acústico</div>
                </div>
              </Button>

              {/* 2. Sileo Error */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-red-500/40"
                soundType="none"
                onClick={() => {
                  notify.error({
                    title: 'Fallo de Autenticación',
                    description: 'El token Bearer ha caducado. Vuelve a iniciar sesión.',
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 mr-3 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pastilla Error (Crítico)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Alerta con vibración de resorte</div>
                </div>
              </Button>

              {/* 3. Sileo Warning */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-amber-500/40"
                soundType="none"
                onClick={() => {
                  notify.warning({
                    title: 'Memoria al 91%',
                    description: 'El clúster Redis está cerca del umbral de desalojo.',
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 mr-3 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pastilla Advertencia (Warning)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Indicador ámbar de alerta preventiva</div>
                </div>
              </Button>

              {/* 4. Sileo Info */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-blue-500/40"
                soundType="none"
                onClick={() => {
                  notify.info({
                    title: 'Reporte en Cola',
                    description: 'La compilación mensual estará lista en ~3 minutos.',
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 mr-3 shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pastilla Informativa (Info)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Mensaje de estado discreto</div>
                </div>
              </Button>

              {/* 5. Sileo Action */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-orange-500/40"
                soundType="none"
                onClick={() => {
                  notify.action({
                    title: 'Nueva Versión Encontrada',
                    description: 'Instala la actualización para soporte HTTP/3.',
                    button: {
                      title: 'Actualizar Ahora',
                      onClick: () => notify.success({ title: 'Actualización en curso' }),
                    },
                  });
                }}
              >
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 mr-3 shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pastilla con Botón de Acción</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Interacción embebida en la cápsula</div>
                </div>
              </Button>

              {/* 6. Sileo Promise */}
              <Button
                variant="outline"
                className="justify-start h-auto p-3 text-left hover:border-primary/40"
                soundType="none"
                onClick={triggerSileoPromise}
              >
                <div className="p-2 rounded-xl bg-primary/10 text-primary mr-3 shrink-0">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Pastilla Asíncrona (Promise)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Morphing elástico de cargando a finalizado</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VERSION 3: SWEETALERT ESTILO APPLE (MODALES INTERACTIVOS)                  */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'sweetalert') && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                Versión 3
              </Badge>
              <CardTitle className="text-base font-bold">SweetAlert Estilo Apple (Modales Interactivos)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Diálogos modales interactivos de confirmación, temporizadores de auto-cierre y prompts de seguridad con diseño refinado de Apple HIG (superficies sólidas, sombras profundas y cero emojis).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Confirmación Destructiva */}
              <Card className="flex flex-col justify-between hover:border-red-500/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-xs font-semibold">Alerta Destructiva</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono text-red-500 border-red-500/20">
                      Confirmar
                    </Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    Solicita confirmación explícita antes de purgar registros críticos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full text-xs justify-center hover:text-red-500 hover:border-red-500/30"
                    soundType="alert"
                    onClick={() => {
                      openSweetAlert({
                        type: 'danger',
                        title: '¿Eliminar Tabla de Auditoría?',
                        text: 'Esta acción purgará de forma permanente 148,290 registros de acceso y eventos criptográficos. No se podrá revertir.',
                        confirmText: 'Sí, Eliminar Permanentemente',
                        cancelText: 'Cancelar',
                        showCancelButton: true,
                        onConfirm: () => sonnerNotify.error('Tabla de auditoría purgada exitosamente.'),
                      });
                    }}
                  >
                    Lanzar Confirmación
                  </Button>
                </CardContent>
              </Card>

              {/* 2. Éxito con Chime */}
              <Card className="flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-xs font-semibold">Alerta de Éxito</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/20">
                      Chime D5
                    </Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    Notificación modal de felicitación con icono y tono de éxito.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full text-xs justify-center hover:text-emerald-500 hover:border-emerald-500/30"
                    soundType="success"
                    onClick={() => {
                      openSweetAlert({
                        type: 'success',
                        title: 'Suscripción Actualizada con Éxito',
                        text: 'Tu organización ha sido promovida al tier Enterprise Plus con SLA del 99.99% y soporte dedicado 24/7.',
                        confirmText: 'Aceptar y Continuar',
                        showCancelButton: false,
                        onConfirm: () => sonnerNotify.success('Configuración aplicada al espacio de trabajo.'),
                      });
                    }}
                  >
                    Lanzar Éxito
                  </Button>
                </CardContent>
              </Card>

              {/* 3. Temporizador Auto-Cierre */}
              <Card className="flex flex-col justify-between hover:border-primary/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-xs font-semibold">Alerta con Temporizador</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/20">
                      Auto-Cierre
                    </Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    Cuenta regresiva de 4 segundos con barra de progreso decreciente animada.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full text-xs justify-center hover:text-primary hover:border-primary/30"
                    soundType="pop"
                    onClick={() => {
                      openSweetAlert({
                        type: 'timer',
                        title: 'Bloqueo Automático de Seguridad',
                        text: 'Por directiva institucional, la sesión entrará en suspensión en breve a menos que se cancele.',
                        confirmText: 'Mantener Sesión Activa',
                        timerMs: 4000,
                        showCancelButton: true,
                        cancelText: 'Cerrar Ahora',
                        onConfirm: () => sonnerNotify.info('Sesión renovada por 60 minutos.'),
                      });
                    }}
                  >
                    Lanzar Temporizador (4s)
                  </Button>
                </CardContent>
              </Card>

              {/* 4. Prompt de Seguridad con Entrada */}
              <Card className="flex flex-col justify-between hover:border-blue-500/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-xs font-semibold">Prompt con Validación</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono text-blue-500 border-blue-500/20">
                      Input Match
                    </Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    Exige escribir una palabra clave exacta para desbloquear la acción crítica.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    className="w-full text-xs justify-center hover:text-blue-500 hover:border-blue-500/30"
                    soundType="click"
                    onClick={() => {
                      openSweetAlert({
                        type: 'prompt',
                        title: 'Autorización de Reinicio en Caliente',
                        text: 'Para reiniciar el clúster de producción US-EAST-1, confirma escribiendo la clave de autorización.',
                        requiredMatch: 'REINICIAR',
                        promptPlaceholder: 'Escribe REINICIAR aquí...',
                        confirmText: 'Autorizar Reinicio',
                        showCancelButton: true,
                        cancelText: 'Cancelar',
                        onConfirm: (val) => sonnerNotify.success(`Reinicio autorizado con token: ${val}`),
                      });
                    }}
                  >
                    Lanzar Prompt Clave
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VERSION 4: BANNERS CONTEXTUALES INTEGRADOS (APPLE HIG)                    */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'banners') && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/20">
                    Versión 4
                  </Badge>
                  <CardTitle className="text-base font-bold">Banners Contextuales Integrados (Apple HIG)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Alertas integradas directamente en el flujo del layout para comunicar estados del sistema con opción de descarte y botones de acción secundaria.
                </CardDescription>
              </div>
              {Object.keys(dismissedBanners).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  soundType="pop"
                  onClick={handleRestoreBanners}
                  className="text-xs self-start sm:self-auto shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Restaurar Banners ({Object.keys(dismissedBanners).length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            {/* 1. Info Banner */}
            {!dismissedBanners['info-banner'] && (
              <div className="flex items-start justify-between p-4 rounded-2xl bg-blue-500/[0.06] border border-blue-500/20 text-foreground transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                    <Info className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Ventana de Mantenimiento Programada
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      El domingo 03 de noviembre entre las 02:00 y 04:00 UTC se realizará una actualización en los nodos de base de datos distribuidos. La conectividad permanecerá en modo de solo lectura.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        soundType="click"
                        onClick={() => sonnerNotify.info('Redirigiendo a ventana de estado del clúster...')}
                        className="h-7 text-[11px] px-2.5 bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                      >
                        Ver Estado del Clúster
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  soundType="click"
                  onClick={() => handleDismissBanner('info-banner')}
                  className="text-muted-foreground hover:text-foreground shrink-0 -mr-1 -mt-1"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* 2. Warning Banner */}
            {!dismissedBanners['warning-banner'] && (
              <div className="flex items-start justify-between p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-foreground transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Capacidad de Almacenamiento al 88%
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      El volumen de logs de auditoría ha alcanzado 440 GB de los 500 GB contratados. Si se supera el 95%, las escrituras no críticas se pospondrán automáticamente.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        soundType="click"
                        onClick={() => sonnerNotify.warning('Abriendo asistente de expansión de cuota...')}
                        className="h-7 text-[11px] px-2.5 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                      >
                        Ampliar Capacidad
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  soundType="click"
                  onClick={() => handleDismissBanner('warning-banner')}
                  className="text-muted-foreground hover:text-foreground shrink-0 -mr-1 -mt-1"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* 3. Danger / Error Banner */}
            {!dismissedBanners['danger-banner'] && (
              <div className="flex items-start justify-between p-4 rounded-2xl bg-red-500/[0.06] border border-red-500/20 text-foreground transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-red-500/10 text-red-500 shrink-0 mt-0.5">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-red-600 dark:text-red-400">
                      Degradación de Latencia en Pasarela Stripe
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Se han registrado tiempos de respuesta superiores a 3,200 ms en la verificación de tarjetas para la región LATAM. El balanceador ha redirigido el 40% del tráfico a MercadoPago.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  soundType="click"
                  onClick={() => handleDismissBanner('danger-banner')}
                  className="text-muted-foreground hover:text-foreground shrink-0 -mr-1 -mt-1"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* 4. Success Banner */}
            {!dismissedBanners['success-banner'] && (
              <div className="flex items-start justify-between p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 text-foreground transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Copia de Seguridad SOC2 Completada
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Snapshot inmutable almacenado en bóveda fría con cifrado AES-256-GCM. Hash criptográfico verificado con éxito.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  soundType="click"
                  onClick={() => handleDismissBanner('success-banner')}
                  className="text-muted-foreground hover:text-foreground shrink-0 -mr-1 -mt-1"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Directrices de Arquitectura de Notificaciones de Apple HIG */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-bold">Arquitectura de Notificaciones según Apple HIG</CardTitle>
          <CardDescription className="text-xs">
            Cuándo emplear cada uno de los 5 niveles de feedback en aplicaciones empresariales
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
            <span className="font-semibold text-foreground block">1. Pill Toasts</span>
            <p className="text-muted-foreground text-[11px]">
              Pastillas invertidas en <code className="font-mono text-[10px] text-foreground">top-20 right-6</code>. Contraste alto con fondo negro en claro y blanco en oscuro.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
            <span className="font-semibold text-foreground block">2. Toasts (Sonner)</span>
            <p className="text-muted-foreground text-[11px]">
              Esquina inferior derecha con botón de deshacer y apilado en cascada para operaciones en lote.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
            <span className="font-semibold text-foreground block">3. Sileo (Dynamic Island)</span>
            <p className="text-muted-foreground text-[11px]">
              Cápsula central superior con física de resortes y morphing SVG de estados de promesas.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
            <span className="font-semibold text-foreground block">4. SweetAlert (Modales)</span>
            <p className="text-muted-foreground text-[11px]">
              Diálogos centrados que interrumpen la pantalla para confirmaciones críticas, temporizadores o prompts.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
            <span className="font-semibold text-foreground block">5. Banners Contextuales</span>
            <p className="text-muted-foreground text-[11px]">
              Alertas persistentes incrustadas en el flujo del layout que informan sobre el estado del sistema.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Render the Active SweetAlert Modal */}
      {sweetAlertConfig && (
        <SweetAlert
          isOpen={isSweetAlertOpen}
          onClose={() => setIsSweetAlertOpen(false)}
          {...sweetAlertConfig}
        />
      )}
    </div>
  );
};

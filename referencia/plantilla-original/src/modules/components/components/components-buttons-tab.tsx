import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  Play,
  Sparkles,
  Command,
  Download,
  Loader2,
  Copy,
  Shield,
  Zap,
  CheckCircle2,
  Flame,
  Layers,
  ArrowUpRight,
  Sun,
  Eye,
  Lock,
  Compass,
} from 'lucide-react';

export const ComponentsButtonsTab: React.FC = () => {
  const { play } = useSound();
  const [isLoading, setIsLoading] = useState(false);
  const [groupSelected, setGroupSelected] = useState<'day' | 'week' | 'month'>('week');

  const handleSimulateLoading = () => {
    play('pop');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      play('success');
      pillToast.success('Operación Concluida', 'El proceso simulado en segundo plano finalizó exitosamente.');
    }, 1800);
  };

  const soundPresets = [
    { type: 'click' as const, label: 'Micro Click', desc: 'Simulación háptica de trackpad Apple Force Touch' },
    { type: 'pop' as const, label: 'Pop Acústico', desc: 'Apertura de menús contextuales y modales' },
    { type: 'tab' as const, label: 'Transición Tab', desc: 'Cambio de pestañas en barra segmentada' },
    { type: 'toggle' as const, label: 'Conmutador Switch', desc: 'Interruptores de estado binario ON/OFF' },
    { type: 'success' as const, label: 'Chime de Éxito', desc: 'Acorde melódico D5-A5 de confirmación' },
    { type: 'alert' as const, label: 'Alerta Suave', desc: 'Tono armónico de advertencia o confirmación destructiva' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* SECTION 1: Apple Gradient Buttons Showcase */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="text-[10px]">
              Apple Design Craft
            </Badge>
            <Badge variant="blue" className="text-[10px]">
              Degradados Sutiles HIG
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Botones con Degradados & Relieve Óptico Apple
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-3xl leading-relaxed">
            Acabados con micro-degradados verticales de luminancia, bisel especular superior de 1px (`inset 0 1px 0 rgba(255,255,255,0.38)`) y micro-bordes con canal alfa para emular la precisión de hardware de macOS, iOS y visionOS.
          </p>
        </div>

        {/* System Accent Gradients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Paleta Semántica con Degradado Vertical</CardTitle>
              <CardDescription>
                Transición suave de 3 paradas de color con reflejo especular en el borde superior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="gradientBlue" onClick={() => play('click')} className="gap-1.5">
                  <Zap className="h-4 w-4" />
                  <span>Apple Blue</span>
                </Button>

                <Button variant="gradientEmerald" onClick={() => play('success')} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Apple Emerald</span>
                </Button>

                <Button variant="gradientAmber" onClick={() => play('pop')} className="gap-1.5">
                  <Flame className="h-4 w-4" />
                  <span>Apple Amber</span>
                </Button>

                <Button variant="gradientPurple" onClick={() => play('click')} className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>VisionOS Purple</span>
                </Button>

                <Button variant="gradientRose" onClick={() => play('alert')} className="gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span>Apple Crimson</span>
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                La fórmula de color combina un tono más claro en el 0%, el tono medio oficial en el 50% y un subtono saturado en el 100%, evitando la sobre-saturación artificial.
              </p>
            </CardContent>
          </Card>

          {/* Pro Metallic & Titanium Finishes */}
          <Card>
            <CardHeader>
              <CardTitle>Superficies Metálicas & Acabados Pro Titanium</CardTitle>
              <CardDescription>
                Acabados físicos inspirados en el titanio de grado aeroespacial y el cristal esmerilado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="gradientDark" onClick={() => play('click')} className="gap-1.5">
                  <Lock className="h-4 w-4" />
                  <span>Titanium Oscuro</span>
                </Button>

                <Button variant="gradientSurface" onClick={() => play('pop')} className="gap-1.5">
                  <Compass className="h-4 w-4" />
                  <span>Superficie macOS</span>
                </Button>

                <Button variant="glassGlow" onClick={() => play('tab')} className="gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>VisionOS Glass Glow</span>
                </Button>

                <Button variant="glass" onClick={() => play('click')} className="gap-1.5">
                  <Layers className="h-4 w-4" />
                  <span>Liquid Glass</span>
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                <strong>Superficie macOS</strong> emula el botón físico clásico con sombra interna blanca en modo claro y bisel de grafito en modo oscuro.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pill Buttons & Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Formato Cápsula (Pill Buttons) con Micro-Degradado</CardTitle>
            <CardDescription>
              Silueta ovalada continua (`rounded-full`) para acciones de alta prioridad, llamadas a la acción y botones de estado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="pill" variant="gradientBlue" onClick={() => play('click')} className="gap-2">
                <Zap className="h-3.5 w-3.5" />
                <span>Desplegar Clúster</span>
                <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full tabular-nums">
                  EKS
                </span>
              </Button>

              <Button size="pill" variant="gradientEmerald" onClick={() => play('success')} className="gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Autorizar Transferencia</span>
              </Button>

              <Button size="pill" variant="gradientDark" onClick={() => play('pop')} className="gap-2">
                <Lock className="h-3.5 w-3.5" />
                <span>Rotar Claves Criptográficas</span>
                <span className="font-mono text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full">
                  AES
                </span>
              </Button>

              <Button size="pill" variant="glassGlow" onClick={() => play('tab')} className="gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Inspeccionar Métricas</span>
              </Button>

              <Button size="pill" variant="gradientSurface" onClick={() => play('click')} className="gap-2">
                <span>Descargar Auditoría</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Anatomía del Bisel Especular */}
        <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" />
            Anatomía Técnica del Bisel Óptico Apple:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px] text-muted-foreground pt-1">
            <div className="p-2.5 rounded-xl bg-background/60 border border-border/40">
              <span className="font-semibold text-foreground block mb-0.5">1. Luz Especular Inset</span>
              <span>`inset 0 1px 0 rgba(255,255,255,0.38)` proyecta la incidencia cenital de luz.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background/60 border border-border/40">
              <span className="font-semibold text-foreground block mb-0.5">2. Degradado Lineal</span>
              <span>`bg-gradient-to-b` crea una transición de luminosidad sutil de arriba hacia abajo.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background/60 border border-border/40">
              <span className="font-semibold text-foreground block mb-0.5">3. Borde con Canal Alfa</span>
              <span>`border border-[#...]/60` delimita el contorno sin generar cortes duros.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background/60 border border-border/40">
              <span className="font-semibold text-foreground block mb-0.5">4. Micro-Sombra Difusa</span>
              <span>`0 2px 4px rgba(..., 0.25)` confiere elevación z-index sutil sobre el fondo.</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Standard Variations & Sound Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <Card>
          <CardHeader>
            <CardTitle>Variantes Visuales Planas Estándar</CardTitle>
            <CardDescription>
              Jerarquía de botones complementarios: Contraste neutro y bordes sutiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="default">Primario Default</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="outline">Borde Outline</Button>
              <Button variant="ghost">Fantasma Ghost</Button>
              <Button variant="destructive">Destructivo</Button>
              <Button variant="glass">Liquid Glass</Button>
            </div>

            <div className="pt-2 border-t border-border/40">
              <p className="text-xs font-semibold text-foreground mb-2">Escalas de Tamaño:</p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button size="sm">Small (h-8)</Button>
                <Button size="default">Default (h-9)</Button>
                <Button size="lg">Large (h-11)</Button>
                <Button size="pill" variant="outline">Pill (h-9)</Button>
                <Button size="icon" variant="outline" title="Botón icono">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estados Interactivos & Grupos Conectados</CardTitle>
            <CardDescription>
              Conexión continua de bordes entre botones agrupados y estados de carga asíncrona.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Button Group */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Grupo Conectado Segmentado:</p>
              <div className="inline-flex rounded-xl border border-border overflow-hidden">
                {(['day', 'week', 'month'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      play('click');
                      setGroupSelected(g);
                    }}
                    className={cn(
                      'px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer border-r last:border-r-0 border-border',
                      groupSelected === g
                        ? 'bg-primary text-white font-semibold'
                        : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {g === 'day' ? 'Día' : g === 'week' ? 'Semana' : 'Mes'}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading Button */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Botón de Carga Asíncrono:</p>
              <Button
                variant="gradientBlue"
                disabled={isLoading}
                onClick={handleSimulateLoading}
                className="gap-2 text-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sincronizando Bóvedas...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Iniciar Descarga Segura</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sound Synthesizer Station */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="text-[10px]">
              Web Audio API
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Latencia Cero
            </Badge>
          </div>
          <CardTitle>Generador de Retroalimentación Háptica & Acústica</CardTitle>
          <CardDescription>
            Síntesis matemática nativa en navegador mediante osciladores Web Audio (sin archivos MP3/WAV externos pesados).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {soundPresets.map((snd) => (
              <button
                key={snd.type}
                type="button"
                onClick={() => play(snd.type)}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/40 border border-border/50 hover:bg-secondary/70 hover:border-primary/40 transition-all text-left cursor-pointer group"
              >
                <div className="h-8 w-8 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 text-primary group-hover:scale-105 transition-transform">
                  <Play className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground block group-hover:text-primary transition-colors">
                    {snd.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground block leading-tight">
                    {snd.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Keycaps */}
      <Card>
        <CardHeader>
          <CardTitle>Atajos de Teclado Apple (Kbd Keycaps)</CardTitle>
          <CardDescription>
            Representación tipográfica de teclas de comando de hardware conforme a las convenciones de macOS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/40">
              <span className="text-foreground font-medium">Búsqueda Global:</span>
              <kbd className="font-mono text-[10px] bg-background border border-border px-1.5 py-0.5 rounded shadow-xs text-foreground font-semibold">
                ⌘K
              </kbd>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/40">
              <span className="text-foreground font-medium">Confirmar y Enviar:</span>
              <kbd className="font-mono text-[10px] bg-background border border-border px-1.5 py-0.5 rounded shadow-xs text-foreground font-semibold">
                ⌘↵
              </kbd>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/40">
              <span className="text-foreground font-medium">Cerrar Inspector:</span>
              <kbd className="font-mono text-[10px] bg-background border border-border px-1.5 py-0.5 rounded shadow-xs text-foreground font-semibold">
                Esc
              </kbd>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/40">
              <span className="text-foreground font-medium">Alternar Barra Lateral:</span>
              <kbd className="font-mono text-[10px] bg-background border border-border px-1.5 py-0.5 rounded shadow-xs text-foreground font-semibold">
                ⌘B
              </kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

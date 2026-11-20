import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  Radio,
  GitBranch,
  Rocket,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Zap,
  Server,
  Layers,
  Leaf,
  Cpu,
} from 'lucide-react';

export const WidgetsActivityTab: React.FC = () => {
  const { play } = useSound();
  const [isRolloutPaused, setIsRolloutPaused] = useState(false);
  const [canaryPercentage, setCanaryPercentage] = useState(25);

  const handleToggleRollout = () => {
    play('click');
    setIsRolloutPaused(!isRolloutPaused);
    if (!isRolloutPaused) {
      pillToast.warning('Rollout Pausado', 'El despliegue canario quedó detenido al 25% de tráfico.');
    } else {
      pillToast.success('Rollout Reanudado', 'Continuando la progresión de tráfico al 50%.');
      setCanaryPercentage(50);
    }
  };

  const handlePromoteFull = () => {
    play('success');
    setCanaryPercentage(100);
    pillToast.success('Promoción al 100% Exitosa', 'El tráfico de producción fue migrado por completo a la nueva release.');
  };

  const steps = [
    { name: 'Compilación TypeScript & Vite', duration: '42s', status: 'completed' },
    { name: 'Pruebas Unitarias & Integración', duration: '1m 18s', status: 'completed' },
    { name: 'Canary Deploy (25% Tráfico)', duration: 'En curso...', status: 'active' },
    { name: 'Promoción Global a Producción', duration: 'En cola', status: 'pending' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Apple Dynamic Island / Live Activity Widget */}
      <div className="rounded-3xl border border-white/10 bg-black text-white p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                Apple Live Activity • Despliegue en Tiempo Real
              </span>
              <Badge variant="outline" className="border-white/20 text-white font-mono text-[10px] ml-1">
                v2.4.0-rc.3
              </Badge>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Pipeline de Entrega Continua (CI/CD)
            </h3>

            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Clúster Frankfurt (eu-central-1) con enrutamiento ponderado mediante AWS Route 53. El 25% del tráfico de producción está siendo atendido por la nueva arquitectura.
            </p>
          </div>

          {/* Live Activity Actions */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleRollout}
              className="border-neutral-700 bg-neutral-900/80 text-white hover:bg-neutral-800 text-xs gap-1.5 h-9"
            >
              {isRolloutPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              <span>{isRolloutPaused ? 'Reanudar' : 'Pausar'}</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handlePromoteFull}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 h-9 shadow-md"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Promover al 100%</span>
            </Button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="relative z-10 pt-6 mt-6 border-t border-neutral-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-2xl border transition-all',
                  st.status === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : st.status === 'active'
                    ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                  <span>Paso {idx + 1}</span>
                  <span>{st.duration}</span>
                </div>
                <p className="font-semibold text-xs text-white">{st.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Telemetry Cards: Queue Worker + Green Energy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asynchronous Queue Worker */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cola de Tareas en Segundo Plano (Worker Pool)</CardTitle>
                <CardDescription>
                  Throughput de procesamiento por segundo y latencia de serialización en clúster Redis.
                </CardDescription>
              </div>
              <Badge variant="success" className="font-mono text-xs">
                Zero Lag
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                  Rendimiento
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-foreground mt-0.5 block">
                  1,840 ops/s
                </span>
                <span className="text-[10px] text-emerald-500 font-mono">+12% carga</span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                  Latencia P99
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-foreground mt-0.5 block">
                  4.2 ms
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Tiempo de respuesta</span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                  Dead Letter (DLQ)
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-foreground mt-0.5 block">
                  0
                </span>
                <span className="text-[10px] text-emerald-500 font-mono">Sin fallos</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Capacidad de procesamiento en cola de eventos:</span>
                <span className="font-mono tabular-nums text-foreground font-semibold">92% disponible</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environmental & Carbon Efficiency */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sostenibilidad Ambiental & Huella de Carbono</CardTitle>
                <CardDescription>
                  Monitoreo de energía renovable en centros de datos asociados a las directivas Apple 2030.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-xs">
                Net Zero
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Leaf className="h-4 w-4" />
                  <span>Energía Renovable</span>
                </div>
                <span className="text-2xl font-bold font-mono tabular-nums text-foreground block">
                  100%
                </span>
                <p className="text-[11px] text-muted-foreground">Parques solares y eólicos certificados</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  <Cpu className="h-4 w-4" />
                  <span>Índice PUE Cómputo</span>
                </div>
                <span className="text-2xl font-bold font-mono tabular-nums text-foreground block">
                  1.12
                </span>
                <p className="text-[11px] text-muted-foreground">Eficiencia de refrigeración pasiva</p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              Todos los servidores de procesamiento cumplen los lineamientos de neutralidad de carbono y reporte de emisiones de Alcance 1, 2 y 3.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

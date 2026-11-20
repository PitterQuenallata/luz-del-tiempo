import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Spinner } from '@/components/ui/ios-spinner';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const ComponentsIndicatorsTab: React.FC = () => {
  const { play } = useSound();
  const [progressVal, setProgressVal] = useState(65);

  const simulateProgressStep = () => {
    play('click');
    setProgressVal((prev) => (prev >= 100 ? 0 : prev + 15));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Apple Status Badges & Dot Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Etiquetas de Estado Semánticas (Pill Badges)</CardTitle>
            <CardDescription>
              Micro-etiquetas con fondo translúcido y bordes de 1px basados en la paleta de sistema Apple.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Acento Primario</Badge>
              <Badge variant="secondary">Neutro Secundario</Badge>
              <Badge variant="success">Éxito / Aprobado</Badge>
              <Badge variant="warning">Advertencia / Pendiente</Badge>
              <Badge variant="destructive">Error / Bloqueado</Badge>
              <Badge variant="blue">Informativo Azul</Badge>
              <Badge variant="purple">VIP / Especial</Badge>
              <Badge variant="outline">Borde Outline</Badge>
            </div>

            <div className="pt-3 border-t border-border/40 space-y-2">
              <p className="text-xs font-semibold text-foreground">Indicadores de Punto de Conexión (Status Dots):</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  En Línea / Activo
                </span>

                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  En Espera
                </span>

                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Mantenimiento
                </span>

                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Sin Conexión
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apple iOS Native Activity Spinner */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-[10px]">
                iOS 18 Native
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                12 Blades
              </Badge>
            </div>
            <CardTitle>Spinner Oficial de Actividad iOS (12 Aspas)</CardTitle>
            <CardDescription>
              Implementación fiel de `UIActivityIndicatorView` con 12 aspas redondeadas a 30° y desfase rotativo de opacidad sin vibración óptica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-around gap-6 p-4 rounded-2xl bg-muted/20 border border-border/40">
              {/* Spinner Small */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 flex items-center justify-center">
                  <Spinner size="sm" className="text-muted-foreground" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">sm (12px)</span>
              </div>

              {/* Spinner Medium */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 flex items-center justify-center">
                  <Spinner size="md" className="text-primary" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">md (16px)</span>
              </div>

              {/* Spinner Large */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 flex items-center justify-center">
                  <Spinner size="lg" className="text-foreground" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">lg (24px)</span>
              </div>

              {/* Spinner Extra Large */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 flex items-center justify-center">
                  <Spinner size="xl" className="text-primary" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">xl (32px)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Spinner size="md" className="text-primary" />
                <span className="font-semibold text-foreground">Sincronizando estado con el servidor...</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">UIActivityIndicator</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars & Segmented Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Barras de Progreso Lineales & Medidores Segmentados</CardTitle>
              <CardDescription>
                Indicadores continuos de estado con animación suave y cifras numéricas monoespaciadas.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={simulateProgressStep}
              className="text-xs gap-1.5 h-8"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Simular Avance (+15%)</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Continuous Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground">Sincronización de Base de Datos Clúster:</span>
              <span className="font-mono tabular-nums font-bold text-primary">{progressVal}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressVal}%` }}
              />
            </div>
          </div>

          {/* Segmented 4-Step Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground">Etapas de Aprobación de Firma (Paso 3 de 4):</span>
              <span className="font-mono text-[11px] text-muted-foreground">75% Completado</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="h-2 rounded-full bg-primary" />
              <div className="h-2 rounded-full bg-primary" />
              <div className="h-2 rounded-full bg-primary" />
              <div className="h-2 rounded-full bg-muted" />
            </div>
          </div>

          {/* Stacked Avatars */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Equipo Asignado al Proyecto:</p>
              <p className="text-[11px] text-muted-foreground">Superposición con borde de separación de 2px</p>
            </div>
            <div className="flex items-center -space-x-2">
              {['VS', 'LD', 'AO', 'KT'].map((initials, idx) => (
                <div
                  key={idx}
                  className="h-8 w-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-bold text-foreground ring-1 ring-border shadow-xs"
                >
                  {initials}
                </div>
              ))}
              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground ring-1 ring-border">
                +4
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

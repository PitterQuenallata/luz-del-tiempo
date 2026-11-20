import React from 'react';
import {
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { AutomationMetrics } from '../types/automatizaciones.types';

interface AutomationMetricsBarProps {
  metrics: AutomationMetrics;
}

export const AutomationMetricsBar: React.FC<AutomationMetricsBarProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Reglas Activas */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-4 sm:p-5 space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Reglas Activas
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            En producción
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums font-mono">
          {metrics.activeRules} <span className="text-xs font-medium text-muted-foreground font-sans">/ {metrics.activeWorkflows}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Flujos en escucha continua</p>
      </div>

      {/* 2. Disparos Hoy */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-4 sm:p-5 space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Disparos Hoy
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            24h
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums font-mono">
          {metrics.totalExecutionsToday.toLocaleString('es-ES')}
        </div>
        <p className="text-[11px] text-muted-foreground">Eventos procesados sin demora</p>
      </div>

      {/* 3. Tasa de Éxito */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-4 sm:p-5 space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Tasa de Éxito
          </span>
          <span className="text-[11px] font-mono text-emerald-500 font-medium">
            +0.4%
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums font-mono">
          {metrics.overallSuccessRate}%
        </div>
        <p className="text-[11px] text-muted-foreground">0.2% de reintentos controlados</p>
      </div>

      {/* 4. Tiempo Ahorrado */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-4 sm:p-5 space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Tiempo Ahorrado
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Mensual
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums font-mono">
          ~{metrics.hoursSavedMonthly}h <span className="text-xs font-medium text-muted-foreground font-sans">/ mes</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Carga operativa eliminada</p>
      </div>
    </div>
  );
};

export default AutomationMetricsBar;

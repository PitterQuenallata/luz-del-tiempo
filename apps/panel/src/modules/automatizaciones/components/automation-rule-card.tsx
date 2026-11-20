import React from 'react';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  Zap,
  ShoppingBag,
  CreditCard,
  ShieldAlert,
  LifeBuoy,
  Lock,
  Send,
  Truck,
  Globe,
  BellRing,
  RefreshCw,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { AutomationRule } from '../types/automatizaciones.types';
import { Badge } from '../../../../src/shared/components/ui/badge';
import { Button } from '../../../../src/shared/components/ui/button';
import { Switch } from '../../../../src/shared/components/ui/switch';
import { useSound } from '../../../../src/shared/context/sound-context';
import { cn } from '../../../../src/shared/lib/utils';

interface AutomationRuleCardProps {
  rule: AutomationRule;
  onToggle: (id: string) => void;
  onTest: (rule: AutomationRule) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  CreditCard,
  ShieldAlert,
  LifeBuoy,
  Lock,
  Send,
  Truck,
  Globe,
  BellRing,
  RefreshCw,
  UserCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  Zap,
};

export const AutomationRuleCard: React.FC<AutomationRuleCardProps> = ({
  rule,
  onToggle,
  onTest,
}) => {
  const { play } = useSound();

  const TriggerIcon = iconMap[rule.trigger.iconName] || Zap;
  const ConditionIcon = iconMap[rule.condition.iconName] || CheckCircle2;
  const ActionIcon = iconMap[rule.action.iconName] || ArrowRight;

  const categoryBadges: Record<string, { label: string; variant: 'blue' | 'purple' | 'warning' | 'destructive' | 'secondary' }> = {
    ecommerce: { label: 'eCommerce', variant: 'blue' },
    pagos: { label: 'Finanzas & Pagos', variant: 'purple' },
    seguridad: { label: 'Seguridad & IAM', variant: 'destructive' },
    soporte: { label: 'Soporte al Cliente', variant: 'warning' },
    sistema: { label: 'Sistema & Cron', variant: 'secondary' },
  };

  const cat = categoryBadges[rule.category] || { label: rule.category, variant: 'secondary' };

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-200 p-5 sm:p-6 bg-card text-card-foreground flex flex-col justify-between gap-5 shadow-xs',
        rule.enabled
          ? 'border-border/60 hover:border-primary/40 hover:shadow-sm'
          : 'border-border/30 opacity-70 bg-muted/10'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight text-foreground">
              {rule.name}
            </h3>
            <Badge variant={cat.variant} className="text-[10px] uppercase font-mono px-2 py-0.5">
              {cat.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            {rule.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            {rule.enabled ? 'Activo' : 'Pausado'}
          </span>
          <Switch
            checked={rule.enabled}
            onCheckedChange={() => {
              play('toggle');
              onToggle(rule.id);
            }}
          />
        </div>
      </div>

      {/* Visual Flow Nodes Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative py-2">
        {/* Node 1: Trigger */}
        <div className="p-3.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              1. Disparador (Trigger)
            </span>
            <div className="h-6 w-6 rounded-lg bg-muted/70 text-foreground flex items-center justify-center">
              <TriggerIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{rule.trigger.title}</p>
            <p className="text-[11px] text-muted-foreground">{rule.trigger.subtitle}</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/80 mt-1">
            {rule.trigger.service}
          </span>
        </div>

        {/* Node 2: Condition */}
        <div className="p-3.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              2. Condición (Filtro)
            </span>
            <div className="h-6 w-6 rounded-lg bg-muted/70 text-foreground flex items-center justify-center">
              <ConditionIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{rule.condition.title}</p>
            <p className="text-[11px] text-muted-foreground">{rule.condition.subtitle}</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/80 mt-1">
            {rule.condition.service}
          </span>
        </div>

        {/* Node 3: Action */}
        <div className="p-3.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              3. Acción Automatizada
            </span>
            <div className="h-6 w-6 rounded-lg bg-muted/70 text-foreground flex items-center justify-center">
              <ActionIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{rule.action.title}</p>
            <p className="text-[11px] text-muted-foreground">{rule.action.subtitle}</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/80 mt-1">
            {rule.action.service}
          </span>
        </div>
      </div>

      {/* Footer / Telemetry */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-border/50 gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4 flex-wrap tabular-nums font-mono text-[11px]">
          <span>
            Ejecuciones: <strong className="text-foreground">{rule.executionsCount.toLocaleString('es-ES')}</strong>
          </span>
          <span>
            Latencia media: <strong className="text-foreground">{rule.avgLatency}</strong>
          </span>
          <span>
            Último disparo: <strong className="text-foreground">{rule.lastRun}</strong>
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          soundType="click"
          onClick={() => onTest(rule)}
          className="h-8 text-xs rounded-xl gap-1.5 shrink-0 self-end sm:self-auto"
        >
          <Play className="h-3.5 w-3.5 text-primary fill-primary/20" />
          <span>Probar Flujo Ahora</span>
        </Button>
      </div>
    </div>
  );
};

export default AutomationRuleCard;

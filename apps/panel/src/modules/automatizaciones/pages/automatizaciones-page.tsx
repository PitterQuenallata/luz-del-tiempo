import React, { useState, useMemo } from 'react';
import {
  Zap,
  Search,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { initialAutomationRules, initialAutomationMetrics } from '../data/automatizaciones-data';
import { AutomationRule, AutomationCategory } from '../types/automatizaciones.types';
import { AutomationMetricsBar } from '../components/automation-metrics-bar';
import { AutomationRuleCard } from '../components/automation-rule-card';
import { AutomationTestSimulator } from '../components/automation-test-simulator';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export const AutomatizacionesPage: React.FC = () => {
  const { play } = useSound();
  const [rules, setRules] = useState<AutomationRule[]>(initialAutomationRules);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AutomationCategory | 'all'>('all');
  const [testingRule, setTestingRule] = useState<AutomationRule | null>(null);

  // Toggle rule state
  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newState = !r.enabled;
          pillToast.info('Estado de Regla', newState ? `Flujo activado: ${r.name}` : `Flujo pausado: ${r.name}`);
          return { ...r, enabled: newState };
        }
        return r;
      })
    );
  };

  // Launch test simulator
  const handleTestRule = (rule: AutomationRule) => {
    setTestingRule(rule);
  };

  // Calculate live metrics based on state
  const liveMetrics = useMemo(() => {
    const activeRules = rules.filter((r) => r.enabled).length;
    const hoursSavedMonthly = rules
      .filter((r) => r.enabled)
      .reduce((sum, r) => sum + r.savedHoursMonthly, 0);

    return {
      ...initialAutomationMetrics,
      activeRules,
      activeWorkflows: rules.length,
      hoursSavedMonthly: parseFloat(hoursSavedMonthly.toFixed(1)),
    };
  }, [rules]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
      const matchesSearch =
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.trigger.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.action.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [rules, selectedCategory, searchQuery]);

  const categories: { id: AutomationCategory | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'Todos los Flujos', count: rules.length },
    { id: 'ecommerce', label: 'eCommerce', count: rules.filter((r) => r.category === 'ecommerce').length },
    { id: 'pagos', label: 'Pagos & Cobros', count: rules.filter((r) => r.category === 'pagos').length },
    { id: 'soporte', label: 'Soporte SLA', count: rules.filter((r) => r.category === 'soporte').length },
    { id: 'seguridad', label: 'Seguridad & IAM', count: rules.filter((r) => r.category === 'seguridad').length },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Flujos & Automatizaciones
            </h1>
            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
              Motor v2.4
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            Diseña, conecta y simula pipelines autónomos que integran logística, pasarelas de pago, registros del sistema y soporte.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border/60 hover:bg-muted/50 gap-2 h-9"
            onClick={() => {
              play('pop');
              pillToast.info('Guía de Conexión', 'Los flujos se integran con webhooks HTTP o colas de eventos en producción.');
            }}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Guía de Conexión</span>
          </Button>

          <Button
            size="sm"
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2 h-9"
            onClick={() => {
              play('click');
              pillToast.info('Nueva Regla', 'Selecciona un evento desencadenante y define la acción.');
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Crear Regla</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metrics */}
      <AutomationMetricsBar metrics={liveMetrics} />

      {/* 3. Search & Filter Bar */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por regla, trigger o acción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-9.5 rounded-xl bg-background/80 border-border/60 focus-visible:ring-primary/20 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{filteredRules.length} de {rules.length} reglas activas</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  play('pop');
                  setSelectedCategory(cat.id);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all select-none',
                  isSelected
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{cat.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-semibold',
                    isSelected
                      ? 'bg-background/20 text-background'
                      : 'bg-muted-foreground/15 text-muted-foreground'
                  )}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Rules List */}
      <div className="space-y-4">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule) => (
            <AutomationRuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggleRule}
              onTest={handleTestRule}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 p-12 text-center bg-card/20 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No se encontraron reglas</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No hay automatizaciones que coincidan con &quot;{searchQuery}&quot;. Prueba cambiando los filtros o el término de búsqueda.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl mt-2"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Restablecer Filtros
            </Button>
          </div>
        )}
      </div>

      {/* 5. Interactive Test Simulator Modal */}
      <AutomationTestSimulator
        rule={testingRule}
        onClose={() => setTestingRule(null)}
      />
    </div>
  );
};

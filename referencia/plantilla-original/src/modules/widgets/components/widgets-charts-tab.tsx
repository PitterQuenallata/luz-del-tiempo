import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { metricsSparklinesData, cloudExpensesData } from '../data/widgets-data';
import { cn } from '../../../shared/lib/utils';

export const WidgetsChartsTab: React.FC = () => {
  const totalCloudExpense = cloudExpensesData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Sparkline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsSparklinesData.map((stat, idx) => {
          const min = Math.min(...stat.history);
          const max = Math.max(...stat.history);
          const range = max - min || 1;
          const points = stat.history
            .map((val, i) => {
              const x = (i / (stat.history.length - 1)) * 120;
              const y = 35 - ((val - min) / range) * 28;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <Card key={idx} className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-foreground">
                    {stat.value}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-mono font-medium',
                      stat.isPositive ? 'text-emerald-500' : 'text-rose-500'
                    )}
                  >
                    {stat.percentageChange}
                  </span>
                </div>

                {/* Micro Sparkline SVG */}
                <div className="pt-2 h-10 w-full overflow-hidden">
                  <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke={stat.isPositive ? '#10B981' : '#F43F5E'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cloud Expenses & Retention Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cloud Expenses Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Distribución de Costos de Infraestructura Cloud
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Gasto operativo mensual auditado por proveedor
                  </CardDescription>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-xs text-muted-foreground block">Gasto Total</span>
                  <span className="text-sm font-bold text-foreground">
                    ${totalCloudExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Proportional Segmented Progress Bar */}
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted/60 p-0.5 border border-border/40">
                  {cloudExpensesData.map((item, idx) => (
                    <div
                      key={idx}
                      style={{ width: `${item.percentage}%` }}
                      className={cn('h-full first:rounded-l-full last:rounded-r-full', item.color)}
                      title={`${item.provider}: ${item.percentage}%`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[11px] font-mono tabular-nums text-muted-foreground">
                  <span>Presupuesto asignado: $35,000.00</span>
                  <span className="text-emerald-500 font-medium">Margen disponible: 22.3%</span>
                </div>
              </div>

              {/* Provider Rows */}
              <div className="divide-y divide-border/30">
                {cloudExpensesData.map((expense, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-2.5 h-2.5 rounded-full', expense.color)} />
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">
                          {expense.provider}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {expense.allocation}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums">
                      <span className="text-xs font-bold text-foreground block">
                        ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {expense.percentage}% del total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Retention & Enterprise SLA Gauge (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">
                Retención Neta de Asientos (NDR)
              </CardTitle>
              <CardDescription className="text-xs">
                Métrica anualizada de persistencia de contratos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="flex items-center justify-center py-2">
                {/* Circular Gauge */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-muted/40"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-primary"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset="251.2"
                      style={{ strokeDashoffset: `${251.2 - (251.2 * 94.2) / 100}` }}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold font-mono tabular-nums text-foreground block">
                      94.2%
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Target 90%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/40 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tasa de Churn Anual:</span>
                  <span className="font-semibold text-emerald-500 tabular-nums">2.1% (Excelente)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Expansión de Cuentas:</span>
                  <span className="font-semibold text-foreground tabular-nums">+14.8% YoY</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Contratos Activos:</span>
                  <span className="font-semibold text-foreground tabular-nums">418 Enterprise</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

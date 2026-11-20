import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { DashboardKpiGrid } from './dashboard-kpi-grid';
import { crmKpisData, dealFunnelData, accountExecutivesData } from '../data/dashboard-data';
import { formatCurrency, cn } from '../../../shared/lib/utils';

export const DashboardCrmView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 KPIs Apple Grid */}
      <DashboardKpiGrid metrics={crmKpisData} />

      {/* Funnel & Account Executives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Deal Funnel (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <div>
                <CardTitle className="text-base font-semibold">
                  Embudo de Conversión de Oportunidades (Pipeline)
                </CardTitle>
                <CardDescription className="text-xs">
                  Transición de leads a contratos firmados con volumen financiero
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/proyectos' })}
                className="text-xs gap-1"
              >
                Ver Kanban
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-4 font-mono text-xs">
                {dealFunnelData.map((stage, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-sans font-medium text-foreground">
                        {stage.stage}
                      </span>
                      <div className="flex items-center gap-3 tabular-nums">
                        <span className="text-muted-foreground">{stage.dealsCount} deals</span>
                        <span className="font-bold text-foreground">
                          {formatCurrency(stage.volume)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          idx === 0 && 'bg-primary',
                          idx === 1 && 'bg-blue-500',
                          idx === 2 && 'bg-indigo-500',
                          idx === 3 && 'bg-emerald-500'
                        )}
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/40 text-xs flex justify-between items-center font-mono tabular-nums">
                <span className="text-muted-foreground">Velocidad del Pipeline:</span>
                <span className="font-semibold text-emerald-500">+$78,200.00 / semana proyectado</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Executives Quota (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">
                Rendimiento de Ejecutivos de Cuenta (AEs)
              </CardTitle>
              <CardDescription className="text-xs">
                Porcentaje de cumplimiento de cuota trimestral
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 p-0">
              <div className="divide-y divide-border/30">
                {accountExecutivesData.map((exec, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={exec.avatar}
                        alt={exec.name}
                        className="w-8 h-8 rounded-full object-cover border border-border/50"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">
                          {exec.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                          {exec.dealsClosed} deals cerrados
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums">
                      <span className="text-xs font-bold text-foreground block">
                        {formatCurrency(exec.revenueGenerated)}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0',
                          exec.quotaPercent >= 100
                            ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                            : 'border-muted text-muted-foreground'
                        )}
                      >
                        {exec.quotaPercent}% cuota
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

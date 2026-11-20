import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { DashboardKpiGrid } from './dashboard-kpi-grid';
import { ecommerceKpisData, topProductsData } from '../data/dashboard-data';
import { formatCurrency, cn } from '../../../shared/lib/utils';

export const DashboardEcommerceView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 KPIs Apple Grid */}
      <DashboardKpiGrid metrics={ecommerceKpisData} />

      {/* Sales Channels & Fulfillment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales by Channel (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">
                Distribución de Ventas por Canal
              </CardTitle>
              <CardDescription className="text-xs">
                Porcentaje de transacciones liquidadas en el periodo
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-sans font-medium text-foreground">Tienda Online Directa (Web & App)</span>
                    <span className="font-bold tabular-nums">64%</span>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '64%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-sans font-medium text-foreground">Marketplace Corporativo B2B</span>
                    <span className="font-bold tabular-nums">22%</span>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-sans font-medium text-foreground">Puntos de Venta Físicos (POS)</span>
                    <span className="font-bold tabular-nums">14%</span>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '14%' }} />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/40 text-xs space-y-1 font-mono tabular-nums">
                <div className="flex justify-between text-muted-foreground">
                  <span>Margen Bruto de Operación:</span>
                  <span className="font-semibold text-emerald-500">41.8%</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Devoluciones (RMA Rate):</span>
                  <span className="font-semibold text-foreground">0.8% (&lt;1.5% Target)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fulfillment Pipeline (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">
                Estado Operativo de Envíos & Despacho
              </CardTitle>
              <CardDescription className="text-xs">
                Flujo logístico en tiempo real en centros de distribución
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
                    En Empaque
                  </span>
                  <span className="text-2xl font-bold font-mono tabular-nums text-foreground mt-1 block">
                    42
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Prioridad estándar
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
                    En Tránsito
                  </span>
                  <span className="text-2xl font-bold font-mono tabular-nums text-primary mt-1 block">
                    189
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    En ruta con carrier
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
                    Entregados Hoy
                  </span>
                  <span className="text-2xl font-bold font-mono tabular-nums text-emerald-500 mt-1 block">
                    310
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    99.4% a tiempo
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/40 border border-border/40 text-xs space-y-1 font-mono text-muted-foreground">
                <p>
                  <strong className="text-foreground">SLA de Despacho Inmediato:</strong> El 94.2% de los pedidos realizados antes de las 14:00 UTC son despachados en el mismo día hábil.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Products Table */}
      <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
          <div>
            <CardTitle className="text-base font-semibold">
              Productos con Mayor Facturación
            </CardTitle>
            <CardDescription className="text-xs">
              Artículos líderes en ventas, volumen de stock y recaudación acumulada
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/ecommerce' })}
            className="text-xs gap-1"
          >
            Ver Catálogo
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-5">Producto</th>
                  <th className="py-3 px-5">Categoría</th>
                  <th className="py-3 px-5">Precio Unitario</th>
                  <th className="py-3 px-5">Unidades Vendidas</th>
                  <th className="py-3 px-5">Ingresos Totales</th>
                  <th className="py-3 px-5 text-right">Stock Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {topProductsData.map((prod) => (
                  <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-foreground">
                      {prod.name}
                    </td>
                    <td className="py-3.5 px-5 text-muted-foreground">
                      {prod.category}
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums font-medium text-foreground">
                      {formatCurrency(prod.price)}
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-foreground">
                      {prod.soldUnits}
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums font-bold text-foreground">
                      {formatCurrency(prod.revenue)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-mono px-2 py-0',
                          prod.stock < 30
                            ? 'border-amber-500/30 text-amber-500 bg-amber-500/5'
                            : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                        )}
                      >
                        {prod.stock} en almacén
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

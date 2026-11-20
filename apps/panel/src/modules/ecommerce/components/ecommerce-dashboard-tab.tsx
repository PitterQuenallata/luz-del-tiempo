import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { PaymentGateway, RecentTransaction, ProductPerformance } from '../types/ecommerce';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

interface EcommerceDashboardTabProps {
  gateways: PaymentGateway[];
  transactions: RecentTransaction[];
  performances: ProductPerformance[];
  onNavigateToShop: () => void;
  onNavigateToList: () => void;
}

export const EcommerceDashboardTab: React.FC<EcommerceDashboardTabProps> = ({
  gateways,
  transactions,
  performances,
  onNavigateToShop,
  onNavigateToList,
}) => {
  const { play } = useSound();

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner + Quick Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Welcome Card (8 cols) */}
        <Card className="lg:col-span-8 overflow-hidden relative border-border bg-gradient-to-br from-card via-card to-card/90">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                  Panel Comercial en Vivo
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Bienvenido de vuelta, Mathew Anderson
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                  El volumen de ventas de hoy presenta un incremento del 35% respecto a la media semanal. Tus 4 pasarelas de pago están operando con latencia nominal inferior a 85 ms.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="default"
                  size="sm"
                  soundType="click"
                  onClick={() => {
                    play('click');
                    onNavigateToShop();
                  }}
                  className="text-xs gap-1.5"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Explorar Catálogo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Ventas de Hoy</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-foreground tabular-nums">$2,340.00</span>
                  <span className="text-xs font-semibold text-emerald-500 flex items-center">
                    <ArrowUpRight className="h-3.5 w-3.5" /> +35%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Órdenes Completadas</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-foreground tabular-nums">48</span>
                  <span className="text-xs font-semibold text-emerald-500 flex items-center">
                    <ArrowUpRight className="h-3.5 w-3.5" /> +12%
                  </span>
                </div>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-muted-foreground block">Ticket Promedio</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-foreground tabular-nums">$48.75</span>
                  <span className="text-xs font-semibold text-muted-foreground font-mono">USD</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Highlights (4 cols) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <Card className="border-border">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs text-muted-foreground">Ingresos Totales (Mes)</span>
              <div className="font-mono text-2xl font-bold text-foreground tabular-nums">$65,432.00</div>
              <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
                <ArrowUpRight className="h-3 w-3" /> +18.4% vs mes anterior
              </span>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs text-muted-foreground">Gastos de Operación</span>
              <div className="font-mono text-2xl font-bold text-foreground tabular-nums">$10,230.00</div>
              <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
                <ArrowDownRight className="h-3 w-3" /> -4.2% optimización de costos
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Middle Row: Revenue Updates + Sales Overview + Weekly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue Updates (8 cols) */}
        <Card className="lg:col-span-8 border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Flujo de Ingresos & Rendimiento Mensual</CardTitle>
                <CardDescription className="text-xs">
                  Comparativa de facturación bruta frente a costes de fulfillment y licencias
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">2026 Q3-Q4</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            {/* Visual breakdown bars */}
            <div className="space-y-4">
              {[
                { month: 'Octubre 2026 (Actual)', sales: 65432, cost: 10230, percent: 84 },
                { month: 'Septiembre 2026', sales: 54120, cost: 9800, percent: 70 },
                { month: 'Agosto 2026', sales: 48900, cost: 8950, percent: 63 },
                { month: 'Julio 2026', sales: 42300, cost: 8400, percent: 55 },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.month}</span>
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="text-foreground font-semibold">${item.sales.toLocaleString()} USD</span>
                      <span className="text-muted-foreground text-[11px]">Coste: ${item.cost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t border-border/40 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Facturación Bruta
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  Coste Operativo
                </span>
              </div>
              <span className="font-mono text-[11px] text-foreground font-medium">Margen Neto Promedio: 81.2%</span>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category (4 cols) */}
        <Card className="lg:col-span-4 border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold">Distribución por Categorías</CardTitle>
            <CardDescription className="text-xs">Participación de inventario en ventas</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {[
              { label: 'Electrónica & Gaming', share: 44, amount: '$28,789', color: 'bg-primary' },
              { label: 'Hardware & Periféricos', share: 26, amount: '$17,012', color: 'bg-emerald-500' },
              { label: 'Moda & Accesorios', share: 18, amount: '$11,777', color: 'bg-purple-500' },
              { label: 'Libros & Publicaciones', share: 12, amount: '$7,854', color: 'bg-amber-500' },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {cat.amount} <strong className="text-foreground font-semibold">({cat.share}%)</strong>
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', cat.color)} style={{ width: `${cat.share}%` }} />
                </div>
              </div>
            ))}

            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border mt-4 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">Tasa de Conversión General</span>
                <span className="font-mono font-bold text-primary">3.82%</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Supera el promedio de la industria de comercio electrónico B2B (2.4%).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Gateways Row */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-sm font-bold tracking-tight text-foreground">
            Pasarelas de Pago Integradas (Payment Gateways)
          </h3>
          <Badge variant="outline" className="font-mono text-[10px]">4 Activas</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gateways.map((gw) => (
            <Card key={gw.id} className="border-border hover:border-foreground/20 transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
                    {gw.type}
                  </span>
                  <Badge
                    variant={gw.status === 'active' ? 'outline' : 'secondary'}
                    className={cn(
                      'text-[10px] font-mono capitalize',
                      gw.status === 'active' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    )}
                  >
                    {gw.status === 'active' ? 'Operativo' : 'Verificación'}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground">{gw.name}</h4>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Balance Líquido</span>
                    <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                      ${gw.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Tarifa {gw.feePercent}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions (4 cols) + Product Performances (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Transactions (5 cols) */}
        <Card className="lg:col-span-5 border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Órdenes y Transacciones Recientes</CardTitle>
                <CardDescription className="text-xs">Registro en tiempo real de cobros</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] text-emerald-500 border-emerald-500/30">
                En Vivo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 text-xs">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground">{tx.orderNumber}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] font-mono py-0 px-1.5 uppercase',
                          tx.status === 'completed' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                          tx.status === 'pending' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                          tx.status === 'refunded' && 'bg-red-500/10 text-red-500 border-red-500/20'
                        )}
                      >
                        {tx.status === 'completed' ? 'Completado' : tx.status === 'pending' ? 'Pendiente' : 'Reembolsado'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px] truncate max-w-[200px]">{tx.customerName}</p>
                    <span className="text-[10px] text-muted-foreground/70">{tx.date}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-foreground text-sm tabular-nums block">
                      ${tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{tx.gateway.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Performances (7 cols) */}
        <Card className="lg:col-span-7 border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Rendimiento de Productos Estrella</CardTitle>
                <CardDescription className="text-xs">Artículos con mayor facturación bruta y conversión</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                soundType="click"
                onClick={() => {
                  play('click');
                  onNavigateToList();
                }}
                className="text-xs text-primary"
              >
                Ver Inventario Completo
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Producto</th>
                    <th className="py-2.5 px-3 font-medium text-right">Unidades</th>
                    <th className="py-2.5 px-3 font-medium text-right">Facturado</th>
                    <th className="py-2.5 px-4 font-medium text-right">Crecimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {performances.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="h-10 w-10 rounded-xl object-cover border border-border shrink-0"
                          />
                          <div>
                            <span className="font-medium text-foreground block truncate max-w-[200px]">
                              {p.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{p.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-foreground">
                        {p.salesVolume}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-foreground tabular-nums">
                        ${p.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center text-emerald-500 font-semibold font-mono text-xs">
                          <ArrowUpRight className="h-3 w-3 mr-0.5" />
                          +{p.growth}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { areaSeriesData } from '../data/charts-data';
import { AreaSeriesPoint } from '../types/charts.types';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';

export const ChartsAreaTab: React.FC = () => {
  const { play } = useSound();
  const [period, setPeriod] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxVal = 32000;
  const width = 640;
  const height = 240;
  const paddingX = 30;
  const paddingY = 25;

  const getCoordinates = (points: AreaSeriesPoint[], key: 'revenue' | 'expenses' | 'netProfit') => {
    return points.map((p, i) => {
      const x = paddingX + (i / (points.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - (p[key] / maxVal) * (height - 2 * paddingY);
      return { x, y, val: p[key], date: p.date };
    });
  };

  const revenueCoords = getCoordinates(areaSeriesData, 'revenue');
  const expenseCoords = getCoordinates(areaSeriesData, 'expenses');
  const profitCoords = getCoordinates(areaSeriesData, 'netProfit');

  // Build SVG Path with smooth curves
  const buildSmoothPath = (coords: { x: number; y: number }[]) => {
    if (!coords.length) return '';
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const revenueLine = buildSmoothPath(revenueCoords);
  const revenueArea = `${revenueLine} L ${revenueCoords[revenueCoords.length - 1].x} ${height - paddingY} L ${revenueCoords[0].x} ${height - paddingY} Z`;

  const profitLine = buildSmoothPath(profitCoords);
  const profitArea = `${profitLine} L ${profitCoords[profitCoords.length - 1].x} ${height - paddingY} L ${profitCoords[0].x} ${height - paddingY} Z`;

  const hoveredPoint = hoverIndex !== null ? areaSeriesData[hoverIndex] : areaSeriesData[areaSeriesData.length - 1];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Ingresos Totales (MRR)
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
              $165,000 USD
            </span>
            <span className="text-xs font-mono text-emerald-500 font-semibold flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +24.8%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Comparado con ciclo previo</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Gastos de Operación Cloud
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
              $65,100 USD
            </span>
            <span className="text-xs font-mono text-muted-foreground font-semibold">
              39.4% ratio
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Servidores, CDN y licencias</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Beneficio Neto Operativo
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-500">
              $99,900 USD
            </span>
            <span className="text-xs font-mono text-emerald-500 font-semibold flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +31.2%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Margen libre de impuestos</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Margen de Eficiencia
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
              60.5%
            </span>
            <span className="text-xs font-mono text-primary font-semibold">
              Grado A+
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Punto de equilibrio optimizado</p>
        </Card>
      </div>

      {/* Main Interactive Spline Area Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-[10px]">
                  Curva Bezier Spline
                </Badge>
                <Badge variant="blue" className="text-[10px]">
                  Gradiente Apple
                </Badge>
              </div>
              <CardTitle>Flujo de Ingresos vs. Beneficio Neto Acumulado</CardTitle>
              <CardDescription>
                Pasa el cursor sobre la gráfica para inspeccionar los valores exactos por punto de registro temporal.
              </CardDescription>
            </div>

            {/* Timeframe Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border/50 text-xs self-start sm:self-auto">
              {(['7D', '30D', '90D', '1Y'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    play('click');
                    setPeriod(p);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-medium font-mono',
                    period === p ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Legend and Active Point Inspection */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-muted/20 border border-border/40">
            <div className="flex items-center gap-5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Ingresos Brutos</span>
                <span className="font-mono tabular-nums font-bold text-foreground">
                  ${hoveredPoint.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Beneficio Neto</span>
                <span className="font-mono tabular-nums font-bold text-foreground">
                  ${hoveredPoint.netProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="text-muted-foreground">Gastos Cloud</span>
                <span className="font-mono tabular-nums font-bold text-foreground">
                  ${hoveredPoint.expenses.toLocaleString()}
                </span>
              </div>
            </div>

            <Badge variant="outline" className="font-mono text-xs">
              Corte: {hoveredPoint.date} 2026
            </Badge>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-64 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#007AFF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34C759" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#34C759" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = height - paddingY - ratio * (height - 2 * paddingY);
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-muted-foreground text-[9px] font-mono"
                    >
                      ${Math.round((ratio * maxVal) / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={revenueArea} fill="url(#revenueGrad)" />
              <path d={profitArea} fill="url(#profitGrad)" />

              {/* Lines */}
              <path
                d={revenueLine}
                fill="none"
                stroke="#007AFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={profitLine}
                fill="none"
                stroke="#34C759"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Hover Vertical Bar & Points */}
              {revenueCoords.map((pt, i) => {
                const isHovered = hoverIndex === i;
                return (
                  <g
                    key={i}
                    onMouseEnter={() => {
                      play('click');
                      setHoverIndex(i);
                    }}
                    onMouseLeave={() => setHoverIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Invisible Hitbox */}
                    <rect
                      x={pt.x - 20}
                      y={0}
                      width={40}
                      height={height}
                      fill="transparent"
                    />

                    {/* Hover vertical crosshair */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={paddingY}
                        x2={pt.x}
                        y2={height - paddingY}
                        stroke="#007AFF"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Point circles */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#007AFF"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="transition-all"
                    />
                    <circle
                      cx={profitCoords[i].x}
                      cy={profitCoords[i].y}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#34C759"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="transition-all"
                    />

                    {/* Date label at bottom */}
                    <text
                      x={pt.x}
                      y={height - 8}
                      textAnchor="middle"
                      className={cn(
                        'text-[10px] font-mono transition-colors',
                        isHovered ? 'fill-foreground font-bold' : 'fill-muted-foreground'
                      )}
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

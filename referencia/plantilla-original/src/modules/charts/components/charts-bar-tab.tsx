import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { barComparisonData } from '../data/charts-data';
import { BarComparisonItem } from '../types/charts.types';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  BarChart2,
  Calendar,
  Layers,
  ArrowUpRight,
  Target,
} from 'lucide-react';

export const ChartsBarTab: React.FC = () => {
  const { play } = useSound();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTargetLine, setShowTargetLine] = useState(true);

  const maxVal = 100000;
  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const hoveredItem = hoverIndex !== null ? barComparisonData[hoverIndex] : barComparisonData[barComparisonData.length - 1];

  const totalCurrent = barComparisonData.reduce((acc, curr) => acc + curr.currentYear, 0);
  const totalPrevious = barComparisonData.reduce((acc, curr) => acc + curr.previousYear, 0);
  const growthRate = Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Ventas Anuales 2026 (YTD)
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
              ${totalCurrent.toLocaleString()} USD
            </span>
            <span className="text-xs font-mono text-emerald-500 font-semibold flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +{growthRate}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Superando el plan en un 12%</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Cierre Ejercicio 2025
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-muted-foreground">
              ${totalPrevious.toLocaleString()} USD
            </span>
            <span className="text-xs font-mono text-muted-foreground font-semibold">
              Base Histórica
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Total acumulado en 12 meses</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Tasa de Cumplimiento de Cuota
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-primary">
              108.4%
            </span>
            <span className="text-xs font-mono text-emerald-500 font-semibold flex items-center">
              Objetivo Superado
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Cuotas trimestrales rebasadas</p>
        </Card>
      </div>

      {/* Grouped Columns Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-[10px]">
                  Columnas Comparativas
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Apple HIG
                </Badge>
              </div>
              <CardTitle>Rendimiento Interanual por Mes (2026 vs. 2025)</CardTitle>
              <CardDescription>
                Columnas gemelas con curvatura superior redondeada (`rx="3"`), línea de cuota meta y panel de inspección contextual.
              </CardDescription>
            </div>

            <Button
              variant={showTargetLine ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                play('toggle');
                setShowTargetLine(!showTargetLine);
              }}
              className="text-xs gap-1.5 self-start sm:self-auto h-8"
            >
              <Target className="h-3.5 w-3.5" />
              <span>{showTargetLine ? 'Ocultar Cuota' : 'Ver Cuota Meta'}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Legend and Active Point Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-muted/20 border border-border/40">
            <div className="flex items-center gap-5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-primary" />
                <span className="text-muted-foreground">Año 2026:</span>
                <span className="font-mono tabular-nums font-bold text-foreground">
                  ${hoveredItem.currentYear.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-muted-foreground/30" />
                <span className="text-muted-foreground">Año 2025:</span>
                <span className="font-mono tabular-nums font-bold text-foreground">
                  ${hoveredItem.previousYear.toLocaleString()}
                </span>
              </div>
              {showTargetLine && (
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-4 bg-amber-500 border-dashed" />
                  <span className="text-muted-foreground">Cuota Meta:</span>
                  <span className="font-mono tabular-nums font-bold text-amber-500">
                    ${hoveredItem.targetQuota.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <Badge variant="outline" className="font-mono text-xs">
              Mes Seleccionado: {hoveredItem.month}
            </Badge>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-64 select-none overflow-visible"
            >
              {/* Horizontal grid lines */}
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

              {/* Columns for each month */}
              {barComparisonData.map((item, idx) => {
                const isHovered = hoverIndex === idx;
                const slotWidth = (width - 2 * paddingX) / barComparisonData.length;
                const groupCenterX = paddingX + idx * slotWidth + slotWidth / 2;
                const barWidth = Math.min(10, slotWidth * 0.35);

                const hCurrent = (item.currentYear / maxVal) * (height - 2 * paddingY);
                const yCurrent = height - paddingY - hCurrent;

                const hPrev = (item.previousYear / maxVal) * (height - 2 * paddingY);
                const yPrev = height - paddingY - hPrev;

                const yTarget = height - paddingY - (item.targetQuota / maxVal) * (height - 2 * paddingY);

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => {
                      play('click');
                      setHoverIndex(idx);
                    }}
                    onMouseLeave={() => setHoverIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Hitbox */}
                    <rect
                      x={paddingX + idx * slotWidth}
                      y={0}
                      width={slotWidth}
                      height={height}
                      fill="transparent"
                    />

                    {/* Target line segment */}
                    {showTargetLine && (
                      <line
                        x1={groupCenterX - barWidth - 4}
                        y1={yTarget}
                        x2={groupCenterX + barWidth + 4}
                        y2={yTarget}
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeDasharray="3 2"
                      />
                    )}

                    {/* Previous Year Column */}
                    <rect
                      x={groupCenterX - barWidth - 1.5}
                      y={yPrev}
                      width={barWidth}
                      height={hPrev}
                      rx="3"
                      ry="3"
                      className={cn(
                        'transition-all duration-200',
                        isHovered ? 'fill-muted-foreground/60' : 'fill-muted-foreground/30'
                      )}
                    />

                    {/* Current Year Column (Apple Blue) */}
                    <rect
                      x={groupCenterX + 1.5}
                      y={yCurrent}
                      width={barWidth}
                      height={hCurrent}
                      rx="3"
                      ry="3"
                      className={cn(
                        'transition-all duration-200',
                        isHovered ? 'fill-blue-400' : 'fill-primary'
                      )}
                    />

                    {/* Month Label */}
                    <text
                      x={groupCenterX}
                      y={height - 8}
                      textAnchor="middle"
                      className={cn(
                        'text-[10px] font-mono transition-colors',
                        isHovered ? 'fill-foreground font-bold' : 'fill-muted-foreground'
                      )}
                    >
                      {item.month}
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

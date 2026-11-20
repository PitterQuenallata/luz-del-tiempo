import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { financialCandlesData } from '../data/charts-data';
import { FinancialCandle } from '../types/charts.types';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  TrendingUp,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
} from 'lucide-react';

export const ChartsFinancialTab: React.FC = () => {
  const { play } = useSound();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const minPrice = 140.0;
  const maxPrice = 160.0;
  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;

  const maxVolume = 8000;
  const volumeHeight = 50;

  const hoveredCandle = hoverIndex !== null ? financialCandlesData[hoverIndex] : financialCandlesData[financialCandlesData.length - 1];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Último Precio de Liquidación
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
              ${hoveredCandle.close.toFixed(2)} USD
            </span>
            <span className={cn('text-xs font-mono font-semibold flex items-center', hoveredCandle.isBullish ? 'text-emerald-500' : 'text-rose-500')}>
              {hoveredCandle.isBullish ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {hoveredCandle.isBullish ? '+1.8%' : '-0.7%'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Sesión: {hoveredCandle.date}</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Rango Máximo / Mínimo
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold font-mono tabular-nums text-foreground">
              ${hoveredCandle.high.toFixed(1)} / ${hoveredCandle.low.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-muted-foreground">Spread $0.15</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Volatilidad intradiaria contenida</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Volumen de Contratos
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {hoveredCandle.volume.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-primary font-semibold">Lotes</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Profundidad de mercado activa</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-card/70 border-border/50 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider font-semibold">
            Tendencia Algorítmica
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-500">Alcista</span>
            <span className="text-xs font-mono text-emerald-500 font-semibold">RSI 62.4</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Cruces de medias EMA 20/50</p>
        </Card>
      </div>

      {/* Candlestick & Volume Canvas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-[10px]">
                  Velas Japonesas (OHLC)
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Histograma de Volumen
                </Badge>
              </div>
              <CardTitle>Comportamiento de Precios & Volatilidad de Transacciones</CardTitle>
              <CardDescription>
                Representación de apertura, máximo, mínimo y cierre diario con barras de volumen en la banda inferior.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Active Candle Details Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-muted/20 border border-border/40 text-xs">
            <div className="flex items-center gap-6 font-mono tabular-nums">
              <span>
                <strong className="text-muted-foreground font-sans font-semibold">Apertura:</strong> ${hoveredCandle.open.toFixed(2)}
              </span>
              <span>
                <strong className="text-muted-foreground font-sans font-semibold">Máximo:</strong> ${hoveredCandle.high.toFixed(2)}
              </span>
              <span>
                <strong className="text-muted-foreground font-sans font-semibold">Mínimo:</strong> ${hoveredCandle.low.toFixed(2)}
              </span>
              <span>
                <strong className="text-muted-foreground font-sans font-semibold">Cierre:</strong>{' '}
                <span className={hoveredCandle.isBullish ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                  ${hoveredCandle.close.toFixed(2)}
                </span>
              </span>
              <span>
                <strong className="text-muted-foreground font-sans font-semibold">Volumen:</strong> {hoveredCandle.volume.toLocaleString()}
              </span>
            </div>

            <Badge variant="outline" className="font-mono text-xs">
              {hoveredCandle.date} 2026
            </Badge>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height + volumeHeight + 20}`}
              className="w-full h-72 select-none overflow-visible"
            >
              {/* Horizontal grid lines for prices */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = height - paddingY - ratio * (height - 2 * paddingY);
                const price = minPrice + ratio * (maxPrice - minPrice);
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
                      ${price.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Candlesticks */}
              {financialCandlesData.map((candle, idx) => {
                const slotWidth = (width - 2 * paddingX) / financialCandlesData.length;
                const candleX = paddingX + idx * slotWidth + slotWidth / 2;
                const candleWidth = Math.min(22, slotWidth * 0.55);

                const priceRange = maxPrice - minPrice;
                const yHigh = height - paddingY - ((candle.high - minPrice) / priceRange) * (height - 2 * paddingY);
                const yLow = height - paddingY - ((candle.low - minPrice) / priceRange) * (height - 2 * paddingY);
                const yOpen = height - paddingY - ((candle.open - minPrice) / priceRange) * (height - 2 * paddingY);
                const yClose = height - paddingY - ((candle.close - minPrice) / priceRange) * (height - 2 * paddingY);

                const isBullish = candle.close >= candle.open;
                const candleColor = isBullish ? '#34C759' : '#FF3B30';

                const rectY = Math.min(yOpen, yClose);
                const rectHeight = Math.max(2, Math.abs(yClose - yOpen));

                // Volume Bar at the bottom
                const volY = height + 15 + volumeHeight - (candle.volume / maxVolume) * volumeHeight;
                const volH = (candle.volume / maxVolume) * volumeHeight;

                const isHovered = hoverIndex === idx;

                return (
                  <g
                    key={candle.id}
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
                      height={height + volumeHeight + 20}
                      fill="transparent"
                    />

                    {/* Wick Line */}
                    <line
                      x1={candleX}
                      y1={yHigh}
                      x2={candleX}
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth="1.5"
                    />

                    {/* Candle Body */}
                    <rect
                      x={candleX - candleWidth / 2}
                      y={rectY}
                      width={candleWidth}
                      height={rectHeight}
                      rx="2"
                      ry="2"
                      fill={candleColor}
                      opacity={isHovered ? 1 : 0.85}
                    />

                    {/* Volume Bar */}
                    <rect
                      x={candleX - candleWidth / 2}
                      y={volY}
                      width={candleWidth}
                      height={volH}
                      rx="2"
                      ry="2"
                      fill={candleColor}
                      opacity={isHovered ? 0.6 : 0.3}
                    />

                    {/* Date label */}
                    <text
                      x={candleX}
                      y={height + volumeHeight + 15}
                      textAnchor="middle"
                      className={cn(
                        'text-[10px] font-mono transition-colors',
                        isHovered ? 'fill-foreground font-bold' : 'fill-muted-foreground'
                      )}
                    >
                      {candle.date}
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

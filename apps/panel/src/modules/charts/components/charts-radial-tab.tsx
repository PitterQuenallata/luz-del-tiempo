import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { appleActivityRings, cloudStorageDonut } from '../data/charts-data';
import { RadialMetricRing, DonutSegment } from '../types/charts.types';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  Activity,
  HardDrive,
  Cpu,
  Layers,
  Server,
  Cloud,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export const ChartsRadialTab: React.FC = () => {
  const { play } = useSound();
  const [selectedDonutId, setSelectedDonutId] = useState<string | null>(null);

  // Concentric Rings calculation
  // Radius for outer (CPU), middle (RAM), inner (Network)
  const ringRadii = [80, 62, 44];
  const ringStroke = 12;

  // Donut total calculation
  const totalStorage = cloudStorageDonut.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apple Activity Concentric Rings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-[10px]">
                Apple Activity Rings
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                SVG Circular Math
              </Badge>
            </div>
            <CardTitle>Anillos Concéntricos de Telemetría (Estilo Apple Watch)</CardTitle>
            <CardDescription>
              Representación radial de alta fidelidad para el uso instantáneo de infraestructura de cómputo, memoria ECC y red perimetral.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
              {/* Concentric Rings SVG */}
              <div className="relative w-52 h-52 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform overflow-visible">
                  {appleActivityRings.map((ring, idx) => {
                    const radius = ringRadii[idx];
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (ring.percentage / 100) * circumference;

                    return (
                      <g key={ring.id}>
                        {/* Background Track */}
                        <circle
                          cx="100"
                          cy="100"
                          r={radius}
                          stroke={ring.bgStrokeColor}
                          strokeWidth={ringStroke}
                          fill="transparent"
                        />
                        {/* Active Progress Ring */}
                        <circle
                          cx="100"
                          cy="100"
                          r={radius}
                          stroke={ring.strokeColor}
                          strokeWidth={ringStroke}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-out"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Central Status Icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Zap className="h-6 w-6 text-foreground/80 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-muted-foreground mt-0.5">
                    SLA 99.99%
                  </span>
                </div>
              </div>

              {/* Rings Legend List */}
              <div className="space-y-3.5 w-full max-w-xs">
                {appleActivityRings.map((ring, idx) => (
                  <div
                    key={ring.id}
                    className="p-3 rounded-2xl bg-muted/20 border border-border/40 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: ring.strokeColor }}
                        />
                        <span className="font-semibold text-foreground">{ring.label}</span>
                      </div>
                      <span className="font-mono tabular-nums font-bold text-foreground">
                        {ring.percentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-4.5">{ring.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donut Storage Segment Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="blue" className="text-[10px]">
                Donut Radial
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                Cuotas Cloud
              </Badge>
            </div>
            <CardTitle>Distribución de Almacenamiento & Bóvedas de Datos</CardTitle>
            <CardDescription>
              Segmentación proporcional de volúmenes persistentes en clústeres multi-regionales con selección interactiva.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
              {/* Donut Chart SVG */}
              <div className="relative w-48 h-48 shrink-0">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 transform">
                  {(() => {
                    const radius = 60;
                    const circumference = 2 * Math.PI * radius;
                    let accumulatedOffset = 0;

                    return cloudStorageDonut.map((seg) => {
                      const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                      const currentOffset = accumulatedOffset;
                      accumulatedOffset += (seg.percentage / 100) * circumference;

                      const isSelected = selectedDonutId === seg.id;

                      return (
                        <circle
                          key={seg.id}
                          cx="80"
                          cy="80"
                          r={radius}
                          stroke={seg.color}
                          strokeWidth={isSelected ? 22 : 18}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={-currentOffset}
                          fill="transparent"
                          onMouseEnter={() => {
                            play('click');
                            setSelectedDonutId(seg.id);
                          }}
                          onMouseLeave={() => setSelectedDonutId(null)}
                          className="cursor-pointer transition-all duration-200"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Donut Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                    {totalStorage.toFixed(1)} TB
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Consumido</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="space-y-2.5 w-full max-w-xs">
                {cloudStorageDonut.map((seg) => {
                  const isSelected = selectedDonutId === seg.id;

                  return (
                    <div
                      key={seg.id}
                      onMouseEnter={() => {
                        play('click');
                        setSelectedDonutId(seg.id);
                      }}
                      onMouseLeave={() => setSelectedDonutId(null)}
                      className={cn(
                        'p-2.5 rounded-xl border transition-all cursor-pointer text-xs',
                        isSelected
                          ? 'bg-muted/40 border-primary shadow-xs'
                          : 'bg-muted/15 border-border/30 hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="font-semibold text-foreground">{seg.label}</span>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-foreground">
                          {seg.value} TB ({seg.percentage}%)
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-4.5">
                        {seg.legendDescription}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

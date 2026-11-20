import React, { useState, useEffect } from 'react';
import { ChartsSubTab } from '../types/charts.types';
import { ChartsAreaTab } from '../components/charts-area-tab';
import { ChartsBarTab } from '../components/charts-bar-tab';
import { ChartsRadialTab } from '../components/charts-radial-tab';
import { ChartsFinancialTab } from '../components/charts-financial-tab';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  TrendingUp,
  BarChart2,
  PieChart,
  CandlestickChart,
} from 'lucide-react';

export const ChartsShowcasePage: React.FC = () => {
  const { play } = useSound();

  const getInitialTab = (): ChartsSubTab => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('tab=bar')) return 'bar';
      if (hash.includes('tab=radial')) return 'radial';
      if (hash.includes('tab=financial')) return 'financial';
      if (hash.includes('tab=area')) return 'area';
    }
    return 'area';
  };

  const [activeTab, setActiveTab] = useState<ChartsSubTab>(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=bar')) {
        setActiveTab('bar');
      } else if (hash.includes('tab=radial')) {
        setActiveTab('radial');
      } else if (hash.includes('tab=financial')) {
        setActiveTab('financial');
      } else if (hash.includes('tab=area')) {
        setActiveTab('area');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const subTabs = [
    {
      id: 'area' as ChartsSubTab,
      label: 'Áreas & Tendencias Spline',
      icon: TrendingUp,
      badge: 'Gradients',
    },
    {
      id: 'bar' as ChartsSubTab,
      label: 'Columnas & Comparativa Anual',
      icon: BarChart2,
      badge: '2026 vs 2025',
    },
    {
      id: 'radial' as ChartsSubTab,
      label: 'Anillos Apple Activity & Donut',
      icon: PieChart,
      badge: 'Fitness UI',
    },
    {
      id: 'financial' as ChartsSubTab,
      label: 'Velas Financieras OHLC',
      icon: CandlestickChart,
      badge: 'Volumen',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Analítica & Gráficos</span>
          <span>/</span>
          <span className="text-foreground">Suite de Gráficos Apple</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Suite de Gráficos & Visualización
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Biblioteca de visualización de datos de alto rendimiento inspirada en Modernize y Apple HIG: curvas spline continuas, columnas comparativas con cuota meta, anillos concéntricos Apple Watch y velas japonesas con histograma de volumen.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="default" className="text-xs font-mono">
              Vector SVG
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              Apple HIG
            </Badge>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border overflow-x-auto no-scrollbar">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                play('tab');
                setActiveTab(tab.id);
                window.location.hash = `#/charts?tab=${tab.id}`;
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.2 rounded-full tabular-nums',
                    isActive
                      ? 'bg-primary text-white font-bold'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'area' && <ChartsAreaTab />}
      {activeTab === 'bar' && <ChartsBarTab />}
      {activeTab === 'radial' && <ChartsRadialTab />}
      {activeTab === 'financial' && <ChartsFinancialTab />}
    </div>
  );
};
export default ChartsShowcasePage;

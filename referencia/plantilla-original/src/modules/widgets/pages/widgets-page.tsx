import React, { useState, useEffect } from 'react';
import { WidgetsTab } from '../types/widgets.types';
import { WidgetsCardsTab } from '../components/widgets-cards-tab';
import { WidgetsChartsTab } from '../components/widgets-charts-tab';
import { WidgetsBannersTab } from '../components/widgets-banners-tab';
import { WidgetsActivityTab } from '../components/widgets-activity-tab';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  LayoutGrid,
  CreditCard,
  BarChart2,
  BellRing,
  Radio,
} from 'lucide-react';

export const WidgetsPage: React.FC = () => {
  const { play } = useSound();

  const getInitialTab = (): WidgetsTab => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('tab=charts')) return 'charts';
      if (hash.includes('tab=banners')) return 'banners';
      if (hash.includes('tab=activity')) return 'activity';
      if (hash.includes('tab=cards')) return 'cards';
    }
    return 'cards';
  };

  const [activeTab, setActiveTab] = useState<WidgetsTab>(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=charts')) {
        setActiveTab('charts');
      } else if (hash.includes('tab=banners')) {
        setActiveTab('banners');
      } else if (hash.includes('tab=activity')) {
        setActiveTab('activity');
      } else if (hash.includes('tab=cards')) {
        setActiveTab('cards');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const subTabs = [
    {
      id: 'cards' as WidgetsTab,
      label: 'Tarjetas & Operaciones',
      icon: CreditCard,
      badge: 'Nodos',
    },
    {
      id: 'charts' as WidgetsTab,
      label: 'Gráficos & Cómputo',
      icon: BarChart2,
      badge: 'Sparklines',
    },
    {
      id: 'banners' as WidgetsTab,
      label: 'Banners de Estado',
      icon: BellRing,
      badge: 'SLA 99.9%',
    },
    {
      id: 'activity' as WidgetsTab,
      label: 'Live Activities & CI/CD',
      icon: Radio,
      badge: 'Apple Island',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Componentes & Widgets</span>
          <span>/</span>
          <span className="text-foreground">Widgets Hub & Telemetría</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Widgets & Analítica de Sistema
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Biblioteca de componentes operacionales, métricas de infraestructura en tiempo real, banners de estado de alta disponibilidad y widgets interactivos tipo Apple Live Activity.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="default" className="text-xs font-mono">
              Live Activity
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
                window.location.hash = `#/widgets?tab=${tab.id}`;
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

      {/* Active Tab View */}
      {activeTab === 'cards' && <WidgetsCardsTab />}
      {activeTab === 'charts' && <WidgetsChartsTab />}
      {activeTab === 'banners' && <WidgetsBannersTab />}
      {activeTab === 'activity' && <WidgetsActivityTab />}
    </div>
  );
};
export default WidgetsPage;

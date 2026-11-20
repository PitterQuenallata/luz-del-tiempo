import React, { useState, useEffect } from 'react';
import { ComponentsSubTab } from '../types/components.types';
import { ComponentsButtonsTab } from '../components/components-buttons-tab';
import { ComponentsIndicatorsTab } from '../components/components-indicators-tab';
import { ComponentsFeedbackTab } from '../components/components-feedback-tab';
import { ComponentsSurfacesTab } from '../components/components-surfaces-tab';
import { ComponentsIconsTab } from '../components/components-icons-tab';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  Sparkles,
  MousePointerClick,
  Sliders,
  BellRing,
  Layers,
} from 'lucide-react';

export const ComponentsShowcasePage: React.FC = () => {
  const { play } = useSound();

  const getInitialTab = (): ComponentsSubTab => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('tab=icons')) return 'icons';
      if (hash.includes('tab=indicators')) return 'indicators';
      if (hash.includes('tab=feedback')) return 'feedback';
      if (hash.includes('tab=surfaces')) return 'surfaces';
      if (hash.includes('tab=buttons')) return 'buttons';
    }
    return 'buttons';
  };

  const [activeTab, setActiveTab] = useState<ComponentsSubTab>(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=icons')) {
        setActiveTab('icons');
      } else if (hash.includes('tab=indicators')) {
        setActiveTab('indicators');
      } else if (hash.includes('tab=feedback')) {
        setActiveTab('feedback');
      } else if (hash.includes('tab=surfaces')) {
        setActiveTab('surfaces');
      } else if (hash.includes('tab=buttons')) {
        setActiveTab('buttons');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const subTabs = [
    {
      id: 'buttons' as ComponentsSubTab,
      label: 'Botones & Sintetizador',
      icon: MousePointerClick,
      badge: 'Háptico',
    },
    {
      id: 'indicators' as ComponentsSubTab,
      label: 'Indicadores & Spinners',
      icon: Sliders,
      badge: 'Progreso',
    },
    {
      id: 'feedback' as ComponentsSubTab,
      label: 'Feedback & Acordeones',
      icon: Layers,
      badge: 'Acordeón',
    },
    {
      id: 'surfaces' as ComponentsSubTab,
      label: 'Superficies & Liquid Glass',
      icon: Layers,
      badge: 'Rare UI',
    },
    {
      id: 'icons' as ComponentsSubTab,
      label: 'Iconos Animados & Morfismo',
      icon: Sparkles,
      badge: 'Morph',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Componentes & Primitivas</span>
          <span>/</span>
          <span className="text-foreground">UI Kit Apple HIG</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Catálogo de Componentes UI
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Biblioteca completa de primitivas de interfaz conforme a Apple Human Interface Guidelines: feedback háptico con Web Audio API, spinners vectoriales sin saltos, acordeones fluidos y navegación dinámica con Rare UI.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="default" className="text-xs font-mono">
              Apple HIG
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              Zero Emojis
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
                window.location.hash = `#/components?tab=${tab.id}`;
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
      {activeTab === 'buttons' && <ComponentsButtonsTab />}
      {activeTab === 'indicators' && <ComponentsIndicatorsTab />}
      {activeTab === 'feedback' && <ComponentsFeedbackTab />}
      {activeTab === 'surfaces' && <ComponentsSurfacesTab />}
      {activeTab === 'icons' && <ComponentsIconsTab />}
    </div>
  );
};
export default ComponentsShowcasePage;

import React, { useState, useEffect } from 'react';
import { FormsSubTab } from '../types/forms.types';
import { FormsLayoutsTab } from '../components/forms-layouts-tab';
import { FormsElementsTab } from '../components/forms-elements-tab';
import { FormsWizardTab } from '../components/forms-wizard-tab';
import { FormsValidationTab } from '../components/forms-validation-tab';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  LayoutTemplate,
  SlidersHorizontal,
  Route,
  ShieldCheck,
} from 'lucide-react';

export const FormsShowcasePage: React.FC = () => {
  const { play } = useSound();

  const getInitialTab = (): FormsSubTab => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('tab=elements')) return 'elements';
      if (hash.includes('tab=wizard')) return 'wizard';
      if (hash.includes('tab=validation')) return 'validation';
      if (hash.includes('tab=layouts')) return 'layouts';
    }
    return 'layouts';
  };

  const [activeTab, setActiveTab] = useState<FormsSubTab>(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=elements')) {
        setActiveTab('elements');
      } else if (hash.includes('tab=wizard')) {
        setActiveTab('wizard');
      } else if (hash.includes('tab=validation')) {
        setActiveTab('validation');
      } else if (hash.includes('tab=layouts')) {
        setActiveTab('layouts');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const subTabs = [
    {
      id: 'layouts' as FormsSubTab,
      label: 'Diseños de Formulario',
      icon: LayoutTemplate,
      badge: 'Modernize',
    },
    {
      id: 'elements' as FormsSubTab,
      label: 'Controles & Elementos',
      icon: SlidersHorizontal,
      badge: 'Inputs',
    },
    {
      id: 'wizard' as FormsSubTab,
      label: 'Asistente Multi-Paso',
      icon: Route,
      badge: '4 Pasos',
    },
    {
      id: 'validation' as FormsSubTab,
      label: 'Validación TanStack Form',
      icon: ShieldCheck,
      badge: 'Zod Core',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Componentes & Formularios</span>
          <span>/</span>
          <span className="text-foreground">Suite de Formularios</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Suite de Formularios & Entradas
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Estructura integral inspirada en la plantilla Modernize: maquetación en una y dos columnas, grupos de entrada con prefijos y sufijos, asistente de onboarding multi-paso y validación estricta con TanStack Form y Zod.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="default" className="text-xs font-mono">
              TanStack Form
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
                window.location.hash = `#/forms?tab=${tab.id}`;
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
      {activeTab === 'layouts' && <FormsLayoutsTab />}
      {activeTab === 'elements' && <FormsElementsTab />}
      {activeTab === 'wizard' && <FormsWizardTab />}
      {activeTab === 'validation' && <FormsValidationTab />}
    </div>
  );
};

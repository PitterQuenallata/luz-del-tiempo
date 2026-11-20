import React, { useState, useEffect } from 'react';
import { TablesSubTab } from '../types/tables.types';
import { TablesBasicTab } from '../components/tables-basic-tab';
import { TablesDataTableTab } from '../components/tables-datatable-tab';
import { TablesExpandableTab } from '../components/tables-expandable-tab';
import { TablesEditableTab } from '../components/tables-editable-tab';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';
import {
  TableProperties,
  Database,
  Rows3,
  FileSpreadsheet,
} from 'lucide-react';

export const TablesShowcasePage: React.FC = () => {
  const { play } = useSound();

  const getInitialTab = (): TablesSubTab => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('tab=datatable')) return 'datatable';
      if (hash.includes('tab=expandable')) return 'expandable';
      if (hash.includes('tab=editable')) return 'editable';
      if (hash.includes('tab=basic')) return 'basic';
    }
    return 'datatable';
  };

  const [activeTab, setActiveTab] = useState<TablesSubTab>(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=datatable')) {
        setActiveTab('datatable');
      } else if (hash.includes('tab=expandable')) {
        setActiveTab('expandable');
      } else if (hash.includes('tab=editable')) {
        setActiveTab('editable');
      } else if (hash.includes('tab=basic')) {
        setActiveTab('basic');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const subTabs = [
    {
      id: 'datatable' as TablesSubTab,
      label: 'TanStack Data Table',
      icon: Database,
      badge: 'v8 Core',
    },
    {
      id: 'basic' as TablesSubTab,
      label: 'Tablas Estándar & Telemetría',
      icon: TableProperties,
      badge: 'HIG',
    },
    {
      id: 'expandable' as TablesSubTab,
      label: 'Filas Expandibles',
      icon: Rows3,
      badge: 'Facturas',
    },
    {
      id: 'editable' as TablesSubTab,
      label: 'Edición en Línea',
      icon: FileSpreadsheet,
      badge: 'Reactivo',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Componentes & Datos</span>
          <span>/</span>
          <span className="text-foreground">Suite de Data Tables</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Suite de Tablas & Data Tables
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Colección completa de tablas de datos empresariales inspirada en la arquitectura Modernize y Apple HIG: ordenamiento multidireccional, filtros globales, operaciones en lote, sub-filas expandibles y edición en línea reactiva.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="default" className="text-xs font-mono">
              TanStack Table v8
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              Tabular-Nums
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
                window.location.hash = `#/tables?tab=${tab.id}`;
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
      {activeTab === 'datatable' && <TablesDataTableTab />}
      {activeTab === 'basic' && <TablesBasicTab />}
      {activeTab === 'expandable' && <TablesExpandableTab />}
      {activeTab === 'editable' && <TablesEditableTab />}
    </div>
  );
};

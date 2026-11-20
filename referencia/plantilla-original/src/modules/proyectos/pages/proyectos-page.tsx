import React, { useState } from 'react';
import {
  FolderKanban,
  Calendar,
  FileText,
} from 'lucide-react';
import { initialTasks } from '../data/proyectos-data';
import { KanbanTask } from '../types/proyectos.types';
import { ProyectosKanbanTab } from '../components/proyectos-kanban-tab';
import { ProyectosCalendarTab } from '../components/proyectos-calendar-tab';
import { ProyectosNotesTab } from '../components/proyectos-notes-tab';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

export type ProyectosSubTab = 'kanban' | 'calendar' | 'notes';

export const ProyectosPage: React.FC = () => {
  const { play } = useSound();
  const [activeTab, setActiveTab] = useState<ProyectosSubTab>('kanban');
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);

  const subTabs: {
    id: ProyectosSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'kanban', label: 'Tablero Kanban', icon: FolderKanban, badge: String(tasks.length) },
    { id: 'calendar', label: 'Calendario & Sprints', icon: Calendar },
    { id: 'notes', label: 'Notas & Documentación', icon: FileText },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Espacio de Trabajo</span>
          <span>/</span>
          <span className="text-foreground">Proyectos & Flujo Ágil</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Tablero Ágil, Sprints & Documentación
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Estructura integral adaptada de la plantilla Modernize: gestión ágil de tareas con columnas de flujo continuo, calendario interactivo de hitos y bloc de notas con categorías.
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border overflow-x-auto">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                play('tab');
                setActiveTab(tab.id as ProyectosSubTab);
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

      {/* SUB-TAB CONTENTS */}
      {activeTab === 'kanban' && (
        <ProyectosKanbanTab tasks={tasks} onUpdateTasks={setTasks} />
      )}

      {activeTab === 'calendar' && (
        <ProyectosCalendarTab />
      )}

      {activeTab === 'notes' && (
        <ProyectosNotesTab />
      )}
    </div>
  );
};

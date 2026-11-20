import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Calendar,
  MessageSquare,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { KanbanTask, KanbanColumn, PriorityLevel } from '../types/proyectos.types';
import { kanbanColumns, initialAssignees } from '../data/proyectos-data';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface ProyectosKanbanTabProps {
  tasks: KanbanTask[];
  onUpdateTasks: (tasks: KanbanTask[]) => void;
}

export const ProyectosKanbanTab: React.FC<ProyectosKanbanTabProps> = ({
  tasks,
  onUpdateTasks,
}) => {
  const { play } = useSound();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // New Task Modal State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<KanbanTask['columnId']>('todo');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('Media');
  const [newCategory, setNewCategory] = useState('Ingeniería');
  const [newDueDate, setNewDueDate] = useState('06 Nov 2026');

  // Task Details Modal State
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());

      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchAssignee =
        assigneeFilter === 'all' || t.assignees.some((a) => a.id === assigneeFilter);

      return matchSearch && matchPriority && matchAssignee;
    });
  }, [tasks, search, priorityFilter, assigneeFilter]);

  // Metrics
  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter((t) => t.columnId === 'in_progress').length;
  const inReviewCount = tasks.filter((t) => t.columnId === 'review').length;
  const completedCount = tasks.filter((t) => t.columnId === 'done').length;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      play('alert');
      pillToast.error('Título Obligatorio', 'Debes ingresar un nombre descriptivo para la tarea.');
      return;
    }

    const created: KanbanTask = {
      id: `TSK-${Math.floor(200 + Math.random() * 800)}`,
      title: newTitle,
      description: newDesc || 'Sin descripción adicional.',
      columnId: targetColumnId,
      priority: newPriority,
      category: newCategory,
      assignees: [initialAssignees[0]],
      dueDate: newDueDate,
      subtasks: [
        { id: `sub-${Date.now()}-1`, title: 'Fase inicial de definición', completed: false },
        { id: `sub-${Date.now()}-2`, title: 'Implementación y verificación técnica', completed: false },
      ],
      commentsCount: 0,
      attachmentsCount: 0,
    };

    onUpdateTasks([created, ...tasks]);
    setIsNewTaskModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    play('success');
    pillToast.success('Tarea Creada con Éxito', `"${created.title}" se agregó al tablero.`);
  };

  const handleMoveTask = (taskId: string, direction: 'forward' | 'backward') => {
    const columnOrder: KanbanTask['columnId'][] = ['todo', 'in_progress', 'review', 'done'];
    onUpdateTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const currentIndex = columnOrder.indexOf(t.columnId);
          const nextIndex =
            direction === 'forward'
              ? Math.min(columnOrder.length - 1, currentIndex + 1)
              : Math.max(0, currentIndex - 1);
          play(direction === 'forward' ? 'pop' : 'click');
          return { ...t, columnId: columnOrder[nextIndex] };
        }
        return t;
      })
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    onUpdateTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          play('pop');
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              subtasks: prev.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : null
      );
    }
  };

  const handleDeleteTask = (taskId: string) => {
    play('alert');
    onUpdateTasks(tasks.filter((t) => t.id !== taskId));
    setSelectedTask(null);
    pillToast.info('Tarea Eliminada', 'Se retiró la tarjeta del tablero.');
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Urgente':
        return (
          <Badge variant="outline" className="text-[10px] font-mono bg-red-500/10 text-red-500 border-red-500/20">
            Urgente
          </Badge>
        );
      case 'Alta':
        return (
          <Badge variant="outline" className="text-[10px] font-mono bg-orange-500/10 text-orange-500 border-orange-500/20">
            Alta
          </Badge>
        );
      case 'Media':
        return (
          <Badge variant="outline" className="text-[10px] font-mono bg-blue-500/10 text-blue-500 border-blue-500/20">
            Media
          </Badge>
        );
      case 'Baja':
      default:
        return (
          <Badge variant="secondary" className="text-[10px] font-mono">
            Baja
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Agile Progress Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Total de Tareas</span>
            <div className="font-mono text-2xl font-bold text-foreground tabular-nums">{totalTasks}</div>
            <span className="text-[11px] text-muted-foreground font-mono">En sprint activo</span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">En Desarrollo Activo</span>
            <div className="font-mono text-2xl font-bold text-blue-500 tabular-nums">{inProgressCount}</div>
            <span className="text-[11px] text-blue-500/80 font-mono">WIP en curso</span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Revisión & QA</span>
            <div className="font-mono text-2xl font-bold text-amber-500 tabular-nums">{inReviewCount}</div>
            <span className="text-[11px] text-amber-500/80 font-mono">Esperando aprobación</span>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Completadas & Deploy</span>
            <div className="font-mono text-2xl font-bold text-emerald-500 tabular-nums">{completedCount}</div>
            <span className="text-[11px] text-emerald-500/80 font-mono">
              {totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}% de avance global
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, descripción o etiqueta de proyecto..."
            className="pl-9 text-xs h-9 bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              play('click');
              setPriorityFilter(e.target.value);
            }}
            className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => {
              play('click');
              setAssigneeFilter(e.target.value);
            }}
            className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
          >
            <option value="all">Todos los Responsables</option>
            {initialAssignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.role})
              </option>
            ))}
          </select>

          <Button
            variant="default"
            size="sm"
            soundType="pop"
            onClick={() => {
              play('pop');
              setTargetColumnId('todo');
              setIsNewTaskModalOpen(true);
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {kanbanColumns.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.columnId === col.id);
          return (
            <div
              key={col.id}
              className="flex flex-col space-y-3.5 p-3 rounded-2xl bg-secondary/30 border border-border/70 min-h-[520px]"
            >
              {/* Column Header (Pure Typography, Zero Icons) */}
              <div className="flex items-center justify-between px-1.5 py-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-foreground tracking-tight">
                    {col.title}
                  </h3>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground font-bold tabular-nums">
                    {columnTasks.length}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="iconSm"
                  soundType="pop"
                  onClick={() => {
                    play('pop');
                    setTargetColumnId(col.id);
                    setIsNewTaskModalOpen(true);
                  }}
                  title="Añadir tarea a esta columna"
                  className="h-6 w-6"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1">
                {columnTasks.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-border/80 flex items-center justify-center p-4 text-center">
                    <span className="text-[11px] text-muted-foreground">
                      No hay tareas en esta fase
                    </span>
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
                    const progressPercent =
                      task.subtasks.length > 0
                        ? Math.round((completedSubtasks / task.subtasks.length) * 100)
                        : 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          play('click');
                          setSelectedTask(task);
                        }}
                        className="group p-4 rounded-xl border border-border bg-card hover:border-foreground/25 hover:shadow-xs transition-all duration-200 cursor-pointer space-y-3"
                      >
                        {/* Top: Category Tag & Priority Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">
                            {task.category}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Progress Bar for Subtasks */}
                        {task.subtasks.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                              <span>Progreso</span>
                              <span className="tabular-nums">
                                {completedSubtasks}/{task.subtasks.length} ({progressPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-300',
                                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-primary'
                                )}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Footer: Assignees & Move Controls */}
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                          {/* Assignee Avatar Stack */}
                          <div className="flex items-center -space-x-1.5">
                            {task.assignees.map((a) => (
                              <img
                                key={a.id}
                                src={a.avatar}
                                alt={a.name}
                                title={`${a.name} - ${a.role}`}
                                className="h-6 w-6 rounded-full object-cover border-2 border-card shrink-0"
                              />
                            ))}
                          </div>

                          {/* Quick Column Shift Buttons */}
                          <div
                            className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {col.id !== 'todo' && (
                              <button
                                type="button"
                                onClick={() => handleMoveTask(task.id, 'backward')}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                                title="Mover a fase previa"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                            )}

                            {col.id !== 'done' && (
                              <button
                                type="button"
                                onClick={() => handleMoveTask(task.id, 'forward')}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                                title="Mover a siguiente fase"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg border-border shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Crear Tarea de Proyecto</CardTitle>
                  <CardDescription className="text-xs">
                    Define los objetivos técnicos, prioridad y fase en el tablero
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>

            <form onSubmit={handleCreateTask}>
              <CardContent className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-medium text-foreground block mb-1.5">Título de la Tarea *</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="ej. Refactorización de queries en TanStack"
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1.5">Descripción Detallada</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe los criterios de aceptación y dependencias técnicas..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-hidden leading-relaxed resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Fase Inicial</label>
                    <select
                      value={targetColumnId}
                      onChange={(e) => setTargetColumnId(e.target.value as any)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                    >
                      <option value="todo">Por Hacer</option>
                      <option value="in_progress">En Desarrollo</option>
                      <option value="review">Revisión & QA</option>
                      <option value="done">Completado</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Prioridad</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                    >
                      <option value="Urgente">Urgente</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Categoría</label>
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1.5">Fecha de Entrega Estimada</label>
                  <Input
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-border/50 flex items-center justify-end gap-2 bg-secondary/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  soundType="click"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  soundType="success"
                  className="text-xs gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Crear Tarea
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-xl border-border shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-0.5">
                    {selectedTask.category} • {selectedTask.id}
                  </span>
                  <CardTitle className="text-base font-bold">{selectedTask.title}</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                {selectedTask.description}
              </p>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-mono">Prioridad</span>
                  <div className="mt-0.5">{getPriorityBadge(selectedTask.priority)}</div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-mono">Vencimiento</span>
                  <span className="font-mono text-foreground font-semibold">{selectedTask.dueDate}</span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-mono">Fase Actual</span>
                  <span className="font-semibold text-primary capitalize">
                    {kanbanColumns.find((c) => c.id === selectedTask.columnId)?.title.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Subtasks Checklist */}
              {selectedTask.subtasks.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-foreground block">
                    Checklist de Verificación ({selectedTask.subtasks.filter((s) => s.completed).length}/
                    {selectedTask.subtasks.length})
                  </span>
                  <div className="space-y-1.5 divide-y divide-border/40">
                    {selectedTask.subtasks.map((st) => (
                      <label
                        key={st.id}
                        className="flex items-center gap-2.5 pt-1.5 cursor-pointer hover:text-foreground transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleToggleSubtask(selectedTask.id, st.id)}
                          className="h-4 w-4 accent-primary rounded-sm"
                        />
                        <span
                          className={cn(
                            'text-xs transition-all',
                            st.completed ? 'text-muted-foreground line-through' : 'text-foreground font-medium'
                          )}
                        >
                          {st.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignees */}
              <div>
                <span className="font-semibold text-foreground block mb-2">Miembros Asignados:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.assignees.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-secondary/20"
                    >
                      <img src={a.avatar} alt={a.name} className="h-6 w-6 rounded-full object-cover" />
                      <div>
                        <span className="font-semibold text-foreground text-[11px] block">{a.name}</span>
                        <span className="text-[9px] text-muted-foreground">{a.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <div className="p-4 border-t border-border/50 flex items-center justify-between bg-secondary/20">
              <Button
                variant="ghost"
                size="sm"
                soundType="alert"
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="text-xs text-muted-foreground hover:text-red-500 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar Tarea
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                  className="text-xs"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

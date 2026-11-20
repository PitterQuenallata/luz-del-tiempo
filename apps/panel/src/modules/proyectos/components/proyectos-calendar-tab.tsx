import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  X,
  Check,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { CalendarEvent, EventCategory } from '../types/proyectos.types';
import { initialCalendarEvents } from '../data/proyectos-data';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export const ProyectosCalendarTab: React.FC = () => {
  const { play } = useSound();
  const [events, setEvents] = useState<CalendarEvent[]>(initialCalendarEvents);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-29');

  // New Event Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-10-30');
  const [newTime, setNewTime] = useState('14:00 - 15:30');
  const [newCategory, setNewCategory] = useState<EventCategory>('Engineering');
  const [newLocation, setNewLocation] = useState('Sala Virtual A-1');
  const [newDesc, setNewDesc] = useState('');

  // Fixed 2026-10 / 2026-11 Calendar Month Grid (October 2026 has 31 days, starts on Thursday)
  const daysInOctober = 31;
  const startDayOffset = 3; // Thursday (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun)

  const calendarDays = useMemoDays(daysInOctober, startDayOffset);

  function useMemoDays(totalDays: number, offset: number) {
    const days = [];
    for (let i = 0; i < offset; i++) {
      days.push({ dayNumber: null, dateStr: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `2026-10-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr });
    }
    // Fill trailing blanks to complete 35 cells
    while (days.length % 7 !== 0) {
      days.push({ dayNumber: null, dateStr: null });
    }
    return days;
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      play('alert');
      pillToast.error('Título Obligatorio', 'Debes ingresar un nombre para el evento.');
      return;
    }

    const created: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle,
      date: newDate,
      time: newTime,
      category: newCategory,
      location: newLocation,
      description: newDesc || 'Sin descripción adicional.',
      attendeesCount: 4,
    };

    setEvents([...events, created]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    play('success');
    pillToast.success('Evento Agendado', `"${created.title}" se agregó al calendario.`);
  };

  const getCategoryColor = (cat: EventCategory) => {
    switch (cat) {
      case 'Engineering':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Design':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'Business':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Release':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const selectedDateEvents = events.filter((e) => e.date === selectedDate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Interactive Calendar Grid */}
        <Card className="lg:col-span-8 border-border">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold">Octubre 2026</CardTitle>
                <CardDescription className="text-xs">
                  Sprints activos, reuniones de ingeniería y fechas límite de despliegue
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  soundType="click"
                  onClick={() => {
                    play('click');
                    setSelectedDate('2026-10-28');
                  }}
                  className="text-xs font-mono"
                >
                  Hoy
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  soundType="pop"
                  onClick={() => {
                    play('pop');
                    setIsModalOpen(true);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nuevo Evento
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-muted-foreground pb-2 border-b border-border/40">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {calendarDays.map((cell, idx) => {
                if (!cell.dayNumber || !cell.dateStr) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[85px] sm:min-h-[105px] rounded-xl bg-secondary/10 opacity-30"
                    />
                  );
                }

                const isToday = cell.dateStr === '2026-10-28';
                const isSelected = cell.dateStr === selectedDate;
                const dayEvents = events.filter((e) => e.date === cell.dateStr);

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => {
                      play('click');
                      setSelectedDate(cell.dateStr!);
                    }}
                    className={cn(
                      'min-h-[85px] sm:min-h-[105px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border/60 hover:border-foreground/20 hover:bg-muted/30 bg-card/40'
                    )}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'font-mono text-xs tabular-nums',
                          isToday
                            ? 'h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center'
                            : isSelected
                            ? 'font-bold text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {cell.dayNumber}
                      </span>
                    </div>

                    {/* Event Pill Chips */}
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={cn(
                            'text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md border truncate leading-tight',
                            getCategoryColor(ev.category)
                          )}
                          title={`${ev.time} - ${ev.title}`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] font-mono text-muted-foreground block text-right">
                          +{dayEvents.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column (4 cols): Selected Day Schedule */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Agenda del Día</CardTitle>
                  <CardDescription className="text-xs font-mono">{selectedDate}</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'Evento' : 'Eventos'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {selectedDateEvents.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <span className="text-xs text-muted-foreground block">
                    No hay compromisos agendados para esta fecha.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    soundType="pop"
                    onClick={() => {
                      setNewDate(selectedDate);
                      setIsModalOpen(true);
                    }}
                    className="text-xs mt-2"
                  >
                    Agendar en este día
                  </Button>
                </div>
              ) : (
                selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-border bg-card/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase',
                          getCategoryColor(ev.category)
                        )}
                      >
                        {ev.category}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                        {ev.time}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-foreground leading-snug">{ev.title}</h4>

                    {ev.description && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {ev.description}
                      </p>
                    )}

                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Category Legend Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Tipología de Eventos</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Engineering & Sprints</span>
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Design & Usability</span>
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Business & Finance</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Releases & Deploy</span>
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg border-border shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Agendar Nuevo Evento</CardTitle>
                  <CardDescription className="text-xs">
                    Programa hitos de sprint, reuniones y ventanas de mantenimiento
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateEvent}>
              <CardContent className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-medium text-foreground block mb-1.5">Nombre del Evento *</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="ej. Sprint Review & Demo de Funcionalidad"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Fecha (YYYY-MM-DD)</label>
                    <Input
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Rango Horario</label>
                    <Input
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder="ej. 10:00 - 11:30"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Categoría</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Business">Business</option>
                      <option value="Release">Release</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Ubicación / Sala</label>
                    <Input
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="ej. Google Meet A-1"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1.5">Descripción de la Sesión</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Objetivo principal, temario y asistentes convocados..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-hidden leading-relaxed resize-none"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-border/50 flex items-center justify-end gap-2 bg-secondary/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  soundType="click"
                  onClick={() => setIsModalOpen(false)}
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
                  Confirmar Evento
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

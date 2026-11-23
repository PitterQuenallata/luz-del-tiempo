import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { AGENDA_TIPO_ETIQUETA } from '@luz/shared';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { useActividades } from '../../gestion/hooks/use-gestion';
import { irA } from '../../gestion/lib/navegar';

// Calendario de la agenda. Cada actividad se muestra de su primera a su última fecha.
// Dorado = publicada; gris = borrador o cancelada. Clic: abre su página de edición.
export const CalendarioActividades: React.FC = () => {
  const { data, isLoading, error } = useActividades();

  const eventos = useMemo(
    () =>
      (data ?? [])
        .filter((a) => a.primeraFecha)
        .map((a) => {
          const publicada = a.status === 'publicada';
          return {
            id: a.id,
            title: a.title,
            start: a.primeraFecha as string,
            end: a.ultimaFecha ?? undefined,
            backgroundColor: publicada ? '#e2a927' : '#64748b',
            borderColor: publicada ? '#e2a927' : '#64748b',
            textColor: '#0b1324',
            extendedProps: { tipo: AGENDA_TIPO_ETIQUETA[a.kind as keyof typeof AGENDA_TIPO_ETIQUETA] ?? a.kind },
          };
        }),
    [data],
  );

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">Dorado = publicada · Gris = borrador o cancelada. Clic en una actividad para editarla.</p>
      <Card className="border-border">
        <CardContent className="p-4 sm:p-5 text-xs">
          {error ? (
            <p className="text-red-400">No se pudo cargar el calendario.</p>
          ) : isLoading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
              locale={esLocale}
              firstDay={1}
              initialView="dayGridMonth"
              height="auto"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }}
              buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', list: 'Lista' }}
              events={eventos}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              eventClick={(info) => {
                info.jsEvent.preventDefault();
                irA(`/agenda/${info.event.id}`);
              }}
              eventDidMount={(info) => {
                info.el.title = `${info.event.title} · ${info.event.extendedProps.tipo}`;
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

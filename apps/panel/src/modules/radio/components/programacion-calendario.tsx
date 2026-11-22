import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { ApiEmisora, useProgramasTodos } from './programacion-datos';
import { RELLENO_ETIQUETA } from '@luz/shared';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { irA } from '../../gestion/lib/navegar';

const toMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const aHora = (m: number) => (m >= 1440 ? '23:59' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);

// Huecos de un día sin programa (en minutos desde medianoche)
function huecosDelDia(franjas: { inicio: number; fin: number }[]): [number, number][] {
  const orden = [...franjas].sort((a, b) => a.inicio - b.inicio);
  const huecos: [number, number][] = [];
  let cursor = 0;
  for (const f of orden) {
    if (f.inicio > cursor) huecos.push([cursor, f.inicio]);
    cursor = Math.max(cursor, f.fin);
  }
  if (cursor < 1440) huecos.push([cursor, 1440]);
  return huecos;
}

// Horario semanal de UNA emisora. En dorado lo que va en vivo, en gris lo grabado o automático,
// y en tenue el relleno. Clic en una hora libre: agregar horario. Clic en un programa: editarlo.
export const ProgramacionCalendario: React.FC<{
  emisora: ApiEmisora | undefined;
  onHorarioLibre: (sel: { dayOfWeek: number; startTime: string; endTime: string }) => void;
}> = ({ emisora, onHorarioLibre }) => {
  const { data: programas = [] } = useProgramasTodos(emisora?.id ?? null);

  const eventos = useMemo(() => {
    if (!emisora) return [];
    const lista: Record<string, unknown>[] = [];
    for (const p of programas) {
      if (!p.isActive) continue;
      for (const f of p.franjas) {
        lista.push({
          id: f.id,
          title: `${p.name}${p.hostName ? ` · ${p.hostName}` : ''}`,
          daysOfWeek: [f.dayOfWeek],
          startTime: f.startTime.slice(0, 5),
          endTime: f.endTime.slice(0, 5) === '00:00' ? '23:59' : f.endTime.slice(0, 5),
          backgroundColor: f.isLive ? '#e2a927' : '#334155',
          borderColor: f.isLive ? '#e2a927' : '#475569',
          textColor: f.isLive ? '#0b1324' : '#f1f5f9',
          extendedProps: { hora: `${f.startTime.slice(0, 5)}–${f.endTime.slice(0, 5)}`, programaId: p.id, relleno: false },
        });
      }
    }
    if (emisora.relleno !== 'ninguno') {
      const etiqueta = RELLENO_ETIQUETA[emisora.relleno];
      for (let dia = 0; dia < 7; dia++) {
        const franjasDia = programas.flatMap((p) => p.franjas.filter((f) => f.dayOfWeek === dia).map((f) => ({ inicio: toMin(f.startTime), fin: toMin(f.endTime) })));
        for (const [ini, fin] of huecosDelDia(franjasDia)) {
          lista.push({
            id: `relleno-${dia}-${ini}`,
            title: etiqueta,
            daysOfWeek: [dia],
            startTime: aHora(ini),
            endTime: aHora(fin),
            display: 'background',
            backgroundColor: 'rgba(148, 163, 184, 0.10)',
            extendedProps: { relleno: true },
          });
        }
      }
    }
    return lista;
  }, [emisora, programas]);

  return (
    <div className="programacion-fc text-xs">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        locale={esLocale}
        firstDay={1}
        initialView="timeGridWeek"
        headerToolbar={false}
        allDaySlot={false}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="01:00:00"
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        scrollTime="06:00:00"
        height={900}
        events={eventos}
        eventOverlap={false}
        eventMinHeight={34}
        eventContent={(info) => {
          if (info.event.extendedProps.relleno) return <div className="px-1 text-[10px] italic text-slate-400">{info.event.title}</div>;
          return (
            <div className="flex h-full flex-col gap-0.5 overflow-hidden px-1.5 py-1 leading-tight">
              <span className="font-semibold">{info.event.title}</span>
              <span className="opacity-70">{info.event.extendedProps.hora}</span>
            </div>
          );
        }}
        dateClick={(info) => {
          if (!emisora) return;
          const pad = (n: number) => String(n).padStart(2, '0');
          const hora = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          const fin = new Date(info.date.getTime() + 60 * 60 * 1000);
          if (programas.length === 0) {
            pillToast.info('Crea un programa primero', 'Un horario pertenece a un programa.');
            return;
          }
          onHorarioLibre({ dayOfWeek: info.date.getDay(), startTime: hora(info.date), endTime: hora(fin) });
        }}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          if (info.event.extendedProps.relleno || !emisora) return;
          irA(`/emisoras/${emisora.id}/programas/${info.event.extendedProps.programaId}`);
        }}
      />
    </div>
  );
};

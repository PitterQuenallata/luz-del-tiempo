import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/modal';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiHorarioPlaylist, ApiPlaylist, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { cn } from '../../../shared/lib/utils';

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type Horario = ApiHorarioPlaylist;

// Programar una lista: sin horarios suena en la rotación; con horarios, solo suena en esas horas.
export const ProgramarListaDialog: React.FC<{ isOpen: boolean; onClose: () => void; lista: ApiPlaylist | null }> = ({ isOpen, onClose, lista }) => {
  const [programada, setProgramada] = useState(false);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [interrumpe, setInterrumpe] = useState(true);
  const [unaSola, setUnaSola] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre, parte de lo guardado
  useEffect(() => {
    if (!isOpen || !lista) return;
    setProgramada(lista.mode === 'programada');
    setHorarios(lista.schedules.length ? lista.schedules : [{ dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }]);
    setInterrumpe(lista.interrumpe);
    setUnaSola(lista.unaSola);
    setError(null);
  }, [isOpen, lista]);

  const guardar = useMutacionGestion(
    (input: { id: string; programada: boolean; horarios: Horario[]; interrumpe: boolean; unaSola: boolean }) => luzApi.guardarHorarios(input.id, input),
    'Programación guardada',
    'No se pudo guardar la programación',
  );

  const cambiarHorario = (i: number, cambios: Partial<Horario>) => setHorarios(horarios.map((h, j) => (j === i ? { ...h, ...cambios } : h)));

  const confirmar = async () => {
    if (!lista) return;
    if (programada && horarios.length === 0) return setError('Agrega al menos un horario, o deja la lista en la rotación.');
    if (horarios.some((h) => h.endTime <= h.startTime)) return setError('En cada horario, la hora de fin debe ser posterior a la de inicio. Si cruza la medianoche, crea dos horarios.');
    setError(null);
    try {
      await guardar.mutateAsync({ id: lista.id, programada, horarios: programada ? horarios : [], interrumpe, unaSola });
      onClose();
    } catch {
      /* el aviso lo muestra useMutacionGestion */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lista ? `Programar: ${lista.name}` : 'Programar'}
      description="Sin horarios, la lista suena en la rotación. Con horarios, suena solo en esas horas."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancelar</Button>
          <Button type="button" size="sm" className="text-xs" disabled={guardar.isPending} onClick={confirmar}>Guardar programación</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div role="radiogroup" aria-label="Cuándo suena" className="grid gap-2 sm:grid-cols-2">
          {[
            { id: false, titulo: 'En la rotación', texto: 'Suena mezclada con las demás listas, sin horario.' },
            { id: true, titulo: 'Programada', texto: 'Suena solo en los horarios que elijas.' },
          ].map((o) => (
            <button
              key={String(o.id)}
              type="button"
              role="radio"
              aria-checked={programada === o.id}
              onClick={() => setProgramada(o.id)}
              className={cn('rounded-xl border p-3 text-left cursor-pointer transition-colors', programada === o.id ? 'border-primary bg-primary/10' : 'border-border hover:border-foreground/30')}
            >
              <span className="block text-sm font-semibold">{o.titulo}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{o.texto}</span>
            </button>
          ))}
        </div>

        {programada && (
          <div className="space-y-3">
            <p className="text-xs font-semibold">Horarios</p>
            {horarios.map((h, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[160px] flex-1">
                  <label htmlFor={`dia-${i}`} className="mb-1 block text-[11px] text-muted-foreground">Día</label>
                  <SelectField id={`dia-${i}`} value={h.dayOfWeek} onChange={(e) => cambiarHorario(i, { dayOfWeek: Number(e.target.value) })}>
                    {DIAS.map((d, n) => <option key={d} value={n}>{d}</option>)}
                  </SelectField>
                </div>
                <div>
                  <label htmlFor={`ini-${i}`} className="mb-1 block text-[11px] text-muted-foreground">Desde</label>
                  <Input id={`ini-${i}`} type="time" value={h.startTime} onChange={(e) => cambiarHorario(i, { startTime: e.target.value })} className="w-32 text-xs" />
                </div>
                <div>
                  <label htmlFor={`fin-${i}`} className="mb-1 block text-[11px] text-muted-foreground">Hasta</label>
                  <Input id={`fin-${i}`} type="time" value={h.endTime} onChange={(e) => cambiarHorario(i, { endTime: e.target.value })} className="w-32 text-xs" />
                </div>
                <button type="button" aria-label="Quitar horario" onClick={() => setHorarios(horarios.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-red-400 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setHorarios([...horarios, { dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }])}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Agregar horario
            </Button>

            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-xs font-semibold">Cuando llegue la hora</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-0.5 accent-primary" checked={interrumpe} onChange={(e) => setInterrumpe(e.target.checked)} />
                <span className="text-xs">
                  <span className="block font-medium text-foreground">Interrumpir lo que suena</span>
                  <span className="block text-muted-foreground">
                    Marcado: entra a la hora exacta, aunque esté sonando otra pista (la corta).
                    Sin marcar: espera a que termine la pista que suena y entra después.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-0.5 accent-primary" checked={unaSola} onChange={(e) => setUnaSola(e.target.checked)} />
                <span className="text-xs">
                  <span className="block font-medium text-foreground">Solo una pista en ese horario</span>
                  <span className="block text-muted-foreground">
                    Marcado: suena una sola pista de la lista y luego vuelve la rotación normal.
                    Sin marcar: suena la lista completa durante todo el horario.
                  </span>
                </span>
              </label>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </Modal>
  );
};

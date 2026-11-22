import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { franjaSchema } from '@luz/shared';
import type { FranjaInput } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { SelectField } from '../../usuarios/components/select-field';
import { luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { DIAS } from '../../gestion/lib/fechas';
import { DialogoContenido, EtiquetaCampo } from '../../contenido/components/dialogo-contenido';

interface FranjaDialogProps {
  programaId?: string; // programa fijo (desde la tabla)
  programaNombre?: string;
  programas?: { id: string; name: string }[]; // si se dan, el usuario elige el programa (desde el calendario)
  inicial?: { dayOfWeek: number; startTime: string; endTime: string }; // día y hora preelegidos al arrastrar
  onClose: () => void;
}

// Horario semanal de un programa: día, hora de inicio y de fin.
export const FranjaDialog: React.FC<FranjaDialogProps> = ({ programaId, programaNombre, programas, inicial, onClose }) => {
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [programaElegido, setProgramaElegido] = useState<string>(programaId ?? programas?.[0]?.id ?? '');
  const guardar = useMutacionGestion(
    (datos: FranjaInput) => luzApi.createFranja(programaElegido, datos),
    'Horario agregado',
    'No se pudo agregar el horario',
  );
  const nombre = programaNombre ?? programas?.find((p) => p.id === programaElegido)?.name ?? '';

  const form = useForm({
    defaultValues: {
      dayOfWeek: inicial?.dayOfWeek ?? 1,
      startTime: inicial?.startTime ?? '08:00',
      endTime: inicial?.endTime ?? '09:00',
      isLive: false,
    },
    onSubmit: async ({ value }) => {
      if (!programaElegido) {
        setErrorForm('Elige un programa.');
        return;
      }
      const parsed = franjaSchema.safeParse({ ...value, dayOfWeek: Number(value.dayOfWeek) });
      if (!parsed.success) {
        setErrorForm(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
        return;
      }
      setErrorForm(null);
      await guardar.mutateAsync(parsed.data);
      onClose();
    },
  });

  return (
    <form.Subscribe selector={(s) => s.canSubmit}>
    {(puedeEnviar) => (
    <DialogoContenido
      titulo={`Nuevo horario · ${nombre}`}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton="Agregar horario"
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      {errorForm && <p className="text-[11px] text-red-400">{errorForm}</p>}
      {programas && (
        <div>
          <EtiquetaCampo htmlFor="franja-programa">Programa</EtiquetaCampo>
          <SelectField id="franja-programa" value={programaElegido} onChange={(e) => setProgramaElegido(e.target.value)}>
            {programas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
        </div>
      )}
      <form.Field name="dayOfWeek">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="franja-dia">Día</EtiquetaCampo>
            <SelectField id="franja-dia" value={String(f.state.value)} onChange={(e) => f.handleChange(Number(e.target.value))}>
              {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </SelectField>
          </div>
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="startTime">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="franja-inicio">Inicio</EtiquetaCampo>
              <Input id="franja-inicio" type="time" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="endTime">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="franja-fin">Fin</EtiquetaCampo>
              <Input id="franja-fin" type="time" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
      </div>
      <form.Field name="isLive">
        {(f) => (
          <div className="flex items-center gap-2">
            <Switch id="franja-envivo" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
            <EtiquetaCampo htmlFor="franja-envivo">Se transmite en vivo</EtiquetaCampo>
          </div>
        )}
      </form.Field>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

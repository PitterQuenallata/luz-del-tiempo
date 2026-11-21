import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { programaSchema } from '@luz/shared';
import type { ProgramaInput } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiPrograma, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { useAreas } from '../../contenido/hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, claseTextarea } from '../../contenido/components/dialogo-contenido';

interface ProgramaDialogProps {
  emisoraId: string;
  programa: ApiPrograma | null;
  onClose: () => void;
}

// Programa de una emisora (ej. "Vida sana"). Sus horarios se agregan después, como franjas.
export const ProgramaDialog: React.FC<ProgramaDialogProps> = ({ emisoraId, programa, onClose }) => {
  const areas = useAreas();
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const guardar = useMutacionGestion(
    (datos: ProgramaInput) => (programa ? luzApi.updatePrograma(programa.id, datos) : luzApi.createPrograma(emisoraId, datos)),
    programa ? 'Programa guardado' : 'Programa creado',
    'No se pudo guardar el programa',
  );

  const form = useForm({
    defaultValues: {
      name: programa?.name ?? '',
      hostName: programa?.hostName ?? '',
      description: programa?.description ?? '',
      areaId: programa?.areaId ?? '',
      isActive: programa?.isActive ?? true,
    },
    onSubmit: async ({ value }) => {
      const parsed = programaSchema.safeParse({
        name: value.name,
        description: value.description.trim() || null,
        hostName: value.hostName.trim() || null,
        areaId: value.areaId || null,
        isActive: value.isActive,
      });
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
      titulo={programa ? 'Editar programa' : 'Nuevo programa'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={programa ? 'Guardar' : 'Crear'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      {errorForm && <p className="text-[11px] text-red-400">{errorForm}</p>}
      <form.Field name="name">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="programa-nombre">Nombre</EtiquetaCampo>
            <Input id="programa-nombre" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="ej. Vida sana" className="text-xs" />
          </div>
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="hostName">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="programa-conductor">Conductor</EtiquetaCampo>
              <Input id="programa-conductor" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="areaId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="programa-area">Área</EtiquetaCampo>
              <SelectField id="programa-area" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                <option value="">Sin área</option>
                {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
      </div>
      <form.Field name="description">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="programa-descripcion">Descripción</EtiquetaCampo>
            <textarea id="programa-descripcion" rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
          </div>
        )}
      </form.Field>
      <form.Field name="isActive">
        {(f) => (
          <div className="flex items-center gap-2">
            <Switch id="programa-activo" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
            <EtiquetaCampo htmlFor="programa-activo">Activo</EtiquetaCampo>
          </div>
        )}
      </form.Field>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

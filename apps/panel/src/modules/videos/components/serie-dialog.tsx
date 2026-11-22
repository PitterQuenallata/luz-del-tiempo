import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { serieSchema } from '@luz/shared';
import type { SerieInput } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiSerie, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { useAreas } from '../../contenido/hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, claseTextarea } from '../../contenido/components/dialogo-contenido';
import { slugDe } from '../../contenido/components/area-dialog';

interface SerieDialogProps {
  serie: ApiSerie | null;
  onClose: () => void;
}

// Serie de videos (siempre dentro de un área).
export const SerieDialog: React.FC<SerieDialogProps> = ({ serie, onClose }) => {
  const areas = useAreas();
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const guardar = useMutacionGestion(
    (datos: SerieInput) => (serie ? luzApi.updateSerie(serie.id, datos) : luzApi.createSerie(datos)),
    serie ? 'Serie guardada' : 'Serie creada',
    'No se pudo guardar la serie',
  );

  const form = useForm({
    defaultValues: {
      name: serie?.name ?? '',
      slug: serie?.slug ?? '',
      description: serie?.description ?? '',
      areaId: serie?.areaId ?? '',
      youtubePlaylistId: serie?.youtubePlaylistId ?? '',
      sortOrder: serie?.sortOrder ?? 0,
    },
    onSubmit: async ({ value }) => {
      const parsed = serieSchema.safeParse({
        name: value.name,
        slug: value.slug,
        description: value.description.trim() || null,
        areaId: value.areaId,
        youtubePlaylistId: value.youtubePlaylistId.trim() || null,
        sortOrder: Number(value.sortOrder) || 0,
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
      titulo={serie ? 'Editar serie' : 'Nueva serie'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={serie ? 'Guardar' : 'Crear'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      {errorForm && <p className="text-[11px] text-red-400">{errorForm}</p>}
      <form.Field name="name">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="serie-nombre">Nombre</EtiquetaCampo>
            <Input
              id="serie-nombre"
              value={f.state.value}
              onChange={(e) => {
                f.handleChange(e.target.value);
                if (!serie) form.setFieldValue('slug', slugDe(e.target.value));
              }}
              placeholder="ej. Podcast Salud"
              className="text-xs"
            />
          </div>
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="slug">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="serie-slug">Enlace (slug)</EtiquetaCampo>
              <Input id="serie-slug" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs font-mono" />
            </div>
          )}
        </form.Field>
        <form.Field name="areaId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="serie-area">Área</EtiquetaCampo>
              <SelectField id="serie-area" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                <option value="">Elige un área</option>
                {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
      </div>
      <form.Field name="description">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="serie-descripcion">Descripción</EtiquetaCampo>
            <textarea id="serie-descripcion" rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
          </div>
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="youtubePlaylistId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="serie-lista">Lista de YouTube (opcional)</EtiquetaCampo>
              <Input id="serie-lista" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs font-mono" />
            </div>
          )}
        </form.Field>
        <form.Field name="sortOrder">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="serie-orden">Orden</EtiquetaCampo>
              <Input id="serie-orden" type="number" min={0} value={f.state.value} onChange={(e) => f.handleChange(Number(e.target.value))} className="text-xs" />
            </div>
          )}
        </form.Field>
      </div>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

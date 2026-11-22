import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { videoSchema, youtubeIdDe } from '@luz/shared';
import type { VideoInput } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiVideo, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion, useSeries } from '../../gestion/hooks/use-gestion';
import { aInputFecha, desdeInputFecha } from '../../gestion/lib/fechas';
import { useAreas } from '../../contenido/hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, claseTextarea } from '../../contenido/components/dialogo-contenido';

interface VideoDialogProps {
  video: ApiVideo | null;
  onClose: () => void;
}

// Video de YouTube: se pega el enlace o el ID, y la serie (si hay) debe ser del mismo área.
export const VideoDialog: React.FC<VideoDialogProps> = ({ video, onClose }) => {
  const areas = useAreas();
  const series = useSeries();
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const guardar = useMutacionGestion(
    (datos: VideoInput) => (video ? luzApi.updateVideo(video.id, datos) : luzApi.createVideo(datos)),
    video ? 'Video guardado' : 'Video agregado',
    'No se pudo guardar el video',
  );

  const form = useForm({
    defaultValues: {
      youtube: video?.youtubeId ?? '',
      title: video?.title ?? '',
      description: video?.description ?? '',
      areaId: video?.areaId ?? '',
      seriesId: video?.seriesId ?? '',
      publishedAt: aInputFecha(video?.publishedAt),
      isFeatured: video?.isFeatured ?? false,
      isPublished: video?.isPublished ?? true,
    },
    onSubmit: async ({ value }) => {
      const id = youtubeIdDe(value.youtube);
      const parsed = videoSchema.safeParse({
        youtubeId: id ?? value.youtube,
        title: value.title,
        description: value.description.trim() || null,
        areaId: value.areaId,
        seriesId: value.seriesId || null,
        isFeatured: value.isFeatured,
        isPublished: value.isPublished,
        publishedAt: desdeInputFecha(value.publishedAt),
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
      titulo={video ? 'Editar video' : 'Nuevo video'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={video ? 'Guardar' : 'Agregar'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      {errorForm && <p className="text-[11px] text-red-400">{errorForm}</p>}
      <form.Field name="youtube">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="video-youtube">Enlace de YouTube o ID</EtiquetaCampo>
            <Input id="video-youtube" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" className="text-xs font-mono" />
          </div>
        )}
      </form.Field>
      <form.Field name="title">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="video-titulo">Título</EtiquetaCampo>
            <Input id="video-titulo" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
          </div>
        )}
      </form.Field>
      <form.Field name="description">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="video-descripcion">Descripción</EtiquetaCampo>
            <textarea id="video-descripcion" rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
          </div>
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="areaId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="video-area">Área</EtiquetaCampo>
              <SelectField id="video-area" value={f.state.value} onChange={(e) => { f.handleChange(e.target.value); form.setFieldValue('seriesId', ''); }}>
                <option value="">Elige un área</option>
                {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
        <form.Field name="seriesId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="video-serie">Serie (opcional)</EtiquetaCampo>
              <SelectField id="video-serie" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                <option value="">Sin serie</option>
                {(series.data ?? [])
                  .filter((s) => s.areaId === form.getFieldValue('areaId'))
                  .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="publishedAt">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="video-fecha">Fecha en YouTube</EtiquetaCampo>
              <Input id="video-fecha" type="datetime-local" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <div className="flex flex-col gap-2 pt-5">
          <form.Field name="isFeatured">
            {(f) => (
              <div className="flex items-center justify-between gap-2">
                <EtiquetaCampo htmlFor="video-destacado">Destacado</EtiquetaCampo>
                <Switch id="video-destacado" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
              </div>
            )}
          </form.Field>
          <form.Field name="isPublished">
            {(f) => (
              <div className="flex items-center justify-between gap-2">
                <EtiquetaCampo htmlFor="video-publicado">Publicado</EtiquetaCampo>
                <Switch id="video-publicado" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
              </div>
            )}
          </form.Field>
        </div>
      </div>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

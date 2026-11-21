import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { postSchema, POST_ESTADOS } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { SelectField } from '../../usuarios/components/select-field';
import { mensajeCampo } from '../../../shared/lib/form';
import { ApiNoticia, luzApi } from '../../../shared/api/luz-api';
import type { PostInput } from '@luz/shared';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { aInputFecha, desdeInputFecha } from '../../gestion/lib/fechas';
import { useAreas, usePersonas } from '../../contenido/hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, ErrorCampo, claseTextarea } from '../../contenido/components/dialogo-contenido';
import { ImagenCampo } from '../../contenido/components/imagen-campo';
import { slugDe } from '../../contenido/components/area-dialog';

const ETIQUETA_ESTADO: Record<string, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  published: 'Publicada',
  archived: 'Archivada',
};

interface NoticiaDialogProps {
  noticia: ApiNoticia | null;
  onClose: () => void;
}

// Noticia: título, texto, portada, área, autor y estado de publicación.
export const NoticiaDialog: React.FC<NoticiaDialogProps> = ({ noticia, onClose }) => {
  const areas = useAreas();
  const personas = usePersonas();
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const guardar = useMutacionGestion(
    (datos: PostInput) =>
      noticia ? luzApi.updateNoticia(noticia.id, datos) : luzApi.createNoticia(datos),
    noticia ? 'Noticia guardada' : 'Noticia creada',
    'No se pudo guardar la noticia',
  );

  const form = useForm({
    defaultValues: {
      title: noticia?.title ?? '',
      slug: noticia?.slug ?? '',
      excerpt: noticia?.excerpt ?? '',
      content: noticia?.content ?? '',
      coverUrl: noticia?.coverUrl ?? null,
      areaId: noticia?.areaId ?? '',
      authorPersonId: noticia?.authorPersonId ?? '',
      status: (noticia?.status ?? 'draft') as (typeof POST_ESTADOS)[number],
      publishedAt: aInputFecha(noticia?.publishedAt ?? new Date().toISOString()),
    },
    onSubmit: async ({ value }) => {
      const parsed = postSchema.safeParse({
        title: value.title,
        slug: value.slug,
        excerpt: value.excerpt.trim() || null,
        content: value.content.trim() || null,
        coverUrl: value.coverUrl,
        areaId: value.areaId || null,
        authorPersonId: value.authorPersonId || null,
        status: value.status,
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
      titulo={noticia ? 'Editar noticia' : 'Nueva noticia'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={noticia ? 'Guardar' : 'Crear'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      {errorForm && <p className="text-[11px] text-red-400">{errorForm}</p>}

      <form.Field name="coverUrl">
        {(f) => (
          <ImagenCampo etiqueta="Imagen de portada" valor={f.state.value} onChange={(url) => f.handleChange(url)} ratio={16 / 10} etiquetaRatio="16:10" recomendacion="Se recorta sola a 16:10." />
        )}
      </form.Field>

      <form.Field name="title">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="noticia-titulo">Título</EtiquetaCampo>
            <Input
              id="noticia-titulo"
              value={f.state.value}
              onChange={(e) => {
                f.handleChange(e.target.value);
                if (!noticia) form.setFieldValue('slug', slugDe(e.target.value));
              }}
              onBlur={f.handleBlur}
              className="text-xs"
            />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="slug">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="noticia-slug">Enlace (slug)</EtiquetaCampo>
            <Input id="noticia-slug" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="text-xs font-mono" />
            <p className="text-[11px] text-muted-foreground mt-1">La página será /noticias/{f.state.value || '…'}</p>
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="excerpt">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="noticia-resumen">Resumen</EtiquetaCampo>
            <textarea id="noticia-resumen" rows={2} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="content">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="noticia-texto">Texto</EtiquetaCampo>
            <textarea id="noticia-texto" rows={8} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="areaId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="noticia-area">Área</EtiquetaCampo>
              <SelectField id="noticia-area" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                <option value="">Sin área</option>
                {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
        <form.Field name="authorPersonId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="noticia-autor">Autor</EtiquetaCampo>
              <SelectField id="noticia-autor" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                <option value="">Sin autor</option>
                {(personas.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="status">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="noticia-estado">Estado</EtiquetaCampo>
              <SelectField id="noticia-estado" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as (typeof POST_ESTADOS)[number])}>
                {POST_ESTADOS.map((s) => <option key={s} value={s}>{ETIQUETA_ESTADO[s]}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
        <form.Field name="publishedAt">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="noticia-fecha">Fecha de publicación</EtiquetaCampo>
              <Input id="noticia-fecha" type="datetime-local" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
              <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
            </div>
          )}
        </form.Field>
      </div>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

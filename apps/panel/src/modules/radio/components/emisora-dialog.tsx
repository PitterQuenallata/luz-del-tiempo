import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { emisoraSchema } from '@luz/shared';
import type { EmisoraInput } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiEmisora, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { useAreas } from '../../contenido/hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, claseTextarea } from '../../contenido/components/dialogo-contenido';
import { ImagenCampo } from '../../contenido/components/imagen-campo';
import { slugDe } from '../../contenido/components/area-dialog';

interface EmisoraDialogProps {
  emisora: ApiEmisora | null;
  onClose: () => void;
}

// Emisora del ministerio (propia) o de otra radio (externa, máximo una).
export const EmisoraDialog: React.FC<EmisoraDialogProps> = ({ emisora, onClose }) => {
  const areas = useAreas();
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const guardar = useMutacionGestion(
    (datos: EmisoraInput) => (emisora ? luzApi.updateEmisora(emisora.id, datos) : luzApi.createEmisora(datos)),
    emisora ? 'Emisora guardada' : 'Emisora creada',
    'No se pudo guardar la emisora',
  );

  const form = useForm({
    defaultValues: {
      name: emisora?.name ?? '',
      slug: emisora?.slug ?? '',
      description: emisora?.description ?? '',
      genre: emisora?.genre ?? '',
      kind: (emisora?.kind ?? 'own') as 'own' | 'external',
      imageUrl: emisora?.imageUrl ?? null,
      relleno: (emisora?.relleno ?? 'musica') as 'ninguno' | 'musica' | 'historias' | 'musica_historias',
      isMain: emisora?.isMain ?? false,
      areaId: emisora?.areaId ?? '',
      operatedByName: emisora?.operatedByName ?? '',
      visibleInMinistry: emisora?.visibleInMinistry ?? true,
      status: (emisora?.status ?? 'active') as 'active' | 'suspended' | 'disabled',
      sortOrder: emisora?.sortOrder ?? 0,
      contactName: emisora?.contactName ?? '',
      contactPhone: emisora?.contactPhone ?? '',
      contactEmail: emisora?.contactEmail ?? '',
      notes: emisora?.notes ?? '',
    },
    onSubmit: async ({ value }) => {
      const parsed = emisoraSchema.safeParse({
        name: value.name,
        slug: value.slug,
        description: value.description.trim() || null,
        genre: value.genre.trim() || null,
        kind: value.kind,
        imageUrl: value.imageUrl,
        relleno: value.relleno,
        isMain: value.isMain,
        areaId: value.areaId || null,
        operatedByName: value.kind === 'external' ? value.operatedByName.trim() || null : null,
        visibleInMinistry: value.visibleInMinistry,
        status: value.status,
        sortOrder: Number(value.sortOrder) || 0,
        contactName: value.contactName.trim() || null,
        contactPhone: value.contactPhone.trim() || null,
        contactEmail: value.contactEmail.trim() || '',
        notes: value.notes.trim() || null,
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
      titulo={emisora ? `Editar · ${emisora.name}` : 'Nueva emisora'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={emisora ? 'Guardar' : 'Crear'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      {errorForm && <p className="text-[11px] text-red-400">{errorForm}</p>}

      <form.Field name="imageUrl">
        {(f) => (
          <ImagenCampo etiqueta="Foto de la emisora" valor={f.state.value} onChange={(url) => f.handleChange(url)} ratio={16 / 9} etiquetaRatio="16:9" recomendacion="Horizontal (16:9). Se muestra en la página de radio." />
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="name">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-nombre">Nombre</EtiquetaCampo>
              <Input
                id="emisora-nombre"
                value={f.state.value}
                onChange={(e) => {
                  f.handleChange(e.target.value);
                  if (!emisora) form.setFieldValue('slug', slugDe(e.target.value));
                }}
                className="text-xs"
              />
            </div>
          )}
        </form.Field>
        <form.Field name="slug">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-slug">Enlace (slug)</EtiquetaCampo>
              <Input id="emisora-slug" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs font-mono" />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="relleno">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="emisora-relleno">Cuando no hay programa, suena</EtiquetaCampo>
            <SelectField id="emisora-relleno" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as 'ninguno' | 'musica' | 'historias' | 'musica_historias')}>
              <option value="musica">AutoDJ (música propia de la emisora)</option>
              <option value="historias">Historias</option>
              <option value="musica_historias">AutoDJ e historias</option>
              <option value="ninguno">Nada (la franja queda vacía)</option>
            </SelectField>
            <p className="text-[11px] text-muted-foreground mt-1">Solo suena contenido de esta emisora. Nunca pasa a la música de otra estación.</p>
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="kind">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-tipo">Tipo</EtiquetaCampo>
              <SelectField id="emisora-tipo" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as 'own' | 'external')}>
                <option value="own">Del ministerio</option>
                <option value="external">Externa (otra radio)</option>
              </SelectField>
            </div>
          )}
        </form.Field>
        <form.Field name="areaId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-area">Área</EtiquetaCampo>
              <SelectField id="emisora-area" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                <option value="">Sin área</option>
                {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="kind">
        {(tipo) =>
          tipo.state.value === 'external' ? (
            <form.Field name="operatedByName">
              {(f) => (
                <div>
                  <EtiquetaCampo htmlFor="emisora-operada">Operada por</EtiquetaCampo>
                  <Input id="emisora-operada" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="Radio Pepito" className="text-xs" />
                </div>
              )}
            </form.Field>
          ) : null
        }
      </form.Field>

      <form.Field name="description">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="emisora-descripcion">Descripción</EtiquetaCampo>
            <textarea id="emisora-descripcion" rows={2} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-3 gap-3">
        <form.Field name="genre">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-genero">Género</EtiquetaCampo>
              <Input id="emisora-genero" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="Alabanza" className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="status">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-estado">Estado</EtiquetaCampo>
              <SelectField id="emisora-estado" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as 'active' | 'suspended' | 'disabled')}>
                <option value="active">Activa</option>
                <option value="suspended">Suspendida</option>
                <option value="disabled">Deshabilitada</option>
              </SelectField>
            </div>
          )}
        </form.Field>
        <form.Field name="sortOrder">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-orden">Orden</EtiquetaCampo>
              <Input id="emisora-orden" type="number" min={0} value={f.state.value} onChange={(e) => f.handleChange(Number(e.target.value))} className="text-xs" />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="contactName">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-contacto">Responsable</EtiquetaCampo>
              <Input id="emisora-contacto" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="contactPhone">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-telefono">Teléfono</EtiquetaCampo>
              <Input id="emisora-telefono" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
      </div>

      <div className="flex items-center justify-between gap-3">
        <form.Field name="isMain">
          {(f) => (
            <div className="flex items-center gap-2">
              <Switch id="emisora-principal" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
              <EtiquetaCampo htmlFor="emisora-principal">Es la principal</EtiquetaCampo>
            </div>
          )}
        </form.Field>
        <form.Field name="visibleInMinistry">
          {(f) => (
            <div className="flex items-center gap-2">
              <Switch id="emisora-visible" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
              <EtiquetaCampo htmlFor="emisora-visible">Visible en la web</EtiquetaCampo>
            </div>
          )}
        </form.Field>
      </div>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

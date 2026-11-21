import React from 'react';
import { useForm } from '@tanstack/react-form';
import { X } from 'lucide-react';
import { areaSchema, AREA_TEMPLATES, AREA_ICONOS } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { mensajeCampo } from '../../../shared/lib/form';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiArea } from '../../../shared/api/luz-api';
import { SelectField } from '../../usuarios/components/select-field';
import { useArea, useAgregarFotoGaleria, useGuardarArea, useQuitarFotoGaleria } from '../hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, ErrorCampo, claseTextarea } from './dialogo-contenido';
import { ImagenCampo } from './imagen-campo';

interface AreaDialogProps {
  area: ApiArea | null; // null = nueva área
  siguienteOrden: number;
  onClose: () => void;
}

const ETIQUETA_TEMPLATE: Record<string, string> = {
  hero: 'A · Portada grande',
  gallery: 'B · Texto + galería',
  simple: 'C · Simple',
};

const ETIQUETA_ICONO: Record<string, string> = {
  health: 'Salud',
  music: 'Música',
  bible: 'Biblia',
  kids: 'Niños',
  family: 'Familia',
  radio: 'Radio',
};

// Convierte un nombre en enlace: "Escuela de Salud" -> "escuela-de-salud"
export const slugDe = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

// Área: datos, plantilla y, si ya existe, su galería de fotos.
export const AreaDialog: React.FC<AreaDialogProps> = ({ area, siguienteOrden, onClose }) => {
  const guardar = useGuardarArea(area?.id ?? null);
  const detalle = useArea(area?.id ?? null);
  const agregarFoto = useAgregarFotoGaleria();
  const quitarFoto = useQuitarFotoGaleria();

  const form = useForm({
    defaultValues: {
      slug: area?.slug ?? '',
      name: area?.name ?? '',
      template: (area?.template ?? 'simple') as 'hero' | 'gallery' | 'simple',
      summary: area?.summary ?? '',
      content: area?.content ?? '',
      color: area?.color ?? '#e2a927',
      icon: (area?.icon ?? 'radio') as (typeof AREA_ICONOS)[number],
      coverUrl: area?.coverUrl ?? null,
      whatsapp: area?.whatsapp ?? '',
      eventEnabled: area?.eventEnabled ?? false,
      isPublished: area?.isPublished ?? true,
      sortOrder: area?.sortOrder ?? siguienteOrden,
    },
    validators: { onChange: areaSchema as any, onSubmit: areaSchema as any },
    onSubmit: async ({ value }) => {
      const datos = areaSchema.parse({
        ...value,
        summary: value.summary.trim() || null,
        content: value.content.trim() || null,
        whatsapp: value.whatsapp.trim() || null,
      });
      await guardar.mutateAsync(datos);
      onClose();
    },
  });

  const fotos = detalle.data?.galeria ?? [];

  return (
    <form.Subscribe selector={(s) => s.canSubmit}>
    {(puedeEnviar) => (
    <DialogoContenido
      titulo={area ? `Editar área · ${area.name}` : 'Nueva área'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={area ? 'Guardar' : 'Crear'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      <form.Field name="name">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="area-nombre">Nombre</EtiquetaCampo>
            <Input
              id="area-nombre"
              value={f.state.value}
              onChange={(e) => {
                f.handleChange(e.target.value);
                // El enlace se genera solo al crear; al editar no se cambia (la página pública depende de él)
                if (!area) form.setFieldValue('slug', slugDe(e.target.value));
              }}
              onBlur={f.handleBlur}
              placeholder="ej. Salud"
              className="text-xs"
            />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="slug">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="area-slug">Enlace (slug)</EtiquetaCampo>
            <Input id="area-slug" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} disabled={Boolean(area)} className="text-xs font-mono" />
            <p className="text-[11px] text-muted-foreground mt-1">
              {area ? 'El enlace no se cambia para no romper las direcciones existentes.' : `La página será /areas/${f.state.value || '…'}`}
            </p>
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="template">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="area-plantilla">Plantilla</EtiquetaCampo>
              <SelectField id="area-plantilla" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as 'hero' | 'gallery' | 'simple')}>
                {AREA_TEMPLATES.map((t) => <option key={t} value={t}>{ETIQUETA_TEMPLATE[t]}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
        <form.Field name="icon">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="area-icono">Ícono</EtiquetaCampo>
              <SelectField id="area-icono" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as (typeof AREA_ICONOS)[number])}>
                {AREA_ICONOS.map((i) => <option key={i} value={i}>{ETIQUETA_ICONO[i]}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="summary">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="area-resumen">Resumen corto</EtiquetaCampo>
            <Input id="area-resumen" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="Una frase para la tarjeta del área" className="text-xs" />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="content">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="area-contenido">Contenido</EtiquetaCampo>
            <textarea id="area-contenido" rows={5} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className={claseTextarea} />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="coverUrl">
        {(f) => (
          <ImagenCampo
            etiqueta="Imagen principal"
            valor={f.state.value}
            onChange={(url) => f.handleChange(url)}
            recomendacion="Horizontal (16:9), al menos 1600 × 900."
          />
        )}
      </form.Field>

      {area && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <span className="font-medium block">Galería (plantilla B)</span>
          {fotos.length === 0 && <p className="text-[11px] text-muted-foreground">Sin fotos todavía.</p>}
          <div className="grid grid-cols-4 gap-2">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                <img src={foto.imageUrl} alt={foto.caption ?? ''} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={async () => {
                    const ok = await confirmar({ title: '¿Quitar esta foto de la galería?', type: 'danger', confirmText: 'Eliminar' });
                    if (ok) quitarFoto.mutate({ areaId: area.id, fotoId: foto.id });
                  }}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <ImagenCampo
            etiqueta="Agregar foto"
            valor={null}
            ratio={4 / 3}
            etiquetaRatio="4:3"
            onChange={(url) => { if (url) agregarFoto.mutate({ areaId: area.id, url }); }}
            recomendacion="Se recorta sola a 4:3. Se recomiendan 4 fotos."
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="color">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="area-color">Color de acento</EtiquetaCampo>
              <div className="flex items-center gap-2">
                <input id="area-color" type="color" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="h-9 w-12 rounded-lg border border-border bg-background cursor-pointer" />
                <span className="font-mono text-[11px] text-muted-foreground">{f.state.value}</span>
              </div>
            </div>
          )}
        </form.Field>
        <form.Field name="whatsapp">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="area-whatsapp">WhatsApp del responsable</EtiquetaCampo>
              <Input id="area-whatsapp" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="+591 7xxxxxxx" className="text-xs font-mono" />
              <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="sortOrder">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="area-orden">Orden</EtiquetaCampo>
              <Input id="area-orden" type="number" min={0} value={f.state.value} onChange={(e) => f.handleChange(Number(e.target.value))} className="text-xs" />
            </div>
          )}
        </form.Field>
        <div className="flex flex-col gap-2 pt-5">
          <form.Field name="isPublished">
            {(f) => (
              <div className="flex items-center justify-between gap-2">
                <EtiquetaCampo htmlFor="area-publicada">Publicada</EtiquetaCampo>
                <Switch id="area-publicada" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
              </div>
            )}
          </form.Field>
          <form.Field name="eventEnabled">
            {(f) => (
              <div className="flex items-center justify-between gap-2">
                <EtiquetaCampo htmlFor="area-evento">Próximo evento</EtiquetaCampo>
                <Switch id="area-evento" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
              </div>
            )}
          </form.Field>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-2">
        El próximo evento se completa al crear actividades (siguiente etapa).
      </p>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

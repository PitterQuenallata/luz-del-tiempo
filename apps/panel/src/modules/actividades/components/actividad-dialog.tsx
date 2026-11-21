import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { actividadSchema, ACTIVIDAD_TIPOS } from '@luz/shared';
import type { ActividadInput } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiActividad, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { aInputFecha, desdeInputFecha } from '../../gestion/lib/fechas';
import { useAreas, usePersonas } from '../../contenido/hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, claseTextarea } from '../../contenido/components/dialogo-contenido';
import { ImagenCampo } from '../../contenido/components/imagen-campo';
import { slugDe } from '../../contenido/components/area-dialog';

export const ETIQUETA_TIPO: Record<string, string> = {
  vacation_school: 'Escuela de vacaciones',
  health_school: 'Escuela de salud',
  music_school: 'Escuela de música',
  workshop: 'Taller',
  health_campaign: 'Campaña de salud',
  bible_campaign: 'Campaña bíblica',
  bible_study: 'Estudio bíblico',
  other: 'Otra',
};

// "Sábado | 15:00 Bienvenida; 16:00 Clase" -> [{ day, items }]
export const agendaDesdeTexto = (texto: string) =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linea) => {
      const [dia, resto = ''] = linea.split('|');
      return { day: dia.trim(), items: resto.split(';').map((i) => i.trim()).filter(Boolean) };
    });

export const agendaATexto = (agenda: { day: string; items: string[] }[]) =>
  agenda.map((a) => `${a.day} | ${a.items.join('; ')}`).join('\n');

interface ActividadDialogProps {
  actividad: ApiActividad | null;
  onClose: () => void;
}

// Actividad: escuela, taller, campaña o estudio, con su lugar, horario e inscripción.
export const ActividadDialog: React.FC<ActividadDialogProps> = ({ actividad, onClose }) => {
  const areas = useAreas();
  const personas = usePersonas();
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const guardar = useMutacionGestion(
    (datos: ActividadInput) => (actividad ? luzApi.updateActividad(actividad.id, datos) : luzApi.createActividad(datos)),
    actividad ? 'Actividad guardada' : 'Actividad creada',
    'No se pudo guardar la actividad',
  );

  const form = useForm({
    defaultValues: {
      title: actividad?.title ?? '',
      slug: actividad?.slug ?? '',
      type: (actividad?.type ?? 'workshop') as (typeof ACTIVIDAD_TIPOS)[number],
      areaId: actividad?.areaId ?? '',
      presenterPersonId: actividad?.presenterPersonId ?? '',
      summary: actividad?.summary ?? '',
      content: actividad?.content ?? '',
      coverUrl: actividad?.coverUrl ?? null,
      startsAt: aInputFecha(actividad?.startsAt),
      endsAt: aInputFecha(actividad?.endsAt),
      scheduleText: actividad?.scheduleText ?? '',
      isVirtual: actividad?.isVirtual ?? false,
      locationName: actividad?.locationName ?? '',
      locationAddress: actividad?.locationAddress ?? '',
      registrationType: (actividad?.registrationType ?? 'whatsapp') as 'none' | 'whatsapp' | 'link',
      registrationValue: actividad?.registrationValue ?? '',
      capacity: actividad?.capacity ? String(actividad.capacity) : '',
      cost: actividad?.cost ?? '',
      agenda: actividad ? agendaATexto(actividad.agenda) : '',
      isPublished: actividad?.isPublished ?? false,
    },
    onSubmit: async ({ value }) => {
      const inicio = desdeInputFecha(value.startsAt);
      const parsed = actividadSchema.safeParse({
        title: value.title,
        slug: value.slug,
        type: value.type,
        areaId: value.areaId || null,
        presenterPersonId: value.presenterPersonId || null,
        summary: value.summary.trim() || null,
        content: value.content.trim() || null,
        coverUrl: value.coverUrl,
        startsAt: inicio ?? '',
        endsAt: desdeInputFecha(value.endsAt),
        scheduleText: value.scheduleText.trim() || null,
        isVirtual: value.isVirtual,
        locationName: value.locationName.trim() || null,
        locationAddress: value.locationAddress.trim() || null,
        registrationType: value.registrationType,
        registrationValue: value.registrationType === 'none' ? null : value.registrationValue.trim() || null,
        capacity: value.capacity ? Number(value.capacity) : null,
        cost: value.cost.trim() || null,
        agenda: agendaDesdeTexto(value.agenda),
        isPublished: value.isPublished,
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
      titulo={actividad ? 'Editar actividad' : 'Nueva actividad'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={actividad ? 'Guardar' : 'Crear'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      {errorForm && <p className="text-[11px] text-red-400">{errorForm}</p>}

      <form.Field name="coverUrl">
        {(f) => <ImagenCampo etiqueta="Imagen (afiche)" valor={f.state.value} onChange={(url) => f.handleChange(url)} ratio={3 / 4} etiquetaRatio="3:4" maxAncho={1200} recomendacion="Vertical (3:4). Se recorta sola para que se vea igual en las tarjetas y en la página." />}
      </form.Field>

      <form.Field name="title">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="act-titulo">Título</EtiquetaCampo>
            <Input
              id="act-titulo"
              value={f.state.value}
              onChange={(e) => {
                f.handleChange(e.target.value);
                if (!actividad) form.setFieldValue('slug', slugDe(e.target.value));
              }}
              className="text-xs"
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="slug">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-slug">Enlace (slug)</EtiquetaCampo>
              <Input id="act-slug" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs font-mono" />
            </div>
          )}
        </form.Field>
        <form.Field name="type">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-tipo">Tipo</EtiquetaCampo>
              <SelectField id="act-tipo" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as (typeof ACTIVIDAD_TIPOS)[number])}>
                {ACTIVIDAD_TIPOS.map((t) => <option key={t} value={t}>{ETIQUETA_TIPO[t]}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="summary">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="act-resumen">Resumen</EtiquetaCampo>
            <textarea id="act-resumen" rows={2} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="startsAt">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-inicio">Inicio</EtiquetaCampo>
              <Input id="act-inicio" type="datetime-local" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="endsAt">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-fin">Fin (opcional)</EtiquetaCampo>
              <Input id="act-fin" type="datetime-local" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="scheduleText">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="act-horario">Horario en texto</EtiquetaCampo>
            <Input id="act-horario" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="Sábados 15:00 a 17:00" className="text-xs" />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="areaId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-area">Área</EtiquetaCampo>
              <SelectField id="act-area" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                <option value="">Sin área</option>
                {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
        <form.Field name="presenterPersonId">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-presentador">Quién la dirige</EtiquetaCampo>
              <SelectField id="act-presentador" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                <option value="">Sin asignar</option>
                {(personas.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </SelectField>
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="locationName">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-lugar">Lugar</EtiquetaCampo>
              <Input id="act-lugar" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="locationAddress">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-direccion">Dirección</EtiquetaCampo>
              <Input id="act-direccion" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="registrationType">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-inscripcion">Inscripción</EtiquetaCampo>
              <SelectField id="act-inscripcion" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as 'none' | 'whatsapp' | 'link')}>
                <option value="none">Sin inscripción</option>
                <option value="whatsapp">Por WhatsApp</option>
                <option value="link">Por enlace</option>
              </SelectField>
            </div>
          )}
        </form.Field>
        <form.Field name="registrationValue">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-inscripcion-valor">WhatsApp o enlace</EtiquetaCampo>
              <Input id="act-inscripcion-valor" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="+591 7xxxxxxx o https://…" className="text-xs" />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="cost">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-costo">Costo</EtiquetaCampo>
              <Input id="act-costo" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="Gratis" className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="capacity">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="act-cupo">Cupo (opcional)</EtiquetaCampo>
              <Input id="act-cupo" type="number" min={1} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="agenda">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="act-agenda">Agenda por día</EtiquetaCampo>
            <textarea id="act-agenda" rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder={'Sábado | 15:00 Bienvenida; 16:00 Clase'} className={claseTextarea} />
            <p className="text-[11px] text-muted-foreground mt-1">Una línea por día: día | horarios separados por punto y coma.</p>
          </div>
        )}
      </form.Field>

      <form.Field name="content">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="act-texto">Descripción</EtiquetaCampo>
            <textarea id="act-texto" rows={4} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
          </div>
        )}
      </form.Field>

      <div className="flex items-center justify-between gap-2">
        <form.Field name="isVirtual">
          {(f) => (
            <div className="flex items-center gap-2">
              <Switch id="act-virtual" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
              <EtiquetaCampo htmlFor="act-virtual">Es virtual</EtiquetaCampo>
            </div>
          )}
        </form.Field>
        <form.Field name="isPublished">
          {(f) => (
            <div className="flex items-center gap-2">
              <Switch id="act-publicada" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
              <EtiquetaCampo htmlFor="act-publicada">Publicada</EtiquetaCampo>
            </div>
          )}
        </form.Field>
      </div>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

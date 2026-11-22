import React from 'react';
import { useForm } from '@tanstack/react-form';
import { personaSchema } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { mensajeCampo } from '../../../shared/lib/form';
import { ApiPersona } from '../../../shared/api/luz-api';
import { useGuardarPersona } from '../hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, ErrorCampo, claseTextarea } from './dialogo-contenido';
import { ImagenCampo } from './imagen-campo';

interface PersonaDialogProps {
  persona: ApiPersona | null; // null = nueva persona
  siguienteOrden: number;
  onClose: () => void;
}

// Predicadores, autores y equipo (TanStack Form + personaSchema de @luz/shared).
export const PersonaDialog: React.FC<PersonaDialogProps> = ({ persona, siguienteOrden, onClose }) => {
  const guardar = useGuardarPersona(persona?.id ?? null);

  const form = useForm({
    defaultValues: {
      name: persona?.name ?? '',
      roleTitle: persona?.roleTitle ?? '',
      bio: persona?.bio ?? '',
      photoUrl: persona?.photoUrl ?? null,
      sortOrder: persona?.sortOrder ?? siguienteOrden,
      isPublished: persona?.isPublished ?? true,
    },
    validators: { onChange: personaSchema as any, onSubmit: personaSchema as any },
    onSubmit: async ({ value }) => {
      const datos = personaSchema.parse({ ...value, bio: value.bio.trim() || null });
      await guardar.mutateAsync(datos);
      onClose();
    },
  });

  return (
    <form.Subscribe selector={(s) => s.canSubmit}>
    {(puedeEnviar) => (
    <DialogoContenido
      titulo={persona ? 'Editar persona' : 'Nueva persona'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={persona ? 'Guardar' : 'Crear'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      <form.Field name="photoUrl">
        {(f) => (
          <ImagenCampo
            etiqueta="Foto"
            valor={f.state.value}
            onChange={(url) => f.handleChange(url)}
            ratio={4 / 5}
            etiquetaRatio="4:5"
            maxAncho={800}
            recomendacion="Retrato. Se recorta sola a 4:5 para que todas las fotos se vean iguales."
          />
        )}
      </form.Field>

      <form.Field name="name">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="persona-nombre">Nombre</EtiquetaCampo>
            <Input id="persona-nombre" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="ej. Pr. Daniel Mamani" className="text-xs" />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="roleTitle">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="persona-cargo">Cargo</EtiquetaCampo>
            <Input id="persona-cargo" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="ej. Predicador, Locutor, Autor" className="text-xs" />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="bio">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="persona-bio">Biografía corta</EtiquetaCampo>
            <textarea id="persona-bio" rows={4} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className={claseTextarea} />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3 items-end">
        <form.Field name="sortOrder">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="persona-orden">Orden</EtiquetaCampo>
              <Input id="persona-orden" type="number" min={0} value={f.state.value} onChange={(e) => f.handleChange(Number(e.target.value))} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="isPublished">
          {(f) => (
            <div className="flex items-center justify-between gap-2 pb-1">
              <EtiquetaCampo htmlFor="persona-publicada">Publicada</EtiquetaCampo>
              <Switch id="persona-publicada" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
            </div>
          )}
        </form.Field>
      </div>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};

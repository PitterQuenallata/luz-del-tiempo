import React from 'react';
import { X } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { rolSchema, normalizarNombre } from '@luz/shared';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { ApiRole } from '../../../shared/api/luz-api';
import { useCrearRol, useEditarRol } from '../hooks/use-roles';
import { mensajeCampo } from '../../../shared/lib/form';

interface RolDialogProps {
  rol: ApiRole | null; // null = crear
  onClose: () => void;
}

const Error_: React.FC<{ texto: string | null }> = ({ texto }) => (texto ? <p className="text-[11px] text-red-400">{texto}</p> : null);

// Crear o editar un rol con TanStack Form y el esquema compartido.
export const RolDialog: React.FC<RolDialogProps> = ({ rol, onClose }) => {
  const crear = useCrearRol();
  const editar = useEditarRol();
  const esquema = rol ? rolSchema.pick({ name: true, description: true }) : rolSchema;

  const form = useForm({
    defaultValues: { key: rol?.key ?? '', name: rol?.name ?? '', description: rol?.description ?? '' },
    validators: { onChange: esquema as any, onSubmit: esquema as any },
    onSubmit: async ({ value }) => {
      if (rol) {
        await editar.mutateAsync({ id: rol.id, patch: { name: normalizarNombre(value.name), description: value.description.trim() || null } });
      } else {
        const datos = rolSchema.parse(value);
        await crear.mutateAsync({ key: datos.key, name: datos.name, description: datos.description?.trim() || undefined, permisos: [] });
      }
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        noValidate
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
        className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h3 className="text-sm font-semibold">{rol ? 'Editar rol' : 'Nuevo rol'}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 text-xs">
          {!rol && (
            <form.Field name="key">
              {(f) => (
                <div className="space-y-1.5">
                  <label htmlFor="rol-clave" className="font-medium block">Clave</label>
                  <Input id="rol-clave" value={f.state.value} onChange={(e) => f.handleChange(e.target.value.toLowerCase())} onBlur={f.handleBlur} placeholder="ej. comunicacion" className="text-xs font-mono" />
                  {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
                </div>
              )}
            </form.Field>
          )}
          <form.Field name="name">
            {(f) => (
              <div className="space-y-1.5">
                <label htmlFor="rol-nombre" className="font-medium block">Nombre</label>
                <Input id="rol-nombre" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={() => { f.handleChange(normalizarNombre(f.state.value)); f.handleBlur(); }} placeholder="ej. Comunicación" className="text-xs" />
                {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
              </div>
            )}
          </form.Field>
          <form.Field name="description">
            {(f) => (
              <div className="space-y-1.5">
                <label htmlFor="rol-desc" className="font-medium block">Descripción</label>
                <Input id="rol-desc" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="Para qué sirve este rol" className="text-xs" />
                {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
              </div>
            )}
          </form.Field>
        </div>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([puedeEnviar, enviando]) => (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-secondary/20">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
              <Button type="submit" variant="default" size="sm" disabled={!puedeEnviar || enviando} className="text-xs">
                {rol ? 'Guardar' : 'Crear rol'}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
};

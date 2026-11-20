import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { ApiRole } from '../../../shared/api/luz-api';
import { useCrearRol, useEditarRol } from '../hooks/use-roles';
import { errorNombre, errorTexto, normalizarNombre } from '../../../shared/lib/validaciones';

interface RolDialogProps {
  rol: ApiRole | null; // null = crear
  onClose: () => void;
}

const CLAVE = /^[a-z][a-z0-9_]{1,40}$/;

// Crear o editar un rol (nombre, descripción; la clave no cambia después de crear).
export const RolDialog: React.FC<RolDialogProps> = ({ rol, onClose }) => {
  const crear = useCrearRol();
  const editar = useEditarRol();
  const [key, setKey] = useState(rol?.key ?? '');
  const [name, setName] = useState(rol?.name ?? '');
  const [description, setDescription] = useState(rol?.description ?? '');

  const claveValida = rol ? true : CLAVE.test(key);
  const errNombre = errorNombre(name, 'El nombre');
  const errDesc = errorTexto(description, 'La descripción', 0, 200, false);
  const puedeGuardar = !errNombre && !errDesc && claveValida && !crear.isPending && !editar.isPending;

  const guardar = async () => {
    if (rol) {
      await editar.mutateAsync({ id: rol.id, patch: { name: normalizarNombre(name), description: description.trim() || null } });
    } else {
      await crear.mutateAsync({ key: key.trim(), name: normalizarNombre(name), description: description.trim() || undefined, permisos: [] });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h3 className="text-sm font-semibold">{rol ? 'Editar rol' : 'Nuevo rol'}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="rol-clave" className="font-medium block">Clave</label>
            <Input id="rol-clave" value={key} disabled={!!rol} onChange={(e) => setKey(e.target.value.toLowerCase())} placeholder="ej. comunicacion" className="text-xs font-mono" />
            {!rol && key && !CLAVE.test(key) && (
              <p className="text-[11px] text-red-400">Usa letras minúsculas, números o guion bajo, y empieza con letra.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rol-nombre" className="font-medium block">Nombre</label>
            <Input id="rol-nombre" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(normalizarNombre(name))} placeholder="ej. Comunicación" className="text-xs" />
            {name && errNombre && <p className="text-[11px] text-red-400">{errNombre}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rol-desc" className="font-medium block">Descripción</label>
            <Input id="rol-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para qué sirve este rol" className="text-xs" />
            {errDesc && <p className="text-[11px] text-red-400">{errDesc}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-secondary/20">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
          <Button type="button" variant="default" size="sm" disabled={!puedeGuardar} onClick={guardar} className="text-xs">
            {rol ? 'Guardar' : 'Crear rol'}
          </Button>
        </div>
      </div>
    </div>
  );
};

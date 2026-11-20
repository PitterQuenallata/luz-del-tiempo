import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Usuario } from '../types/usuarios.types';
import { useRoles, useUpdateUsuario } from '../hooks/use-usuarios';
import { useSession } from '../../auth/hooks/use-session';

interface UsuarioDetalleDialogProps {
  usuario: Usuario;
  onClose: () => void;
}

// Detalle de un usuario: cambiar rol y activar o desactivar la cuenta.
export const UsuarioDetalleDialog: React.FC<UsuarioDetalleDialogProps> = ({ usuario, onClose }) => {
  const { data: roles } = useRoles();
  const { data: sesion } = useSession();
  const update = useUpdateUsuario();

  const esSuperadmin = sesion?.roleKey === 'superadmin';
  const esPropia = sesion?.id === usuario.id;
  const esSuperadminObjetivo = usuario.roleKey === 'superadmin';
  const puedeEditarRol = !esSuperadminObjetivo || esSuperadmin;

  const [roleKey, setRoleKey] = useState(usuario.roleKey ?? '');
  const [activo, setActivo] = useState(usuario.status === 'Activo');

  const rolesAsignables = roles.filter((r) => r.key !== 'superadmin' || esSuperadmin);
  const cambioRol = roleKey !== (usuario.roleKey ?? '');
  const cambioEstado = activo !== (usuario.status === 'Activo');
  const hayCambios = cambioRol || cambioEstado;

  const guardar = async () => {
    const patch: { roleKey?: string; isActive?: boolean } = {};
    if (cambioRol) patch.roleKey = roleKey;
    if (cambioEstado) patch.isActive = activo;
    await update.mutateAsync({ id: usuario.id, patch });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
              {usuario.avatarText}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{usuario.name}</h3>
              <p className="text-xs text-muted-foreground font-mono truncate">{usuario.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground mb-0.5">Teléfono</p>
              <p className="font-mono">{usuario.phone ?? 'No registrado'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Alta</p>
              <p className="font-mono">{usuario.joinedAt}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="detalle-rol" className="font-medium block">Rol</label>
            <select
              id="detalle-rol"
              value={roleKey}
              disabled={!puedeEditarRol}
              onChange={(e) => setRoleKey(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium disabled:opacity-60"
            >
              {rolesAsignables.map((r) => (
                <option key={r.key} value={r.key}>{r.name}</option>
              ))}
            </select>
            {!puedeEditarRol && (
              <p className="text-[11px] text-muted-foreground">Solo el superadmin puede modificar esta cuenta.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="font-medium">Estado de la cuenta</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: true, label: 'Activa' },
                { value: false, label: 'Desactivada' },
              ].map((op) => (
                <button
                  key={op.label}
                  type="button"
                  disabled={esPropia && !op.value}
                  onClick={() => setActivo(op.value)}
                  className={`h-9 rounded-xl border text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    activo === op.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
            {esPropia && <p className="text-[11px] text-muted-foreground">No puedes desactivar tu propia cuenta.</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-secondary/20">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!hayCambios || update.isPending}
            onClick={guardar}
            className="text-xs"
          >
            {update.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
};

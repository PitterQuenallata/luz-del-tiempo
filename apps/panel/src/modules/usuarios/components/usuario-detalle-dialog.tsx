import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { luzApi } from '../../../shared/api/luz-api';
import { Usuario } from '../types/usuarios.types';
import { useEliminarUsuario, useRoles, useUpdateUsuario } from '../hooks/use-usuarios';
import { useSession } from '../../auth/hooks/use-session';
import { TelefonoInput, telefonoValido } from './telefono-input';
import { FotoPerfil } from './foto-perfil';
import { formatoUltimoAcceso } from '../lib/usuario';
import { confirmar } from '../../../shared/lib/confirm';
import { errorNombre, normalizarNombre } from '../../../shared/lib/validaciones';

interface UsuarioDetalleDialogProps {
  usuario: Usuario;
  onClose: () => void;
}

// Ver y editar un usuario: fotos, nombres, teléfono, rol y estado; y eliminarlo.
export const UsuarioDetalleDialog: React.FC<UsuarioDetalleDialogProps> = ({ usuario, onClose }) => {
  const roles = useRoles().data;
  const { data: sesion } = useSession();
  const update = useUpdateUsuario();
  const eliminar = useEliminarUsuario();
  const { data: paisesData } = useQuery({ queryKey: ['paises'], queryFn: () => luzApi.listPaises(), staleTime: Infinity });
  const paises = paisesData?.paises ?? [];

  const esSuperadmin = sesion?.roleKey === 'superadmin';
  const esPropia = sesion?.id === usuario.id;
  const puedeEditarRol = usuario.roleKey !== 'superadmin' || esSuperadmin;
  const eliminado = usuario.status === 'Eliminado';

  const [firstName, setFirstName] = useState(usuario.firstName ?? '');
  const [lastName, setLastName] = useState(usuario.lastName ?? '');
  const [phoneCode, setPhoneCode] = useState(usuario.phoneCode ?? paisesData?.predeterminado ?? '+591');
  const [phone, setPhone] = useState(usuario.phone ?? '');
  const [roleKey, setRoleKey] = useState(usuario.roleKey ?? '');
  const [activo, setActivo] = useState(usuario.status === 'Activo');

  const rolesAsignables = roles.filter((r) => r.key !== 'superadmin' || esSuperadmin);
  const telValido = telefonoValido(phoneCode, phone, paises);
  const patch: Record<string, unknown> = {};
  if (firstName.trim() !== (usuario.firstName ?? '')) patch.firstName = firstName.trim();
  if (lastName.trim() !== (usuario.lastName ?? '')) patch.lastName = lastName.trim();
  if (phoneCode !== (usuario.phoneCode ?? '') || (phone || null) !== (usuario.phone ?? null)) {
    patch.phoneCode = phoneCode;
    patch.phone = phone || null;
  }
  if (roleKey && roleKey !== usuario.roleKey) patch.roleKey = roleKey;
  if (activo !== (usuario.status === 'Activo')) patch.isActive = activo;
  const hayCambios = Object.keys(patch).length > 0;
  const errNombres = errorNombre(firstName, 'Nombres');
  const errApellidos = errorNombre(lastName, 'Apellidos');
  const valido = !errNombres && !errApellidos && telValido;

  const guardar = async () => {
    if (patch.firstName) patch.firstName = normalizarNombre(String(patch.firstName));
    if (patch.lastName) patch.lastName = normalizarNombre(String(patch.lastName));
    await update.mutateAsync({ id: usuario.id, patch });
    onClose();
  };

  const borrar = async () => {
    const ok = await confirmar({
      type: 'danger',
      title: `¿Eliminar a ${usuario.name}?`,
      text: usuario.lastLoginAt
        ? 'Esta cuenta ya tuvo actividad: se marcará como eliminada y se conservará el historial.'
        : 'La cuenta no tiene actividad: se borrará definitivamente.',
      confirmText: 'Eliminar',
    });
    if (ok) eliminar.mutate(usuario.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <FotoPerfil id={usuario.id} fotoUrl={usuario.fotoUrl} iniciales={usuario.avatarText} tamano="h-14 w-14" editable={!eliminado} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{usuario.name}</h3>
              <p className="text-xs text-muted-foreground font-mono truncate">{usuario.email}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Último acceso: {formatoUltimoAcceso(usuario.lastLoginAt)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {usuario.mustChangePassword && (
            <p className="text-[11px] rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">Debe cambiar su contraseña inicial al entrar.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="det-nombres" className="font-medium block">Nombres</label>
              <Input id="det-nombres" value={firstName} disabled={eliminado} onChange={(e) => setFirstName(e.target.value)} onBlur={() => setFirstName(normalizarNombre(firstName))} className="text-xs" />
              {errNombres && <p className="text-[11px] text-red-400">{errNombres}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="det-apellidos" className="font-medium block">Apellidos</label>
              <Input id="det-apellidos" value={lastName} disabled={eliminado} onChange={(e) => setLastName(e.target.value)} onBlur={() => setLastName(normalizarNombre(lastName))} className="text-xs" />
              {errApellidos && <p className="text-[11px] text-red-400">{errApellidos}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="font-medium">Teléfono</p>
            <TelefonoInput id="det-tel" codigo={phoneCode} numero={phone} onChange={(c, n) => { setPhoneCode(c); setPhone(n); }} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="det-rol" className="font-medium block">Rol</label>
            <select
              id="det-rol"
              value={roleKey}
              disabled={!puedeEditarRol || eliminado}
              onChange={(e) => setRoleKey(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs disabled:opacity-60"
            >
              {rolesAsignables.map((r) => (
                <option key={r.key} value={r.key}>{r.name}</option>
              ))}
            </select>
            {!puedeEditarRol && <p className="text-[11px] text-muted-foreground">Solo el superadmin puede modificar esta cuenta.</p>}
          </div>
          {!eliminado && (
            <div className="space-y-1.5">
              <p className="font-medium">Estado</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: true, label: 'Activo' }, { value: false, label: 'Inactivo' }].map((op) => (
                  <button
                    key={op.label}
                    type="button"
                    disabled={esPropia && !op.value}
                    onClick={() => setActivo(op.value)}
                    className={`h-9 rounded-xl border text-xs font-medium cursor-pointer disabled:opacity-50 ${
                      activo === op.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              {esPropia && <p className="text-[11px] text-muted-foreground">No puedes desactivar tu propia cuenta.</p>}
            </div>
          )}
          {eliminado && <p className="text-[11px] text-muted-foreground">Cuenta eliminada. Se conserva el historial y no puede entrar.</p>}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-border/60 bg-secondary/20">
          {!eliminado && !esPropia ? (
            <Button type="button" variant="ghost" size="sm" onClick={borrar} className="text-xs text-destructive gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
            {!eliminado && (
              <Button type="button" variant="default" size="sm" disabled={!hayCambios || !valido || update.isPending} onClick={guardar} className="text-xs">
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

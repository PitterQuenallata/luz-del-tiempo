import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { usuarioEditarSchema, normalizarNombre } from '@luz/shared';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Usuario } from '../types/usuarios.types';
import { useEliminarUsuario, useRoles, useUpdateUsuario } from '../hooks/use-usuarios';
import { useSession } from '../../auth/hooks/use-session';
import { mensajeCampo } from '../../../shared/lib/form';
import { confirmar } from '../../../shared/lib/confirm';
import { TelefonoInput } from './telefono-input';
import { FotoPerfil } from './foto-perfil';
import { SelectField } from './select-field';
import { formatoUltimoAcceso } from '../lib/usuario';

interface UsuarioDetalleDialogProps {
  usuario: Usuario;
  onClose: () => void;
}

const Error_: React.FC<{ texto: string | null }> = ({ texto }) => (texto ? <p className="text-[11px] text-red-400">{texto}</p> : null);

// Ver y editar un usuario con TanStack Form y el esquema compartido.
export const UsuarioDetalleDialog: React.FC<UsuarioDetalleDialogProps> = ({ usuario, onClose }) => {
  const roles = useRoles().data;
  const { data: sesion } = useSession();
  const update = useUpdateUsuario();
  const eliminar = useEliminarUsuario();

  const esSuperadmin = sesion?.roleKey === 'superadmin';
  const esPropia = sesion?.id === usuario.id;
  const puedeEditarRol = usuario.roleKey !== 'superadmin' || esSuperadmin;
  const eliminado = usuario.status === 'Eliminado';
  const rolesAsignables = roles.filter((r) => r.key !== 'superadmin' || esSuperadmin);

  const form = useForm({
    defaultValues: {
      firstName: usuario.firstName ?? '',
      lastName: usuario.lastName ?? '',
      phoneCode: usuario.phoneCode ?? '+591',
      phone: usuario.phone ?? '',
      roleKey: usuario.roleKey ?? '',
      isActive: usuario.status === 'Activo',
    },
    validators: { onChange: usuarioEditarSchema, onSubmit: usuarioEditarSchema },
    onSubmit: async ({ value }) => {
      const datos = usuarioEditarSchema.parse(value);
      const patch: Record<string, unknown> = {};
      if (datos.firstName !== (usuario.firstName ?? '')) patch.firstName = datos.firstName;
      if (datos.lastName !== (usuario.lastName ?? '')) patch.lastName = datos.lastName;
      if (datos.phone !== (usuario.phone ?? '') || datos.phoneCode !== (usuario.phoneCode ?? '')) {
        patch.phoneCode = datos.phoneCode;
        patch.phone = datos.phone || null;
      }
      if (datos.roleKey !== usuario.roleKey) patch.roleKey = datos.roleKey;
      if (datos.isActive !== (usuario.status === 'Activo')) patch.isActive = datos.isActive;
      if (Object.keys(patch).length === 0) return onClose();
      await update.mutateAsync({ id: usuario.id, patch });
      onClose();
    },
  });

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
      <form
        role="dialog"
        aria-modal="true"
        noValidate
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
      >
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
            <form.Field name="firstName">
              {(f) => (
                <div className="space-y-1.5">
                  <label htmlFor="det-nombres" className="font-medium block">Nombres</label>
                  <Input id="det-nombres" value={f.state.value} disabled={eliminado} onChange={(e) => f.handleChange(e.target.value)} onBlur={() => { f.handleChange(normalizarNombre(f.state.value)); f.handleBlur(); }} className="text-xs" />
                  {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
                </div>
              )}
            </form.Field>
            <form.Field name="lastName">
              {(f) => (
                <div className="space-y-1.5">
                  <label htmlFor="det-apellidos" className="font-medium block">Apellidos</label>
                  <Input id="det-apellidos" value={f.state.value} disabled={eliminado} onChange={(e) => f.handleChange(e.target.value)} onBlur={() => { f.handleChange(normalizarNombre(f.state.value)); f.handleBlur(); }} className="text-xs" />
                  {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
                </div>
              )}
            </form.Field>
          </div>

          <div className="space-y-1.5">
            <p className="font-medium">Teléfono</p>
            <form.Field name="phoneCode">
              {(codigo) => (
                <form.Field name="phone">
                  {(numero) => (
                    <>
                      <TelefonoInput id="det-tel" codigo={codigo.state.value} numero={numero.state.value} onChange={(c, n) => { codigo.handleChange(c); numero.handleChange(n); }} />
                      {numero.state.meta.isTouched && <Error_ texto={mensajeCampo(numero.state.meta.errors)} />}
                    </>
                  )}
                </form.Field>
              )}
            </form.Field>
          </div>

          <form.Field name="roleKey">
            {(f) => (
              <div className="space-y-1.5">
                <label htmlFor="det-rol" className="font-medium block">Rol</label>
                <SelectField id="det-rol" value={f.state.value} disabled={!puedeEditarRol || eliminado} onChange={(e) => f.handleChange(e.target.value)}>
                  {rolesAsignables.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
                </SelectField>
                {!puedeEditarRol && <p className="text-[11px] text-muted-foreground">Solo el superadmin puede modificar esta cuenta.</p>}
              </div>
            )}
          </form.Field>

          {!eliminado && (
            <form.Field name="isActive">
              {(f) => (
                <div className="space-y-1.5">
                  <p className="font-medium">Estado</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: true, label: 'Activo' }, { value: false, label: 'Inactivo' }].map((op) => (
                      <button
                        key={op.label}
                        type="button"
                        disabled={esPropia && !op.value}
                        onClick={() => f.handleChange(op.value)}
                        className={`h-9 rounded-xl border text-xs font-medium cursor-pointer disabled:opacity-50 ${
                          f.state.value === op.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                  {esPropia && <p className="text-[11px] text-muted-foreground">No puedes desactivar tu propia cuenta.</p>}
                </div>
              )}
            </form.Field>
          )}
          {eliminado && <p className="text-[11px] text-muted-foreground">Cuenta eliminada. Se conserva el historial y no puede entrar.</p>}
        </div>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting, s.isDirty]}>
          {([puedeEnviar, enviando, cambio]) => (
            <div className="flex items-center justify-between gap-2 p-4 border-t border-border/60 bg-secondary/20">
              {!eliminado && !esPropia ? (
                <Button type="button" variant="ghost" size="sm" onClick={borrar} className="text-xs text-destructive gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </Button>
              ) : <span />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
                {!eliminado && (
                  <Button type="submit" variant="default" size="sm" disabled={!cambio || !puedeEnviar || enviando} className="text-xs">
                    {enviando ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
};

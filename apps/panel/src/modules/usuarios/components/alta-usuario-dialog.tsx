import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { usuarioAltaSchema, contrasenaInicial, normalizarNombre } from '@luz/shared';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { luzApi } from '../../../shared/api/luz-api';
import { copiarTexto } from '../../../shared/lib/clipboard';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { mensajeCampo } from '../../../shared/lib/form';
import { useRoles, useCreateUsuario } from '../hooks/use-usuarios';
import { TelefonoInput } from './telefono-input';
import { SelectField } from './select-field';
import { useSession } from '../../auth/hooks/use-session';

interface AltaUsuarioDialogProps {
  onClose: () => void;
}

const Error_: React.FC<{ texto: string | null }> = ({ texto }) => (texto ? <p className="text-[11px] text-red-400">{texto}</p> : null);

// Alta de usuario con TanStack Form y el esquema compartido (@luz/shared).
export const AltaUsuarioDialog: React.FC<AltaUsuarioDialogProps> = ({ onClose }) => {
  const roles = useRoles().data;
  const { data: sesion } = useSession();
  const crear = useCreateUsuario();
  const { data: paisesData } = useQuery({ queryKey: ['paises'], queryFn: () => luzApi.listPaises(), staleTime: Infinity });
  const [creado, setCreado] = useState<{ nombre: string; email: string; contrasena: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const form = useForm({
    defaultValues: { firstName: '', lastName: '', email: '', phoneCode: '+591', phone: '', roleKey: 'editor' },
    validators: { onChange: usuarioAltaSchema, onSubmit: usuarioAltaSchema },
    onSubmit: async ({ value }) => {
      const datos = usuarioAltaSchema.parse(value);
      await crear.mutateAsync(
        { firstName: datos.firstName, lastName: datos.lastName, email: datos.email, phoneCode: datos.phoneCode, phone: datos.phone, roleKey: datos.roleKey },
        { onSuccess: (res) => setCreado({ nombre: res.usuario.name, email: res.usuario.email, contrasena: res.contrasenaInicial }) }
      );
    },
  });

  const rolesAsignables = roles.filter((r) => r.key !== 'superadmin' || sesion?.roleKey === 'superadmin');
  const copiar = async (texto: string) => {
    if (await copiarTexto(texto)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } else {
      pillToast.error('No se pudo copiar', 'Selecciona la contraseña y cópiala a mano.');
    }
  };

  if (creado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-xl">
          <div className="p-5 border-b border-border/60">
            <h3 className="text-sm font-semibold">Usuario creado</h3>
            <p className="text-xs text-muted-foreground mt-1">{creado.nombre} · {creado.email}</p>
          </div>
          <div className="p-5 space-y-3 text-xs">
            <p>Entrega esta contraseña inicial. La cambiará al entrar por primera vez.</p>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-3">
              <span className="font-mono text-base font-semibold select-all">{creado.contrasena}</span>
              <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => copiar(creado.contrasena)}>
                {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">No se volverá a mostrar. Si la pierdes, el administrador puede editar la cuenta.</p>
          </div>
          <div className="flex justify-end p-4 border-t border-border/60 bg-secondary/20">
            <Button type="button" variant="default" size="sm" onClick={onClose} className="text-xs">Listo</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        noValidate
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h3 className="text-sm font-semibold">Nuevo usuario</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="firstName">
              {(f) => (
                <div className="space-y-1.5">
                  <label htmlFor="alta-nombres" className="font-medium block">Nombres *</label>
                  <Input id="alta-nombres" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={() => { f.handleChange(normalizarNombre(f.state.value)); f.handleBlur(); }} className="text-xs" />
                  {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
                </div>
              )}
            </form.Field>
            <form.Field name="lastName">
              {(f) => (
                <div className="space-y-1.5">
                  <label htmlFor="alta-apellidos" className="font-medium block">Apellidos *</label>
                  <Input id="alta-apellidos" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={() => { f.handleChange(normalizarNombre(f.state.value)); f.handleBlur(); }} className="text-xs" />
                  {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="email">
            {(f) => (
              <div className="space-y-1.5">
                <label htmlFor="alta-correo" className="font-medium block">Correo *</label>
                <Input id="alta-correo" type="email" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="text-xs font-mono" />
                {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
              </div>
            )}
          </form.Field>

          <div className="space-y-1.5">
            <p className="font-medium">Teléfono</p>
            <form.Field name="phoneCode">
              {(codigo) => (
                <form.Field name="phone">
                  {(numero) => (
                    <>
                      <TelefonoInput
                        id="alta-tel"
                        codigo={codigo.state.value}
                        numero={numero.state.value}
                        onChange={(c, n) => { codigo.handleChange(c); numero.handleChange(n); }}
                      />
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
                <label htmlFor="alta-rol" className="font-medium block">Rol *</label>
                <SelectField id="alta-rol" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                  {rolesAsignables.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
                </SelectField>
                {f.state.meta.isTouched && <Error_ texto={mensajeCampo(f.state.meta.errors)} />}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.values.lastName}>
            {(apellidos) => {
              const preview = apellidos.trim() ? contrasenaInicial(apellidos) : '';
              return (
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Contraseña inicial: Apellido*.</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="font-mono text-sm font-semibold">{preview || '—'}</p>
                    {preview && (
                      <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => copiar(preview)}>
                        {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiado ? 'Copiado' : 'Copiar'}
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Primer apellido con inicial mayúscula, seguido de *. La cambiará al entrar por primera vez.</p>
                </div>
              );
            }}
          </form.Subscribe>
        </div>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([puedeEnviar, enviando]) => (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-secondary/20">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
              <Button type="submit" variant="default" size="sm" disabled={!puedeEnviar || enviando} className="text-xs">
                {enviando ? 'Creando…' : 'Crear usuario'}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
};

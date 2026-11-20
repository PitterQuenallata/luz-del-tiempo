import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { copiarTexto } from '../../../shared/lib/clipboard';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { luzApi } from '../../../shared/api/luz-api';
import { useRoles, useCreateUsuario } from '../hooks/use-usuarios';
import { TelefonoInput, telefonoValido } from './telefono-input';
import { contrasenaInicialPreview } from '../lib/usuario';
import { useSession } from '../../auth/hooks/use-session';
import { useQuery } from '@tanstack/react-query';

interface AltaUsuarioDialogProps {
  onClose: () => void;
}

// Alta de usuario: nombres, apellidos, correo, teléfono, rol. La contraseña inicial es el apellido.
export const AltaUsuarioDialog: React.FC<AltaUsuarioDialogProps> = ({ onClose }) => {
  const roles = useRoles().data;
  const { data: sesion } = useSession();
  const crear = useCreateUsuario();
  const { data: paisesData } = useQuery({ queryKey: ['paises'], queryFn: () => luzApi.listPaises(), staleTime: Infinity });
  const paises = paisesData?.paises ?? [];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState(paisesData?.predeterminado ?? '+591');
  const [phone, setPhone] = useState('');
  const [roleKey, setRoleKey] = useState('editor');
  const [creado, setCreado] = useState<{ nombre: string; email: string; contrasena: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const rolesAsignables = roles.filter((r) => r.key !== 'superadmin' || sesion?.roleKey === 'superadmin');
  const preview = contrasenaInicialPreview(lastName);
  const valido =
    firstName.trim() && lastName.trim() && email.trim() && roleKey && telefonoValido(phoneCode, phone, paises) && preview.length >= 4;

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    crear.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phoneCode, phone, roleKey },
      {
        onSuccess: (res) => setCreado({ nombre: res.usuario.name, email: res.usuario.email, contrasena: res.contrasenaInicial }),
      }
    );
  };

  const copiar = async (texto: string) => {
    const ok = await copiarTexto(texto);
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } else {
      pillToast.error('No se pudo copiar', 'Selecciona la contraseña y cópiala a mano.');
    }
  };

  // Pantalla de resultado: la contraseña inicial solo se muestra en este momento
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
        onClick={(e) => e.stopPropagation()}
        onSubmit={guardar}
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
            <div className="space-y-1.5">
              <label htmlFor="alta-nombres" className="font-medium block">Nombres *</label>
              <Input id="alta-nombres" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="text-xs" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="alta-apellidos" className="font-medium block">Apellidos *</label>
              <Input id="alta-apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} className="text-xs" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="alta-correo" className="font-medium block">Correo *</label>
            <Input id="alta-correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-xs font-mono" required />
          </div>

          <div className="space-y-1.5">
            <p className="font-medium">Teléfono</p>
            <TelefonoInput id="alta-tel" codigo={phoneCode} numero={phone} onChange={(c, n) => { setPhoneCode(c); setPhone(n); }} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="alta-rol" className="font-medium block">Rol *</label>
            <select id="alta-rol" value={roleKey} onChange={(e) => setRoleKey(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs">
              {rolesAsignables.map((r) => (
                <option key={r.key} value={r.key}>{r.name}</option>
              ))}
            </select>
          </div>

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
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-secondary/20">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
          <Button type="submit" variant="default" size="sm" disabled={!valido || crear.isPending} className="text-xs">
            {crear.isPending ? 'Creando…' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </div>
  );
};

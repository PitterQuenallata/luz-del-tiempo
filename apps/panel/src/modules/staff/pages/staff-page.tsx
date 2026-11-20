import React, { useState } from 'react';
import { Pencil, Trash2, Plus, UserPlus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { ApiRole, luzApi } from '../../../shared/api/luz-api';
import { useSession } from '../../auth/hooks/use-session';
import { useRoles, useUsuarios, useCreateUsuario } from '../../usuarios/hooks/use-usuarios';
import { usePermisos, useEliminarRol } from '../hooks/use-roles';
import { MatrizPermisos } from '../components/matriz-permisos';
import { RolDialog } from '../components/rol-dialog';

export const StaffPage: React.FC = () => {
  const { data: sesion } = useSession();
  const esSuperadmin = sesion?.roleKey === 'superadmin';
  const usuarios = useUsuarios().data ?? [];
  const roles = useRoles().data;
  const permisos = usePermisos().data ?? [];
  const eliminarRol = useEliminarRol();
  const crearMiembro = useCreateUsuario();

  const [rolEditando, setRolEditando] = useState<ApiRole | null | 'nuevo'>(null);
  const [altaAbierta, setAltaAbierta] = useState(false);
  const equipo = usuarios.filter((u) => u.roleKey);

  return (
    <div className="space-y-10 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Administración / Staff &amp; Permisos</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Staff &amp; Permisos</h1>
        <p className="text-sm text-muted-foreground mt-1">Equipo del panel, roles y lo que puede hacer cada rol.</p>
      </div>

      {/* Equipo */}
      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Equipo del panel</CardTitle>
            <CardDescription className="text-xs">Cuentas que tienen un rol y acceso al panel.</CardDescription>
          </div>
          <Button variant="default" size="sm" className="text-xs gap-1.5" onClick={() => setAltaAbierta(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Agregar miembro
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border/60 bg-secondary/30 text-left">
                <th className="px-4 py-2.5 font-medium">Nombre</th>
                <th className="px-4 py-2.5 font-medium">Correo</th>
                <th className="px-4 py-2.5 font-medium">Rol</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {equipo.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Aún no hay miembros.</td></tr>
              )}
              {equipo.map((u) => (
                <tr key={u.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5">{u.role}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={u.status === 'Activo' ? 'success' : 'secondary'}>{u.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Roles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Roles</h2>
            <p className="text-xs text-muted-foreground">{esSuperadmin ? 'Crea, edita o elimina roles.' : 'Solo el superadmin puede cambiar los roles.'}</p>
          </div>
          {esSuperadmin && (
            <Button variant="default" size="sm" className="text-xs gap-1.5" onClick={() => setRolEditando('nuevo')}>
              <Plus className="h-3.5 w-3.5" /> Nuevo rol
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {roles.map((rol) => (
            <Card key={rol.id} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">{rol.name}</CardTitle>
                  <Badge variant="secondary" className="text-[10px] font-mono">{rol.isSystem ? 'Sistema' : 'Personalizado'}</Badge>
                </div>
                <CardDescription className="text-[11px] font-mono">{rol.key}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                <p className="text-muted-foreground min-h-[2.5rem]">{rol.description ?? ''}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{rol.miembros}</p>
                    <p className="text-muted-foreground">{rol.miembros === 1 ? 'usuario' : 'usuarios'}</p>
                  </div>
                  {esSuperadmin && rol.key !== 'superadmin' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="iconSm" title="Editar rol" onClick={() => setRolEditando(rol)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!rol.isSystem && (
                        <Button
                          variant="ghost"
                          size="iconSm"
                          title="Eliminar rol"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar el rol "${rol.name}"?`)) eliminarRol.mutate(rol.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Matriz */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Matriz de permisos</CardTitle>
          <CardDescription className="text-xs">
            {esSuperadmin ? 'Marca qué puede hacer cada rol y guarda los cambios.' : 'Lo que puede hacer cada rol.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <MatrizPermisos roles={roles} permisos={permisos} editable={esSuperadmin} />
        </CardContent>
      </Card>

      {rolEditando && (
        <RolDialog rol={rolEditando === 'nuevo' ? null : rolEditando} onClose={() => setRolEditando(null)} />
      )}
      {altaAbierta && (
        <AltaMiembro
          roles={roles.filter((r) => r.key !== 'superadmin' || esSuperadmin)}
          onClose={() => setAltaAbierta(false)}
          onSubmit={(input) => crearMiembro.mutate(input, { onSuccess: () => setAltaAbierta(false) })}
          guardando={crearMiembro.isPending}
        />
      )}
    </div>
  );
};

const AltaMiembro: React.FC<{
  roles: ApiRole[];
  onClose: () => void;
  onSubmit: (input: { name: string; email: string; password: string; phone?: string; roleKey: string }) => void;
  guardando: boolean;
}> = ({ roles, onClose, onSubmit, guardando }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [roleKey, setRoleKey] = useState(roles.find((r) => r.key === 'editor')?.key ?? roles[0]?.key ?? '');
  const valido = name.trim() && email.trim() && password.length >= 8 && roleKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) onSubmit({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined, roleKey });
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h3 className="text-sm font-semibold">Agregar miembro</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="m-nombre" className="font-medium block">Nombre completo *</label>
            <Input id="m-nombre" value={name} onChange={(e) => setName(e.target.value)} className="text-xs" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="m-correo" className="font-medium block">Correo *</label>
            <Input id="m-correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-xs font-mono" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="m-pass" className="font-medium block">Contraseña inicial *</label>
            <Input id="m-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="text-xs" minLength={8} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="m-rol" className="font-medium block">Rol *</label>
              <select id="m-rol" value={roleKey} onChange={(e) => setRoleKey(e.target.value)} className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs">
                {roles.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="m-tel" className="font-medium block">Teléfono</label>
              <Input id="m-tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-xs font-mono" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-secondary/20">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
          <Button type="submit" variant="default" size="sm" disabled={!valido || guardando} className="text-xs">
            {guardando ? 'Creando…' : 'Crear miembro'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StaffPage;

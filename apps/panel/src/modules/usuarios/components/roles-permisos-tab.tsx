import React, { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { ApiRole } from '../../../shared/api/luz-api';
import { useSession } from '../../auth/hooks/use-session';
import { useRoles } from '../hooks/use-usuarios';
import { usePermisos, useEliminarRol } from '../hooks/use-roles';
import { MatrizPermisos } from './matriz-permisos';
import { RolDialog } from './rol-dialog';
import { confirmar } from '../../../shared/lib/confirm';

// Roles en tabla compacta + matriz de permisos. Solo el superadmin cambia roles.
export const RolesPermisosTab: React.FC = () => {
  const { data: sesion } = useSession();
  const esSuperadmin = sesion?.roleKey === 'superadmin';
  const roles = useRoles().data;
  const permisos = usePermisos().data ?? [];
  const eliminarRol = useEliminarRol();
  const [rolEditando, setRolEditando] = useState<ApiRole | null | 'nuevo'>(null);

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Roles</CardTitle>
            <CardDescription className="text-xs">
              {esSuperadmin ? 'Crea, edita o elimina roles.' : 'Solo el superadmin puede cambiar los roles.'}
            </CardDescription>
          </div>
          {esSuperadmin && (
            <Button variant="default" size="sm" className="text-xs gap-1.5" onClick={() => setRolEditando('nuevo')}>
              <Plus className="h-3.5 w-3.5" /> Nuevo rol
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border/60 bg-secondary/30 text-left">
                <th className="px-4 py-2.5 font-medium">Rol</th>
                <th className="px-4 py-2.5 font-medium">Descripción</th>
                <th className="px-4 py-2.5 font-medium">Tipo</th>
                <th className="px-4 py-2.5 font-medium text-right">Usuarios</th>
                <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((rol) => {
                const puedeEditar = esSuperadmin && rol.key !== 'superadmin';
                return (
                  <tr key={rol.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{rol.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{rol.key}</p>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{rol.description ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-[10px]">{rol.isSystem ? 'Sistema' : 'Personalizado'}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{rol.miembros}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        {puedeEditar && (
                          <Button variant="ghost" size="iconSm" title="Editar rol" onClick={() => setRolEditando(rol)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {puedeEditar && !rol.isSystem && (
                          <Button
                            variant="ghost"
                            size="iconSm"
                            title="Eliminar rol"
                            onClick={async () => {
                              const ok = await confirmar({
                                type: 'danger',
                                title: `¿Eliminar el rol "${rol.name}"?`,
                                text: 'Solo se puede si ningún usuario tiene este rol.',
                                confirmText: 'Eliminar',
                              });
                              if (ok) eliminarRol.mutate(rol.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

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

      {rolEditando && <RolDialog rol={rolEditando === 'nuevo' ? null : rolEditando} onClose={() => setRolEditando(null)} />}
    </div>
  );
};

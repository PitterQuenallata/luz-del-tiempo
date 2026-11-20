import React, { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { usuariosColumns } from './usuarios-columns';
import { UsuarioDetalleDialog } from './usuario-detalle-dialog';
import { AltaUsuarioDialog } from './alta-usuario-dialog';
import { Usuario } from '../types/usuarios.types';
import { confirmar } from '../../../shared/lib/confirm';
import { useEliminarUsuario, useRoles, useUpdateUsuario, useUsuarios } from '../hooks/use-usuarios';

type FiltroEstado = 'todos' | 'activos' | 'inactivos' | 'eliminados';

// Directorio de usuarios: tabla compacta con cifras en una línea y filtros.
export const UsuariosDirectoryTab: React.FC = () => {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [altaAbierta, setAltaAbierta] = useState(false);

  const vigentes = useUsuarios('vigentes');
  const eliminados = useUsuarios('eliminados');
  const roles = useRoles().data;
  const update = useUpdateUsuario();
  const eliminar = useEliminarUsuario();

  const todos = vigentes.data ?? [];
  const cuentasEliminadas = eliminados.data ?? [];
  const activos = todos.filter((u) => u.status === 'Activo').length;
  const inactivos = todos.filter((u) => u.status === 'Inactivo').length;

  const datos = useMemo(() => {
    if (filtroEstado === 'eliminados') return cuentasEliminadas;
    return todos.filter((u) => {
      if (filtroEstado === 'activos' && u.status !== 'Activo') return false;
      if (filtroEstado === 'inactivos' && u.status !== 'Inactivo') return false;
      if (filtroRol !== 'todos' && u.roleKey !== filtroRol && !(filtroRol === 'sin_rol' && !u.roleKey)) return false;
      return true;
    });
  }, [filtroEstado, filtroRol, todos, cuentasEliminadas]);

  const columnas = useMemo(
    () =>
      usuariosColumns({
        onEdit: (u) => setSeleccionado(u),
        onToggleActivo: async (u) => {
          const activar = u.status !== 'Activo';
          const ok = await confirmar({
            type: activar ? 'info' : 'warning',
            title: activar ? `¿Activar a ${u.name}?` : `¿Desactivar a ${u.name}?`,
            text: activar ? 'Podrá volver a entrar al panel.' : 'No podrá entrar al panel hasta que se active de nuevo.',
            confirmText: activar ? 'Activar' : 'Desactivar',
          });
          if (ok) update.mutate({ id: u.id, patch: { isActive: activar } });
        },
        onEliminar: async (u) => {
          const ok = await confirmar({
            type: 'danger',
            title: `¿Eliminar a ${u.name}?`,
            text: u.lastLoginAt
              ? 'Esta cuenta ya tuvo actividad: se marcará como eliminada y se conservará el historial.'
              : 'La cuenta no tiene actividad: se borrará definitivamente.',
            confirmText: 'Eliminar',
          });
          if (ok) eliminar.mutate(u.id);
        },
      }),
    [update, eliminar]
  );

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-4 border-b border-border/50">
          <div>
            <CardTitle className="text-base font-bold">Directorio de usuarios</CardTitle>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {todos.length} usuarios · {activos} activos · {inactivos} inactivos · {cuentasEliminadas.length} eliminados
            </p>
            <CardDescription className="text-xs mt-1">Cuentas del panel, su rol y su estado.</CardDescription>
          </div>
          <Button variant="default" size="sm" className="text-xs gap-1.5" onClick={() => setAltaAbierta(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Nuevo usuario
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-wrap gap-2 p-4 border-b border-border/50">
            <select
              aria-label="Filtrar por estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="h-9 px-3 rounded-xl border border-border bg-background text-xs"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
              <option value="eliminados">Eliminados</option>
            </select>
            <select
              aria-label="Filtrar por rol"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="h-9 px-3 rounded-xl border border-border bg-background text-xs"
            >
              <option value="todos">Todos los roles</option>
              <option value="sin_rol">Sin rol</option>
              {roles.map((r) => (
                <option key={r.key} value={r.key}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4">
            <DataTable columns={columnas} data={datos} searchKey="name" searchPlaceholder="Buscar por nombre o correo..." enableExport={false} />
          </div>
        </CardContent>
      </Card>

      {seleccionado && <UsuarioDetalleDialog usuario={seleccionado} onClose={() => setSeleccionado(null)} />}
      {altaAbierta && <AltaUsuarioDialog onClose={() => setAltaAbierta(false)} />}
    </div>
  );
};

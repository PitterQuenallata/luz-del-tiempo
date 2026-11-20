import { ColumnDef } from '@tanstack/react-table';
import { Usuario } from '../types/usuarios.types';
import { DataTableColumnHeader } from '../../../shared/components/data-table/data-table-column-header';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Edit2, Trash2, RotateCcw } from 'lucide-react';
import { formatoUltimoAcceso } from '../lib/usuario';

interface UsuariosColumnsActions {
  onEdit: (usuario: Usuario) => void;
  onToggleActivo: (usuario: Usuario) => void;
  onEliminar: (usuario: Usuario) => void;
}

// Columnas de la tabla: usuario, rol, estado, último acceso y acciones.
export const usuariosColumns = (acciones: UsuariosColumnsActions): ColumnDef<Usuario>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          {user.fotoUrl ? (
            <img src={user.fotoUrl} alt="" className="h-8 w-8 rounded-xl object-cover border border-border shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px] shrink-0">
              {user.avatarText}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
    cell: ({ row }) => <span className="text-xs">{row.getValue('role') as string}</span>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as Usuario['status'];
      const variante = status === 'Activo' ? 'success' : status === 'Eliminado' ? 'destructive' : 'secondary';
      return <Badge variant={variante}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'lastLoginAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Último acceso" />,
    cell: ({ row }) => (
      <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
        {formatoUltimoAcceso(row.original.lastLoginAt)}
      </span>
    ),
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => {
      const user = row.original;
      if (user.status === 'Eliminado') return null;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="iconSm" title="Ver y editar" onClick={() => acciones.onEdit(user)}>
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="iconSm"
            title={user.status === 'Activo' ? 'Desactivar' : 'Activar'}
            onClick={() => acciones.onToggleActivo(user)}
          >
            <RotateCcw className={user.status === 'Activo' ? 'h-3.5 w-3.5 text-muted-foreground' : 'h-3.5 w-3.5 text-primary'} />
          </Button>
          <Button variant="ghost" size="iconSm" title="Eliminar" onClick={() => acciones.onEliminar(user)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      );
    },
  },
];

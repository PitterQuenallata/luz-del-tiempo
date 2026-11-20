import { ColumnDef } from '@tanstack/react-table';
import { Usuario } from '../types/usuarios.types';
import { DataTableColumnHeader } from '../../../shared/components/data-table/data-table-column-header';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Edit2, Trash2, RotateCcw } from 'lucide-react';

interface UsuariosColumnsActions {
  onEdit: (usuario: Usuario) => void;
  onDeactivate: (usuario: Usuario) => void;
  onActivate: (usuario: Usuario) => void;
}

// Columnas de la tabla de usuarios: datos reales del modelo (sin plan ni facturación).
export const usuariosColumns = (acciones: UsuariosColumnsActions): ColumnDef<Usuario>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
            {user.avatarText}
          </div>
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
      const status = row.getValue('status') as string;
      return <Badge variant={status === 'Activo' ? 'success' : 'secondary'}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'joinedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Alta" />,
    cell: ({ row }) => <span className="font-mono text-[11px] text-muted-foreground">{row.getValue('joinedAt') as string}</span>,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => {
      const user = row.original;
      const activo = user.status === 'Activo';
      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="iconSm" soundType="click" title="Ver y editar" onClick={() => acciones.onEdit(user)}>
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          {activo ? (
            <Button variant="ghost" size="iconSm" soundType="alert" title="Desactivar" onClick={() => acciones.onDeactivate(user)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          ) : (
            <Button variant="ghost" size="iconSm" soundType="success" title="Reactivar" onClick={() => acciones.onActivate(user)}>
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
            </Button>
          )}
        </div>
      );
    },
  },
];

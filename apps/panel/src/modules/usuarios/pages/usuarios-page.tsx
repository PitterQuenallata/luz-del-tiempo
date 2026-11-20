import React from 'react';
import { useUsuarios, useCreateUsuario, useDeleteUsuario } from '../hooks/use-usuarios';
import { UsuariosDirectoryTab } from '../components/usuarios-directory-tab';
import { NuevoUsuarioInput } from '../../../shared/api/luz-api';

export const UsuariosPage: React.FC = () => {
  const { data: usuarios = [], isError } = useUsuarios();
  const createMutation = useCreateUsuario();
  const deleteMutation = useDeleteUsuario();

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Administración / Usuarios</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">Cuentas del panel, su rol y su estado.</p>
      </div>

      {isError && <p className="text-xs text-red-400">No se pudieron cargar los usuarios. Revisa tu sesión.</p>}

      <UsuariosDirectoryTab
        usuarios={usuarios}
        onAddUsuario={(input: NuevoUsuarioInput) => createMutation.mutate(input)}
        onDeleteUsuario={(id: string) => deleteMutation.mutate(id)}
      />
    </div>
  );
};

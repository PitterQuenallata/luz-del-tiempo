import React, { useState } from 'react';
import { useUsuarios, useCreateUsuario, useDeleteUsuario, useUpdateUsuario } from '../hooks/use-usuarios';
import { UsuariosDirectoryTab } from '../components/usuarios-directory-tab';
import { RolesPermisosTab } from '../components/roles-permisos-tab';
import { NuevoUsuarioInput } from '../../../shared/api/luz-api';
import { cn } from '../../../shared/lib/utils';

type Pestana = 'directorio' | 'roles';

const pestanaInicial = (): Pestana => (window.location.hash.includes('tab=roles') ? 'roles' : 'directorio');

export const UsuariosPage: React.FC = () => {
  const { data: usuarios = [], isError } = useUsuarios();
  const createMutation = useCreateUsuario();
  const deleteMutation = useDeleteUsuario();
  const updateMutation = useUpdateUsuario();
  const [pestana, setPestana] = useState<Pestana>(pestanaInicial);

  const cambiar = (p: Pestana) => {
    setPestana(p);
    window.location.hash = p === 'roles' ? '#/usuarios?tab=roles' : '#/usuarios';
  };

  const pestanas: { id: Pestana; label: string }[] = [
    { id: 'directorio', label: 'Directorio' },
    { id: 'roles', label: 'Roles y permisos' },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Administración / Usuarios</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">Cuentas del panel, sus roles y lo que puede hacer cada rol.</p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {pestanas.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => cambiar(p.id)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
              pestana === p.id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isError && <p className="text-xs text-red-400">No se pudieron cargar los usuarios. Revisa tu sesión.</p>}

      {pestana === 'directorio' && (
        <UsuariosDirectoryTab
          usuarios={usuarios}
          onAddUsuario={(input: NuevoUsuarioInput) => createMutation.mutate(input)}
          onDeleteUsuario={(id: string) => deleteMutation.mutate(id)}
          onActivateUsuario={(id: string) => updateMutation.mutate({ id, patch: { isActive: true } })}
        />
      )}

      {pestana === 'roles' && <RolesPermisosTab />}
    </div>
  );
};

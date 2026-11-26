import React, { useState } from 'react';
import { UsuariosDirectoryTab } from '../components/usuarios-directory-tab';
import { RolesPermisosTab } from '../components/roles-permisos-tab';
import { Pestanas } from '../../../shared/components/ui/pestanas';

type Pestana = 'directorio' | 'roles';

const pestanaInicial = (): Pestana => (window.location.hash.includes('tab=roles') ? 'roles' : 'directorio');

export const UsuariosPage: React.FC = () => {
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

      <Pestanas valor={pestana} items={pestanas} alCambiar={cambiar} />


      {pestana === 'directorio' && <UsuariosDirectoryTab />}

      {pestana === 'roles' && <RolesPermisosTab />}
    </div>
  );
};

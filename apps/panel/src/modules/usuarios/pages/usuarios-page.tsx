import React, { useState } from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import { useUsuarios, useCreateUsuario, useDeleteUsuario } from '../hooks/use-usuarios';
import { UsuariosDirectoryTab } from '../components/usuarios-directory-tab';
import { RolesPermisosTab } from '../components/roles-permisos-tab';
import { NuevoUsuarioInput } from '../../../shared/api/luz-api';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

export type UsuariosSubTab = 'directory' | 'roles';

const tabDesdeHash = (): UsuariosSubTab =>
  window.location.hash.includes('tab=roles') ? 'roles' : 'directory';

export const UsuariosPage: React.FC = () => {
  const { play } = useSound();
  const { data: usuarios = [], isError } = useUsuarios();
  const createMutation = useCreateUsuario();
  const deleteMutation = useDeleteUsuario();
  const [activeTab, setActiveTab] = useState<UsuariosSubTab>(tabDesdeHash);

  React.useEffect(() => {
    const onHashChange = () => setActiveTab(tabDesdeHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const subTabs: { id: UsuariosSubTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'directory', label: 'Directorio', icon: Users, badge: String(usuarios.length) },
    { id: 'roles', label: 'Roles y permisos', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Administración</span>
          <span>/</span>
          <span className="text-foreground">Usuarios y roles</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Usuarios y roles
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
          Cuentas del panel, sus roles y lo que cada rol puede hacer.
        </p>
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border overflow-x-auto">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                play('tab');
                setActiveTab(tab.id);
                window.location.hash = `#/usuarios?tab=${tab.id}`;
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                isActive ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn('font-mono text-[10px] px-1.5 rounded-full tabular-nums', isActive ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground')}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isError && <p className="text-xs text-red-400">No se pudieron cargar los usuarios. Revisa tu sesión.</p>}

      {activeTab === 'directory' && (
        <UsuariosDirectoryTab
          usuarios={usuarios}
          onAddUsuario={(input: NuevoUsuarioInput) => createMutation.mutate(input)}
          onDeleteUsuario={(id: string) => deleteMutation.mutate(id)}
        />
      )}

      {activeTab === 'roles' && <RolesPermisosTab />}
    </div>
  );
};

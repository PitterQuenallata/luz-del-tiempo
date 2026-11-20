import React from 'react';
import { Check, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { useRolesPermisos } from '../hooks/use-usuarios';

// Roles del panel y la matriz de permisos (docs/PLAN.md §6.1).
export const RolesPermisosTab: React.FC = () => {
  const { data, isLoading, isError } = useRolesPermisos();

  if (isLoading) return <p className="text-xs text-muted-foreground">Cargando roles…</p>;
  if (isError || !data) return <p className="text-xs text-red-400">No se pudieron cargar los roles.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {data.roles.map((rol) => (
          <Card key={rol.key} className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">{rol.name}</CardTitle>
                <Badge variant="secondary" className="text-[10px] font-mono">{rol.scope === 'station' ? 'Por estación' : 'Global'}</Badge>
              </div>
              <CardDescription className="text-[11px] font-mono">{rol.key}</CardDescription>
            </CardHeader>
            <CardContent className="text-xs">
              <p className="text-2xl font-bold tabular-nums">{rol.miembros}</p>
              <p className="text-muted-foreground">{rol.miembros === 1 ? 'usuario' : 'usuarios'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border overflow-x-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Matriz de permisos</CardTitle>
          <CardDescription className="text-xs">
            Los permisos marcados como "Pendiente" aún no están aplicados en la API; se activan con su módulo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border/60 bg-secondary/30 text-left">
                <th className="px-4 py-2.5 font-medium">Permiso</th>
                {data.roles.map((rol) => (
                  <th key={rol.key} className="px-3 py-2.5 font-medium text-center whitespace-nowrap">{rol.name}</th>
                ))}
                <th className="px-4 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.permisos.map((permiso) => (
                <tr key={permiso.key} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5">{permiso.descripcion}</td>
                  {data.roles.map((rol) => (
                    <td key={rol.key} className="px-3 py-2.5 text-center">
                      {permiso.roles.includes(rol.key) ? (
                        <Check className="h-4 w-4 text-primary inline" aria-label="Sí" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground/50 inline" aria-label="No" />
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <Badge variant={permiso.aplicado ? 'default' : 'outline'} className="text-[10px]">
                      {permiso.aplicado ? 'Aplicado' : 'Pendiente'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

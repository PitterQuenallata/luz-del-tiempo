import React from 'react';
import { Link } from '@tanstack/react-router';
import { Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { useUsuarios, useRolesPermisos } from '../../usuarios/hooks/use-usuarios';
import { useSession } from '../../auth/hooks/use-session';

// Inicio: cifras reales de la API.
export const DashboardPage: React.FC = () => {
  const { data: session } = useSession();
  const { data: usuarios = [] } = useUsuarios();
  const { data: rolesData } = useRolesPermisos();

  const total = usuarios.length;
  const activos = usuarios.filter((u) => u.status === 'Activo').length;
  const inactivos = total - activos;
  const roles = rolesData?.roles ?? [];

  const kpis = [
    { label: 'Usuarios', value: total, icon: Users, hint: 'Cuentas del panel' },
    { label: 'Activos', value: activos, icon: UserCheck, hint: 'Con acceso habilitado' },
    { label: 'Desactivados', value: inactivos, icon: UserX, hint: 'Sin acceso' },
    { label: 'Roles', value: roles.length, icon: ShieldCheck, hint: 'Roles configurados' },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Principal / Inicio</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
          Bienvenido{session?.name ? `, ${session.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen del panel de La Luz del Tiempo.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-border">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">{k.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="font-mono text-3xl font-bold tabular-nums">{k.value}</div>
                <span className="text-[11px] text-muted-foreground">{k.hint}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Accesos rápidos</CardTitle>
          <CardDescription className="text-xs">Secciones del panel</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link to="/usuarios" className="px-4 py-2 rounded-xl border border-border hover:bg-muted/60">Usuarios</Link>
          <Link to="/staff" className="px-4 py-2 rounded-xl border border-border hover:bg-muted/60">Staff & Permisos</Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;

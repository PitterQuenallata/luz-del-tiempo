import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { luzApi, EventoLog } from '../../../shared/api/luz-api';

const ETIQUETAS: Record<string, string> = {
  'usuario.crear': 'Usuario creado',
  'usuario.editar': 'Usuario editado',
  'usuario.activar': 'Usuario activado',
  'usuario.desactivar': 'Usuario desactivado',
  'usuario.eliminar': 'Usuario eliminado',
  'usuario.eliminar_logico': 'Usuario eliminado (lógico)',
  'sesion.iniciar': 'Inicio de sesión',
  'perfil.editar': 'Perfil editado',
  'perfil.contrasena': 'Contraseña cambiada',
};

const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const detalleDe = (e: EventoLog) => {
  if (e.detalle) return e.detalle;
  if (e.cambios) return Object.keys(e.cambios).join(', ');
  return e.entidadId ? `${e.entidad} ${e.entidadId.slice(0, 8)}…` : e.entidad;
};

// Bitácora de actividad del panel.
export const LogsPage: React.FC = () => {
  const [accion, setAccion] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['logs', accion],
    queryFn: () => luzApi.listLogs(accion || undefined),
  });

  return (
    <div className="space-y-6 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Administración / Logs</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Quién hizo qué y cuándo.</p>
      </div>

      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Actividad reciente</CardTitle>
            <CardDescription className="text-xs">Últimos 200 eventos.</CardDescription>
          </div>
          <select
            aria-label="Filtrar por acción"
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border bg-background text-xs"
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ETIQUETAS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {error ? (
            <p className="p-4 text-xs text-red-400">No tienes permiso para ver la bitácora.</p>
          ) : isLoading ? (
            <p className="p-4 text-xs text-muted-foreground">Cargando…</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-border/60 bg-secondary/30 text-left">
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Fecha</th>
                  <th className="px-4 py-2.5 font-medium">Usuario</th>
                  <th className="px-4 py-2.5 font-medium">Acción</th>
                  <th className="px-4 py-2.5 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Sin eventos todavía.</td></tr>
                )}
                {(data ?? []).map((e) => (
                  <tr key={e.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{fecha(e.fecha)}</td>
                    <td className="px-4 py-2.5">{e.usuarioNombre ?? '—'}</td>
                    <td className="px-4 py-2.5">{ETIQUETAS[e.accion] ?? e.accion}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{detalleDe(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;

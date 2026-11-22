import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiActividad, luzApi } from '../../../shared/api/luz-api';
import { useAreas } from '../../contenido/hooks/use-contenido';
import { useActividades, useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { fechaLegible } from '../../gestion/lib/fechas';
import { ETIQUETA_TIPO } from '../components/actividad-dialog';
import { CalendarioActividades } from '../components/calendario-actividades';
import { cn } from '../../../shared/lib/utils';
import { irA } from '../../gestion/lib/navegar';

// Actividades: escuelas, talleres, campañas y estudios con fecha, lugar e inscripción.
export const ActividadesPage: React.FC = () => {
  const { data, isLoading, error } = useActividades();
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');
  const areas = useAreas();
  const eliminar = useMutacionGestion((id: string) => luzApi.deleteActividad(id), 'Actividad eliminada', 'No se pudo eliminar la actividad');

  const nombreArea = useMemo(() => new Map((areas.data ?? []).map((a) => [a.id, a.name])), [areas.data]);
  const actividades = data ?? [];

  const borrar = async (a: ApiActividad) => {
    const ok = await confirmar({ title: `¿Eliminar la actividad "${a.title}"?`, type: 'danger', confirmText: 'Eliminar' });
    if (ok) eliminar.mutate(a.id);
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Principal / Actividades</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Actividades</h1>
        <p className="text-sm text-muted-foreground mt-1">Escuelas, talleres, campañas y estudios.</p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {([['lista', 'Lista'], ['calendario', 'Calendario']] as const).map(([id, texto]) => (
          <button key={id} type="button" onClick={() => setVista(id)} className={cn('px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors', vista === id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}>
            {texto}
          </button>
        ))}
      </div>

      {vista === 'calendario' && <CalendarioActividades />}

      {vista === 'lista' && (
      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Todas las actividades</CardTitle>
            <CardDescription className="text-xs">Se ordenan por fecha de inicio. Las no publicadas no se ven en la web.</CardDescription>
          </div>
          <Button type="button" size="sm" className="text-xs" onClick={() => irA('/actividades/nueva')}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nueva actividad
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {error ? (
            <p className="p-4 text-xs text-red-400">No se pudieron cargar las actividades.</p>
          ) : isLoading ? (
            <p className="p-4 text-xs text-muted-foreground">Cargando…</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-border/60 bg-secondary/30 text-left">
                  <th className="px-4 py-2.5 font-medium">Imagen</th>
                  <th className="px-4 py-2.5 font-medium">Actividad</th>
                  <th className="px-4 py-2.5 font-medium">Tipo</th>
                  <th className="px-4 py-2.5 font-medium">Inicio</th>
                  <th className="px-4 py-2.5 font-medium">Área</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actividades.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Todavía no hay actividades.</td></tr>
                )}
                {actividades.map((a) => (
                  <tr key={a.id} onClick={() => irA(`/actividades/${a.id}`)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40">
                    <td className="px-4 py-2.5">{a.coverUrl ? (
                      <img src={a.coverUrl} alt="" className="h-16 w-12 rounded-md object-cover border border-border" />
                    ) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold">{a.title}</p>
                      <p className="font-mono text-muted-foreground">/actividades/{a.slug}</p>
                    </td>
                    <td className="px-4 py-2.5">{ETIQUETA_TIPO[a.type] ?? a.type}</td>
                    <td className="px-4 py-2.5">{fechaLegible(a.startsAt)}</td>
                    <td className="px-4 py-2.5">{a.areaId ? nombreArea.get(a.areaId) ?? '—' : '—'}</td>
                    <td className="px-4 py-2.5">{a.isPublished ? 'Publicada' : 'Oculta'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" aria-label="Editar" onClick={() => irA(`/actividades/${a.id}`)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" aria-label="Eliminar" onClick={(e) => { e.stopPropagation(); borrar(a); }}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

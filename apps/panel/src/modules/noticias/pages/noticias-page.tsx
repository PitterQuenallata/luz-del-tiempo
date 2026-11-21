import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiNoticia, luzApi } from '../../../shared/api/luz-api';
import { useAreas } from '../../contenido/hooks/use-contenido';
import { useMutacionGestion, useNoticias } from '../../gestion/hooks/use-gestion';
import { fechaLegible } from '../../gestion/lib/fechas';
import { irA } from '../../gestion/lib/navegar';

const ETIQUETA_ESTADO: Record<string, string> = { draft: 'Borrador', scheduled: 'Programada', published: 'Publicada', archived: 'Archivada' };

// Noticias del sitio: borradores, programadas, publicadas y archivadas.
export const NoticiasPage: React.FC = () => {
  const { data, isLoading, error } = useNoticias();
  const areas = useAreas();
  const eliminar = useMutacionGestion((id: string) => luzApi.deleteNoticia(id), 'Noticia eliminada', 'No se pudo eliminar la noticia');
  const [filtro, setFiltro] = useState<string>('');

  const nombreArea = useMemo(() => new Map((areas.data ?? []).map((a) => [a.id, a.name])), [areas.data]);
  const noticias = (data ?? []).filter((n) => !filtro || n.status === filtro);

  const borrar = async (n: ApiNoticia) => {
    const ok = await confirmar({ title: `¿Eliminar la noticia "${n.title}"?`, type: 'danger', confirmText: 'Eliminar' });
    if (ok) eliminar.mutate(n.id);
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Principal / Noticias</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Noticias</h1>
        <p className="text-sm text-muted-foreground mt-1">Lo que se publica en la sección de noticias de la web.</p>
      </div>

      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Todas las noticias</CardTitle>
            <CardDescription className="text-xs">Las borradores no se ven en la web.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select aria-label="Filtrar por estado" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="h-9 px-3 rounded-xl border border-border bg-background text-xs">
              <option value="">Todos los estados</option>
              {Object.entries(ETIQUETA_ESTADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Button type="button" size="sm" className="text-xs" onClick={() => irA('/noticias/nueva')}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nueva noticia
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {error ? (
            <p className="p-4 text-xs text-red-400">No se pudieron cargar las noticias.</p>
          ) : isLoading ? (
            <p className="p-4 text-xs text-muted-foreground">Cargando…</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-border/60 bg-secondary/30 text-left">
                  <th className="px-4 py-2.5 font-medium">Imagen</th>
                  <th className="px-4 py-2.5 font-medium">Título</th>
                  <th className="px-4 py-2.5 font-medium">Área</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Publicación</th>
                  <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {noticias.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Todavía no hay noticias.</td></tr>
                )}
                {noticias.map((n) => (
                  <tr key={n.id} onClick={() => irA(`/noticias/${n.id}`)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40">
                    <td className="px-4 py-2.5">{n.coverUrl ? (
                      <img src={n.coverUrl} alt="" className="h-12 w-20 rounded-md object-cover border border-border" />
                    ) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold">{n.title}</p>
                      <p className="font-mono text-muted-foreground">/noticias/{n.slug}</p>
                    </td>
                    <td className="px-4 py-2.5">{n.areaId ? nombreArea.get(n.areaId) ?? '—' : '—'}</td>
                    <td className="px-4 py-2.5">{ETIQUETA_ESTADO[n.status]}</td>
                    <td className="px-4 py-2.5">{fechaLegible(n.publishedAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" aria-label="Editar" onClick={() => irA(`/noticias/${n.id}`)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" aria-label="Eliminar" onClick={(e) => { e.stopPropagation(); borrar(n); }}>
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
    </div>
  );
};

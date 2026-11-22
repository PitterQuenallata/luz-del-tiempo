import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiSerie, ApiVideo, luzApi } from '../../../shared/api/luz-api';
import { useAreas } from '../../contenido/hooks/use-contenido';
import { useMutacionGestion, useSeries, useVideos } from '../../gestion/hooks/use-gestion';
import { fechaLegible } from '../../gestion/lib/fechas';
import { cn } from '../../../shared/lib/utils';
import { irA } from '../../gestion/lib/navegar';

type Pestana = 'videos' | 'series';

// Videos de YouTube y sus series. Cada video y cada serie pertenecen a un área.
export const VideosPage: React.FC = () => {
  const [pestana, setPestana] = useState<Pestana>('videos');
  const videos = useVideos();
  const series = useSeries();
  const areas = useAreas();
  const eliminarVideo = useMutacionGestion((id: string) => luzApi.deleteVideo(id), 'Video quitado', 'No se pudo quitar el video');
  const eliminarSerie = useMutacionGestion((id: string) => luzApi.deleteSerie(id), 'Serie eliminada', 'No se pudo eliminar la serie');

  const nombreArea = useMemo(() => new Map((areas.data ?? []).map((a) => [a.id, a.name])), [areas.data]);
  const nombreSerie = useMemo(() => new Map((series.data ?? []).map((s) => [s.id, s.name])), [series.data]);

  const borrarVideo = async (v: ApiVideo) => {
    const ok = await confirmar({ title: `¿Quitar "${v.title}" de la lista?`, text: 'El video sigue en YouTube.', type: 'danger', confirmText: 'Quitar' });
    if (ok) eliminarVideo.mutate(v.id);
  };
  const borrarSerie = async (s: ApiSerie) => {
    const ok = await confirmar({ title: `¿Eliminar la serie "${s.name}"?`, text: 'Los videos de la serie se quedan sin serie.', type: 'danger', confirmText: 'Eliminar' });
    if (ok) eliminarSerie.mutate(s.id);
  };

  const pestanas: { id: Pestana; label: string }[] = [
    { id: 'videos', label: 'Videos' },
    { id: 'series', label: 'Series' },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Principal / Videos</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Videos</h1>
        <p className="text-sm text-muted-foreground mt-1">Videos de YouTube y sus series, por área.</p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {pestanas.map((p) => (
          <button key={p.id} type="button" onClick={() => setPestana(p.id)} className={cn('px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors', pestana === p.id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}>
            {p.label}
          </button>
        ))}
      </div>

      {pestana === 'videos' && (
        <Card className="border-border">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Videos</CardTitle>
              <CardDescription className="text-xs">Pega el enlace de YouTube; la miniatura se toma sola.</CardDescription>
            </div>
            <Button type="button" size="sm" className="text-xs" onClick={() => irA('/videos/nuevo')}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar video
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {videos.error ? (
              <p className="p-4 text-xs text-red-400">No se pudieron cargar los videos.</p>
            ) : videos.isLoading ? (
              <p className="p-4 text-xs text-muted-foreground">Cargando…</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-border/60 bg-secondary/30 text-left">
                    <th className="px-4 py-2.5 font-medium">Video</th>
                    <th className="px-4 py-2.5 font-medium">Área</th>
                    <th className="px-4 py-2.5 font-medium">Serie</th>
                    <th className="px-4 py-2.5 font-medium">Estado</th>
                    <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(videos.data ?? []).length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Todavía no hay videos.</td></tr>
                  )}
                  {(videos.data ?? []).map((v) => (
                    <tr key={v.id} onClick={() => irA(`/videos/${v.id}`)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <img src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" className="h-10 w-16 rounded-md object-cover border border-border" />
                          <div>
                            <p className="font-semibold">{v.title}</p>
                            <p className="font-mono text-muted-foreground">{fechaLegible(v.publishedAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{nombreArea.get(v.areaId) ?? '—'}</td>
                      <td className="px-4 py-2.5">{v.seriesId ? nombreSerie.get(v.seriesId) ?? '—' : '—'}</td>
                      <td className="px-4 py-2.5">{v.isPublished ? (v.isFeatured ? 'Publicado · destacado' : 'Publicado') : 'Oculto'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="sm" aria-label="Editar" onClick={() => irA(`/videos/${v.id}`)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" aria-label="Quitar" onClick={(e) => { e.stopPropagation(); borrarVideo(v); }}>
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

      {pestana === 'series' && (
        <Card className="border-border">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Series</CardTitle>
              <CardDescription className="text-xs">Agrupan videos de la misma área (por ejemplo, "Podcast Salud").</CardDescription>
            </div>
            <Button type="button" size="sm" className="text-xs" onClick={() => irA('/videos/series/nueva')}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nueva serie
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-border/60 bg-secondary/30 text-left">
                  <th className="px-4 py-2.5 font-medium">Serie</th>
                  <th className="px-4 py-2.5 font-medium">Área</th>
                  <th className="px-4 py-2.5 font-medium">Videos</th>
                  <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(series.data ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Todavía no hay series.</td></tr>
                )}
                {(series.data ?? []).map((s) => (
                  <tr key={s.id} onClick={() => irA(`/videos/series/${s.id}`)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold">{s.name}</p>
                      <p className="font-mono text-muted-foreground">{s.slug}</p>
                    </td>
                    <td className="px-4 py-2.5">{nombreArea.get(s.areaId) ?? '—'}</td>
                    <td className="px-4 py-2.5">{(videos.data ?? []).filter((v) => v.seriesId === s.id).length}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" aria-label="Editar" onClick={() => irA(`/videos/series/${s.id}`)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" aria-label="Eliminar" onClick={(e) => { e.stopPropagation(); borrarSerie(s); }}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

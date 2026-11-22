import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiArea } from '../../../shared/api/luz-api';
import { useAreas, useEliminarArea } from '../hooks/use-contenido';
import { irA } from '../../gestion/lib/navegar';

const ETIQUETA_TEMPLATE: Record<string, string> = { hero: 'Portada grande', gallery: 'Texto + galería', simple: 'Simple' };

// Pestaña Áreas: cada área tiene su página propia (/areas/:slug).
export const AreasTab: React.FC = () => {
  const { data, isLoading, error } = useAreas();
  const eliminar = useEliminarArea();

  const areas = data ?? [];
  const siguiente = areas.length ? Math.max(...areas.map((a) => a.sortOrder)) + 1 : 0;

  const borrar = async (a: ApiArea) => {
    const ok = await confirmar({
      title: `¿Eliminar el área "${a.name}"?`,
      text: 'Su página pública dejará de existir. Las áreas con contenido deberían archivarse; esta versión todavía no revisa contenido relacionado.',
      type: 'danger', confirmText: 'Eliminar',
    });
    if (ok) eliminar.mutate(a.id);
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold">Áreas</CardTitle>
          <CardDescription className="text-xs">Salud, música, Biblia, niños y las que se agreguen.</CardDescription>
        </div>
        <Button type="button" size="sm" className="text-xs" onClick={() => irA('/contenido/areas/nueva')}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nueva área
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {error ? (
          <p className="p-4 text-xs text-red-400">No se pudieron cargar las áreas.</p>
        ) : isLoading ? (
          <p className="p-4 text-xs text-muted-foreground">Cargando…</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border/60 bg-secondary/30 text-left">
                <th className="px-4 py-2.5 font-medium">Imagen</th>
                <th className="px-4 py-2.5 font-medium">Área</th>
                <th className="px-4 py-2.5 font-medium">Página</th>
                <th className="px-4 py-2.5 font-medium">Plantilla</th>
                <th className="px-4 py-2.5 font-medium">Galería</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {areas.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Todavía no hay áreas.</td></tr>
              )}
              {areas.map((a) => (
                <tr key={a.id} onClick={() => irA(`/contenido/areas/${a.id}`)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40">
                  <td className="px-4 py-2.5">{a.coverUrl ? (
                    <img src={a.coverUrl} alt="" className="h-12 w-20 rounded-md object-cover border border-border" />
                  ) : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ background: a.color }} />
                      <span className="font-semibold">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">/areas/{a.slug}</td>
                  <td className="px-4 py-2.5">{ETIQUETA_TEMPLATE[a.template]}</td>
                  <td className="px-4 py-2.5">{a.fotosGaleria} {a.fotosGaleria === 1 ? 'foto' : 'fotos'}</td>
                  <td className="px-4 py-2.5">{a.isPublished ? 'Publicada' : 'Archivada'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" aria-label="Editar" onClick={() => irA(`/contenido/areas/${a.id}`)}>
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
  );
};

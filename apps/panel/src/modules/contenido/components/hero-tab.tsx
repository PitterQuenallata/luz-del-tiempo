import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiHero } from '../../../shared/api/luz-api';
import { useEliminarHero, useHero } from '../hooks/use-contenido';
import { irA } from '../../gestion/lib/navegar';

// Pestaña Portada: diapositivas del carrusel de la página de inicio.
export const HeroTab: React.FC = () => {
  const { data, isLoading, error } = useHero();
  const eliminar = useEliminarHero();

  const slides = data ?? [];
  const siguiente = slides.length ? Math.max(...slides.map((s) => s.sortOrder)) + 1 : 0;

  const borrar = async (s: ApiHero) => {
    const ok = await confirmar({ title: `¿Eliminar la diapositiva "${s.title}"?`, type: 'danger', confirmText: 'Eliminar' });
    if (ok) eliminar.mutate(s.id);
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold">Carrusel de la portada</CardTitle>
          <CardDescription className="text-xs">Las diapositivas se muestran en el orden indicado.</CardDescription>
        </div>
        <Button type="button" size="sm" className="text-xs" onClick={() => irA('/contenido/portada/nueva')}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nueva diapositiva
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {error ? (
          <p className="p-4 text-xs text-red-400">No se pudieron cargar las diapositivas.</p>
        ) : isLoading ? (
          <p className="p-4 text-xs text-muted-foreground">Cargando…</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border/60 bg-secondary/30 text-left">
                <th className="px-4 py-2.5 font-medium w-12">Orden</th>
                <th className="px-4 py-2.5 font-medium">Imagen</th>
                <th className="px-4 py-2.5 font-medium">Título</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {slides.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Todavía no hay diapositivas.</td></tr>
              )}
              {slides.map((s) => (
                <tr key={s.id} onClick={() => irA(`/contenido/portada/${s.id}`)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40">
                  <td className="px-4 py-2.5 font-mono">{s.sortOrder}</td>
                  <td className="px-4 py-2.5">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt="" className="h-10 w-16 rounded-md object-cover border border-border" />
                    ) : (
                      <span className="text-muted-foreground">Sin imagen</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-muted-foreground truncate max-w-[28rem]">{s.subtitle}</p>
                  </td>
                  <td className="px-4 py-2.5">{s.isPublished ? 'Publicada' : 'Oculta'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" aria-label="Editar" onClick={() => irA(`/contenido/portada/${s.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" aria-label="Eliminar" onClick={(e) => { e.stopPropagation(); borrar(s); }}>
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

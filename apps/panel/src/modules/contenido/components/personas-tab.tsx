import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiPersona } from '../../../shared/api/luz-api';
import { useEliminarPersona, usePersonas } from '../hooks/use-contenido';
import { irA } from '../../gestion/lib/navegar';

// Pestaña Personas: predicadores, autores y equipo (no necesitan cuenta en el panel).
export const PersonasTab: React.FC = () => {
  const { data, isLoading, error } = usePersonas();
  const eliminar = useEliminarPersona();

  const personas = data ?? [];
  const siguiente = personas.length ? Math.max(...personas.map((p) => p.sortOrder)) + 1 : 0;

  const borrar = async (p: ApiPersona) => {
    const ok = await confirmar({ title: `¿Eliminar a ${p.name}?`, type: 'danger', confirmText: 'Eliminar' });
    if (ok) eliminar.mutate(p.id);
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold">Personas</CardTitle>
          <CardDescription className="text-xs">Predicadores, autores y equipo de la radio.</CardDescription>
        </div>
        <Button type="button" size="sm" className="text-xs" onClick={() => irA('/contenido/personas/nueva')}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nueva persona
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {error ? (
          <p className="p-4 text-xs text-red-400">No se pudieron cargar las personas.</p>
        ) : isLoading ? (
          <p className="p-4 text-xs text-muted-foreground">Cargando…</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border/60 bg-secondary/30 text-left">
                <th className="px-4 py-2.5 font-medium">Persona</th>
                <th className="px-4 py-2.5 font-medium">Cargo</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Todavía no hay personas.</td></tr>
              )}
              {personas.map((p) => (
                <tr key={p.id} onClick={() => irA(`/contenido/personas/${p.id}`)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">{p.name.charAt(0)}</div>
                      )}
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">{p.roleTitle}</td>
                  <td className="px-4 py-2.5">{p.isPublished ? 'Publicada' : 'Oculta'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" aria-label="Editar" onClick={() => irA(`/contenido/personas/${p.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" aria-label="Eliminar" onClick={(e) => { e.stopPropagation(); borrar(p); }}>
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

import React from 'react';
import { cn } from '../../lib/utils';

// Pestañas tipo segmentado (el mismo estilo que Usuarios). El estado vive en el padre;
// si pasas `alCambiar`, el padre puede guardarlo en la dirección (#/ruta?tab=...).
export interface PestanaItem<T extends string> { id: T; label: string }

export function Pestanas<T extends string>({ valor, items, alCambiar }: { valor: T; items: PestanaItem<T>[]; alCambiar: (id: T) => void }) {
  return (
    <div role="tablist" className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={valor === p.id}
          onClick={() => alCambiar(p.id)}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
            valor === p.id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// Pestaña inicial desde la dirección: #/ruta?tab=id (o la primera si no viene)
export function pestanaDesdeHash<T extends string>(items: PestanaItem<T>[]): T {
  const tab = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('tab');
  return (items.find((i) => i.id === tab)?.id ?? items[0]!.id) as T;
}

// Cambia la pestaña en la dirección sin salir de la página
export function fijarPestanaEnHash(id: string) {
  const [ruta] = window.location.hash.split('?');
  window.location.hash = `${ruta}?tab=${id}`;
}

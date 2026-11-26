import React, { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/modal';
import { Button } from '../../../shared/components/ui/button';
import { ApiPista, ApiPlaylist, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { cn } from '../../../shared/lib/utils';

// Orden de los audios DENTRO de una lista: arrastrando con el mouse o con las flechas.
export const OrdenarPistasDialog: React.FC<{ isOpen: boolean; onClose: () => void; lista: ApiPlaylist | null; pistas: ApiPista[] }> = ({ isOpen, onClose, lista, pistas }) => {
  const nombres = useMemo(() => new Map(pistas.map((p) => [p.id, p])), [pistas]);
  const inicial = useMemo(() => (lista?.trackIds ?? []).filter((id) => nombres.has(id)), [lista, nombres]);
  const [orden, setOrden] = useState<string[]>(inicial);

  useEffect(() => {
    if (isOpen) setOrden(inicial);
  }, [isOpen, inicial]);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const guardar = useMutacionGestion((input: { id: string; trackIds: string[] }) => luzApi.ordenarPistas(input.id, input.trackIds), 'Orden de los audios guardado', 'No se pudo guardar el orden');
  const cambio = orden.some((id, i) => id !== inicial[i]);

  const mover = (de: number, a: number) => {
    if (a < 0 || a >= orden.length) return;
    setOrden(arrayMove(orden, de, a));
  };
  const alSoltar = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    mover(orden.indexOf(String(active.id)), orden.indexOf(String(over.id)));
  };
  const confirmar = async () => {
    if (!lista) return;
    await guardar.mutateAsync({ id: lista.id, trackIds: orden });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lista ? `Ordenar audios: ${lista.name}` : 'Ordenar audios'}
      description="Así suenan de arriba abajo cuando la lista está en modo Secuencial. Arrastra un audio o usa las flechas."
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancelar</Button>
          <Button type="button" size="sm" className="text-xs" disabled={!cambio || guardar.isPending} onClick={confirmar}>Guardar orden</Button>
        </>
      }
    >
      {orden.length === 0 && <p className="text-sm text-muted-foreground">Esta lista no tiene audios.</p>}
      <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
        <SortableContext items={orden} strategy={verticalListSortingStrategy}>
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {orden.map((id, i) => (
              <FilaAudio key={id} id={id} titulo={nombres.get(id)?.title || nombres.get(id)?.storageKey || 'Audio'} artista={nombres.get(id)?.artist ?? null} posicion={i} total={orden.length} onMover={(a) => mover(i, a)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </Modal>
  );
};

const FilaAudio: React.FC<{ id: string; titulo: string; artista: string | null; posicion: number; total: number; onMover: (a: number) => void }> = ({ id, titulo, artista, posicion, total, onMover }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2', isDragging && 'opacity-70 shadow-lg')}
    >
      <button type="button" ref={setActivatorNodeRef} aria-label={`Arrastrar ${titulo}`} className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-6 shrink-0 text-center font-mono text-xs text-muted-foreground">{posicion + 1}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{titulo}</p>
        {artista && <p className="truncate text-xs text-muted-foreground">{artista}</p>}
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label={`Subir ${titulo}`} disabled={posicion === 0} onClick={() => onMover(posicion - 1)}>
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Bajar ${titulo}`} disabled={posicion >= total - 1} onClick={() => onMover(posicion + 1)}>
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
};

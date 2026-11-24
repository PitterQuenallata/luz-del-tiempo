import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ListMusic, Pencil, Plus, Upload } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiEmisora, ApiPista, ApiPlaylist, luzApi } from '../../../shared/api/luz-api';
import { cn } from '../../../shared/lib/utils';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { useEstaciones } from '../../gestion/hooks/use-gestion';
import { irA } from '../../gestion/lib/navegar';
import { usePistas, usePlaylists } from '../hooks/use-radio';
import { PlaylistDialog } from '../components/playlist-dialog';
import { PistaMetadatosDialog } from '../components/pista-metadatos-dialog';
import { duracion, faltantes, nombreDeArchivo, tituloReal } from '../lib/pistas';
import { useEmisoraSeleccionada } from '../lib/emisora-seleccion';

// Tablero de playlists: la biblioteca a la izquierda y una columna por playlist.
// Arrastrar desde la biblioteca agrega; entre columnas mueve; dentro de una columna reordena.
// Para subir audios nuevos, se va a Archivos (no se sube desde aquí).

const BIBLIOTECA = 'biblioteca';
const mensajeError = (err: unknown) => (err instanceof Error ? err.message : 'Inténtalo de nuevo.');

// Ids de arrastre: "b:<pista>" en la biblioteca, "p:<playlist>:<pista>" dentro de una playlist, "col:<id>" para soltar en una columna vacía.
const contenedorDe = (id: string) => (id.startsWith('b:') ? BIBLIOTECA : id.startsWith('p:') ? id.split(':')[1] : id.startsWith('col:') ? id.slice(4) : null);
const pistaDe = (id: string) => (id.startsWith('b:') ? id.slice(2) : id.split(':')[2]);
const idBiblioteca = (pistaId: string) => `b:${pistaId}`;
const idEnPlaylist = (playlistId: string, pistaId: string) => `p:${playlistId}:${pistaId}`;

export const TableroPage: React.FC = () => {
  const emisoras = useEstaciones();
  const lista = emisoras.data ?? [];
  const [emisoraId, setEmisoraId] = useEmisoraSeleccionada(lista);
  const emisora = lista.find((e) => e.id === emisoraId);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1.5">Radio / Playlists</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Playlists en tablero</h1>
          <p className="text-sm text-muted-foreground mt-1">Arrastra los audios a cada playlist y ponlos en el orden en que deben sonar. Para quitar uno, suéltalo en la biblioteca.</p>
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="tablero-emisora" className="text-xs font-medium block mb-1.5">Emisora</label>
          <SelectField id="tablero-emisora" value={emisoraId} onChange={(e) => setEmisoraId(e.target.value)}>
            {lista.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </SelectField>
        </div>
      </div>
      {emisora && <Tablero emisora={emisora} />}
    </div>
  );
};

const Tablero: React.FC<{ emisora: ApiEmisora }> = ({ emisora }) => {
  const qc = useQueryClient();
  const pistasQ = usePistas(emisora.id);
  const playlistsQ = usePlaylists(emisora.id);
  // Biblioteca del tablero: los audios de la estación y los del archivo de la emisora
  const pistas = useMemo(() => [...(pistasQ.data?.pistas ?? []), ...(pistasQ.data?.archivoEmisora ?? [])], [pistasQ.data]);
  // Columnas: las de la estación y las de la emisora que esta estación tiene activadas
  const playlists = useMemo(() => (playlistsQ.data ?? []).filter((p) => p.activa), [playlistsQ.data]);
  const pistaPorId = useMemo(() => new Map(pistas.map((p) => [p.id, p])), [pistas]);

  // Orden que se ve mientras se arrastra; se alinea con el servidor cada vez que llega.
  const [orden, setOrden] = useState<Record<string, string[]>>({});
  const [activoId, setActivoId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [soloFaltan, setSoloFaltan] = useState(false);
  const [pistaAbierta, setPistaAbierta] = useState<ApiPista | null>(null);
  const [playlistEditando, setPlaylistEditando] = useState<ApiPlaylist | 'nueva' | null>(null);
  useEffect(() => {
    setOrden(Object.fromEntries(playlists.map((p) => [p.id, p.trackIds])));
  }, [playlistsQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const listaDe = (playlistId: string) => orden[playlistId] ?? playlists.find((p) => p.id === playlistId)?.trackIds ?? [];

  const guardarOrden = useMutation({
    mutationFn: ({ playlist, trackIds }: { playlist: ApiPlaylist; trackIds: string[] }) =>
      luzApi.updatePlaylist(playlist.id, {
        name: playlist.name,
        description: playlist.description,
        mode: playlist.mode,
        weight: playlist.weight,
        isActive: playlist.isActive,
        trackIds,
        schedules: playlist.schedules,
      }) as Promise<{ sincronizado?: { estado: string; message?: string } }>,
    onSuccess: (res) => {
      if (res?.sincronizado && res.sincronizado.estado !== 'ok') {
        pillToast.error('Orden guardado, pero la radio no se actualizó', res.sincronizado.message ?? 'Revisa la conexión con la radio.');
      } else {
        pillToast.success('Orden guardado');
      }
    },
    onError: (err) => pillToast.error('No se guardó el orden', mensajeError(err)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['gestion', 'radio', 'playlists', emisora.id] }),
  });

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => setActivoId(String(e.active.id));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActivoId(null);
    if (!over) return;
    const idActivo = String(active.id);
    const idDestino = String(over.id);
    const origen = contenedorDe(idActivo);
    const destino = contenedorDe(idDestino);
    if (!origen || !destino) return;
    const tid = pistaDe(idActivo);
    const actual: Record<string, string[]> = { ...orden };
    const base = (id: string) => actual[id] ?? listaDe(id);
    const posicionEnDestino = (lista: string[]) => {
      if (!idDestino.startsWith('p:')) return lista.length;
      const i = lista.indexOf(pistaDe(idDestino));
      return i >= 0 ? i : lista.length;
    };
    let tocadas: string[] = [];

    if (origen === BIBLIOTECA) {
      if (destino === BIBLIOTECA) return;
      const lista = [...base(destino)];
      if (lista.includes(tid)) return pillToast.error('Ese audio ya está en esta playlist');
      lista.splice(posicionEnDestino(lista), 0, tid);
      actual[destino] = lista;
      tocadas = [destino];
    } else if (destino === BIBLIOTECA) {
      actual[origen] = base(origen).filter((t) => t !== tid);
      tocadas = [origen];
    } else if (origen === destino) {
      const lista = base(origen);
      const desde = lista.indexOf(tid);
      const hasta = idDestino.startsWith('p:') ? lista.indexOf(pistaDe(idDestino)) : lista.length - 1;
      if (desde < 0 || hasta < 0 || desde === hasta) return;
      actual[origen] = arrayMove(lista, desde, hasta);
      tocadas = [origen];
    } else {
      const dest = [...base(destino)];
      if (dest.includes(tid)) return pillToast.error('Ese audio ya está en la playlist de destino');
      dest.splice(posicionEnDestino(dest), 0, tid);
      actual[origen] = base(origen).filter((t) => t !== tid);
      actual[destino] = dest;
      tocadas = [origen, destino];
    }

    setOrden(actual);
    for (const id of tocadas) {
      const playlist = playlists.find((p) => p.id === id);
      if (playlist) guardarOrden.mutate({ playlist, trackIds: actual[id] });
    }
  };

  const bibliotecaVisible = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pistas.filter((p) =>
      (!soloFaltan || faltantes(p).obligatorios.length > 0) &&
      (!q || `${tituloReal(p) ?? ''} ${p.artist ?? ''} ${p.storageKey}`.toLowerCase().includes(q)),
    );
  }, [pistas, busqueda, soloFaltan]);

  const activa = activoId ? pistaPorId.get(pistaDe(activoId)) : undefined;
  const irArchivos = () => irA(`/archivos?estacion=${emisora.id}`);
  const cabecera = (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">{playlists.length} playlist{playlists.length === 1 ? '' : 's'} · {pistas.length} audios</p>
      <Button type="button" size="sm" className="text-xs" onClick={() => setPlaylistEditando('nueva')}><Plus className="h-3.5 w-3.5 mr-1" /> Nueva playlist</Button>
    </div>
  );

  return (
    <>
      {cabecera}
      <DndContext sensors={sensores} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActivoId(null)}>
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {/* Biblioteca: origen de los audios */}
          <Columna id={BIBLIOTECA} className="border-dashed">
            <div className="space-y-2 p-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Biblioteca <span className="text-muted-foreground font-normal">· {pistas.length}</span></p>
                <button type="button" onClick={irArchivos} className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"><Upload className="h-3 w-3" /> Subir audios</button>
              </div>
              <Input placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="text-xs" />
              <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={soloFaltan} onChange={(e) => setSoloFaltan(e.target.checked)} className="accent-primary" /> Solo con datos que faltan
              </label>
            </div>
            <div className="space-y-2 p-3 max-h-[64vh] overflow-y-auto">
              {pistasQ.isLoading && <p className="text-xs text-muted-foreground">Cargando audios…</p>}
              {pistasQ.data && pistas.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No hay audios todavía.
                  <button type="button" onClick={irArchivos} className="mt-2 block mx-auto text-primary underline underline-offset-2 cursor-pointer">Subirlos en Archivos</button>
                </div>
              )}
              {bibliotecaVisible.map((p) => (
                <ItemBiblioteca key={p.id} id={idBiblioteca(p.id)} pista={p} onAbrir={() => setPistaAbierta(p)} />
              ))}
            </div>
          </Columna>

          {playlists.map((p) => {
            const ids = listaDe(p.id);
            return (
              <Columna key={p.id} id={p.id}>
                <div className="flex items-start justify-between gap-2 p-3 border-b border-border/60">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{ids.length} audio{ids.length === 1 ? '' : 's'}</span>
                      <Badge variant="outline" className="text-[10px]">{{ rotacion: 'Rotación', secuencial: 'Secuencial', programada: 'Programada' }[p.mode]}</Badge>
                      {!p.isActive && <Badge variant="warning" className="text-[10px]">Pausada</Badge>}
                    </div>
                  </div>
                  <button type="button" aria-label="Editar datos de la playlist" onClick={() => setPlaylistEditando(p)} className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
                </div>
                <SortableContext items={ids.map((t) => idEnPlaylist(p.id, t))} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 p-3 min-h-[12rem] max-h-[64vh] overflow-y-auto">
                    {ids.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Arrastra audios de la biblioteca aquí.</p>}
                    {ids.map((tid) => {
                      const pista = pistaPorId.get(tid);
                      if (!pista) return null;
                      return <ItemPlaylist key={tid} id={idEnPlaylist(p.id, tid)} pista={pista} onAbrir={() => setPistaAbierta(pista)} />;
                    })}
                  </div>
                </SortableContext>
              </Columna>
            );
          })}

        </div>

        <DragOverlay>{activa ? <TarjetaPista pista={activa} /> : null}</DragOverlay>
      </DndContext>

      {pistaAbierta && <PistaMetadatosDialog key={pistaAbierta.id} pista={pistaAbierta} carpetas={[...new Set(pistas.map((p) => p.folder).filter(Boolean))].sort()} onClose={() => setPistaAbierta(null)} />}
      {playlistEditando && (
        <PlaylistDialog emisoraId={emisora.id} playlist={playlistEditando === 'nueva' ? null : playlistEditando} otras={playlists} onClose={() => setPlaylistEditando(null)} />
      )}
    </>
  );
};

const Columna: React.FC<{ id: string; className?: string; children: React.ReactNode }> = ({ id, className, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${id}` });
  return (
    <section ref={setNodeRef} className={cn('flex w-72 shrink-0 flex-col rounded-2xl border bg-secondary/20 transition-colors', isOver ? 'border-primary bg-primary/5' : 'border-border', className)}>
      {children}
    </section>
  );
};

// Tarjeta de un audio. Lo importante (título y artista) va en rojo si falta; lo demás, solo se sugiere.
const TarjetaPista: React.FC<{ pista: ApiPista; atenuada?: boolean }> = ({ pista, atenuada }) => {
  const titulo = tituloReal(pista);
  const f = faltantes(pista);
  return (
    <div className={cn('flex items-start gap-2 rounded-xl border bg-card px-3 py-2.5 text-xs shadow-xs', f.obligatorios.length ? 'border-red-500/40' : 'border-border', atenuada && 'opacity-40')}>
      <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        {titulo ? <p className="font-semibold truncate">{titulo}</p> : <p className="font-semibold text-red-400 truncate">Sin título · {nombreDeArchivo(pista)}</p>}
        <p className={cn('truncate', !pista.artist ? 'text-red-400' : 'text-muted-foreground')}>{pista.artist || 'Falta artista'}</p>
        {f.opcionales.length > 0 && <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">sin {f.opcionales.join(', ')}</p>}
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">{duracion(pista.durationSec)}</span>
    </div>
  );
};

const ItemBiblioteca: React.FC<{ id: string; pista: ApiPista; onAbrir: () => void }> = ({ id, pista, onAbrir }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} onClick={onAbrir} className="cursor-grab touch-none active:cursor-grabbing">
      <TarjetaPista pista={pista} atenuada={isDragging} />
    </div>
  );
};

const ItemPlaylist: React.FC<{ id: string; pista: ApiPista; onAbrir: () => void }> = ({ id, pista, onAbrir }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} onClick={onAbrir} className="cursor-grab touch-none active:cursor-grabbing">
      <TarjetaPista pista={pista} atenuada={isDragging} />
    </div>
  );
};

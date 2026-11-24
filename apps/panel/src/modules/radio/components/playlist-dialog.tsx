import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarClock, ListOrdered, Plus, Shuffle, Trash2, X } from 'lucide-react';
import { playlistSchema, type PlaylistInput } from '@luz/shared';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiPista, ApiPlaylist, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { DialogoContenido, EtiquetaCampo, ErrorCampo } from '../../contenido/components/dialogo-contenido';
import { cn } from '../../../shared/lib/utils';

type Modo = PlaylistInput['mode'];

const MODOS: { id: Modo; titulo: string; ayuda: string; icono: React.FC<{ className?: string }> }[] = [
  { id: 'rotacion', titulo: 'Rotación', ayuda: 'Se mezcla con las demás según su peso. Orden aleatorio.', icono: Shuffle },
  { id: 'secuencial', titulo: 'Secuencial', ayuda: 'Se mezcla según su peso, pero siempre en el orden de la lista.', icono: ListOrdered },
  { id: 'programada', titulo: 'Programada', ayuda: 'No entra en la mezcla. Suena solo en los horarios que elijas.', icono: CalendarClock },
];

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const EN_MEZCLA: Modo[] = ['rotacion', 'secuencial'];

interface PlaylistDialogProps {
  emisoraId: string;
  playlist: ApiPlaylist | null;
  pistas: ApiPista[];
  otras: ApiPlaylist[]; // para calcular el reparto de la mezcla
  onClose: () => void;
}

export const PlaylistDialog: React.FC<PlaylistDialogProps> = ({ emisoraId, playlist, pistas, otras, onClose }) => {
  const [nombre, setNombre] = useState(playlist?.name ?? '');
  const [descripcion, setDescripcion] = useState(playlist?.description ?? '');
  const [modo, setModo] = useState<Modo>(playlist?.mode ?? 'rotacion');
  const [peso, setPeso] = useState(playlist?.weight ?? 50);
  const [activa, setActiva] = useState(playlist?.isActive ?? true);
  const [trackIds, setTrackIds] = useState<string[]>(playlist?.trackIds ?? []);
  const [horarios, setHorarios] = useState(playlist?.schedules ?? []);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutacionGestion(
    (datos: PlaylistInput) => (playlist ? luzApi.updatePlaylist(playlist.id, datos) : luzApi.createPlaylist(emisoraId, datos)),
    playlist ? 'Playlist guardada' : 'Playlist creada',
    'No se pudo guardar la playlist',
  );

  const pistaPorId = useMemo(() => new Map(pistas.map((p) => [p.id, p])), [pistas]);
  const biblioteca = pistas.filter((p) => !trackIds.includes(p.id));

  // Reparto real de la mezcla: suma de pesos de las playlists en mezcla y activas
  const reparto = useMemo(() => {
    const items = otras
      .filter((p) => p.id !== playlist?.id && p.isActive && EN_MEZCLA.includes(p.mode))
      .map((p) => ({ nombre: p.name, peso: p.weight }));
    if (activa && EN_MEZCLA.includes(modo)) items.push({ nombre: nombre.trim() || 'Esta playlist', peso });
    const total = items.reduce((t, i) => t + i.peso, 0);
    return { total, items: items.map((i) => ({ ...i, porciento: total ? Math.round((i.peso / total) * 100) : 0 })) };
  }, [otras, playlist?.id, activa, modo, peso, nombre]);

  const mover = (index: number, delta: number) => {
    const copia = [...trackIds];
    const destino = index + delta;
    if (destino < 0 || destino >= copia.length) return;
    [copia[index], copia[destino]] = [copia[destino], copia[index]];
    setTrackIds(copia);
  };

  const actualizarHorario = (i: number, cambios: Partial<(typeof horarios)[number]>) =>
    setHorarios(horarios.map((h, j) => (j === i ? { ...h, ...cambios } : h)));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = playlistSchema.safeParse({
      name: nombre,
      description: descripcion.trim() || null,
      mode: modo,
      weight: peso,
      isActive: activa,
      trackIds,
      schedules: modo === 'programada' ? horarios : [],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
      return;
    }
    setError(null);
    await guardar.mutateAsync(parsed.data);
    onClose();
  };

  const puedeEnviar = nombre.trim().length >= 2;

  return (
    <DialogoContenido
      titulo={playlist ? `Editar playlist: ${playlist.name}` : 'Nueva playlist'}
      onClose={onClose}
      onSubmit={enviar}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
      textoBoton={playlist ? 'Guardar cambios' : 'Crear playlist'}
      ancho="xl"
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <EtiquetaCampo htmlFor="pl-nombre">Nombre</EtiquetaCampo>
            <Input id="pl-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Música de la mañana" className="text-xs" />
          </div>
          <div>
            <EtiquetaCampo htmlFor="pl-desc">Descripción (opcional)</EtiquetaCampo>
            <Input id="pl-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="text-xs" />
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">¿Cómo debe sonar?</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODOS.map((m) => {
              const Icono = m.icono;
              const activo = modo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModo(m.id)}
                  aria-pressed={activo}
                  className={cn(
                    'rounded-xl border p-3 text-left cursor-pointer transition-colors',
                    activo ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary/40',
                  )}
                >
                  <Icono className={cn('h-4 w-4 mb-1.5', activo ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="block font-semibold">{m.titulo}</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">{m.ayuda}</span>
                </button>
              );
            })}
          </div>
        </div>

        {EN_MEZCLA.includes(modo) && (
          <div className="rounded-xl border border-border p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <EtiquetaCampo htmlFor="pl-peso">Peso en la mezcla</EtiquetaCampo>
              <span className="font-mono text-[11px] text-muted-foreground">{peso} de 100</span>
            </div>
            <input id="pl-peso" type="range" min={1} max={100} value={peso} onChange={(e) => setPeso(Number(e.target.value))} className="w-full cursor-pointer accent-primary" />
            <div className="text-[11px] text-muted-foreground space-y-1">
              <p>Así suena la mezcla de las playlists activas:</p>
              <div className="flex flex-wrap gap-1.5">
                {reparto.items.length === 0 && <span>Ninguna playlist en mezcla todavía.</span>}
                {reparto.items.map((i) => (
                  <span key={i.nombre} className="rounded-full bg-secondary px-2 py-0.5 text-foreground">
                    {i.nombre}: {i.porciento} %
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} className="accent-primary" />
          <span>Activa (si no, no suena en ningún horario)</span>
        </label>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">Audios de la playlist</p>
            <span className="text-[11px] text-muted-foreground">{trackIds.length} seleccionados</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border">
              <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground border-b border-border">Biblioteca (toca para agregar)</p>
              <ul className="max-h-56 overflow-y-auto divide-y divide-border/60">
                {biblioteca.length === 0 && <li className="px-3 py-3 text-muted-foreground">No quedan audios por agregar.</li>}
                {biblioteca.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => setTrackIds([...trackIds, p.id])} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-secondary/40 cursor-pointer">
                      <span className="truncate">{p.title}</span>
                      <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border">
              <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground border-b border-border">En orden (así suena)</p>
              <ol className="max-h-56 overflow-y-auto divide-y divide-border/60">
                {trackIds.length === 0 && <li className="px-3 py-3 text-muted-foreground">Agrega audios desde la biblioteca.</li>}
                {trackIds.map((id, i) => (
                  <li key={id} className="flex items-center gap-1.5 px-2 py-1.5">
                    <span className="w-5 text-right font-mono text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 truncate px-1">{pistaPorId.get(id)?.title ?? 'Audio eliminado'}</span>
                    <button type="button" aria-label="Subir" onClick={() => mover(i, -1)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Bajar" onClick={() => mover(i, 1)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Quitar" onClick={() => setTrackIds(trackIds.filter((t) => t !== id))} className="p-1 text-muted-foreground hover:text-red-400 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {modo === 'programada' && (
          <div>
            <p className="font-medium mb-2">Horarios en que suena</p>
            <div className="space-y-2">
              {horarios.length === 0 && <p className="text-muted-foreground">Agrega al menos un horario.</p>}
              {horarios.map((h, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <SelectField aria-label="Día" value={h.dayOfWeek} onChange={(e) => actualizarHorario(i, { dayOfWeek: Number(e.target.value) })} wrapperClassName="w-40">
                    {DIAS.map((d, n) => <option key={d} value={n}>{d}</option>)}
                  </SelectField>
                  <Input type="time" aria-label="Desde" value={h.startTime} onChange={(e) => actualizarHorario(i, { startTime: e.target.value })} className="w-32 text-xs" />
                  <span className="text-muted-foreground">a</span>
                  <Input type="time" aria-label="Hasta" value={h.endTime} onChange={(e) => actualizarHorario(i, { endTime: e.target.value })} className="w-32 text-xs" />
                  <button type="button" aria-label="Quitar horario" onClick={() => setHorarios(horarios.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setHorarios([...horarios, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar horario
              </Button>
              <p className="text-[11px] text-muted-foreground">Si un horario cruza la medianoche, crea dos: uno hasta las 23:59 y otro desde las 00:00.</p>
            </div>
          </div>
        )}

        <ErrorCampo texto={error} />
      </div>
    </DialogoContenido>
  );
};

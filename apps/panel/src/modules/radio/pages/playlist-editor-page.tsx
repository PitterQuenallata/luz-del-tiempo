import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, CalendarClock, ListOrdered, Plus, Search, Shuffle, Trash2, X } from 'lucide-react';
import { playlistSchema, type PlaylistInput } from '@luz/shared';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiEmisora, ApiPista, ApiPlaylist, luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import { useEstaciones } from '../../gestion/hooks/use-gestion';
import { irA } from '../../gestion/lib/navegar';
import { usePistas, usePlaylists } from '../hooks/use-radio';
import { duracion, faltantes, nombreDeArchivo, tituloReal } from '../lib/pistas';

// Editor de una playlist en una sola pantalla: datos, cómo suena, orden de los audios y los audios que tiene.
// El orden se cambia con ↑ y ↓ (cada fila dice su número), así no depende de arrastrar.

type Modo = PlaylistInput['mode'];
type Ambito = 'estacion' | 'emisora';

const MODOS: { id: Modo; titulo: string; ayuda: string }[] = [
  { id: 'rotacion', titulo: 'Mezclada', ayuda: 'Suena al azar, mezclada con las demás listas activas.' },
  { id: 'programada', titulo: 'Por horario', ayuda: 'No entra en la mezcla. Suena solo en las horas que elijas.' },
];
const MODO_ICONO: Record<Modo, React.FC<{ className?: string }>> = { rotacion: Shuffle, secuencial: ListOrdered, programada: CalendarClock };

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const EN_MEZCLA: Modo[] = ['rotacion'];

const Cargando = () => <p className="p-4 text-xs text-muted-foreground">Cargando…</p>;

export const PlaylistEditorPage = () => {
  const { id = 'nueva' } = useParams({ strict: false }) as { id?: string };
  const query = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  const estacionId = query.get('estacion') ?? '';
  const ambitoNueva: Ambito = query.get('ambito') === 'emisora' ? 'emisora' : 'estacion';

  const estaciones = useEstaciones();
  const pistasQ = usePistas(estacionId || null);
  const playlistsQ = usePlaylists(estacionId || null);

  if (!estacionId) return <Aviso texto="Abre la playlist desde Archivos, en la estación donde va a sonar." />;
  if (estaciones.isLoading || pistasQ.isLoading || playlistsQ.isLoading) return <Cargando />;
  const estacion = (estaciones.data ?? []).find((e) => e.id === estacionId);
  if (!estacion) return <Aviso texto="No encontramos esa estación." />;

  const nueva = id === 'nueva';
  const playlist = nueva ? null : (playlistsQ.data ?? []).find((p) => p.id === id) ?? null;
  if (!nueva && !playlist) return <Aviso texto="Esta playlist no existe o ya no está disponible." />;

  const biblioteca = [...(pistasQ.data?.pistas ?? []), ...(pistasQ.data?.archivoEmisora ?? [])];
  return (
    <Editor
      key={id}
      estacion={estacion}
      playlist={playlist}
      ambito={playlist ? playlist.ambito : ambitoNueva}
      otras={playlistsQ.data ?? []}
      biblioteca={biblioteca}
    />
  );
};

const Aviso: React.FC<{ texto: string }> = ({ texto }) => (
  <div className="mx-auto w-full max-w-3xl space-y-4 pb-16">
    <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{texto}</p>
    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => irA('/archivos')}>Ir a Archivos</Button>
  </div>
);

interface EditorProps {
  estacion: ApiEmisora;
  playlist: ApiPlaylist | null;
  ambito: Ambito;
  otras: ApiPlaylist[];
  biblioteca: ApiPista[];
}

const Editor: React.FC<EditorProps> = ({ estacion, playlist, ambito, otras, biblioteca }) => {
  const qc = useQueryClient();
  const nueva = !playlist;
  const volver = `/archivos?emisora=${estacion.radioId}`;

  const [nombre, setNombre] = useState(playlist?.name ?? '');
  const [descripcion, setDescripcion] = useState(playlist?.description ?? '');
  const [modo, setModo] = useState<Modo>(playlist?.mode ?? 'rotacion');
  const [peso, setPeso] = useState(playlist?.weight ?? 50);
  const [activa, setActiva] = useState(playlist?.isActive ?? true);
  const [horarios, setHorarios] = useState(playlist?.schedules ?? []);
  const [ids, setIds] = useState<string[]>(playlist?.trackIds ?? []);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pistaPorId = useMemo(() => new Map(biblioteca.map((p) => [p.id, p])), [biblioteca]);
  const enMezcla = EN_MEZCLA.includes(modo);

  const bibliotecaFiltrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return biblioteca.filter((p) => !q || `${tituloReal(p) ?? ''} ${p.artist ?? ''} ${p.storageKey}`.toLowerCase().includes(q));
  }, [biblioteca, busqueda]);

  const guardar = useMutation({
    mutationFn: (datos: PlaylistInput) =>
      (nueva ? luzApi.createPlaylist(estacion.id, datos, ambito) : luzApi.updatePlaylist(playlist!.id, datos)) as Promise<{
        sincronizado?: { estado: string; message?: string };
      }>,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['gestion'] });
      if (res?.sincronizado && res.sincronizado.estado !== 'ok') {
        pillToast.error('Lista guardada, pero la radio no se actualizó', res.sincronizado.message ?? 'Revisa la conexión con la radio.');
      } else {
        pillToast.success(nueva ? 'Playlist creada' : 'Playlist guardada');
      }
      irA(volver);
    },
    onError: (err) => pillToast.error('No se pudo guardar la playlist', err instanceof Error ? err.message : 'Inténtalo de nuevo.'),
  });

  const guardarLista = () => {
    setError(null);
    const parsed = playlistSchema.safeParse({
      name: nombre,
      description: descripcion.trim() || null,
      mode: modo,
      weight: peso,
      isActive: activa,
      trackIds: ids,
      schedules: modo === 'programada' ? horarios : [],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
      return;
    }
    guardar.mutate(parsed.data);
  };

  const mover = (i: number, direccion: -1 | 1) => {
    const j = i + direccion;
    if (j < 0 || j >= ids.length) return;
    const nuevo = [...ids];
    [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
    setIds(nuevo);
  };
  const alternar = (pistaId: string) => setIds((actual) => (actual.includes(pistaId) ? actual.filter((t) => t !== pistaId) : [...actual, pistaId]));
  const actualizarHorario = (i: number, cambios: Partial<(typeof horarios)[number]>) => setHorarios(horarios.map((h, j) => (j === i ? { ...h, ...cambios } : h)));

  // Las listas son de la emisora: cualquier estación la vincula desde su pestaña AutoDJ.
  const esDeEmisora = true;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-16">
      <div>
        <button type="button" onClick={() => irA(volver)} className="text-xs text-primary hover:underline cursor-pointer">← Volver a Archivos</button>
        <p className="mt-3 text-xs text-muted-foreground font-mono">Radio / Playlists</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{nueva ? 'Nueva playlist' : nombre || 'Editar playlist'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {esDeEmisora ? 'Lista de la emisora: cualquiera de sus estaciones la puede activar con «Suena aquí».' : `Solo suena en ${estacion.name}.`}
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">1. Datos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pl-nombre" className="text-xs font-medium block mb-1.5">Nombre</label>
            <Input id="pl-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Música de la mañana" className="text-xs" />
          </div>
          <div>
            <label htmlFor="pl-desc" className="text-xs font-medium block mb-1.5">Descripción (opcional)</label>
            <Input id="pl-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">2. ¿Cómo suena?</CardTitle>
          <CardDescription className="text-xs">Elige una opción. Lo demás se ajusta solo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {MODOS.map((m) => {
              const Icono = MODO_ICONO[m.id];
              const elegido = modo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModo(m.id)}
                  aria-pressed={elegido}
                  className={cn('rounded-xl border p-3 text-left cursor-pointer transition-colors', elegido ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary/40')}
                >
                  <Icono className={cn('h-4 w-4 mb-1.5', elegido ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="block font-semibold text-sm">{m.titulo}</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">{m.ayuda}</span>
                </button>
              );
            })}
          </div>

          {enMezcla && (
            <p className="text-[11px] text-muted-foreground">
              En la rotación, la lista completa suena en su turno, en el orden que tenga en AutoDJ.
            </p>
          )}

          {modo === 'programada' && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Horarios en que suena</p>
              {horarios.length === 0 && <p className="text-xs text-muted-foreground">Agrega al menos un horario.</p>}
              {horarios.map((h, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <SelectField aria-label="Día" value={h.dayOfWeek} onChange={(e) => actualizarHorario(i, { dayOfWeek: Number(e.target.value) })} wrapperClassName="w-40">
                    {DIAS.map((d, n) => <option key={d} value={n}>{d}</option>)}
                  </SelectField>
                  <Input type="time" aria-label="Desde" value={h.startTime} onChange={(e) => actualizarHorario(i, { startTime: e.target.value })} className="w-32 text-xs" />
                  <span className="text-muted-foreground">a</span>
                  <Input type="time" aria-label="Hasta" value={h.endTime} onChange={(e) => actualizarHorario(i, { endTime: e.target.value })} className="w-32 text-xs" />
                  <button type="button" aria-label="Quitar horario" onClick={() => setHorarios(horarios.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-red-400 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setHorarios([...horarios, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar horario
              </Button>
              <p className="text-[11px] text-muted-foreground">Si un horario cruza la medianoche, crea dos: uno hasta las 23:59 y otro desde las 00:00.</p>
            </div>
          )}

          <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 cursor-pointer">
            <span>
              <span className="block text-sm font-medium">Activa</span>
              <span className="block text-[11px] text-muted-foreground">Si la apagas, la lista no suena en ningún horario.</span>
            </span>
            <Switch checked={activa} onCheckedChange={setActiva} />
          </label>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">3. Orden de reproducción</CardTitle>
          <CardDescription className="text-xs">
            {ids.length === 0 ? 'Todavía no tiene audios.' : `${ids.length} audio${ids.length === 1 ? '' : 's'}. El modo de los audios (Mezclado, Aleatorio o Secuencial) se elige en AutoDJ.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ids.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Marca audios en el paso 4.</p>}
          <ol className="space-y-2">
            {ids.map((pid, i) => {
              const pista = pistaPorId.get(pid);
              const titulo = pista ? tituloReal(pista) ?? nombreDeArchivo(pista) : 'Audio no disponible';
              return (
                <li key={pid} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-xs">
                  <span className="w-6 shrink-0 text-center font-mono text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate font-semibold', !pista && 'text-red-400')}>{titulo}</p>
                    <p className="truncate text-muted-foreground">
                      {pista ? pista.artist || 'Falta artista' : 'Se quitó de la biblioteca; quítalo de la lista.'}
                      {pista && faltantes(pista).obligatorios.length > 0 && <span className="text-red-400"> · falta {faltantes(pista).obligatorios.join(' y ')}</span>}
                    </p>
                  </div>
                  <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">{duracion(pista?.durationSec ?? null)}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)} className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Bajar" disabled={i === ids.length - 1} onClick={() => mover(i, 1)} className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Quitar de la lista" onClick={() => alternar(pid)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">4. Audios disponibles</CardTitle>
            <CardDescription className="text-xs">Marca los que quieres en la lista. Se agregan al final; luego los ordenas en el paso 3.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por título o artista…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-8 text-xs" />
          </div>
          {biblioteca.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Esta estación no tiene audios todavía.{' '}
              <button type="button" onClick={() => irA(volver)} className="text-primary underline underline-offset-2 cursor-pointer">Súbelos en Archivos</button>.
            </p>
          )}
          <ul className="max-h-[50vh] divide-y divide-border/60 overflow-y-auto rounded-xl border border-border">
            {bibliotecaFiltrada.map((p) => {
              const marcada = ids.includes(p.id);
              const titulo = tituloReal(p) ?? nombreDeArchivo(p);
              return (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-xs hover:bg-secondary/40">
                    <input type="checkbox" checked={marcada} onChange={() => alternar(p.id)} className="accent-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{titulo}</p>
                      <p className="truncate text-muted-foreground">{p.artist || 'Sin artista'}</p>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{duracion(p.durationSec)}</span>
                  </label>
                </li>
              );
            })}
            {biblioteca.length > 0 && bibliotecaFiltrada.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">Ningún audio coincide con la búsqueda.</li>}
          </ul>
        </CardContent>
      </Card>

      {error && <p className="rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-400">{error}</p>}

      <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
        <Button type="button" variant="outline" className="text-xs" onClick={() => irA(volver)}>Cancelar</Button>
        <Button type="button" className="text-xs" disabled={guardar.isPending || nombre.trim().length < 2} onClick={guardarLista}>
          {guardar.isPending ? 'Guardando…' : nueva ? 'Crear playlist' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
};

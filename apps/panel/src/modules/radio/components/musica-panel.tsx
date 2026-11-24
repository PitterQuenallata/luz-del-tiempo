import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Check, ListMusic, ListOrdered, Pencil, Plus, Shuffle, Trash2, Upload, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiEmisora, ApiPista, ApiPlaylist, luzApi } from '../../../shared/api/luz-api';
import { confirmar } from '../../../shared/lib/confirm';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { irA } from '../../gestion/lib/navegar';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { usePistas, usePlaylists, useTransmision } from '../hooks/use-radio';
import { PlaylistDialog } from './playlist-dialog';
import { cn } from '../../../shared/lib/utils';

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ETIQUETA_MODO: Record<ApiPlaylist['mode'], string> = { rotacion: 'Rotación', secuencial: 'Secuencial', programada: 'Programada' };
const ICONO_MODO = { rotacion: Shuffle, secuencial: ListOrdered, programada: CalendarClock } as const;

const megas = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

// Música (AutoDJ) de una emisora: playlists a la izquierda y biblioteca de audios a la derecha.
export const MusicaPanel: React.FC<{ emisoras: ApiEmisora[] }> = ({ emisoras }) => {
  const [emisoraId, setEmisoraId] = useState('');
  useEffect(() => {
    if (!emisoras.some((e) => e.id === emisoraId)) setEmisoraId(emisoras[0]?.id ?? '');
  }, [emisoras, emisoraId]);
  const emisora = emisoras.find((e) => e.id === emisoraId);
  const transmision = useTransmision(emisoraId || null);
  const sinTransmision = transmision.data && !transmision.data.transmision.mountPoint;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-72">
          <label htmlFor="musica-emisora" className="text-xs font-medium block mb-1.5">Emisora</label>
          <SelectField id="musica-emisora" value={emisoraId} onChange={(e) => setEmisoraId(e.target.value)}>
            {emisoras.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </SelectField>
        </div>
        {sinTransmision && (
          <p className="text-xs text-muted-foreground">
            Esta emisora todavía no tiene transmisión. Configúrala en{' '}
            <button type="button" onClick={() => irA('/configuracion-radio')} className="text-primary underline underline-offset-2 cursor-pointer">Configuración → Radio</button> para poder subir audios.
          </p>
        )}
      </div>

      {emisora && <MusicaDeEmisora emisora={emisora} />}
    </div>
  );
};

const MusicaDeEmisora: React.FC<{ emisora: ApiEmisora }> = ({ emisora }) => {
  const playlists = usePlaylists(emisora.id);
  const pistas = usePistas(emisora.id);
  const [editando, setEditando] = useState<ApiPlaylist | 'nueva' | null>(null);
  const eliminar = useMutacionGestion((id: string) => luzApi.deletePlaylist(id), 'Playlist eliminada', 'No se pudo eliminar la playlist');

  const borrar = async (p: ApiPlaylist) => {
    const ok = await confirmar({ title: `¿Eliminar la playlist "${p.name}"?`, text: 'Los audios no se borran, solo dejan de sonar en esta playlist.', type: 'danger', confirmText: 'Eliminar' });
    if (ok) eliminar.mutate(p.id);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Playlists</CardTitle>
            <CardDescription className="text-xs">Lo que suena en la radio. Cada playlist tiene un modo y, si quieres, horarios.</CardDescription>
          </div>
          <Button type="button" size="sm" className="text-xs" onClick={() => setEditando('nueva')}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva playlist
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {playlists.isLoading && <p className="text-xs text-muted-foreground">Cargando playlists…</p>}
          {playlists.data?.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Aún no hay playlists. Crea una y elige cómo debe sonar.
            </div>
          )}
          {(playlists.data ?? []).map((p) => (
            <PlaylistFila key={p.id} p={p} pistas={pistas.data?.pistas ?? []} onEditar={() => setEditando(p)} onBorrar={() => borrar(p)} />
          ))}
        </CardContent>
      </Card>

      <BibliotecaPistas emisoraId={emisora.id} datos={pistas.data} cargando={pistas.isLoading} />

      {editando && (
        <PlaylistDialog
          emisoraId={emisora.id}
          playlist={editando === 'nueva' ? null : editando}
          pistas={pistas.data?.pistas ?? []}
          otras={playlists.data ?? []}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
};

const PlaylistFila: React.FC<{ p: ApiPlaylist; pistas: ApiPista[]; onEditar: () => void; onBorrar: () => void }> = ({ p, pistas, onEditar, onBorrar }) => {
  const nombres = p.trackIds.map((id) => pistas.find((t) => t.id === id)?.title).filter(Boolean) as string[];
  const Icono = ICONO_MODO[p.mode];
  return (
    <div className={cn('rounded-xl border border-border p-4 flex flex-wrap items-start gap-3', !p.isActive && 'opacity-60')}>
      <Icono className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div className="flex-1 min-w-[220px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm">{p.name}</span>
          <Badge variant="outline" className="text-[10px]">{ETIQUETA_MODO[p.mode]}</Badge>
          {p.mode !== 'programada' && <Badge variant="secondary" className="text-[10px]">Peso {p.weight}</Badge>}
          {!p.isActive && <Badge variant="warning" className="text-[10px]">Pausada</Badge>}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {p.trackIds.length} audio{p.trackIds.length === 1 ? '' : 's'}
          {p.mode === 'programada' && p.schedules.length > 0 && (
            <> · {p.schedules.map((h) => `${DIAS_CORTO[h.dayOfWeek]} ${h.startTime}–${h.endTime}`).join(', ')}</>
          )}
        </p>
        {nombres.length > 0 && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{nombres.slice(0, 4).join(' · ')}{nombres.length > 4 ? ' …' : ''}</p>}
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={onEditar}><Pencil className="h-3.5 w-3.5 mr-1" /> Editar</Button>
        <button type="button" aria-label="Eliminar playlist" onClick={onBorrar} className="p-2 text-muted-foreground hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
};

const BibliotecaPistas: React.FC<{ emisoraId: string; datos: { pistas: ApiPista[]; espacioUsadoBytes: number; espacioCuotaBytes: number } | undefined; cargando: boolean }> = ({ emisoraId, datos, cargando }) => {
  const entrada = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [subiendo, setSubiendo] = useState(false);
  const [filtro, setFiltro] = useState('');
  const importar = useMutacionGestion(() => luzApi.importarPistas(emisoraId), 'Audios importados', 'No se pudieron importar los audios');
  const borrar = useMutacionGestion((id: string) => luzApi.borrarPista(id), 'Audio eliminado', 'No se pudo eliminar el audio');

  const subirArchivos = async (archivos: FileList | null) => {
    if (!archivos?.length) return;
    setSubiendo(true);
    let subidos = 0;
    try {
      for (const archivo of Array.from(archivos)) {
        try {
          await luzApi.subirPista(emisoraId, archivo);
          subidos++;
        } catch (err) {
          pillToast.error(`No se pudo subir "${archivo.name}"`, err instanceof Error ? err.message : 'Inténtalo de nuevo.');
        }
      }
      if (subidos) pillToast.success(subidos === 1 ? 'Audio subido' : `${subidos} audios subidos`);
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = '';
      qc.invalidateQueries({ queryKey: ['gestion', 'radio', 'pistas', emisoraId] });
    }
  };

  const lista = useMemo(() => (datos?.pistas ?? []).filter((p) => p.title.toLowerCase().includes(filtro.toLowerCase())), [datos, filtro]);
  const porcentaje = datos?.espacioCuotaBytes ? Math.min(100, Math.round((datos.espacioUsadoBytes / datos.espacioCuotaBytes) * 100)) : 0;

  return (
    <Card className="border-border">
      <CardHeader className="space-y-3">
        <div className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><ListMusic className="h-4 w-4" /> Biblioteca de audios</CardTitle>
            <CardDescription className="text-xs">Los audios que la radio puede poner en sus playlists.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => importar.mutate(undefined)} disabled={importar.isPending}>
              {importar.isPending ? 'Importando…' : 'Importar de la radio'}
            </Button>
            <Button type="button" size="sm" className="text-xs" onClick={() => entrada.current?.click()} disabled={subiendo}>
              <Upload className="h-3.5 w-3.5 mr-1" /> {subiendo ? 'Subiendo…' : 'Subir audios'}
            </Button>
            <input ref={entrada} type="file" multiple accept="audio/*,.mp3,.ogg,.opus,.m4a,.aac,.flac,.wav" className="hidden" onChange={(e) => subirArchivos(e.target.files)} />
          </div>
        </div>
        {datos && (
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${porcentaje}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground">{megas(datos.espacioUsadoBytes)} de {megas(datos.espacioCuotaBytes)} usados · {datos.pistas.length} audios</p>
          </div>
        )}
        <Input placeholder="Buscar audio…" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="text-xs" />
      </CardHeader>
      <CardContent className="p-0">
        {cargando && <p className="p-4 text-xs text-muted-foreground">Cargando audios…</p>}
        {datos && datos.pistas.length === 0 && (
          <div className="m-4 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No hay audios todavía. Sube archivos o importa los que ya están en la radio.
          </div>
        )}
        <ul className="divide-y divide-border/60 max-h-[32rem] overflow-y-auto">
          {lista.map((p) => (
            <PistaFila key={p.id} p={p} onBorrar={async () => {
              const ok = await confirmar({ title: `¿Eliminar "${p.title}"?`, text: 'Se borra el archivo de la radio y sale de todas las playlists.', type: 'danger', confirmText: 'Eliminar' });
              if (ok) borrar.mutate(p.id);
            }} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const PistaFila: React.FC<{ p: ApiPista; onBorrar: () => void }> = ({ p, onBorrar }) => {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(p.title);
  const editar = useMutacionGestion((input: { title: string }) => luzApi.editarPista(p.id, { title: input.title, artist: p.artist }), 'Título guardado', 'No se pudo guardar el título');

  if (editando) {
    return (
      <li className="flex items-center gap-2 px-4 py-2">
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="text-xs" autoFocus />
        <button type="button" aria-label="Guardar título" onClick={async () => { await editar.mutateAsync({ title: titulo.trim() || p.title }); setEditando(false); }} className="p-1.5 text-emerald-500 cursor-pointer"><Check className="h-3.5 w-3.5" /></button>
        <button type="button" aria-label="Cancelar" onClick={() => { setTitulo(p.title); setEditando(false); }} className="p-1.5 text-muted-foreground cursor-pointer"><X className="h-3.5 w-3.5" /></button>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-2 px-4 py-2.5 text-xs">
      <span className="flex-1 truncate">{p.title}</span>
      <span className="font-mono text-[11px] text-muted-foreground">{megas(p.sizeBytes)}</span>
      <button type="button" aria-label="Editar título" onClick={() => setEditando(true)} className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
      <button type="button" aria-label="Eliminar audio" onClick={onBorrar} className="p-1.5 text-muted-foreground hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
    </li>
  );
};


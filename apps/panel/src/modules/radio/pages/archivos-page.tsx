import React, { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FolderOpen, ListMusic, Loader2, Pencil, Plus, Trash2, Upload, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Switch } from '../../../shared/components/ui/switch';
import { Input } from '../../../shared/components/ui/input';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiEmisora, ApiPista, ApiPlaylist, luzApi } from '../../../shared/api/luz-api';
import { confirmar } from '../../../shared/lib/confirm';
import { cn } from '../../../shared/lib/utils';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { useEstaciones, useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { irA } from '../../gestion/lib/navegar';
import { usePistas, usePlaylists } from '../hooks/use-radio';
import { PlaylistDialog } from '../components/playlist-dialog';
import { PistaMetadatosDialog } from '../components/pista-metadatos-dialog';
import { duracion, etiquetaCarpeta, faltantes, megas, nombreDeArchivo, tituloReal } from '../lib/pistas';
import { useEmisoraSeleccionada } from '../lib/emisora-seleccion';

// Archivos: subir audios, organizarlos en carpetas y revisar sus datos.
// Las playlists se ordenan en el tablero (/tablero); aquí solo se crean y se editan sus datos.

const TODAS = '__todas__';
const EXTENSIONES_AUDIO = /\.(mp3|ogg|opus|m4a|aac|flac|wav)$/i;
const MENSAJES_MODO = { rotacion: 'Rotación', secuencial: 'Secuencial', programada: 'Programada' } as const;

type Pestana = 'archivos' | 'playlists';
type ArchivoDestino = 'estacion' | 'emisora';

export const ArchivosPage: React.FC = () => {
  const emisoras = useEstaciones();
  const lista = emisoras.data ?? [];
  const [emisoraId, setEmisoraId] = useEmisoraSeleccionada(lista);
  const [pestana, setPestana] = useState<Pestana>('archivos');
  const [destino, setDestino] = useState<ArchivoDestino>('estacion');
  const emisora = lista.find((e) => e.id === emisoraId);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1.5">Radio / Archivos</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Archivos de radio</h1>
          <p className="text-sm text-muted-foreground mt-1">Sube la música, ponla en carpetas y completa sus datos.</p>
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="archivos-emisora" className="text-xs font-medium block mb-1.5">Emisora</label>
          <SelectField id="archivos-emisora" value={emisoraId} onChange={(e) => setEmisoraId(e.target.value)}>
            {lista.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </SelectField>
        </div>
      </div>

      <div role="tablist" className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {([['archivos', 'Archivos'], ['playlists', 'Playlists']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={pestana === id} onClick={() => setPestana(id)}
            className={cn('px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors', pestana === id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {emisoras.isLoading && <p className="text-xs text-muted-foreground">Cargando emisoras…</p>}
      {emisoras.data && lista.length === 0 && <p className="text-xs text-muted-foreground">Primero crea una emisora en Emisoras.</p>}
      {emisora && pestana === 'archivos' && (
        <>
          <div role="group" aria-label="Archivo" className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
            {([['estacion', `Archivo de ${emisora.name}`], ['emisora', 'Archivo de la emisora']] as const).map(([valor, label]) => (
              <button key={valor} type="button" aria-pressed={destino === valor} onClick={() => setDestino(valor)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors', destino === valor ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}>
                {label}
              </button>
            ))}
          </div>
          <BibliotecaArchivos emisora={emisora} destino={destino} />
        </>
      )}
      {emisora && pestana === 'playlists' && <PlaylistsDeEstacion estacion={emisora} />}
    </div>
  );
};

// ---------- Archivos ----------

interface EnCola { id: string; nombre: string; estado: 'subiendo' | 'listo' | 'error'; detalle?: string }

const BibliotecaArchivos: React.FC<{ emisora: ApiEmisora; destino: ArchivoDestino }> = ({ emisora, destino }) => {
  const qc = useQueryClient();
  const datos = usePistas(emisora.id);
  const pistas = useMemo(() => (destino === 'emisora' ? datos.data?.archivoEmisora ?? [] : datos.data?.pistas ?? []), [datos.data, destino]);
  const usado = destino === 'emisora' ? datos.data?.espacioEmisoraUsadoBytes ?? 0 : datos.data?.espacioUsadoBytes ?? 0;
  const cuota = destino === 'emisora' ? datos.data?.espacioEmisoraCuotaBytes ?? 0 : datos.data?.espacioCuotaBytes ?? 0;
  const carpetas = useMemo(() => [...new Set(pistas.map((p) => p.folder).filter(Boolean))].sort(), [pistas]);
  const [carpeta, setCarpeta] = useState(TODAS);
  const [soloFaltan, setSoloFaltan] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [carpetaDestino, setCarpetaDestino] = useState('');
  const [abierta, setAbierta] = useState<ApiPista | null>(null);
  const [cola, setCola] = useState<EnCola[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pistas.filter((p) =>
      (carpeta === TODAS || p.folder === carpeta) &&
      (!soloFaltan || faltantes(p).obligatorios.length > 0) &&
      (!q || `${tituloReal(p) ?? ''} ${p.artist ?? ''} ${p.storageKey}`.toLowerCase().includes(q)),
    );
  }, [pistas, carpeta, soloFaltan, busqueda]);

  const sinDatos = pistas.filter((p) => faltantes(p).obligatorios.length > 0).length;
  const porcentaje = cuota ? Math.min(100, Math.round((usado / cuota) * 100)) : 0;

  const subir = async (archivos: File[]) => {
    const validos = archivos.filter((f) => EXTENSIONES_AUDIO.test(f.name));
    const rechazados = archivos.length - validos.length;
    if (rechazados) pillToast.error(`${rechazados} archivo${rechazados === 1 ? '' : 's'} no son audio`, 'Se aceptan mp3, ogg, opus, m4a, aac, flac y wav.');
    if (!validos.length) return;
    const ids = validos.map((f, i) => `${Date.now()}-${i}`);
    setCola((c) => [...c, ...validos.map((f, i) => ({ id: ids[i], nombre: f.name, estado: 'subiendo' as const }))]);
    let listos = 0;
    for (let i = 0; i < validos.length; i++) {
      try {
        await luzApi.subirPista(emisora.id, validos[i], destino);
        listos++;
        setCola((c) => c.map((x) => (x.id === ids[i] ? { ...x, estado: 'listo' } : x)));
      } catch (err) {
        setCola((c) => c.map((x) => (x.id === ids[i] ? { ...x, estado: 'error', detalle: err instanceof Error ? err.message : 'Inténtalo de nuevo.' } : x)));
      }
    }
    if (listos) pillToast.success(listos === 1 ? 'Audio subido' : `${listos} audios subidos`);
    qc.invalidateQueries({ queryKey: ['gestion', 'radio', 'pistas', emisora.id] });
  };

  const importar = useMutacionGestion(() => luzApi.importarPistas(emisora.id, destino), 'Audios importados', 'No se pudieron importar los audios');
  const releer = useMutacionGestion(
    () => luzApi.releerEtiquetas(emisora.id, destino),
    'Etiquetas leídas',
    'No se pudieron leer las etiquetas',
  );
  const mover = useMutacionGestion(
    (input: { ids: string[]; folder: string }) => luzApi.moverPistas(emisora.id, input),
    'Audios movidos',
    'No se pudieron mover los audios',
  );

  const alternar = (id: string) => {
    const nuevo = new Set(seleccion);
    if (nuevo.has(id)) nuevo.delete(id);
    else nuevo.add(id);
    setSeleccion(nuevo);
  };

  const moverSeleccion = async () => {
    await mover.mutateAsync({ ids: [...seleccion], folder: carpetaDestino.trim() });
    setSeleccion(new Set());
    setCarpetaDestino('');
  };

  const sinAudios = datos.data && pistas.length === 0;

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        {destino === 'emisora' ? 'Archivo de la emisora: lo usan todas sus estaciones en sus listas.' : `Archivo de ${emisora.name}: solo lo usa esta estación.`}
      </p>
      {/* Subida: zona para soltar archivos. Con biblioteca vacía es el estado vacío principal. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => entrada.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') entrada.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(Array.from(e.dataTransfer.files)); }}
        className={cn(
          'rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors',
          sinAudios ? 'p-10' : 'p-5',
          arrastrando ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60 hover:bg-secondary/30',
        )}
      >
        <Upload className={cn('mx-auto text-primary', sinAudios ? 'h-10 w-10' : 'h-6 w-6')} />
        {sinAudios ? (
          <>
            <p className="mt-3 font-semibold">Todavía no hay audios en {emisora.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Arrastra aquí la música o haz clic para elegirla. Se aceptan mp3, ogg, opus, m4a, aac, flac y wav.</p>
            <p className="mt-1 text-xs text-muted-foreground">Si ya están en la radio, puedes traerlos con «Importar de la radio».</p>
          </>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Arrastra audios aquí o haz clic para subir más</p>
        )}
        <input ref={entrada} type="file" multiple accept="audio/*,.mp3,.ogg,.opus,.m4a,.aac,.flac,.wav" className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { subir(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      </div>

      {sinAudios && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" className="text-xs" disabled={importar.isPending} onClick={() => importar.mutate(undefined)}>
            {importar.isPending ? 'Importando…' : 'Importar de la radio'}
          </Button>
        </div>
      )}

      {cola.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Subidas</p>
              <button type="button" className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setCola((c) => c.filter((x) => x.estado === 'subiendo'))}>Limpiar</button>
            </div>
            <ul className="space-y-1.5">
              {cola.map((x) => (
                <li key={x.id} className="flex items-center gap-2">
                  {x.estado === 'subiendo' && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  {x.estado === 'listo' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  {x.estado === 'error' && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                  <span className="flex-1 truncate">{x.nombre}</span>
                  <span className="text-muted-foreground">{x.estado === 'subiendo' ? 'Subiendo…' : x.estado === 'listo' ? 'Listo' : x.detalle}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!sinAudios && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <p><span className="font-semibold">{pistas.length}</span> audios</p>
          <p className={sinDatos ? 'text-red-400' : 'text-muted-foreground'}>{sinDatos} con datos que faltan</p>
          {datos.data && (
            <div className="flex items-center gap-2 min-w-[200px] text-muted-foreground">
              <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary" style={{ width: `${porcentaje}%` }} /></div>
              <span>{megas(usado)} de {megas(cuota)}</span>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="outline" size="sm" className="text-xs" disabled={releer.isPending} title="Vuelve a leer título, artista, álbum y año de cada archivo. No cambia lo que ya escribiste." onClick={() => releer.mutate(undefined)}>
              {releer.isPending ? 'Leyendo…' : 'Releer etiquetas'}
            </Button>
            <Button type="button" variant="outline" size="sm" className="text-xs" disabled={importar.isPending} onClick={() => importar.mutate(undefined)}>
              {importar.isPending ? 'Importando…' : 'Importar de la radio'}
            </Button>
          </div>
        </div>
      )}

      {!sinAudios && (
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          {/* Carpetas */}
          <Card className="border-border h-fit">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold flex items-center gap-1.5"><FolderOpen className="h-3.5 w-3.5" /> Carpetas</CardTitle></CardHeader>
            <CardContent className="p-2">
              <ul className="space-y-0.5 text-xs">
                <FilaCarpeta activa={carpeta === TODAS} nombre="Todas" cuenta={pistas.length} onClick={() => setCarpeta(TODAS)} />
                <FilaCarpeta activa={carpeta === ''} nombre="Sin carpeta" cuenta={pistas.filter((p) => !p.folder).length} onClick={() => setCarpeta('')} />
                {carpetas.map((c) => (
                  <FilaCarpeta key={c} activa={carpeta === c} nombre={c} cuenta={pistas.filter((p) => p.folder === c).length} onClick={() => setCarpeta(c)} />
                ))}
              </ul>
              <p className="px-2 pt-3 text-[11px] text-muted-foreground">Para crear una carpeta, mueve audios a un nombre nuevo.</p>
            </CardContent>
          </Card>

          <Card className="border-border min-w-0">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Input placeholder="Buscar por título, artista o archivo…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="text-xs flex-1 min-w-[200px]" />
                <div role="group" aria-label="Filtro" className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
                  {([[false, 'Todos'], [true, 'Faltan datos']] as const).map(([valor, label]) => (
                    <button key={label} type="button" aria-pressed={soloFaltan === valor} onClick={() => setSoloFaltan(valor)}
                      className={cn('px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors', soloFaltan === valor ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {seleccion.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                  <span className="font-semibold">{seleccion.size} seleccionado{seleccion.size === 1 ? '' : 's'}</span>
                  <Input list="archivos-carpetas" value={carpetaDestino} onChange={(e) => setCarpetaDestino(e.target.value)} placeholder="Carpeta de destino" className="text-xs w-56" />
                  <datalist id="archivos-carpetas">{carpetas.map((c) => <option key={c} value={c} />)}</datalist>
                  <Button type="button" size="sm" className="text-xs" disabled={mover.isPending} onClick={moverSeleccion}>Mover</Button>
                  <button type="button" className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setSeleccion(new Set())}>Quitar selección</button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-border/60 bg-secondary/30 text-left">
                    <th className="w-10 px-3 py-2"><span className="sr-only">Seleccionar</span></th>
                    <th className="px-3 py-2 font-medium">Audio</th>
                    <th className="px-3 py-2 font-medium">Artista</th>
                    <th className="px-3 py-2 font-medium">Álbum</th>
                    <th className="px-3 py-2 font-medium">Año</th>
                    <th className="px-3 py-2 font-medium">Género</th>
                    <th className="px-3 py-2 font-medium">Duración</th>
                    <th className="px-3 py-2 font-medium">Carpeta</th>
                    <th className="px-3 py-2 font-medium">Datos</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      {soloFaltan ? 'Todos los audios de esta vista tienen sus datos. ¡Bien!' : 'No hay audios con estos filtros.'}
                    </td></tr>
                  )}
                  {visibles.map((p) => {
                    const f = faltantes(p);
                    const titulo = tituloReal(p);
                    return (
                      <tr key={p.id} onClick={() => setAbierta(p)} className="border-b border-border/40 cursor-pointer hover:bg-muted/40">
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`Seleccionar ${titulo ?? nombreDeArchivo(p)}`} checked={seleccion.has(p.id)} onChange={() => alternar(p.id)} className="accent-primary cursor-pointer" />
                        </td>
                        <td className="px-3 py-2.5 max-w-[260px]">
                          {titulo ? <p className="font-semibold truncate">{titulo}</p> : <p className="font-semibold text-red-400 truncate">Sin título · {nombreDeArchivo(p)}</p>}
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{p.storageKey}</p>
                        </td>
                        <td className={cn('px-3 py-2.5', !p.artist && 'text-red-400 font-medium')}>{p.artist || 'Falta artista'}</td>
                        <td className={cn('px-3 py-2.5', !p.album && 'text-muted-foreground')}>{p.album || '—'}</td>
                        <td className={cn('px-3 py-2.5', !p.year && 'text-muted-foreground')}>{p.year || '—'}</td>
                        <td className={cn('px-3 py-2.5', !p.genre && 'text-muted-foreground')}>{p.genre || '—'}</td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">{duracion(p.durationSec)}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{etiquetaCarpeta(p.folder)}</td>
                        <td className="px-3 py-2.5">
                          {f.obligatorios.length > 0
                            ? <Badge variant="destructive" className="text-[10px]">Falta {f.obligatorios.join(' y ')}</Badge>
                            : <Badge variant="success" className="text-[10px]">Completo</Badge>}
                          {f.opcionales.length > 0 && <p className="mt-1 text-[10px] text-muted-foreground">sin {f.opcionales.join(', ')}</p>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {abierta && <PistaMetadatosDialog key={abierta.id} pista={abierta} carpetas={carpetas} onClose={() => setAbierta(null)} />}
    </div>
  );
};

const FilaCarpeta: React.FC<{ activa: boolean; nombre: string; cuenta: number; onClick: () => void }> = ({ activa, nombre, cuenta, onClick }) => (
  <li>
    <button type="button" onClick={onClick} className={cn('flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left cursor-pointer transition-colors', activa ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-secondary/50')}>
      <span className="truncate">{nombre}</span>
      <span className="text-[11px] text-muted-foreground">{cuenta}</span>
    </button>
  </li>
);

// ---------- Playlists (lista y datos; el orden está en el tablero) ----------
// De la ESTACIÓN: solo esta estación las usa. De la EMISORA: todas sus estaciones pueden activarlas («Suena aquí»).

const PlaylistsDeEstacion: React.FC<{ estacion: ApiEmisora }> = ({ estacion }) => {
  const playlists = usePlaylists(estacion.id);
  const [editando, setEditando] = useState<ApiPlaylist | null>(null);
  const [creando, setCreando] = useState<'estacion' | 'emisora' | null>(null);
  const eliminar = useMutacionGestion((id: string) => luzApi.deletePlaylist(id), 'Playlist eliminada', 'No se pudo eliminar la playlist');
  const uso = useMutacionGestion(
    (input: { playlistId: string; usar: boolean }) => luzApi.setUsoPlaylist(estacion.id, input.playlistId, input.usar),
    'Playlist actualizada',
    'No se pudo cambiar la playlist',
  );
  const todas = playlists.data ?? [];
  const deEstacion = todas.filter((p) => p.ambito === 'estacion');
  const deEmisora = todas.filter((p) => p.ambito === 'emisora');

  const borrar = async (p: ApiPlaylist) => {
    const ok = await confirmar({
      title: `¿Eliminar la playlist "${p.name}"?`,
      text: p.ambito === 'emisora' ? 'Los audios no se borran. La playlist deja de sonar en todas las estaciones de la emisora.' : 'Los audios no se borran, solo dejan de sonar en esta playlist.',
      type: 'danger',
      confirmText: 'Eliminar',
    });
    if (ok) eliminar.mutate(p.id);
  };

  const fila = (p: ApiPlaylist, emisora: boolean) => (
    <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
      <div className="flex-1 min-w-[200px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm">{p.name}</span>
          <Badge variant="outline" className="text-[10px]">{MENSAJES_MODO[p.mode]}</Badge>
          {!p.isActive && <Badge variant="warning" className="text-[10px]">Pausada</Badge>}
          {emisora && <Badge variant="secondary" className="text-[10px]">Suena en {(p.estacionesIds ?? []).length} estación{(p.estacionesIds ?? []).length === 1 ? '' : 'es'}</Badge>}
        </div>
        <p className="text-muted-foreground mt-0.5">{p.trackIds.length} audio{p.trackIds.length === 1 ? '' : 's'}{p.mode !== 'programada' ? ` · peso ${p.weight}` : ''}</p>
      </div>
      <div className="flex items-center gap-1">
        {emisora && (
          <label className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground" title={`Usar en ${estacion.name}`}>
            <Switch checked={p.activa} onCheckedChange={(usar) => uso.mutate({ playlistId: p.id, usar })} disabled={uso.isPending} />
            {p.activa ? 'Suena aquí' : 'No suena aquí'}
          </label>
        )}
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => irA(`/tablero?estacion=${estacion.id}`)}>
          <ListMusic className="h-3.5 w-3.5 mr-1" /> Tablero
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setEditando(p)}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Datos
        </Button>
        <button type="button" aria-label="Eliminar playlist" onClick={() => borrar(p)} className="p-2 text-muted-foreground hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </li>
  );

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Playlists de {estacion.name}</CardTitle>
            <CardDescription className="text-xs">Las de la estación solo suenan aquí. Para agregar audios y ordenarlos, ve al tablero.</CardDescription>
          </div>
          <Button type="button" size="sm" className="text-xs" onClick={() => setCreando('estacion')}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva playlist
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {playlists.isLoading && <p className="p-4 text-xs text-muted-foreground">Cargando playlists…</p>}
          {!playlists.isLoading && deEstacion.length === 0 && <p className="m-4 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">Esta estación todavía no tiene playlists propias.</p>}
          <ul className="divide-y divide-border/60">{deEstacion.map((p) => fila(p, false))}</ul>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Playlists de la emisora</CardTitle>
            <CardDescription className="text-xs">Listas de producción que todas las estaciones de la emisora pueden usar. Activa las que suenan en {estacion.name}.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setCreando('emisora')}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva lista de la emisora
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!playlists.isLoading && deEmisora.length === 0 && <p className="m-4 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">Todavía no hay listas de la emisora.</p>}
          <ul className="divide-y divide-border/60">{deEmisora.map((p) => fila(p, true))}</ul>
        </CardContent>
      </Card>

      {creando && <PlaylistDialog emisoraId={estacion.id} playlist={null} otras={todas} ambito={creando} onClose={() => setCreando(null)} />}
      {editando && <PlaylistDialog emisoraId={estacion.id} playlist={editando} otras={todas} ambito={editando.ambito} onClose={() => setEditando(null)} />}
    </div>
  );
};

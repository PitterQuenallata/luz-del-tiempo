import React, { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, Blend, CalendarClock, Copy, GripVertical, Headphones, ListMusic, ListOrdered, Plus, Radio, Shuffle, SkipForward, X } from 'lucide-react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../../shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { ApiEmisora, ApiTransmision, ApiPista, ApiPlaylist, luzApi } from '../../../shared/api/luz-api';
import { EstacionControles, EstadoVivo, estadoEstacion } from '../components/estacion-controles';
import { ReproductorLista } from '../components/reproductor-lista';
import { OrdenarPistasDialog } from '../components/ordenar-pistas-dialog';
import { DIAS, ProgramarListaDialog } from '../components/programar-lista-dialog';
import { Sheet } from '../../../shared/components/ui/sheet';
import { useEstaciones, useMutacionGestion, useProgramas } from '../../gestion/hooks/use-gestion';
import { useSession } from '../../auth/hooks/use-session';
import { irA } from '../../gestion/lib/navegar';
import { SelectField } from '../../usuarios/components/select-field';
import { ErrorCampo, ModoEdicion } from '../../contenido/components/dialogo-contenido';
import { useAhoraSuena, useLocutores, usePistas, usePlaylists, useProceso, useServicioRadio, useTransmision } from '../hooks/use-radio';
import { CamposTransmision, DatoTransmision, copiarTexto, useFormularioTransmision } from '../components/transmision-dialog';
import { LocutoresDialog } from '../components/locutores-dialog';
import { EstadoRadio, ProgramacionTab } from './emisoras-page';

// Página de UNA estación: se llega desde «Emisoras y estaciones».
// Modelo: la EMISORA tiene sus audios y sus listas; la estación transmite, tiene su AutoDJ y
// vincula las listas de su emisora (las que suenan aquí). Música y datos generales viven en la emisora.

type Pestana = 'resumen' | 'autodj' | 'programacion' | 'transmision';

const PESTANAS: { id: Pestana; titulo: string }[] = [
  { id: 'resumen', titulo: 'Resumen' },
  { id: 'autodj', titulo: 'AutoDJ' },
  { id: 'programacion', titulo: 'Programación' },
  { id: 'transmision', titulo: 'Transmisión' },
];

const MODO_ETIQUETA: Record<ApiPlaylist['mode'], string> = { rotacion: 'Mezclada', secuencial: 'En orden', programada: 'Por horario' };

const Cargando = () => <p className="p-4 text-xs text-muted-foreground">Cargando…</p>;

export const EstacionPage: React.FC = () => {
  const { id = '' } = useParams({ strict: false }) as { id?: string };
  const estaciones = useEstaciones();
  const sesion = useSession();
  const permisos = sesion.data?.permisos ?? [];
  const admin = permisos.includes('estaciones:todas');
  // El responsable de una emisora de tercero también ve el formulario de transmisión (la API filtra lo que puede cambiar)
  const editaTransmision = admin || permisos.includes('estacion:propia');
  const [pestana, setPestana] = useState<Pestana>(() => {
    const tab = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('tab') as Pestana | null;
    return PESTANAS.some((p) => p.id === tab) ? (tab as Pestana) : 'resumen';
  });

  if (estaciones.isLoading) return <Cargando />;
  const estacion = (estaciones.data ?? []).find((e) => e.id === id);
  if (!estacion) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 pb-16">
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Esta estación no existe o ya no está disponible.</p>
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => irA('/emisoras')}>Volver a Emisoras y estaciones</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <button type="button" onClick={() => irA('/emisoras')} className="text-xs text-primary hover:underline cursor-pointer">← Emisoras y estaciones</button>
        <p className="mt-3 text-xs text-muted-foreground font-mono">Radio / Estaciones / {estacion.name}</p>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {estacion.imageUrl ? (
            <img src={estacion.imageUrl} alt="" className="h-14 w-24 shrink-0 rounded-xl border border-border object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Radio className="h-6 w-6" /></div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight truncate">{estacion.name}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{estacion.transmision.mountPoint ?? 'Sin punto de transmisión'} · {estacion.slug}</p>
          </div>
        </div>
        <EstadoRadio emisora={estacion} />
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Secciones de la estación">
        {PESTANAS.filter((p) => p.id !== 'programacion' || estacion.tieneProgramacion).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestana(p.id)}
            aria-current={pestana === p.id ? 'page' : undefined}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm cursor-pointer transition-colors',
              pestana === p.id ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {p.titulo}
          </button>
        ))}
      </nav>

      {pestana === 'resumen' && <Resumen estacion={estacion} cambiarPestana={setPestana} />}
      {pestana === 'autodj' && <AutoDj estacion={estacion} />}
      {pestana === 'programacion' && estacion.tieneProgramacion && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Esta programación se muestra en la página web de la emisora.</p>
          <ProgramacionTab emisoras={[estacion]} />
        </div>
      )}
      {pestana === 'transmision' && <Transmision estacion={estacion} admin={admin} editaTransmision={editaTransmision} />}
    </div>
  );
};


const Metrica: React.FC<{ etiqueta: string; valor: React.ReactNode; detalle?: string }> = ({ etiqueta, valor, detalle }) => (
  <Card className="border-border">
    <CardContent className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 font-heading text-3xl font-bold">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
    </CardContent>
  </Card>
);

const tiempoDesde = (unix: number | null) => {
  if (!unix) return null;
  const seg = Math.max(0, Math.floor(Date.now() / 1000 - unix));
  const m = Math.floor(seg / 60);
  return m > 0 ? `hace ${m} min ${seg % 60} s` : `hace ${seg} s`;
};

const Resumen: React.FC<{ estacion: ApiEmisora; cambiarPestana: (p: Pestana) => void }> = ({ estacion, cambiarPestana }) => {
  const playlists = usePlaylists(estacion.id);
  const pistas = usePistas(estacion.id);
  const transmision = useTransmision(estacion.id, 5000);
  const ahora = useAhoraSuena(estacion.id);
  const proceso = useProceso(estacion.id).data?.proceso ?? null;
  const saltar = useMutacionGestion((id: string) => luzApi.saltarCancion(id), 'Siguiente canción', 'No se pudo cambiar la canción');
  const saltarLista = useMutacionGestion((id: string) => luzApi.saltarLista(id), 'Siguiente lista de reproducción', 'No se pudo cambiar la lista');
  const activas = (playlists.data ?? []).filter((p) => p.activa);
  const audiosActivos = activas.reduce((n, p) => n + p.trackIds.length, 0);
  const t = transmision.data?.transmision;
  const vivo = (transmision.data?.radio as { status?: EstadoVivo } | null)?.status;
  const sonando = ahora.data?.ahora ?? null;
  const autodjOn = t?.autodjEnabled ?? estacion.autodjEnabled;
  const enAire = Boolean(vivo?.online);
  const estadoAutodj = !t ? null
    : !autodjOn ? { texto: 'Apagado', variante: 'outline' as const }
    : enAire ? { texto: 'En ejecución', variante: 'success' as const }
    : { texto: 'Sin señal', variante: 'warning' as const };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica etiqueta="Oyentes ahora" valor={enAire ? vivo?.listeners ?? 0 : 0} />
        <Metrica etiqueta="Estado" valor={<span className="text-base">{estadoEstacion(estacion, t, vivo, true)?.texto ?? '—'}</span>} />
        <Metrica etiqueta="Listas que suenan" valor={activas.length} detalle={`${(playlists.data ?? []).length} disponibles en la emisora y la estación`} />
        <Metrica etiqueta="Audios en listas" valor={audiosActivos} detalle={`${(pistas.data?.archivoEmisora.length ?? 0) + (pistas.data?.pistas.length ?? 0)} audios en total`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Headphones className="h-4 w-4" /> Emitiendo</CardTitle>
            <Badge variant={enAire ? 'success' : 'outline'} className="text-[10px]">{enAire ? `Al aire · ${vivo?.listeners ?? 0} oyente${vivo?.listeners === 1 ? '' : 's'}` : 'Fuera del aire'}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {proceso && (
              <p className="text-xs text-muted-foreground">
                Proceso: {proceso.estado === 'en_marcha'
                  ? `en marcha${proceso.reinicios > 0 ? ` · ${proceso.reinicios} reinicio${proceso.reinicios === 1 ? '' : 's'} desde que arrancó` : ''}`
                  : proceso.estado === 'reiniciando'
                    ? `reiniciando (último código de salida: ${proceso.ultimoCodigo ?? 'desconocido'})`
                    : 'sin proceso: la emisora está apagada o la radio no responde'}
              </p>
            )}
            {!enAire && <p className="text-sm text-muted-foreground">La estación no está al aire.</p>}
            {enAire && !sonando && <p className="text-sm text-muted-foreground">Al aire, sin información de la pista todavía.</p>}
            {enAire && sonando && (
              <div className="space-y-1">
                <p className="text-lg font-semibold">{sonando.titulo || 'Audio sin título'}</p>
                {sonando.artista && <p className="text-sm text-muted-foreground">{sonando.artista}</p>}
                <p className="text-xs text-muted-foreground">
                  {sonando.lista ? `Lista: ${sonando.lista}` : 'Locutor en vivo o programa'}
                  {sonando.inicio ? ` · empezó ${tiempoDesde(sonando.inicio)}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Siguiente lista: {sonando.siguienteLista ?? 'no hay otra lista en la rotación'}
                </p>
                <p className="text-xs text-muted-foreground">La siguiente canción se elige al terminar la actual.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="text-xs" disabled={!enAire || saltar.isPending || saltarLista.isPending} onClick={() => saltar.mutate(estacion.id)}>
                <SkipForward className="mr-1 h-3.5 w-3.5" /> Siguiente canción
              </Button>
              <Button type="button" variant="outline" size="sm" className="text-xs" disabled={!enAire || !sonando?.lista || saltar.isPending || saltarLista.isPending} onClick={() => saltarLista.mutate(estacion.id)}>
                <ListMusic className="mr-1 h-3.5 w-3.5" /> Siguiente lista de reproducción
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Se actualiza sola cada 5 segundos.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Servicio de AutoDJ</CardTitle>
              <CardDescription className="text-xs">Música automática cuando no hay programa ni locutor.</CardDescription>
            </div>
            {estadoAutodj && <Badge variant={estadoAutodj.variante} className="text-[10px]">{estadoAutodj.texto}</Badge>}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              {activas.length > 0
                ? `Reproduce ${activas.length} lista${activas.length === 1 ? '' : 's'} con ${audiosActivos} audio${audiosActivos === 1 ? '' : 's'}, de arriba abajo.`
                : 'No tiene listas vinculadas todavía.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => irA(`/archivos?emisora=${estacion.radioId}`)}>Archivos de música</Button>
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => cambiarPestana('autodj')}>Listas de reproducción</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Para encender o apagar el AutoDJ, ve a Transmisión.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Cómo suenan los audios de una lista: uno solo por lista
const ORDEN_AUDIOS = [
  { id: 'mezclado' as const, titulo: 'Mezclado', icono: Blend, ayuda: 'Se mezcla la lista completa una vez y luego suena en ese orden.' },
  { id: 'aleatorio' as const, titulo: 'Aleatorio', icono: Shuffle, ayuda: 'Cada vez que se llena la cola, suena un audio al azar.' },
  { id: 'secuencial' as const, titulo: 'Secuencial', icono: ListOrdered, ayuda: 'Suena en el orden exacto de la lista.' },
];

// Duración total de una lista (suma de sus audios con duración conocida)
const duracionDe = (ids: string[], pistas: ApiPista[]) => {
  const mapa = new Map(pistas.map((p) => [p.id, p.durationSec ?? 0]));
  const seg = ids.reduce((n, id) => n + (mapa.get(id) ?? 0), 0);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  if (seg === 0) return '0 min';
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

const textoCuandoSuena = (p: ApiPlaylist) =>
  p.mode === 'programada'
    ? `Programada · ${p.schedules.length} horario${p.schedules.length === 1 ? '' : 's'}`
    : 'En la rotación';

const AutoDj: React.FC<{ estacion: ApiEmisora }> = ({ estacion }) => {
  const transmision = useTransmision(estacion.id);
  const playlists = usePlaylists(estacion.id);
  const pistas = usePistas(estacion.id);
  const todasPistas = [...(pistas.data?.pistas ?? []), ...(pistas.data?.archivoEmisora ?? [])];
  const [escuchando, setEscuchando] = useState<ApiPlaylist | null>(null);
  const [ordenandoAudios, setOrdenandoAudios] = useState<ApiPlaylist | null>(null);
  const [programando, setProgramando] = useState<ApiPlaylist | null>(null);
  const [elegida, setElegida] = useState('');
  const todas = playlists.data ?? [];
  const activas = todas.filter((p) => p.activa);
  const disponibles = todas.filter((p) => !p.activa);
  // Las de la estación suenan siempre primero; las de la emisora se ordenan arrastrando
  const deEmisora = activas.filter((p) => p.ambito === 'emisora');
  const deEstacion = activas.filter((p) => p.ambito === 'estacion');
  const encendido = transmision.data?.transmision.autodjEnabled ?? estacion.autodjEnabled;

  const cambiarUso = useMutacionGestion(
    (input: { playlistId: string; usar: boolean }) => luzApi.setUsoPlaylist(estacion.id, input.playlistId, input.usar),
    'Listas actualizadas',
    'No se pudo cambiar la lista',
  );
  const ordenar = useMutacionGestion((ids: string[]) => luzApi.ordenarPlaylists(estacion.id, ids), 'Orden guardado', 'No se pudo cambiar el orden');
  const cambiarModo = useMutacionGestion(
    (input: { id: string; orden: 'mezclado' | 'aleatorio' | 'secuencial' }) => luzApi.setModoPistas(input.id, input.orden),
    'Modo de los audios guardado',
    'No se pudo cambiar el modo',
  );

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const moverLista = (de: number, a: number) => {
    if (a < 0 || a >= deEmisora.length) return;
    ordenar.mutate(arrayMove(deEmisora, de, a).map((p) => p.id));
  };
  const alSoltar = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    moverLista(deEmisora.findIndex((p) => p.id === active.id), deEmisora.findIndex((p) => p.id === over.id));
  };

  const vincular = () => {
    if (!elegida) return;
    cambiarUso.mutate({ playlistId: elegida, usar: true });
    setElegida('');
  };
  const crearLista = () => irA(`/playlists/nueva?estacion=${estacion.id}&ambito=emisora`);

  // Agenda: cada horario de las listas programadas, por día y hora
  const filasAgenda = todas
    .filter((p) => p.mode === 'programada' && p.schedules.length > 0)
    .flatMap((p) => p.schedules.map((h) => ({ clave: `${p.id}-${h.dayOfWeek}-${h.startTime}`, dia: h.dayOfWeek, desde: h.startTime, hasta: h.endTime, lista: p.name, interrumpe: p.interrumpe, unaSola: p.unaSola })))
    .sort((a, b) => a.dia - b.dia || a.desde.localeCompare(b.desde));

  const filaEstacion = (p: ApiPlaylist) => (
    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{p.name}</p>
        <p className="text-muted-foreground">{p.trackIds.length} audio{p.trackIds.length === 1 ? '' : 's'} · de la estación</p>
      </div>
      <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setEscuchando(p)}>
        <Headphones className="mr-1 h-3.5 w-3.5" /> Escuchar
      </Button>
    </li>
  );

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              Listas de reproducción vinculadas
              <Badge variant={encendido ? 'success' : 'outline'} className="text-[10px] font-normal">AutoDJ {encendido ? 'encendido' : 'apagado'}</Badge>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Suenan de arriba abajo; arrastra o usa las flechas para cambiar el orden. Cada lista tiene un modo para sus audios: elige uno.
              {' '}<span className="text-foreground">Mezclado</span> mezcla la lista una vez; <span className="text-foreground">Aleatorio</span> elige un audio al azar cada vez; <span className="text-foreground">Secuencial</span> sigue el orden exacto.
            </CardDescription>
          </div>
          <Button type="button" size="sm" className="text-xs" onClick={crearLista}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Crear lista de reproducción
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {playlists.isLoading && <p className="text-xs text-muted-foreground">Cargando listas…</p>}
          {!playlists.isLoading && activas.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Esta estación todavía no tiene listas vinculadas. Vincula una existente o crea una nueva.
            </p>
          )}
          {deEstacion.length > 0 && <ul className="divide-y divide-border/60 rounded-xl border border-border">{deEstacion.map(filaEstacion)}</ul>}
          {deEmisora.length > 0 && (
            <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
              <SortableContext items={deEmisora.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-border/60 rounded-xl border border-border">
                  {deEmisora.map((p, i) => (
                    <FilaVinculada
                      key={p.id}
                      lista={p}
                      posicion={i}
                      total={deEmisora.length}
                      ocupada={ordenar.isPending || cambiarUso.isPending || cambiarModo.isPending}
                      onMover={(a) => moverLista(i, a)}
                      onEscuchar={() => setEscuchando(p)}
                      onOrdenarAudios={() => setOrdenandoAudios(p)}
                      onProgramar={() => setProgramando(p)}
                      duracion={duracionDe(p.trackIds, todasPistas)}
                      cuandoSuena={textoCuandoSuena(p)}
                      onModo={(orden) => cambiarModo.mutate({ id: p.id, orden })}
                      onDesvincular={() => cambiarUso.mutate({ playlistId: p.id, usar: false })}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Horarios programados</CardTitle>
          <CardDescription className="text-xs">Las listas programadas y las horas en que suenan, ordenadas por día.</CardDescription>
        </CardHeader>
        <CardContent>
          {filasAgenda.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No hay horarios. Abre «Programar» en una lista para agregar uno.
            </p>
          )}
          <ul className="divide-y divide-border/60">
            {filasAgenda.map((f) => (
              <li key={f.clave} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{DIAS[f.dia]} · {f.desde} – {f.hasta}</p>
                  <p className="truncate text-muted-foreground">{f.lista}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-normal">{f.interrumpe ? 'Interrumpe lo que suena' : 'Espera a que termine la pista'}</Badge>
                  {f.unaSola && <Badge variant="outline" className="text-[10px] font-normal">Solo una pista</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {disponibles.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Vincular una lista de la emisora</CardTitle>
            <CardDescription className="text-xs">Se agrega al final del orden. Las listas de la emisora pueden sonar en todas sus estaciones.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-2">
            <div className="min-w-[240px] flex-1">
              <label htmlFor="vincular-lista" className="mb-1.5 block text-xs font-medium">Lista</label>
              <SelectField id="vincular-lista" value={elegida} onChange={(e) => setElegida(e.target.value)}>
                <option value="">Elige una lista…</option>
                {disponibles.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.trackIds.length} audios)</option>)}
              </SelectField>
            </div>
            <Button type="button" size="sm" className="text-xs" disabled={!elegida || cambiarUso.isPending} onClick={vincular}>
              Vincular
            </Button>
          </CardContent>
        </Card>
      )}

      <Sheet isOpen={escuchando !== null} onClose={() => setEscuchando(null)} title={escuchando?.name ?? ''} description="Escuchar la lista desde este equipo. No cambia lo que suena en la radio." detent="md">
        {escuchando && <ReproductorLista trackIds={escuchando.trackIds} pistas={todasPistas} />}
      </Sheet>

      <OrdenarPistasDialog isOpen={ordenandoAudios !== null} onClose={() => setOrdenandoAudios(null)} lista={ordenandoAudios} pistas={todasPistas} />
      <ProgramarListaDialog isOpen={programando !== null} onClose={() => setProgramando(null)} lista={programando} />
    </div>
  );
};

const FilaVinculada: React.FC<{
  lista: ApiPlaylist;
  posicion: number;
  total: number;
  ocupada: boolean;
  onMover: (a: number) => void;
  onEscuchar: () => void;
  onOrdenarAudios: () => void;
  onProgramar: () => void;
  duracion: string;
  cuandoSuena: string;
  onModo: (orden: 'mezclado' | 'aleatorio' | 'secuencial') => void;
  onDesvincular: () => void;
}> = ({ lista, posicion, total, ocupada, onMover, onEscuchar, onOrdenarAudios, onProgramar, duracion, cuandoSuena, onModo, onDesvincular }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: lista.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3 text-xs', isDragging && 'opacity-70 shadow-lg')}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" ref={setActivatorNodeRef} aria-label={`Arrastrar ${lista.name}`} className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="w-5 shrink-0 text-center font-mono text-muted-foreground">{posicion + 1}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{lista.name}</p>
          <p className="text-muted-foreground">{lista.trackIds.length} audio{lista.trackIds.length === 1 ? '' : 's'} · {duracion} · {cuandoSuena}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onProgramar}>
          <CalendarClock className="mr-1 h-3.5 w-3.5" /> Programar
        </Button>
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onEscuchar}>
          <Headphones className="mr-1 h-3.5 w-3.5" /> Escuchar
        </Button>
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onOrdenarAudios} disabled={lista.trackIds.length < 2}>
          <ListOrdered className="mr-1 h-3.5 w-3.5" /> Ordenar audios
        </Button>
        <div role="radiogroup" aria-label={`Modo de los audios de ${lista.name}`} className="flex overflow-hidden rounded-lg border border-border">
          {ORDEN_AUDIOS.map((o) => {
            const elegido = lista.ordenPistas === o.id;
            const Icono = o.icono;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={elegido}
                aria-label={`${o.titulo}: ${o.ayuda}`}
                title={`${o.titulo}: ${o.ayuda}`}
                disabled={ocupada || elegido}
                onClick={() => onModo(o.id)}
                className={cn(
                  'flex h-8 w-9 items-center justify-center border-l border-border first:border-l-0 cursor-pointer transition-colors disabled:cursor-default',
                  elegido ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icono className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={`Subir ${lista.name}`} disabled={posicion === 0 || ocupada} onClick={() => onMover(posicion - 1)}>
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label={`Bajar ${lista.name}`} disabled={posicion >= total - 1 || ocupada} onClick={() => onMover(posicion + 1)}>
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          aria-label={`Desvincular ${lista.name}`}
          title="Desvincular de esta estación"
          disabled={ocupada}
          onClick={onDesvincular}
          className="p-1.5 text-muted-foreground hover:text-red-400 cursor-pointer disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
};

// Una sección de la pestaña: título, explicación y contenido, separada por una línea (sin cards anidadas)
const Seccion: React.FC<{ titulo: string; descripcion?: string; accion?: React.ReactNode; children: React.ReactNode }> = ({ titulo, descripcion, accion, children }) => (
  <Card className="border-border">
    <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
      <div>
        <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
        {descripcion && <CardDescription className="mt-1 text-xs">{descripcion}</CardDescription>}
      </div>
      {accion}
    </CardHeader>
    <CardContent className="space-y-5">{children}</CardContent>
  </Card>
);

const Transmision: React.FC<{ estacion: ApiEmisora; admin: boolean; editaTransmision: boolean }> = (props) => {
  const transmision = useTransmision(props.estacion.id);
  // El formulario se monta cuando ya llegaron los datos, para que empiece con los valores guardados
  if (!transmision.data) return <Cargando />;
  return <TransmisionContenido {...props} t={transmision.data.transmision} />;
};

const TransmisionContenido: React.FC<{ estacion: ApiEmisora; admin: boolean; editaTransmision: boolean; t: ApiTransmision }> = ({ estacion, admin, editaTransmision, t }) => {
  const locutores = useLocutores(estacion.id);
  const servicio = useServicioRadio();
  const [locutoresAbiertos, setLocutoresAbiertos] = useState(false);
  const form = useFormularioTransmision(estacion, t);

  return (
    <div className="space-y-6">
      <Seccion titulo="Control" descripcion="Encender o apagar la estación, escucharla y copiar el enlace para los oyentes.">
        <EstacionControles emisora={estacion} transmision={t} />
        <p className="text-xs text-muted-foreground">Límite de esta estación: <span className="font-medium text-foreground">{t.limiteServidorOyentes}</span> oyentes a la vez. Cada estación tiene su propio servidor de audio.</p>
        {servicio.data && !servicio.data.encendida && (
          <p className="text-xs text-amber-500">La radio completa está apagada: ninguna estación suena hasta volver a encenderla.</p>
        )}
      </Seccion>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {editaTransmision ? (
            <Seccion titulo="Configuración de transmisión" descripcion="Lo que guardas aquí lo usan el locutor y la radio.">
              <form onSubmit={form.enviar} className="space-y-6" noValidate>
                <CamposTransmision emisora={estacion} transmision={t} f={form.campos} />
                <ErrorCampo texto={form.error} />
                <div className="flex justify-end border-t border-border/60 pt-5">
                  <Button type="submit" size="sm" className="text-xs" disabled={!form.puedeEnviar || form.guardando}>
                    {form.guardando ? 'Guardando…' : 'Guardar transmisión'}
                  </Button>
                </div>
              </form>
            </Seccion>
          ) : (
            <Seccion titulo="Configuración de transmisión" descripcion="La administración cambia estos datos. Tú puedes cambiar el nombre y el AutoDJ de la estación.">
              <p className="text-xs text-muted-foreground">Punto de transmisión: <span className="font-mono text-foreground">{t.mountPoint ?? 'sin punto'}</span> · Calidad: {t.bitrateKbps} kbps · AutoDJ: {t.autodjEnabled ? 'encendido' : 'apagado'}</p>
            </Seccion>
          )}
        </div>

        <aside className="space-y-6">
          <Seccion titulo="Datos para el locutor" descripcion="Con esto se conecta BUTT, OBS o el emisor de Windows.">
            {form.recien && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs">
                <p className="font-medium">Contraseña nueva: cópiala ahora</p>
                <p className="mt-1 text-muted-foreground">No se vuelve a mostrar.</p>
                {form.recien.clave && <p className="mt-2 flex items-center justify-between gap-2 font-mono">{form.recien.clave}<button type="button" onClick={() => copiarTexto(form.recien!.clave!, 'Contraseña')} className="text-muted-foreground hover:text-foreground cursor-pointer"><Copy className="h-3.5 w-3.5" /></button></p>}
              </div>
            )}
            <dl>
              <DatoTransmision etiqueta="Servidor" valor={`${t.locutor.servidor}:${t.locutor.puerto}`} onCopiar={copiarTexto} />
              <DatoTransmision etiqueta="Punto de montaje" valor={form.mountFinal} onCopiar={copiarTexto} />
              <DatoTransmision etiqueta="Contraseña" valor={t.livePasswordConfigurada ? 'Guardada' : 'Sin contraseña'} />
              <DatoTransmision etiqueta="Calidad" valor={`${t.bitrateKbps} kbps`} />
              {t.hlsUrl && <DatoTransmision etiqueta="Enlace para oyentes (adaptable)" valor={t.hlsUrl} onCopiar={copiarTexto} />}
              {t.streamUrl && <DatoTransmision etiqueta="Enlace MP3 clásico" valor={t.streamUrl} onCopiar={copiarTexto} />}
            </dl>
          </Seccion>

          <Seccion
            titulo="Locutores con acceso"
            descripcion="Quiénes pueden transmitir en esta estación."
            accion={admin ? <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setLocutoresAbiertos(true)}>Editar</Button> : undefined}
          >
            {locutores.data && locutores.data.asignados.length === 0 && <p className="text-xs text-muted-foreground">Todavía nadie tiene acceso.</p>}
            <ul className="divide-y divide-border/60">
              {(locutores.data?.asignados ?? []).map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                  <span className="font-medium">{u.nombre}</span>
                  <span className="truncate text-muted-foreground">{u.email}</span>
                </li>
              ))}
            </ul>
          </Seccion>
        </aside>
      </div>

      {locutoresAbiertos && <LocutoresDialog emisora={estacion} onClose={() => setLocutoresAbiertos(false)} />}
    </div>
  );
};

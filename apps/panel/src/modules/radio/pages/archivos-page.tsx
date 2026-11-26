import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiEmisora, ApiPlaylist, ApiRadio, luzApi } from '../../../shared/api/luz-api';
import { confirmar } from '../../../shared/lib/confirm';
import { cn } from '../../../shared/lib/utils';
import { useEstaciones, useMutacionGestion, useRadios } from '../../gestion/hooks/use-gestion';
import { irA } from '../../gestion/lib/navegar';
import { usePlaylists } from '../hooks/use-radio';
import { BibliotecaArchivos } from './biblioteca-archivos';

// Archivos de la EMISORA: sus audios y sus listas. Todas sus estaciones los usan.
// Las listas se vinculan a cada estación desde su pestaña AutoDJ; aquí se crean y se editan.

type Pestana = 'audios' | 'listas';
const MENSAJES_MODO = { rotacion: 'Rotación', secuencial: 'Secuencial', programada: 'Programada' } as const;

export const ArchivosPage: React.FC = () => {
  const radios = useRadios();
  const estaciones = useEstaciones();
  const lista = radios.data ?? [];
  const [radioId, setRadioId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('emisora') ?? '');
  const [pestana, setPestana] = useState<Pestana>('audios');

  useEffect(() => {
    if (lista.length && !lista.some((r) => r.id === radioId)) {
      setRadioId((lista.find((r) => r.kind === 'own') ?? lista[0]).id);
    }
  }, [lista, radioId]);

  const radio = lista.find((r) => r.id === radioId);
  // La API sirve los audios y las listas de la emisora a través de una de sus estaciones.
  const estacion = (estaciones.data ?? []).find((e) => e.radioId === radioId);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1.5">Radio / Archivos</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Archivos de la emisora</h1>
          <p className="text-sm text-muted-foreground mt-1">Los audios y las listas son de la emisora: todas sus estaciones los pueden usar.</p>
        </div>
        {lista.length > 1 && (
          <div className="w-full sm:w-72">
            <label htmlFor="archivos-emisora" className="text-xs font-medium block mb-1.5">Emisora</label>
            <SelectField id="archivos-emisora" value={radioId} onChange={(e) => setRadioId(e.target.value)}>
              {lista.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </SelectField>
          </div>
        )}
      </div>

      <div role="tablist" className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {([['audios', 'Audios'], ['listas', 'Listas de reproducción']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={cn('px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors', pestana === id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}
          >
            {label}
          </button>
        ))}
      </div>

      {radios.isLoading && <p className="text-xs text-muted-foreground">Cargando emisoras…</p>}
      {radios.data && lista.length === 0 && <p className="text-xs text-muted-foreground">Primero crea una emisora en Emisoras.</p>}
      {radio && !estacion && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          {radio.name} todavía no tiene estaciones. Crea una en Emisoras para poder subir audios.
        </p>
      )}
      {radio && estacion && pestana === 'audios' && <BibliotecaArchivos emisora={estacion} destino="emisora" />}
      {radio && estacion && pestana === 'listas' && <ListasDeEmisora radio={radio} estacion={estacion} />}
    </div>
  );
};

const ListasDeEmisora: React.FC<{ radio: ApiRadio; estacion: ApiEmisora }> = ({ radio, estacion }) => {
  const playlists = usePlaylists(estacion.id);
  const eliminar = useMutacionGestion((id: string) => luzApi.deletePlaylist(id), 'Lista eliminada', 'No se pudo eliminar la lista');
  const todas = playlists.data ?? [];

  const borrar = async (p: ApiPlaylist) => {
    const ok = await confirmar({
      title: `¿Eliminar la lista "${p.name}"?`,
      text: 'Los audios no se borran. La lista deja de sonar en todas las estaciones de la emisora.',
      type: 'danger',
      confirmText: 'Eliminar',
    });
    if (ok) eliminar.mutate(p.id);
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold">Listas de {radio.name}</CardTitle>
          <CardDescription className="text-xs">Cada estación las vincula desde su pestaña AutoDJ. Aquí se crean y se editan.</CardDescription>
        </div>
        <Button type="button" size="sm" className="text-xs" onClick={() => irA(`/playlists/nueva?estacion=${estacion.id}&ambito=emisora`)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Nueva lista
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {playlists.isLoading && <p className="p-4 text-xs text-muted-foreground">Cargando listas…</p>}
        {!playlists.isLoading && todas.length === 0 && (
          <p className="m-4 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">Todavía no hay listas en esta emisora.</p>
        )}
        <ul className="divide-y divide-border/60">
          {todas.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
              <div className="min-w-[200px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <Badge variant="outline" className="text-[10px]">{MENSAJES_MODO[p.mode]}</Badge>
                  {!p.isActive && <Badge variant="warning" className="text-[10px]">Pausada</Badge>}
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {p.trackIds.length} audio{p.trackIds.length === 1 ? '' : 's'}{p.mode !== 'programada' ? ` · peso ${p.weight}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => irA(`/playlists/${p.id}?estacion=${estacion.id}`)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <button type="button" aria-label="Eliminar lista" onClick={() => borrar(p)} className="p-2 text-muted-foreground hover:text-red-400 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

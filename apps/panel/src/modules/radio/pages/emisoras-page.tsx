import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { SelectField } from '../../usuarios/components/select-field';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiEmisora, ApiFranja, ApiPrograma, luzApi } from '../../../shared/api/luz-api';
import { useEmisoras, useMutacionGestion, useProgramas } from '../../gestion/hooks/use-gestion';
import { DIAS } from '../../gestion/lib/fechas';
import { cn } from '../../../shared/lib/utils';
import { irA } from '../../gestion/lib/navegar';
import { FranjaDialog } from '../components/franja-dialog';
import { ProgramaDialog } from '../components/programa-dialog';
import { ProgramacionCalendario } from '../components/programacion-calendario';
import { RELLENO_ETIQUETA } from '@luz/shared';

type Pestana = 'emisoras' | 'programacion';

const ETIQUETA_ESTADO: Record<string, string> = { active: 'Activa', suspended: 'Suspendida', disabled: 'Deshabilitada' };

// Emisoras (la principal, las del ministerio y una externa) y su programación semanal.
export const EmisorasPage: React.FC = () => {
  const [pestana, setPestana] = useState<Pestana>('emisoras');
  const emisoras = useEmisoras();
  const eliminarEmisora = useMutacionGestion((id: string) => luzApi.deleteEmisora(id), 'Emisora eliminada', 'No se pudo eliminar la emisora');

  const pestanas: { id: Pestana; label: string }[] = [
    { id: 'emisoras', label: 'Emisoras' },
    { id: 'programacion', label: 'Programación' },
  ];

  const borrar = async (e: ApiEmisora) => {
    const ok = await confirmar({ title: `¿Eliminar la emisora "${e.name}"?`, text: 'Se borran también sus programas y horarios.', type: 'danger', confirmText: 'Eliminar' });
    if (ok) eliminarEmisora.mutate(e.id);
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Principal / Emisoras</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Emisoras y programación</h1>
        <p className="text-sm text-muted-foreground mt-1">Las emisoras del ministerio y su horario semanal.</p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {pestanas.map((p) => (
          <button key={p.id} type="button" onClick={() => setPestana(p.id)} className={cn('px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors', pestana === p.id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}>
            {p.label}
          </button>
        ))}
      </div>

      {pestana === 'emisoras' && (
        <Card className="border-border">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Emisoras</CardTitle>
              <CardDescription className="text-xs">Solo puede haber una principal y una externa.</CardDescription>
            </div>
            <Button type="button" size="sm" className="text-xs" onClick={() => irA('/emisoras/nueva')}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nueva emisora
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {emisoras.error ? (
              <p className="p-4 text-xs text-red-400">No se pudieron cargar las emisoras.</p>
            ) : emisoras.isLoading ? (
              <p className="p-4 text-xs text-muted-foreground">Cargando…</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-border/60 bg-secondary/30 text-left">
                    <th className="px-4 py-2.5 font-medium">Imagen</th>
                    <th className="px-4 py-2.5 font-medium">Emisora</th>
                    <th className="px-4 py-2.5 font-medium">Tipo</th>
                    <th className="px-4 py-2.5 font-medium">Estado</th>
                    <th className="px-4 py-2.5 font-medium">En la web</th>
                    <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(emisoras.data ?? []).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Todavía no hay emisoras.</td></tr>
                  )}
                  {(emisoras.data ?? []).map((e) => (
                    <tr key={e.id} onClick={() => irA(`/emisoras/${e.id}`)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        {e.imageUrl ? (
                          <img src={e.imageUrl} alt="" className="h-12 w-20 rounded-md object-cover border border-border" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold">{e.name}{e.isMain ? ' · principal' : ''}</p>
                        <p className="font-mono text-muted-foreground">{e.slug}</p>
                      </td>
                      <td className="px-4 py-2.5">{e.kind === 'external' ? `Externa${e.operatedByName ? ` · ${e.operatedByName}` : ''}` : 'Del ministerio'}</td>
                      <td className="px-4 py-2.5">{ETIQUETA_ESTADO[e.status]}</td>
                      <td className="px-4 py-2.5">{e.visibleInMinistry ? 'Visible' : 'Oculta'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="sm" aria-label="Editar" onClick={() => irA(`/emisoras/${e.id}`)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {!e.isMain && (
                            <Button type="button" variant="ghost" size="sm" aria-label="Eliminar" onClick={(ev) => { ev.stopPropagation(); borrar(e); }}>
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {pestana === 'programacion' && <ProgramacionTab emisoras={emisoras.data ?? []} />}
    </div>
  );
};

// Programación de UNA emisora: un solo selector, dos botones (Nuevo programa / Agregar horario),
// y el horario como calendario o como tabla.
const ProgramacionTab: React.FC<{ emisoras: ApiEmisora[] }> = ({ emisoras }) => {
  const [emisoraId, setEmisoraId] = useState<string>('');
  const [vista, setVista] = useState<'calendario' | 'tabla'>('calendario');
  const [horarioNuevo, setHorarioNuevo] = useState<{ dayOfWeek: number; startTime: string; endTime: string } | null>(null);
  const [programaNuevo, setProgramaNuevo] = useState(false);
  const programas = useProgramas(emisoraId || null);
  const eliminarFranja = useMutacionGestion((id: string) => luzApi.deleteFranja(id), 'Horario quitado', 'No se pudo quitar el horario');

  useEffect(() => {
    if (!emisoras.some((e) => e.id === emisoraId)) setEmisoraId(emisoras[0]?.id ?? '');
  }, [emisoras, emisoraId]);

  const emisora = emisoras.find((e) => e.id === emisoraId);
  const listaProgramas = programas.data ?? [];
  const filasHorario = useMemo(
    () =>
      listaProgramas
        .flatMap((p) => p.franjas.map((f) => ({ ...f, programa: p })))
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
    [listaProgramas],
  );

  if (emisoras.length === 0) {
    return <p className="text-muted-foreground">Primero crea una emisora en la pestaña Emisoras.</p>;
  }

  return (
    <Card className="border-border">
      <CardContent className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Emisora</span>
          <SelectField aria-label="Emisora" value={emisoraId} onChange={(e) => setEmisoraId(e.target.value)} wrapperClassName="w-72">
            {emisoras.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </SelectField>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setProgramaNuevo(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nuevo programa
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs"
            disabled={listaProgramas.length === 0}
            onClick={() => setHorarioNuevo({ dayOfWeek: 1, startTime: '08:00', endTime: '09:00' })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar horario
          </Button>
        </div>
      </div>

      {emisora && (
        <p className="text-xs text-muted-foreground">
          Cuando no hay programa suena: <strong className="text-foreground">{RELLENO_ETIQUETA[emisora.relleno]}</strong>
          {' · '}
          <button type="button" className="text-primary underline cursor-pointer" onClick={() => irA(`/emisoras/${emisora.id}`)}>cambiar</button>
        </p>
      )}

      {programas.isSuccess && listaProgramas.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-4 text-xs">
          <p className="font-semibold">Esta emisora todavía no tiene programas.</p>
          <p className="text-muted-foreground mt-1">Primero crea un programa (por ejemplo, "Vida sana"). Después le pones su horario.</p>
        </div>
      )}

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {([['calendario', 'Calendario'], ['tabla', 'Tabla']] as const).map(([id, texto]) => (
          <button key={id} type="button" onClick={() => setVista(id)} className={cn('px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors', vista === id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}>
            {texto}
          </button>
        ))}
      </div>

      {vista === 'calendario' && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">Haz clic en una hora libre para agregar un horario. Clic en un programa para editarlo.</p>
          <ProgramacionCalendario emisora={emisora} onHorarioLibre={(sel) => setHorarioNuevo(sel)} />
        </div>
      )}

      {vista === 'tabla' && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/30 text-left">
                <th className="px-4 py-2.5 font-medium">Día</th>
                <th className="px-4 py-2.5 font-medium">Horario</th>
                <th className="px-4 py-2.5 font-medium">Programa</th>
                <th className="px-4 py-2.5 font-medium">Conductor</th>
                <th className="px-4 py-2.5 font-medium">Transmisión</th>
                <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filasHorario.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Sin horarios todavía.</td></tr>
              )}
              {filasHorario.map((f) => (
                <tr key={f.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-semibold">{DIAS[f.dayOfWeek]}</td>
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">{f.startTime.slice(0, 5)} – {f.endTime.slice(0, 5)}</td>
                  <td className="px-4 py-3">{f.programa.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.programa.hostName ?? '—'}</td>
                  <td className="px-4 py-3">{f.isLive ? 'En vivo' : 'Grabado / automático'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" aria-label="Editar programa" onClick={() => irA(`/emisoras/${emisoraId}/programas/${f.programa.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" aria-label="Quitar horario" onClick={() => eliminarFranja.mutate(f.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {programaNuevo && emisoraId && (
        <ProgramaDialog emisoraId={emisoraId} programa={null} onClose={() => setProgramaNuevo(false)} />
      )}

      {horarioNuevo && listaProgramas.length > 0 && (
        <FranjaDialog
          programas={listaProgramas.map((p) => ({ id: p.id, name: p.name }))}
          inicial={horarioNuevo}
          onClose={() => setHorarioNuevo(null)}
        />
      )}
      </CardContent>
    </Card>
  );
};

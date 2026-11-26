import React, { useEffect, useMemo, useState } from 'react';
import { ListMusic, Pencil, Plus, Radio, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { SelectField } from '../../usuarios/components/select-field';
import { confirmar } from '../../../shared/lib/confirm';
import { ApiEmisora, luzApi } from '../../../shared/api/luz-api';
import { useEstaciones, useMutacionGestion, useProgramas, useRadios } from '../../gestion/hooks/use-gestion';
import { useSession } from '../../auth/hooks/use-session';
import { DIAS } from '../../gestion/lib/fechas';
import { cn } from '../../../shared/lib/utils';
import { irA } from '../../gestion/lib/navegar';
import { FranjaDialog } from '../components/franja-dialog';
import { ProgramaDialog } from '../components/programa-dialog';
import { ProgramacionCalendario } from '../components/programacion-calendario';
import { EstacionDialog } from '../components/estacion-dialog';
import { Badge } from '../../../shared/components/ui/badge';
import { Switch } from '../../../shared/components/ui/switch';

const ETIQUETA_ESTADO: Record<string, string> = { draft: 'Borrador', active: 'Activa', suspended: 'Suspendida', disabled: 'Deshabilitada' };

// Estado de la transmisión de una estación y su interruptor (encender / apagar)
export const EstadoRadio: React.FC<{ emisora: ApiEmisora }> = ({ emisora }) => {
  const t = emisora.transmision;
  const cambiar = useMutacionGestion((encendida: boolean) => luzApi.setEmisoraEncendida(emisora.id, encendida), 'Estación actualizada', 'No se pudo cambiar la estación');
  const alternar = async (encendida: boolean) => {
    if (!encendida) {
      const ok = await confirmar({ title: `¿Apagar ${emisora.name}?`, text: 'Deja de sonar para los oyentes hasta que la vuelvas a encender. Puede haber un corte de unos segundos en todas las estaciones.', type: 'danger', confirmText: 'Apagar' });
      if (!ok) return;
    }
    cambiar.mutate(encendida);
  };
  const estado = emisora.status === 'draft' ? { texto: 'Borrador', variante: 'outline' as const }
    : !t.mountPoint ? { texto: 'Sin transmisión', variante: 'outline' as const }
    : !t.livePasswordConfigurada ? { texto: 'Falta contraseña', variante: 'warning' as const }
    : !t.radioEncendida ? { texto: 'Radio apagada', variante: 'outline' as const }
    : !t.encendida ? { texto: 'Apagada', variante: 'outline' as const }
    : t.enAire ? { texto: `Al aire · ${t.oyentes}`, variante: 'success' as const }
    : { texto: 'Sin señal', variante: 'warning' as const };
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <Switch checked={t.encendida} onCheckedChange={alternar} disabled={!t.mountPoint || cambiar.isPending} />
      <Badge variant={estado.variante} className="text-[10px]">{estado.texto}</Badge>
    </div>
  );
};

// Emisores y estaciones: cada emisora contiene sus estaciones. Solo admin crea emisoras y estaciones.
export const EmisorasPage: React.FC = () => {
  const radios = useRadios();
  const estaciones = useEstaciones();
  const eliminarEstacion = useMutacionGestion((id: string) => luzApi.deleteEstacion(id), 'Estación eliminada', 'No se pudo eliminar la estación');
  const sesion = useSession();
  const admin = (sesion.data?.permisos ?? []).includes('estaciones:todas');
  const [nuevaEn, setNuevaEn] = useState<string | null>(null);
  const [editando, setEditando] = useState<ApiEmisora | null>(null);

  const borrar = async (e: ApiEmisora) => {
    const ok = await confirmar({ title: `¿Eliminar la estación "${e.name}"?`, text: 'Se borran también sus programas y horarios. Los audios quedan en el archivo.', type: 'danger', confirmText: 'Eliminar' });
    if (ok) eliminarEstacion.mutate(e.id);
  };

  const listaEstaciones = estaciones.data ?? [];
  const listaRadios = radios.data ?? [];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1.5">Radio / Emisoras</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Emisoras y estaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Una emisora contiene sus estaciones. Cada estación transmite, tiene su AutoDJ y su archivo.</p>
        </div>
        {admin && (
          <Button type="button" size="sm" className="text-xs" onClick={() => irA('/emisoras/nueva')}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva emisora de un tercero
          </Button>
        )}
      </div>

      <div className="space-y-6">
          {radios.isLoading && <p className="text-xs text-muted-foreground">Cargando…</p>}
          {!radios.isLoading && listaRadios.length === 0 && <p className="text-xs text-muted-foreground">Todavía no hay emisoras.</p>}
          {listaRadios.map((r) => {
            const suyas = listaEstaciones.filter((e) => e.radioId === r.id);
            const puedeNueva = admin && (r.kind === 'own' || suyas.length === 0);
            return (
              <Card key={r.id} className="border-border">
                <div className="flex flex-wrap items-center gap-4 p-5 border-b border-border/60">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt="" className="h-14 w-24 rounded-md object-cover border border-border" />
                  ) : (
                    <div className="flex h-14 w-24 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground"><Radio className="h-5 w-5" /></div>
                  )}
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.name}</p>
                      {r.isMain && <Badge variant="secondary" className="text-[10px]">Principal</Badge>}
                      {r.kind === 'external' && <Badge variant="outline" className="text-[10px]">De un tercero{r.operatedByName ? ` · ${r.operatedByName}` : ''}</Badge>}
                      <Badge variant={r.status === 'active' ? 'success' : 'outline'} className="text-[10px]">{ETIQUETA_ESTADO[r.status]}</Badge>
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{r.slug} · {suyas.length} estación{suyas.length === 1 ? '' : 'es'}</p>
                  </div>
                  <div className="flex gap-2">
                    {admin && (
                      <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => irA(`/emisoras/${r.id}`)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar emisora
                      </Button>
                    )}
                    {puedeNueva && (
                      <Button type="button" size="sm" className="text-xs" onClick={() => setNuevaEn(r.id)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Nueva estación
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-0 overflow-x-auto">
                  {suyas.length === 0 ? (
                    <p className="p-5 text-xs text-muted-foreground">Esta emisora todavía no tiene estaciones.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/60 bg-secondary/30 text-left">
                          <th className="px-4 py-2.5 font-medium">Estación</th>
                          <th className="px-4 py-2.5 font-medium">AutoDJ</th>
                          <th className="px-4 py-2.5 font-medium">Radio</th>
                          <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suyas.map((e) => (
                          <tr key={e.id} className="border-b border-border/40">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                {e.imageUrl ? (
                                  <img src={e.imageUrl} alt="" className="h-9 w-14 shrink-0 rounded-md border border-border object-cover" />
                                ) : (
                                  <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground"><Radio className="h-3.5 w-3.5" /></div>
                                )}
                                <button type="button" onClick={() => irA(`/estacion/${e.id}`)} className="font-semibold text-left hover:text-primary hover:underline cursor-pointer">{e.name}</button>
                              </div>
                              <p className="font-mono text-muted-foreground">{e.slug}{e.transmision.mountPoint ? ` · ${e.transmision.mountPoint}` : ''}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={e.autodjEnabled ? 'success' : 'outline'} className="text-[10px]">{e.autodjEnabled ? 'Con AutoDJ' : 'Solo transmisión'}</Badge>
                            </td>
                            <td className="px-4 py-2.5"><EstadoRadio emisora={e} /></td>
                            <td className="px-4 py-2.5">
                              <div className="flex justify-end gap-1">
                                <Button type="button" size="sm" className="text-xs" onClick={() => irA(`/estacion/${e.id}`)}>Abrir</Button>
                                <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => irA(`/estacion/${e.id}?tab=autodj`)}><ListMusic className="h-3.5 w-3.5 mr-1" /> Listas</Button>
                                {admin && (
                                  <>
                                    <Button type="button" variant="ghost" size="sm" aria-label="Editar estación" onClick={() => setEditando(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button type="button" variant="ghost" size="sm" aria-label="Eliminar estación" onClick={() => borrar(e)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                                  </>
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
            );
          })}
        </div>

      {nuevaEn && <EstacionDialog estacion={null} emisoras={listaRadios} radioIdInicial={nuevaEn} onClose={() => setNuevaEn(null)} />}
      {editando && <EstacionDialog estacion={editando} emisoras={listaRadios} onClose={() => setEditando(null)} />}
    </div>
  );
};

// Programación de UNA emisora: un solo selector, dos botones (Nuevo programa / Agregar horario),
// y el horario como calendario o como tabla.
export const ProgramacionTab: React.FC<{ emisoras: ApiEmisora[] }> = ({ emisoras }) => {
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
        {emisoras.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Emisora</span>
            <SelectField aria-label="Emisora" value={emisoraId} onChange={(e) => setEmisoraId(e.target.value)} wrapperClassName="w-72">
              {emisoras.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </SelectField>
          </div>
        )}
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
                      <Button type="button" variant="ghost" size="sm" aria-label="Editar programa" onClick={() => irA(`/estaciones/${emisoraId}/programas/${f.programa.id}`)}>
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

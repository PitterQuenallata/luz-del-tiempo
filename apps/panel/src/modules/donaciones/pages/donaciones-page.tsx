import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { DONACION_METODOS, donacionMetodoSchema, necesidadSchema } from '@luz/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { ApiMetodoDonacion, ApiNecesidad, luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { useDonaciones } from '../../gestion/hooks/use-gestion';
import { EtiquetaCampo, claseTextarea } from '../../contenido/components/dialogo-contenido';

const ETIQUETA_METODO: Record<(typeof DONACION_METODOS)[number], string> = {
  qr: 'QR interbancario',
  bank: 'Transferencia o depósito',
  paypal: 'PayPal',
  remittance: 'Remesa (Western Union, MoneyGram)',
};

interface FilaMetodo { activo: boolean; title: string; detail: string; lines: string }

// Formas de donar que muestra la web y necesidades del ministerio (texto, sin montos).
export const DonacionesPage: React.FC = () => {
  const { data, isLoading, error } = useDonaciones();
  const qc = useQueryClient();
  const [metodos, setMetodos] = useState<Record<string, FilaMetodo>>({});
  const [necesidades, setNecesidades] = useState<ApiNecesidad[]>([]);
  const [guardandoMetodos, setGuardandoMetodos] = useState(false);
  const [guardandoNecesidades, setGuardandoNecesidades] = useState(false);
  const [errorMetodos, setErrorMetodos] = useState<string | null>(null);
  const [errorNecesidades, setErrorNecesidades] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const guardados = new Map<string, ApiMetodoDonacion>(data.metodos.map((m) => [m.id, m]));
    setMetodos(
      Object.fromEntries(
        DONACION_METODOS.map((id) => {
          const m = guardados.get(id);
          return [id, { activo: Boolean(m), title: m?.title ?? ETIQUETA_METODO[id], detail: m?.detail ?? '', lines: (m?.lines ?? []).join('\n') }];
        }),
      ),
    );
    setNecesidades(data.necesidades);
  }, [data]);

  const guardarMetodos = async () => {
    const lista = DONACION_METODOS.filter((id) => metodos[id]?.activo).map((id) => ({
      id,
      title: metodos[id].title.trim(),
      detail: metodos[id].detail.trim(),
      lines: metodos[id].lines.split('\n').map((l) => l.trim()).filter(Boolean),
    }));
    for (const m of lista) {
      const r = donacionMetodoSchema.safeParse(m);
      if (!r.success) return setErrorMetodos(`${ETIQUETA_METODO[m.id]}: ${r.error.issues[0]?.message ?? 'revisa los datos'}`);
    }
    setErrorMetodos(null);
    setGuardandoMetodos(true);
    try {
      await luzApi.setMetodosDonacion(lista);
      await qc.invalidateQueries({ queryKey: ['gestion'] });
      pillToast.success('Formas de donar guardadas');
    } catch (err) {
      pillToast.error('No se pudieron guardar', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardandoMetodos(false);
    }
  };

  const guardarNecesidades = async () => {
    for (const n of necesidades) {
      const r = necesidadSchema.safeParse(n);
      if (!r.success) return setErrorNecesidades(r.error.issues[0]?.message ?? 'Revisa las necesidades.');
    }
    setErrorNecesidades(null);
    setGuardandoNecesidades(true);
    try {
      await luzApi.setNecesidades(necesidades.map((n) => ({ title: n.title.trim(), detail: n.detail.trim() })));
      await qc.invalidateQueries({ queryKey: ['gestion'] });
      pillToast.success('Necesidades guardadas');
    } catch (err) {
      pillToast.error('No se pudieron guardar', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardandoNecesidades(false);
    }
  };

  if (error) return <p className="p-4 text-xs text-red-400">No se pudieron cargar las donaciones.</p>;
  if (isLoading) return <p className="p-4 text-xs text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Principal / Donaciones</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Donaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">Cómo donar y qué necesita el ministerio. Los montos los confirma el ministerio.</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Formas de donar</CardTitle>
          <CardDescription className="text-xs">Activa solo las que el ministerio ya puede recibir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {DONACION_METODOS.map((id) => {
            const f = metodos[id];
            if (!f) return null;
            const set = (patch: Partial<FilaMetodo>) => setMetodos((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
            return (
              <div key={id} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{ETIQUETA_METODO[id]}</p>
                  <div className="flex items-center gap-2">
                    <Switch id={`metodo-${id}`} checked={f.activo} onCheckedChange={(v) => set({ activo: v })} />
                    <EtiquetaCampo htmlFor={`metodo-${id}`}>Mostrar</EtiquetaCampo>
                  </div>
                </div>
                {f.activo && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <EtiquetaCampo htmlFor={`metodo-titulo-${id}`}>Título</EtiquetaCampo>
                        <Input id={`metodo-titulo-${id}`} value={f.title} onChange={(e) => set({ title: e.target.value })} className="text-xs" />
                      </div>
                      <div>
                        <EtiquetaCampo htmlFor={`metodo-detalle-${id}`}>Detalle</EtiquetaCampo>
                        <Input id={`metodo-detalle-${id}`} value={f.detail} onChange={(e) => set({ detail: e.target.value })} className="text-xs" />
                      </div>
                    </div>
                    <div>
                      <EtiquetaCampo htmlFor={`metodo-lineas-${id}`}>Datos (una línea por dato)</EtiquetaCampo>
                      <textarea id={`metodo-lineas-${id}`} rows={3} value={f.lines} onChange={(e) => set({ lines: e.target.value })} className={claseTextarea} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {errorMetodos && <p className="text-[11px] text-red-400">{errorMetodos}</p>}
          <div className="flex justify-end">
            <Button type="button" size="sm" className="text-xs" disabled={guardandoMetodos} onClick={guardarMetodos}>
              {guardandoMetodos ? 'Guardando…' : 'Guardar formas de donar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Necesidades del ministerio</CardTitle>
            <CardDescription className="text-xs">Lo que se pide a la comunidad, en texto.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setNecesidades((n) => [...n, { title: '', detail: '' }])}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {necesidades.length === 0 && <p className="text-muted-foreground">Todavía no hay necesidades.</p>}
          {necesidades.map((n, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
              <Input aria-label="Título de la necesidad" value={n.title} onChange={(e) => setNecesidades((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Equipo de sonido" className="text-xs" />
              <Input aria-label="Detalle de la necesidad" value={n.detail} onChange={(e) => setNecesidades((prev) => prev.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} placeholder="Para la radio y los cultos" className="text-xs" />
              <Button type="button" variant="ghost" size="sm" aria-label="Quitar necesidad" onClick={() => setNecesidades((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            </div>
          ))}
          {errorNecesidades && <p className="text-[11px] text-red-400">{errorNecesidades}</p>}
          <div className="flex justify-end">
            <Button type="button" size="sm" className="text-xs" disabled={guardandoNecesidades} onClick={guardarNecesidades}>
              {guardandoNecesidades ? 'Guardando…' : 'Guardar necesidades'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

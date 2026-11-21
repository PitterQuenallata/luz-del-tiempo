import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { enVivoSchema, PLATAFORMA_ETIQUETA, PLATAFORMAS_EN_VIVO } from '@luz/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { SelectField } from '../../usuarios/components/select-field';
import { EtiquetaCampo, ErrorCampo } from '../../contenido/components/dialogo-contenido';
import { luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { useEnVivo } from '../../gestion/hooks/use-gestion';
import { fechaLegible } from '../../gestion/lib/fechas';

type Plataforma = (typeof PLATAFORMAS_EN_VIVO)[number];
interface FilaEnlace { key: number; platform: Plataforma; url: string }

// Transmisión en vivo: el aviso general y un enlace por plataforma. Pueden estar varias a la vez.
export const EnVivoPage: React.FC = () => {
  const { data, isLoading, error } = useEnVivo();
  const qc = useQueryClient();
  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState('');
  const [filas, setFilas] = useState<FilaEnlace[]>([]);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!data) return;
    setIsLive(data.estado.isLive);
    setTitle(data.estado.title ?? '');
    // Filas listas para pegar: las plataformas principales aparecen vacías si todavía no hay enlaces
    const guardados = data.transmisiones.map((t, i) => ({ key: i + 1, platform: t.platform, url: t.url }));
    const listas: Plataforma[] = ['youtube', 'tiktok', 'facebook'];
    setFilas(
      guardados.length > 0
        ? guardados
        : listas.map((platform, i) => ({ key: i + 1, platform, url: '' })),
    );
  }, [data]);

  const usadas = new Set(filas.map((f) => f.platform));
  const disponibles = PLATAFORMAS_EN_VIVO.filter((p) => !usadas.has(p));

  const guardar = async () => {
    const parsed = enVivoSchema.safeParse({
      isLive,
      title: title.trim() || null,
      // Las filas sin enlace no se guardan
      streams: filas.filter((f) => f.url.trim()).map((f) => ({ platform: f.platform, url: f.url.trim() })),
    });
    if (!parsed.success) {
      setErrorForm(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
      return;
    }
    setErrorForm(null);
    setEnviando(true);
    try {
      await luzApi.setEnVivo(parsed.data);
      await qc.invalidateQueries({ queryKey: ['gestion'] });
      pillToast.success(isLive ? 'Transmisión activa en la web' : 'Transmisión apagada');
    } catch (err) {
      pillToast.error('No se pudo guardar', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Sitio web / En vivo</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">En vivo</h1>
        <p className="text-sm text-muted-foreground mt-1">Enciende el aviso y pega el enlace de cada plataforma donde estés transmitiendo.</p>
      </div>

      <Card className="border-border max-w-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Transmisión</CardTitle>
          <CardDescription className="text-xs">
            {data?.estado.isLive ? `Activa desde ${fechaLegible(data.estado.startedAt)}` : 'Sin transmisión en este momento.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-xs">
          {error ? (
            <p className="text-red-400">No se pudo cargar el estado.</p>
          ) : isLoading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div>
                  <p className="font-semibold">Estamos en vivo</p>
                  <p className="text-muted-foreground">Muestra el aviso en la portada de la web.</p>
                </div>
                <Switch id="en-vivo-activo" checked={isLive} onCheckedChange={setIsLive} />
              </div>

              <div>
                <EtiquetaCampo htmlFor="en-vivo-titulo">Título de la transmisión (opcional)</EtiquetaCampo>
                <Input id="en-vivo-titulo" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Culto de la noche" className="text-xs" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Enlaces de la transmisión</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={disponibles.length === 0}
                    onClick={() => setFilas((prev) => [...prev, { key: Date.now(), platform: disponibles[0], url: '' }])}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar plataforma
                  </Button>
                </div>

                {filas.length === 0 && <p className="text-muted-foreground">Todavía no hay enlaces. Agrega YouTube, TikTok, Facebook o la radio.</p>}

                {filas.map((f) => (
                  <div key={f.key} className="grid grid-cols-[9rem_1fr_auto] items-center gap-2">
                    <SelectField
                      aria-label="Plataforma"
                      value={f.platform}
                      onChange={(e) => setFilas((prev) => prev.map((x) => (x.key === f.key ? { ...x, platform: e.target.value as Plataforma } : x)))}
                    >
                      {PLATAFORMAS_EN_VIVO.filter((p) => p === f.platform || !usadas.has(p)).map((p) => (
                        <option key={p} value={p}>{PLATAFORMA_ETIQUETA[p]}</option>
                      ))}
                    </SelectField>
                    <Input
                      aria-label={`Enlace de ${PLATAFORMA_ETIQUETA[f.platform]}`}
                      value={f.url}
                      onChange={(e) => setFilas((prev) => prev.map((x) => (x.key === f.key ? { ...x, url: e.target.value } : x)))}
                      placeholder="https://…"
                      className="text-xs font-mono"
                    />
                    <Button type="button" variant="ghost" size="sm" aria-label="Quitar plataforma" onClick={() => setFilas((prev) => prev.filter((x) => x.key !== f.key))}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>

              <ErrorCampo texto={errorForm} />

              <div className="flex justify-end">
                <Button type="button" size="sm" className="text-xs" disabled={enviando} onClick={guardar}>
                  {enviando ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

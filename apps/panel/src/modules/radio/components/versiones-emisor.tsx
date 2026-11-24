import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { useVersionesEmisor } from '../hooks/use-radio';

const fecha = (iso: string) => new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** "0.10.0" > "0.9.3" */
function anterior(a: string | null, b: string) {
  if (!a) return true;
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) < (y[i] ?? 0);
  return false;
}

// Versiones del emisor de Windows: la publicada (los emisores se actualizan solos a ella), descarga para
// instalar en una PC nueva, qué versión tiene cada PC y, para el superadmin, publicar una nueva.
export const VersionesEmisor: React.FC<{ puedePublicar: boolean }> = ({ puedePublicar }) => {
  const consulta = useVersionesEmisor();
  const descarga = useQuery({ queryKey: ['gestion', 'radio', 'descarga-emisor'], queryFn: () => luzApi.descargaEmisor() });
  const publicada = consulta.data?.publicada ?? null;
  const equipos = consulta.data?.equipos ?? [];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Emisor de Windows</CardTitle>
        <CardDescription className="text-xs">
          Los emisores instalados revisan al abrirse si hay una versión nueva publicada aquí y se actualizan con un clic.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-xs">
        {consulta.isLoading && <p className="text-muted-foreground">Cargando…</p>}
        {consulta.data && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
            {publicada ? (
              <div>
                <p className="text-sm font-semibold">Versión publicada: {publicada.version}</p>
                <p className="text-muted-foreground">{fecha(publicada.fecha)} · {mb(publicada.bytes)}{publicada.notas ? ` · ${publicada.notas}` : ''}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Todavía no hay ninguna versión publicada.</p>
            )}
            {descarga.data?.url && (
              <Button asChild type="button" variant="outline" size="sm" className="text-xs">
                <a href={descarga.data.url}>Descargar instalador</a>
              </Button>
            )}
          </div>
        )}

        {equipos.length > 0 && (
          <div className="overflow-x-auto">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PCs que transmitieron</p>
            <table className="w-full text-left">
              <thead className="text-[11px] text-muted-foreground">
                <tr>
                  <th className="py-1.5 pr-4 font-medium">PC</th>
                  <th className="py-1.5 pr-4 font-medium">Versión</th>
                  <th className="py-1.5 font-medium">Última transmisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {equipos.map((e) => (
                  <tr key={e.equipo}>
                    <td className="py-2 pr-4">{e.equipo}</td>
                    <td className="py-2 pr-4">
                      {e.version ?? '—'}
                      {publicada && e.version && anterior(e.version, publicada.version) && (
                        <span className="ml-2 text-amber-500">se actualizará</span>
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground">{fecha(e.ultimaVez)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {puedePublicar && <PublicarVersion actual={publicada?.version ?? null} />}
      </CardContent>
    </Card>
  );
};

const PublicarVersion: React.FC<{ actual: string | null }> = ({ actual }) => {
  const [version, setVersion] = useState('');
  const [notas, setNotas] = useState('');
  const [instalador, setInstalador] = useState<File | null>(null);
  const [firma, setFirma] = useState<File | null>(null);
  const publicar = useMutacionGestion(
    (d: { version: string; notas: string; instalador: File; firma: File }) => luzApi.publicarEmisor(d),
    'Versión publicada',
    'No se pudo publicar la versión',
  );

  // La versión sale del nombre del instalador: "Emisor La Luz del Tiempo_0.2.0_x64-setup.exe"
  const elegirInstalador = (f: File | null) => {
    setInstalador(f);
    const v = f?.name.match(/_(\d+\.\d+\.\d+)_/)?.[1];
    if (v) setVersion(v);
  };

  const listo = /^\d+\.\d+\.\d+$/.test(version) && instalador && firma && anterior(actual, version);

  return (
    <form
      className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!instalador || !firma) return;
        await publicar.mutateAsync({ version, notas, instalador, firma });
        setNotas('');
        setInstalador(null);
        setFirma(null);
        (e.target as HTMLFormElement).reset();
      }}
    >
      <p className="font-semibold text-amber-600 dark:text-amber-400">Publicar una versión nueva (superadmin)</p>
      <p className="text-muted-foreground">
        Sube los dos archivos que deja la compilación en <span className="font-mono">src-tauri\target\release\bundle\nsis\</span>:
        el instalador <span className="font-mono">…-setup.exe</span> y su firma <span className="font-mono">…-setup.exe.sig</span>.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-[11px] text-muted-foreground">Instalador (.exe)</span>
          <Input type="file" accept=".exe" onChange={(e) => elegirInstalador(e.target.files?.[0] ?? null)} className="text-xs" />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] text-muted-foreground">Firma (.sig)</span>
          <Input type="file" accept=".sig" onChange={(e) => setFirma(e.target.files?.[0] ?? null)} className="text-xs" />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] text-muted-foreground">Versión</span>
          <Input value={version} onChange={(e) => setVersion(e.target.value.trim())} placeholder="0.2.0" className="font-mono text-xs" />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] text-muted-foreground">Qué cambia (lo ve el operador)</span>
          <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Mejoras en la reconexión" className="text-xs" />
        </label>
      </div>
      {actual && version && !anterior(actual, version) && <p className="text-red-400">La versión debe ser mayor que la publicada ({actual}).</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" className="text-xs" disabled={!listo || publicar.isPending}>
          {publicar.isPending ? 'Publicando…' : 'Publicar versión'}
        </Button>
      </div>
    </form>
  );
};

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, DatabaseBackup, Download, Play, RefreshCw, ScrollText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { luzApi } from '../../../shared/api/luz-api';
import { useEstaciones } from '../../gestion/hooks/use-gestion';

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-BO', { timeZone: 'America/La_Paz' }) : 'Nunca');
const megas = (bytes: number) => (bytes / 1024 / 1024).toFixed(bytes > 1024 * 1024 ? 1 : 2) + ' MB';

export const SistemaPage: React.FC = () => {
  const qc = useQueryClient();
  const [proceso, setProceso] = React.useState('sistema');
  const estaciones = useEstaciones();
  const oyentes = useQuery({ queryKey: ['sistema', 'oyentes'], queryFn: () => luzApi.oyentesRadio(7), refetchInterval: 60000 });
  const registros = useQuery({ queryKey: ['sistema', 'registros', proceso], queryFn: () => luzApi.registrosRadio(proceso), refetchInterval: 10000 });
  const tareas = useQuery({ queryKey: ['sistema', 'tareas'], queryFn: () => luzApi.tareasSistema(), refetchInterval: 30000 });
  const respaldos = useQuery({ queryKey: ['sistema', 'respaldos'], queryFn: () => luzApi.respaldosSistema() });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['sistema'] });
  };

  const ejecutarTarea = useMutation({
    mutationFn: (clave: string) => luzApi.ejecutarTareaSistema(clave),
    onSuccess: () => { pillToast.success('Tarea ejecutada'); refrescar(); },
    onError: () => pillToast.error('No se pudo ejecutar la tarea'),
  });

  const crearRespaldo = useMutation({
    mutationFn: () => luzApi.crearRespaldoSistema(),
    onSuccess: (r) => { pillToast.success('Copia creada', r.nombre); refrescar(); },
    onError: () => pillToast.error('No se pudo crear la copia', 'Revisa que pg_dump esté instalado en la API.'),
  });

  const borrarRespaldo = useMutation({
    mutationFn: (nombre: string) => luzApi.borrarRespaldoSistema(nombre),
    onSuccess: () => { pillToast.success('Copia borrada'); refrescar(); },
    onError: () => pillToast.error('No se pudo borrar la copia'),
  });

  const descargar = async (nombre: string) => {
    try {
      const blob = await luzApi.descargarRespaldoSistema(nombre);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      pillToast.error('No se pudo descargar la copia');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">Administración / Sistema</p>
        <h1 className="text-2xl font-semibold">Sistema</h1>
        <p className="text-sm text-muted-foreground">Tareas de fondo, copias de seguridad y mantenimiento de la radio.</p>
      </div>

      <Card className="border-border">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Tareas de fondo</CardTitle>
            <CardDescription className="text-xs">Corren solas en la API. Aquí ves cuándo se ejecutaron y si salieron bien.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refrescar} aria-label="Actualizar"><RefreshCw className="h-3.5 w-3.5" /></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(tareas.data?.tareas ?? []).map((t, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.nombre}</p>
                <p className="text-xs text-muted-foreground">{t.detalle} · Última: {fecha(t.ultimaEjecucion)}</p>
                {t.ultimoResultado === 'error' && <p className="text-xs text-red-500">Último intento falló</p>}
              </div>
              <div className="flex items-center gap-2">
                {t.ultimoResultado && <Badge variant={t.ultimoResultado === 'ok' ? 'success' : 'warning'} className="text-[10px]">{t.ultimoResultado === 'ok' ? 'Correcta' : 'Error'}</Badge>}
                <Button variant="outline" size="sm" className="text-xs" onClick={() => ejecutarTarea.mutate(t.clave)} disabled={ejecutarTarea.isPending}>
                  <Play className="h-3.5 w-3.5" /> Ejecutar ahora
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><DatabaseBackup className="h-4 w-4" /> Copias de seguridad</CardTitle>
            <CardDescription className="text-xs">Base de datos y configuración de la radio (sin audios). Se guardan 14 días. Descárgalas para tenerlas en tu PC.</CardDescription>
          </div>
          <Button size="sm" className="text-xs" onClick={() => crearRespaldo.mutate()} disabled={crearRespaldo.isPending}>
            {crearRespaldo.isPending ? 'Creando…' : 'Crear copia ahora'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {(respaldos.data?.respaldos ?? []).length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay copias.</p>}
          {(respaldos.data?.respaldos ?? []).map((r) => (
            <div key={r.nombre} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs">{r.nombre}</p>
                <p className="text-xs text-muted-foreground">{fecha(r.creado)} · {megas(r.bytes)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => descargar(r.nombre)}><Download className="h-3.5 w-3.5" /> Descargar</Button>
                <Button variant="ghost" size="sm" aria-label="Borrar copia" onClick={() => borrarRespaldo.mutate(r.nombre)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Oyentes de los últimos 7 días</CardTitle>
          <CardDescription className="text-xs">Pico y promedio por día, tomados cada 5 minutos de cada emisora.</CardDescription>
        </CardHeader>
        <CardContent>
          {(oyentes.data?.filas ?? []).length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay muestras. Se toman cada 5 minutos.</p>}
          {(oyentes.data?.filas ?? []).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="py-1 pr-3 font-medium">Emisora</th><th className="py-1 pr-3 font-medium">Día</th><th className="py-1 pr-3 font-medium">Pico</th><th className="py-1 pr-3 font-medium">Promedio</th></tr>
                </thead>
                <tbody>
                  {(oyentes.data?.filas ?? []).map((f) => (
                    <tr key={`${f.slug}-${f.dia}`} className="border-t border-border">
                      <td className="py-1 pr-3">{f.nombre}</td><td className="py-1 pr-3 font-mono">{f.dia}</td><td className="py-1 pr-3">{f.pico}</td><td className="py-1 pr-3">{f.promedio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><ScrollText className="h-4 w-4" /> Registros de la radio</CardTitle>
            <CardDescription className="text-xs">Lo que escriben Liquidsoap, Icecast y supervisord. Se actualiza solo cada 10 segundos.</CardDescription>
          </div>
          <select value={proceso} onChange={(e) => setProceso(e.target.value)} className="h-9 px-3 rounded-xl border border-border bg-background text-xs" aria-label="Proceso">
            <option value="sistema">Sistema (supervisord)</option>
            {(estaciones.data ?? []).map((e) => <option key={e.id} value={e.slug}>{e.name} ({e.slug})</option>)}
          </select>
        </CardHeader>
        <CardContent className="space-y-3">
          {registros.isError && <p className="text-sm text-muted-foreground">La radio no responde: no se pueden leer los registros.</p>}
          {(registros.data?.registros ?? []).map((r) => (
            <div key={r.archivo}>
              <p className="mb-1 font-mono text-[11px] text-muted-foreground">{r.archivo}.log</p>
              <pre className="max-h-72 overflow-auto rounded-xl bg-secondary/40 p-3 text-[11px] leading-relaxed">{r.lineas.length ? r.lineas.join('\n') : '(sin líneas todavía)'}</pre>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

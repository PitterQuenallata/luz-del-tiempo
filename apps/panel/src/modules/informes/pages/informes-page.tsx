import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Pestanas, pestanaDesdeHash, fijarPestanaEnHash, PestanaItem } from '../../../shared/components/ui/pestanas';
import { luzApi } from '../../../shared/api/luz-api';
import { useEstaciones } from '../../gestion/hooks/use-gestion';

type Pestana = 'oyentes' | 'historial';
const PESTANAS: PestanaItem<Pestana>[] = [
  { id: 'oyentes', label: 'Oyentes' },
  { id: 'historial', label: 'Historial de reproducción' },
];
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HORAS = Array.from({ length: 24 }, (_, h) => h);

// Barra horizontal simple (sin librería de gráficas)
const Barra: React.FC<{ etiqueta: string; valor: number; maximo: number }> = ({ etiqueta, valor, maximo }) => (
  <div className="flex items-center gap-3 text-xs">
    <span className="w-24 shrink-0 text-muted-foreground">{etiqueta}</span>
    <div className="h-3 flex-1 rounded bg-secondary/50">
      <div className="h-3 rounded bg-primary" style={{ width: `${maximo > 0 ? Math.round((valor / maximo) * 100) : 0}%` }} />
    </div>
    <span className="w-12 text-right font-mono">{valor.toFixed(2)}</span>
  </div>
);

export const InformesPage: React.FC = () => {
  const [pestana, setPestana] = useState<Pestana>(() => pestanaDesdeHash(PESTANAS));
  const cambiar = (id: Pestana) => { setPestana(id); fijarPestanaEnHash(id); };
  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="mb-1.5 font-mono text-xs text-muted-foreground">Radio / Informes</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Informes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Oyentes y canciones que sonaron, de todas las emisoras.</p>
      </div>
      <Pestanas valor={pestana} items={PESTANAS} alCambiar={cambiar} />
      {pestana === 'oyentes' && <OyentesTab />}
      {pestana === 'historial' && <HistorialTab />}
    </div>
  );
};

const OyentesTab: React.FC = () => {
  const [dias, setDias] = useState(7);
  const datos = useQuery({ queryKey: ['informes', 'oyentes', dias], queryFn: () => luzApi.oyentesRadio(dias), refetchInterval: 60000 });
  const d = datos.data;
  const maxHora = Math.max(0, ...(d?.porHora ?? []).map((h) => h.promedio));
  const maxDia = Math.max(0, ...(d?.porDiaSemana ?? []).map((x) => x.promedio));
  const porHora = new Map((d?.porHora ?? []).map((h) => [h.hora, h.promedio]));
  const porDia = new Map((d?.porDiaSemana ?? []).map((x) => [x.dia, x.promedio]));
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[7, 30].map((n) => (
          <button key={n} type="button" onClick={() => setDias(n)} className={`rounded-xl border px-3 py-1.5 text-xs ${dias === n ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}`}>
            Últimos {n} días
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-semibold">Oyentes por hora del día</CardTitle>
            <CardDescription className="text-xs">Promedio de oyentes a cada hora (La Paz), en el rango elegido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {HORAS.map((h) => <Barra key={h} etiqueta={`${String(h).padStart(2, '0')}:00`} valor={porHora.get(h) ?? 0} maximo={maxHora} />)}
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-semibold">Oyentes por día de la semana</CardTitle>
            <CardDescription className="text-xs">Promedio de oyentes en cada día, en el rango elegido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {DIAS_SEMANA.map((nombre, i) => <Barra key={nombre} etiqueta={nombre} valor={porDia.get(i) ?? 0} maximo={maxDia} />)}
          </CardContent>
        </Card>
      </div>
      <Card className="border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm font-semibold">Pico y promedio por emisora y día</CardTitle>
        </CardHeader>
        <CardContent>
          {(d?.filas ?? []).length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay muestras. Se toman cada 5 minutos.</p>}
          {(d?.filas ?? []).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="py-1 pr-3 font-medium">Emisora</th><th className="py-1 pr-3 font-medium">Día</th><th className="py-1 pr-3 font-medium">Pico</th><th className="py-1 pr-3 font-medium">Promedio</th></tr>
                </thead>
                <tbody>
                  {(d?.filas ?? []).map((f) => (
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
    </div>
  );
};

const HistorialTab: React.FC = () => {
  const estaciones = useEstaciones();
  const [estacionId, setEstacionId] = useState('');
  const elegida = estacionId || estaciones.data?.[0]?.id || '';
  const historial = useQuery({
    queryKey: ['informes', 'historial', elegida],
    queryFn: () => luzApi.historialEstacion(elegida, 200),
    enabled: Boolean(elegida),
    refetchInterval: 30000,
  });
  return (
    <Card className="border-border">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">Canciones que sonaron</CardTitle>
          <CardDescription className="text-xs">Las 200 más recientes de la estación. Se actualiza cada 30 segundos.</CardDescription>
        </div>
        <select value={elegida} onChange={(e) => setEstacionId(e.target.value)} className="h-9 rounded-xl border border-border bg-background px-3 text-xs" aria-label="Estación">
          {(estaciones.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </CardHeader>
      <CardContent>
        {(historial.data?.pistas ?? []).length === 0 && <p className="text-sm text-muted-foreground">Todavía no sonó nada en esta estación.</p>}
        {(historial.data?.pistas ?? []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-1 pr-3 font-medium">Hora</th><th className="py-1 pr-3 font-medium">Título</th><th className="py-1 pr-3 font-medium">Artista</th><th className="py-1 pr-3 font-medium">Lista</th></tr>
              </thead>
              <tbody>
                {(historial.data?.pistas ?? []).map((p, i) => (
                  <tr key={`${p.inicio}-${i}`} className="border-t border-border">
                    <td className="py-1 pr-3 font-mono">{new Date(p.inicio).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}</td>
                    <td className="py-1 pr-3">{p.titulo || p.archivo || '—'}</td>
                    <td className="py-1 pr-3">{p.artista || '—'}</td>
                    <td className="py-1 pr-3">{p.lista || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

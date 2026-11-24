import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import type { ApiReporteTransmisiones, ApiTotalesTransmision } from '../../../shared/api/luz-api';
import { useReporteTransmisiones } from '../hooks/use-radio';

const mesActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function horas(segundos: number) {
  const min = Math.round(segundos / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

const horasDecimales = (segundos: number) => (segundos / 3600).toFixed(2);

/** CSV para abrir en Excel (separador ; y BOM para que respete las tildes) */
function descargarCsv(r: ApiReporteTransmisiones) {
  const filas: string[][] = [['Tipo', 'Nombre', 'Transmisiones', 'Horas', 'Cortes', 'Silencios', 'Saturaciones']];
  const agregar = (tipo: string, nombre: string, t: ApiTotalesTransmision) =>
    filas.push([tipo, nombre, String(t.transmisiones), horasDecimales(t.segundos), String(t.cortes), String(t.silencios), String(t.saturaciones)]);
  r.porEmisora.forEach((e) => agregar('Emisora', e.nombre, e));
  r.porLocutor.forEach((l) => agregar('Locutor', l.nombre, l));
  r.porPrograma.forEach((p) => agregar('Programa', p.nombre, p));
  agregar('Total', 'Todas', r.general);
  const texto = filas.map((f) => f.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' }));
  enlace.download = `transmisiones-${r.mes}.csv`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

// Horas al aire con el emisor por emisora, locutor y programa en un mes (para los informes del ministerio).
export const ReporteTransmisiones: React.FC = () => {
  const [mes, setMes] = useState(mesActual());
  const consulta = useReporteTransmisiones(mes);
  const r = consulta.data;

  return (
    <Card className="border-border">
      <CardHeader className="flex-row flex-wrap items-end justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold">Reporte de transmisiones</CardTitle>
          <CardDescription className="text-xs">Horas al aire con el emisor de Windows, por emisora, locutor y programa.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} className="h-8 w-40 text-xs" aria-label="Mes del reporte" />
          <Button type="button" variant="outline" size="sm" className="text-xs" disabled={!r || r.general.transmisiones === 0} onClick={() => r && descargarCsv(r)}>
            Descargar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-xs">
        {consulta.isLoading && <p className="text-muted-foreground">Calculando…</p>}
        {consulta.isError && <p className="text-red-400">No se pudo obtener el reporte.</p>}
        {r && r.general.transmisiones === 0 && <p className="text-muted-foreground">No hubo transmisiones con el emisor en este mes.</p>}
        {r && r.general.transmisiones > 0 && (
          <>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Cifra nombre="Horas al aire" valor={horas(r.general.segundos)} />
              <Cifra nombre="Transmisiones" valor={String(r.general.transmisiones)} />
              <Cifra nombre="Cortes" valor={String(r.general.cortes)} />
              <Cifra nombre="Silencios" valor={String(r.general.silencios)} />
              <Cifra nombre="Saturaciones" valor={String(r.general.saturaciones)} />
            </dl>
            <Tabla titulo="Por emisora" filas={r.porEmisora.map((e) => ({ clave: e.id, nombre: e.nombre, t: e }))} />
            <Tabla titulo="Por locutor" filas={r.porLocutor.map((l, i) => ({ clave: l.id ?? `sin-${i}`, nombre: l.nombre, t: l }))} />
            <Tabla titulo="Por programa" filas={r.porPrograma.map((p) => ({ clave: p.nombre, nombre: p.nombre, t: p }))} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

const Cifra: React.FC<{ nombre: string; valor: string }> = ({ nombre, valor }) => (
  <div>
    <dt className="text-[11px] text-muted-foreground">{nombre}</dt>
    <dd className="text-lg font-semibold tabular-nums">{valor}</dd>
  </div>
);

const Tabla: React.FC<{ titulo: string; filas: Array<{ clave: string; nombre: string; t: ApiTotalesTransmision }> }> = ({ titulo, filas }) => (
  <div className="overflow-x-auto">
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{titulo}</p>
    <table className="w-full text-left">
      <thead className="text-[11px] text-muted-foreground">
        <tr>
          <th className="py-1.5 pr-4 font-medium">Nombre</th>
          <th className="py-1.5 pr-4 font-medium text-right">Transmisiones</th>
          <th className="py-1.5 pr-4 font-medium text-right">Tiempo</th>
          <th className="py-1.5 pr-4 font-medium text-right">Cortes</th>
          <th className="py-1.5 pr-4 font-medium text-right">Silencios</th>
          <th className="py-1.5 font-medium text-right">Saturaciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60 tabular-nums">
        {filas.map((f) => (
          <tr key={f.clave}>
            <td className="py-2 pr-4">{f.nombre}</td>
            <td className="py-2 pr-4 text-right">{f.t.transmisiones}</td>
            <td className="py-2 pr-4 text-right whitespace-nowrap">{horas(f.t.segundos)}</td>
            <td className="py-2 pr-4 text-right">{f.t.cortes}</td>
            <td className="py-2 pr-4 text-right">{f.t.silencios}</td>
            <td className="py-2 text-right">{f.t.saturaciones}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import type { ApiTransmisionEmisor } from '../../../shared/api/luz-api';
import { useEnVivoEmisor } from '../hooks/use-radio';

const ESTADO: Record<ApiTransmisionEmisor['estado'], { texto: string; variante: 'success' | 'warning' | 'outline' }> = {
  al_aire: { texto: 'Al aire', variante: 'success' },
  conectando: { texto: 'Conectando', variante: 'outline' },
  reconectando: { texto: 'Reconectando', variante: 'warning' },
};

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });

function duracion(desde: string, hasta: string | null) {
  const min = Math.max(0, Math.round(((hasta ? new Date(hasta).getTime() : Date.now()) - new Date(desde).getTime()) / 60000));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

function incidencias(t: ApiTransmisionEmisor) {
  const partes = [
    t.cortes ? `${t.cortes} corte${t.cortes === 1 ? '' : 's'}` : null,
    t.silencios ? `${t.silencios} silencio${t.silencios === 1 ? '' : 's'}` : null,
    t.saturaciones ? `${t.saturaciones} saturación${t.saturaciones === 1 ? '' : 'es'}` : null,
  ].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Sin incidencias';
}

// Quién está transmitiendo ahora con el emisor de Windows: persona, PC, IP, emisora y estado de la señal.
export const EnVivoEmisor: React.FC = () => {
  const consulta = useEnVivoEmisor();
  const [verRecientes, setVerRecientes] = useState(false);
  const ahora = consulta.data?.ahora ?? [];
  const recientes = consulta.data?.recientes ?? [];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">En vivo ahora</CardTitle>
        <CardDescription className="text-xs">Locutores transmitiendo con el emisor de Windows. Se actualiza cada 15 segundos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {consulta.isLoading && <p className="text-muted-foreground">Revisando…</p>}
        {consulta.isError && <p className="text-red-400">No se pudo consultar quién está transmitiendo.</p>}
        {consulta.data && ahora.length === 0 && (
          <p className="text-muted-foreground">Nadie está transmitiendo con el emisor. Si la música automática está activa, la radio suena con el AutoDJ.</p>
        )}

        {ahora.length > 0 && (
          <ul className="divide-y divide-border/60 rounded-xl border border-border">
            {ahora.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start gap-x-6 gap-y-2 px-4 py-3">
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold">{t.usuario ?? 'Usuario eliminado'}</p>
                  <p className="text-muted-foreground">{t.emisora}{t.programa ? ` · ${t.programa}` : ''}</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                  <Dato nombre="Desde" valor={`${hora(t.inicio)} (${duracion(t.inicio, null)})`} />
                  <Dato nombre="PC" valor={t.equipo ?? '—'} />
                  <Dato nombre="IP" valor={t.ip ?? '—'} mono />
                  <Dato nombre="Envío" valor={t.kbps ? `${t.kbps} kbps` : '—'} />
                </dl>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={ESTADO[t.estado].variante} className="text-[10px]">{ESTADO[t.estado].texto}</Badge>
                  <span className="text-[11px] text-muted-foreground">{incidencias(t)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {recientes.length > 0 && (
          <div>
            <Button type="button" variant="ghost" size="sm" className="text-xs px-0" onClick={() => setVerRecientes((v) => !v)}>
              {verRecientes ? 'Ocultar transmisiones anteriores' : `Ver transmisiones anteriores (${recientes.length})`}
            </Button>
            {verRecientes && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[11px] text-muted-foreground">
                    <tr>
                      <th className="py-1.5 pr-4 font-medium">Fecha</th>
                      <th className="py-1.5 pr-4 font-medium">Locutor</th>
                      <th className="py-1.5 pr-4 font-medium">Emisora</th>
                      <th className="py-1.5 pr-4 font-medium">Duración</th>
                      <th className="py-1.5 pr-4 font-medium">PC / IP</th>
                      <th className="py-1.5 font-medium">Cierre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {recientes.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2 pr-4 whitespace-nowrap">{fecha(t.inicio)} {hora(t.inicio)}</td>
                        <td className="py-2 pr-4">{t.usuario ?? '—'}</td>
                        <td className="py-2 pr-4">{t.emisora}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{duracion(t.inicio, t.fin)}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{t.equipo ?? '—'} · <span className="font-mono">{t.ip ?? '—'}</span></td>
                        <td className="py-2 text-muted-foreground">{t.motivoFin ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dato: React.FC<{ nombre: string; valor: string; mono?: boolean }> = ({ nombre, valor, mono }) => (
  <div>
    <dt className="text-[11px] text-muted-foreground">{nombre}</dt>
    <dd className={mono ? 'font-mono' : undefined}>{valor}</dd>
  </div>
);

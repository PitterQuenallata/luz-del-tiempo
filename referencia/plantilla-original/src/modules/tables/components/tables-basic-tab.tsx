import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { serverNodesData, initialTransactions } from '../data/tables-data';
import { ServerNode } from '../types/tables.types';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  Server,
  Activity,
  ArrowUpRight,
  MoreHorizontal,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

export const TablesBasicTab: React.FC = () => {
  const { play } = useSound();
  const [zebraRows, setZebraRows] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [nodes, setNodes] = useState<ServerNode[]>(serverNodesData);

  const getStatusBadge = (status: ServerNode['status']) => {
    switch (status) {
      case 'Operativo':
        return (
          <Badge variant="success" className="gap-1 font-mono text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            Operativo
          </Badge>
        );
      case 'Advertencia':
        return (
          <Badge variant="warning" className="gap-1 font-mono text-[10px]">
            <AlertTriangle className="h-3 w-3" />
            Advertencia
          </Badge>
        );
      case 'Degradado':
        return (
          <Badge variant="destructive" className="gap-1 font-mono text-[10px]">
            <AlertOctagon className="h-3 w-3" />
            Degradado
          </Badge>
        );
    }
  };

  const handleRestartNode = (nodeName: string) => {
    play('pop');
    pillToast.info('Reinicio de Nodo', `Reinicio suave programado para ${nodeName}.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
            <Switch
              checked={zebraRows}
              onCheckedChange={(checked) => {
                play('toggle');
                setZebraRows(checked);
              }}
            />
            <span className="font-medium">Filas Alternadas (Zebra Striping)</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
            <Switch
              checked={compactDensity}
              onCheckedChange={(checked) => {
                play('toggle');
                setCompactDensity(checked);
              }}
            />
            <span className="font-medium">Densidad Compacta Apple</span>
          </label>
        </div>

        <Badge variant="secondary" className="text-xs font-mono">
          {nodes.length} Nodos Monitoreados
        </Badge>
      </div>

      {/* Table 1: Server Nodes Telemetry */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Topología de Servidores & Telemetría de Recursos</CardTitle>
              <CardDescription>
                Monitoreo en tiempo real de nodos distribuidos, porcentaje de carga en procesador, memoria RAM y almacenamiento.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Nodo / Región</th>
                  <th className="py-3 px-4">Dirección IP</th>
                  <th className="py-3 px-4">Carga CPU</th>
                  <th className="py-3 px-4">Uso RAM</th>
                  <th className="py-3 px-4">Disco</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Uptime</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {nodes.map((node, index) => (
                  <tr
                    key={node.id}
                    className={cn(
                      'transition-colors hover:bg-muted/40',
                      zebraRows && index % 2 === 1 ? 'bg-muted/15' : 'bg-transparent'
                    )}
                  >
                    <td className={cn('px-4', compactDensity ? 'py-2' : 'py-3.5')}>
                      <div className="font-medium text-foreground flex items-center gap-2">
                        <Server className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-mono text-xs">{node.nodeName}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground pl-5.5 block">
                        {node.region}
                      </span>
                    </td>
                    <td className={cn('px-4 font-mono tabular-nums text-muted-foreground', compactDensity ? 'py-2' : 'py-3.5')}>
                      {node.ipAddress}
                    </td>
                    <td className={cn('px-4', compactDensity ? 'py-2' : 'py-3.5')}>
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono tabular-nums">
                          <span>{node.cpuUsage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              node.cpuUsage > 85 ? 'bg-destructive' : node.cpuUsage > 60 ? 'bg-amber-500' : 'bg-primary'
                            )}
                            style={{ width: `${node.cpuUsage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={cn('px-4', compactDensity ? 'py-2' : 'py-3.5')}>
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono tabular-nums">
                          <span>{node.ramUsage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              node.ramUsage > 85 ? 'bg-destructive' : node.ramUsage > 60 ? 'bg-amber-500' : 'bg-blue-500'
                            )}
                            style={{ width: `${node.ramUsage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={cn('px-4 font-mono tabular-nums text-muted-foreground', compactDensity ? 'py-2' : 'py-3.5')}>
                      {node.diskUsage}%
                    </td>
                    <td className={cn('px-4', compactDensity ? 'py-2' : 'py-3.5')}>
                      {getStatusBadge(node.status)}
                    </td>
                    <td className={cn('px-4 font-mono tabular-nums text-muted-foreground', compactDensity ? 'py-2' : 'py-3.5')}>
                      {node.uptimeDays}d activo
                    </td>
                    <td className={cn('px-4 text-right', compactDensity ? 'py-2' : 'py-3.5')}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestartNode(node.nodeName)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Reiniciar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 2: Minimalist Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Historial Reciente de Operaciones y Conciliación</CardTitle>
          <CardDescription>
            Listado plano con micro-badges, formatos tipográficos SF Pro y cifras monoespaciadas (`tabular-nums font-mono`).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Monto Bruto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {initialTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-primary font-medium">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-foreground">
                          {tx.avatarText}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-xs">{tx.customerName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{tx.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-foreground">
                      ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tx.currency}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          tx.status === 'Completado'
                            ? 'success'
                            : tx.status === 'Pendiente'
                            ? 'warning'
                            : tx.status === 'Reembolsado'
                            ? 'blue'
                            : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground font-mono text-[11px]">
                      {tx.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Download,
  ExternalLink,
  HardDrive,
  RefreshCw,
  Globe2,
  Database,
  ArrowLeftRight,
  Zap,
  CheckCircle2,
  Server,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export const WidgetsBannersTab: React.FC = () => {
  const { play } = useSound();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'nominal' | 'synced'>('nominal');

  const handleExpandVolume = () => {
    play('success');
    pillToast.success('Expansión de Volumen', 'Comando enviado a AWS EC2 API (+200GB).');
  };

  const handleDownloadReport = () => {
    play('pop');
    pillToast.success('Auditoría SOX', 'Descarga de reporte cifrado ISO 27001 iniciada.');
  };

  const handleSimulateFailover = () => {
    play('click');
    pillToast.info(
      'Simulador de Failover',
      'Test no disruptivo: balanceo transatlántico conmutado hacia us-east-1 en 4.2 segundos con 0 errores.'
    );
  };

  const handleForceSync = () => {
    play('success');
    setIsSyncing(true);
    setSyncStatus('synced');
    pillToast.success(
      'Sincronización Transcontinental',
      'Registros Write-Ahead Log (WAL) replicados al 100%. Desfase reducido a 0.00 ms.'
    );
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  const replicationMetrics = [
    { label: 'RPO (Pérdida Máx. de Datos)', value: '0.00 seg (Zero Loss)', status: 'optimal' },
    { label: 'RTO (Conmutación Automática)', value: '< 12.4 seg', status: 'optimal' },
    { label: 'Desfase de WAL Postgres', value: syncStatus === 'synced' ? '0.0 MB (0 ms)' : '0.4 MB (3.8 ms)', status: 'synced' },
    { label: 'Quórum de Consenso Raft', value: '5 / 5 Nodos Activos', status: 'active' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner 0: Apple OLED / Dark Pro - Disaster Recovery & Multi-Region Replication */}
      <div className="rounded-3xl border border-white/10 bg-black text-white p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Glow ambient background with Cyan / Indigo hues */}
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-32 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                Replicación Geográfica en Vivo • Active-Active DR
              </span>
              <Badge variant="outline" className="border-white/20 text-white font-mono text-[10px]">
                Frankfurt ⇄ Virginia
              </Badge>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-cyan-400 shrink-0" />
              Sincronización Transcontinental & Quórum Multi-Región
            </h3>

            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Espejo transaccional en tiempo real entre los clústeres <span className="text-white font-mono">eu-central-1</span> y <span className="text-white font-mono">us-east-1</span>. El protocolo de consenso distribuido garantiza conmutación por desastre transparente sin interrupción del servicio ni pérdida de quórum.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateFailover}
              className="border-neutral-700 bg-neutral-900/80 text-white hover:bg-neutral-800 text-xs gap-1.5 h-9"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>Simular Failover</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              disabled={isSyncing}
              onClick={handleForceSync}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs gap-1.5 h-9 shadow-md transition-colors"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Réplica'}</span>
            </Button>
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="relative z-10 pt-6 mt-6 border-t border-neutral-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {replicationMetrics.map((metric, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-2xl border transition-all',
                  metric.status === 'optimal'
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                    : metric.status === 'synced'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-300'
                )}
              >
                <div className="flex items-center justify-between text-[11px] mb-1 font-mono text-neutral-400">
                  <span>Métrica {idx + 1}</span>
                  <span className="font-semibold text-white">{metric.value}</span>
                </div>
                <p className="font-semibold text-xs text-white">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner 1: Nominal Operational SLA */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs px-2.5 py-0.5">
              Estado Nominal
            </Badge>
            <span className="text-xs font-mono tabular-nums text-muted-foreground">
              Verificado hace 3 minutos
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Clúster Central Operando al 99.98% de Disponibilidad SLA
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Todas las zonas de disponibilidad en Frankfurt, Virginia y Tokio se encuentran sincronizadas. El tiempo de respuesta medio en el edge se mantiene estable en 28.4 milisegundos.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              play('click');
              pillToast.info('Monitor de Trazas', 'Abriendo monitor de trazas y telemetría APM...');
            }}
            className="h-9 px-4 rounded-xl text-xs font-medium"
          >
            Inspeccionar Trazas
          </Button>
          <Button
            size="sm"
            onClick={() => {
              play('pop');
              pillToast.success('Certificado Uptime', 'Comprobante de disponibilidad 99.98% descargado.');
            }}
            className="h-9 px-4 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            Descargar Certificado
          </Button>
        </div>
      </div>

      {/* Banner 2: Storage Warning */}
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs px-2.5 py-0.5">
              Alerta de Capacidad
            </Badge>
            <span className="text-xs font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
              84.6% Utilizado
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Volumen Persistente EBS data-node-frankfurt-01 Próximo al Límite
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Quedan 31.4 GB disponibles de 200 GB asignados. Se recomienda aprovisionar almacenamiento adicional para evitar bloqueos en operaciones de escritura de la base de datos.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              play('click');
              pillToast.info('Ciclo de Vida S3', 'Configurando políticas de auto-tiering y retención.');
            }}
            className="h-9 px-4 rounded-xl text-xs font-medium text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
          >
            Auto-Tiering S3
          </Button>
          <Button
            size="sm"
            onClick={handleExpandVolume}
            className="h-9 px-4 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold shadow-sm"
          >
            Expandir +200 GB
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banner 3: Scheduled Maintenance */}
        <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-500/40 text-blue-500 bg-blue-500/10 text-xs px-2.5 py-0.5">
                Mantenimiento
              </Badge>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                Domingo 02:00 UTC
              </span>
            </div>
            <h4 className="text-base font-bold tracking-tight text-foreground">
              Actualización del Kernel de Linux en Nodos de Cómputo
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              La ventana tendrá una duración estimada de 30 minutos. Se ejecutará failover automático hacia el clúster secundario sin pérdida de sesiones activas.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                play('click');
                pillToast.info('Alerta Silenciada', 'Aviso pausado para las próximas 24 horas.');
              }}
              className="h-8 px-3 rounded-xl text-xs"
            >
              Silenciar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                play('pop');
                pillToast.info('Checklist Operativo', 'Mostrando guía y checklist de conmutación.');
              }}
              className="h-8 px-3 rounded-xl text-xs font-medium"
            >
              Ver Checklist
            </Button>
          </div>
        </div>

        {/* Banner 4: Compliance & SOX Audit */}
        <div className="rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs px-2.5 py-0.5">
                Cumplimiento
              </Badge>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                Auditado Q3 2026
              </span>
            </div>
            <h4 className="text-base font-bold tracking-tight text-foreground">
              Reporte de Certificación SOX & ISO 27001 Disponible
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El dictamen independiente emitido por los auditores confirma el cumplimiento de los controles de cifrado en reposo, separación de funciones y retención de logs.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                play('click');
                pillToast.info('Enlace Seguro', 'Enlace temporal generado para el equipo de auditoría.');
              }}
              className="h-8 px-3 rounded-xl text-xs"
            >
              Compartir Acceso
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadReport}
              className="h-8 px-3 rounded-xl text-xs font-medium gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Paquete</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CreditCard,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Shield,
  Sliders,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Switch } from '../../../shared/components/ui/switch';
import { paymentGatewaysData, systemEventsData } from '../data/widgets-data';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export const WidgetsCardsTab: React.FC = () => {
  const { play } = useSound();

  // Quick settings switches
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [force2fa, setForce2fa] = useState(true);
  const [extendedLogs, setExtendedLogs] = useState(true);
  const [webhookAlerts, setWebhookAlerts] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(75);

  const handleToggleMaintenance = (val: boolean) => {
    play(val ? 'alert' : 'click');
    setMaintenanceMode(val);
    if (val) {
      pillToast.warning('Modo Mantenimiento', 'Tráfico externo temporalmente restringido.');
    } else {
      pillToast.success('Operación Normal', 'Modo mantenimiento desactivado en el clúster.');
    }
  };

  const handleSaveSettings = () => {
    play('success');
    pillToast.success('Ajustes Guardados', 'Parámetros administrativos actualizados en el clúster.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top 4 Metrics Grid: Production Cluster Capacity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nodos EKS Activos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                18 / 24
              </span>
              <span className="text-xs font-mono text-emerald-500 font-medium">
                Auto-scale OK
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Cluster Frankfurt eu-central-1
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Carga Media de CPU
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                42.8%
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Capacidad óptima
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Margen de seguridad del 57%
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Memoria RAM Asignada
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                96.4 GB
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                de 128 GB
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              75.3% en uso efectivo de heap
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pool Conexiones DB
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                142
              </span>
              <span className="text-xs font-mono text-emerald-500 font-medium">
                0 esperas
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aurora Serverless v2 PostgreSQL
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Pasarelas de Pago & Eventos Operativos */}
        <div className="lg:col-span-8 space-y-6">
          {/* Payment Gateways Card */}
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-4 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Pasarelas de Cobro & Volumen Procesado
                </CardTitle>
                <CardDescription className="text-xs">
                  Flujo de ingresos en tiempo real por canal de liquidación
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  play('click');
                  pillToast.info('Conciliación', 'Abriendo panel de conciliación bancaria...');
                }}
                className="h-8 px-3 text-xs rounded-xl"
              >
                Conciliación
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {paymentGatewaysData.map((gw) => (
                  <div
                    key={gw.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {gw.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 font-mono',
                            gw.status === 'active'
                              ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                              : 'border-muted text-muted-foreground'
                          )}
                        >
                          {gw.status === 'active' ? 'Operativo' : 'Standby'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {gw.subtitle}
                      </p>
                    </div>

                    <div className="text-right font-mono tabular-nums">
                      <p className="text-sm font-bold text-foreground">
                        ${gw.volume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                        <span>{gw.processedCount} ops</span>
                        <span>•</span>
                        <span className="text-emerald-500 font-medium">
                          {gw.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Events & Operations Card */}
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">
                Eventos & Bitácora Operativa del Sistema
              </CardTitle>
              <CardDescription className="text-xs">
                Mantenimientos preventivos, snapshots y sincronización de infraestructura
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {systemEventsData.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {ev.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 font-mono',
                            ev.status === 'completed'
                              ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                              : ev.status === 'in_progress'
                              ? 'border-blue-500/30 text-blue-500 bg-blue-500/5'
                              : 'border-amber-500/30 text-amber-500 bg-amber-500/5'
                          )}
                        >
                          {ev.status === 'completed'
                            ? 'Completado'
                            : ev.status === 'in_progress'
                            ? 'En Proceso'
                            : 'Programado'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ev.subtitle}
                      </p>
                    </div>

                    <div className="text-right font-mono tabular-nums text-xs">
                      <span className="text-muted-foreground block text-[11px]">
                        {ev.timestamp}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        Duración: {ev.durationMinutes} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Quick Settings & Operational Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">
                Ajustes Rápidos de Sistema
              </CardTitle>
              <CardDescription className="text-xs">
                Parámetros de ejecución en caliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {/* Modo Mantenimiento */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Modo Mantenimiento
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Restringe accesos a usuarios externos
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={handleToggleMaintenance}
                />
              </div>

              {/* Forzar 2FA */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    2FA Forzoso para Staff
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Requerir llaves FIDO2 / Authenticator
                  </p>
                </div>
                <Switch
                  checked={force2fa}
                  onCheckedChange={(val) => {
                    play('click');
                    setForce2fa(val);
                  }}
                />
              </div>

              {/* Retención extendida */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Retención de Logs (365 días)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Almacenamiento en Glacier para SOX
                  </p>
                </div>
                <Switch
                  checked={extendedLogs}
                  onCheckedChange={(val) => {
                    play('click');
                    setExtendedLogs(val);
                  }}
                />
              </div>

              {/* Webhooks en fallos */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Alertas PagerDuty en 5xx
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Notificar de guardia si error &gt; 0.05%
                  </p>
                </div>
                <Switch
                  checked={webhookAlerts}
                  onCheckedChange={(val) => {
                    play('click');
                    setWebhookAlerts(val);
                  }}
                />
              </div>

              {/* Slider de Umbral de Alerta */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Umbral Alerta de Cómputo
                  </span>
                  <span className="font-mono tabular-nums text-primary font-bold">
                    {alertThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-muted-foreground">
                  Se disparará alerta P1 si la CPU excede este umbral por más de 5 minutos consecutivos.
                </p>
              </div>

              <div className="pt-3 border-t border-border/40 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveSettings}
                  className="h-8 px-4 rounded-xl text-xs font-medium shadow-sm"
                >
                  Guardar Parámetros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

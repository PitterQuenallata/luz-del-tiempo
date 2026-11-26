import React, { useState } from 'react';
import { Radio, RefreshCw, Settings2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { ApiEmisora, ApiTransmision, luzApi } from '../../../shared/api/luz-api';
import { useSession } from '../../auth/hooks/use-session';
import { useEstaciones, useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { useServicioRadio, useTransmision } from '../hooks/use-radio';
import { TransmisionDialog } from '../components/transmision-dialog';
import { EnVivoEmisor } from '../components/en-vivo-emisor';
import { ReporteTransmisiones } from '../components/reporte-transmisiones';
import { VersionesEmisor } from '../components/versiones-emisor';
import { Switch } from '../../../shared/components/ui/switch';
import { confirmar } from '../../../shared/lib/confirm';
import { EstacionControles, EstadoVivo, estadoEstacion } from '../components/estacion-controles';

// Configuración de la radio: separada del sitio web. Lo sencillo para cualquier operador con acceso;
// los límites y la capacidad, solo para el superadmin (permiso servidores:configurar).
export const ConfiguracionRadioPage: React.FC = () => {
  const sesion = useSession();
  const emisoras = useEstaciones();
  const servicio = useServicioRadio();
  const avanzado = (sesion.data?.permisos ?? []).includes('servidores:configurar');

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Configuración / Radio</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Configuración de radio</h1>
        <p className="text-sm text-muted-foreground mt-1">Transmisión de cada emisora: datos para el locutor, contraseña y música automática.</p>
      </div>

      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Radio className="h-4 w-4" /> Estado del servicio</CardTitle>
            <CardDescription className="text-xs">Se actualiza cada 30 segundos.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => servicio.refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Actualizar
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs">
          {servicio.isLoading && <span className="text-muted-foreground">Revisando…</span>}
          {servicio.data && (
            <>
              <Badge variant={servicio.data.radioApi === 'ok' ? 'success' : 'destructive'}>Control de la radio: {servicio.data.radioApi === 'ok' ? 'conectado' : 'sin conexión'}</Badge>
              <Badge variant={servicio.data.icecastOnline ? 'success' : 'destructive'}>Transmisión (Icecast): {servicio.data.icecastOnline ? 'en línea' : 'apagada'}</Badge>
              <Badge variant="outline">Emisoras en la radio: {servicio.data.emisorasEnRadio}</Badge>
            </>
          )}
          {servicio.isError && <span className="text-red-400">No se pudo consultar el servicio.</span>}
        </CardContent>
      </Card>

      <RadioInterruptor encendida={servicio.data?.encendida ?? true} disponible={Boolean(servicio.data)} />

      <EnVivoEmisor />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Transmisión por estación</CardTitle>
          <CardDescription className="text-xs">Configura aquí lo que necesita quien va a transmitir: punto de transmisión, contraseña y calidad.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {emisoras.isLoading && <p className="p-4 text-xs text-muted-foreground">Cargando emisoras…</p>}
          <ul className="divide-y divide-border/60">
            {(emisoras.data ?? []).map((e) => (
              <EmisoraTransmision key={e.id} emisora={e} avanzado={avanzado} radioEncendida={servicio.data?.encendida ?? true} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <ReporteTransmisiones />

      <VersionesEmisor puedePublicar={avanzado} />

      {avanzado && <AjustesServidor />}
    </div>
  );
};

// Estado en vivo de la radio para esta emisora (lo devuelve la API de transmisión)
const EmisoraTransmision: React.FC<{ emisora: ApiEmisora; avanzado: boolean; radioEncendida: boolean }> = ({ emisora, avanzado, radioEncendida }) => {
  const transmision = useTransmision(emisora.id);
  const [abierta, setAbierta] = useState(false);
  const t: ApiTransmision | undefined = transmision.data?.transmision;
  const vivo = (transmision.data?.radio as { status?: EstadoVivo } | null)?.status;
  const estado = estadoEstacion(emisora, t, vivo, radioEncendida);

  return (
    <li className="space-y-3 px-4 py-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <p className="font-semibold text-sm">{emisora.name}</p>
          <p className="mt-0.5 font-mono text-muted-foreground">{t?.mountPoint ?? 'Sin mount'}{t?.streamUrl ? ` · ${t.streamUrl}` : ''}</p>
          {t && <p className="mt-0.5 text-[11px] text-muted-foreground">Nombre de salida: <span className="text-foreground">{t.streamNameEfectivo}</span></p>}
          {vivo?.online && (
            <p className="mt-0.5 text-[11px] text-emerald-500">
              Al aire · {vivo.listeners} oyente{vivo.listeners === 1 ? '' : 's'}{vivo.title ? ` · ${vivo.title}` : ''}
            </p>
          )}
        </div>
        {estado && <Badge variant={estado.variante} className="text-[10px]">{estado.texto}</Badge>}
        <Button type="button" size="sm" className="text-xs" disabled={!t} onClick={() => setAbierta(true)}>
          <Settings2 className="mr-1 h-3.5 w-3.5" /> Transmisión
        </Button>
      </div>
      {t && <EstacionControles emisora={emisora} transmision={t} />}
      {abierta && t && <TransmisionDialog emisora={emisora} transmision={t} avanzado={avanzado} onClose={() => setAbierta(false)} />}
    </li>
  );
};

// Encender o apagar toda la radio. Ninguna emisora suena mientras esté apagada.
const RadioInterruptor: React.FC<{ encendida: boolean; disponible: boolean }> = ({ encendida, disponible }) => {
  const cambiar = useMutacionGestion((nuevo: boolean) => luzApi.setRadioEncendida(nuevo), 'Estado de la radio guardado', 'No se pudo cambiar el estado de la radio');
  const alternar = async (nuevo: boolean) => {
    if (!nuevo) {
      const ok = await confirmar({ title: '¿Apagar toda la radio?', text: 'Ninguna emisora va a sonar hasta que la vuelvas a encender. Los oyentes se desconectan.', type: 'danger', confirmText: 'Apagar radio' });
      if (!ok) return;
    }
    cambiar.mutate(nuevo);
  };
  return (
    <Card className="border-border">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Radio className="h-4 w-4" /> Radio completa</CardTitle>
          <CardDescription className="text-xs">Apaga todas las emisoras de una vez. Cada emisora conserva su propio interruptor.</CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Badge variant={encendida ? 'success' : 'outline'}>{encendida ? 'Encendida' : 'Apagada'}</Badge>
          <Switch checked={encendida} onCheckedChange={alternar} disabled={!disponible || cambiar.isPending} />
        </div>
      </CardHeader>
    </Card>
  );
};

const AjustesServidor: React.FC = () => (
  <Card className="border-amber-500/30">
    <CardHeader>
      <CardTitle className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Servidor (solo superadmin)</CardTitle>
      <CardDescription className="text-xs">
        Límites de oyentes y espacio para audios por emisora se editan en su transmisión (sección avanzada). Aquí, lo que es del servidor.
      </CardDescription>
    </CardHeader>
    <CardContent className="text-xs text-muted-foreground space-y-1.5">
      <p>Puerto de los locutores: <span className="font-mono text-foreground">8005</span> (harbor de Liquidsoap).</p>
      <p>Puerto de los oyentes: <span className="font-mono text-foreground">8000</span> (Icecast).</p>
      <p>Si el servicio está apagado, revisa Docker: <span className="font-mono">docker compose -f infra/radio/compose.yaml up -d</span>.</p>
    </CardContent>
  </Card>
);

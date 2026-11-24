import React, { useEffect, useRef, useState } from 'react';
import { Copy, Pause, Play, Radio, RefreshCw, Settings2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { ApiEmisora, ApiTransmision, luzApi } from '../../../shared/api/luz-api';
import { useSession } from '../../auth/hooks/use-session';
import { useEmisoras, useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { useServicioRadio, useTransmision } from '../hooks/use-radio';
import { TransmisionDialog } from '../components/transmision-dialog';
import { EnVivoEmisor } from '../components/en-vivo-emisor';
import { ReporteTransmisiones } from '../components/reporte-transmisiones';
import { VersionesEmisor } from '../components/versiones-emisor';
import { LocutoresDialog } from '../components/locutores-dialog';
import { pillToast } from '../../../shared/components/ui/pill-toast';

// Configuración de la radio: separada del sitio web. Lo sencillo para cualquier operador con acceso;
// los límites y la capacidad, solo para el superadmin (permiso servidores:configurar).
export const ConfiguracionRadioPage: React.FC = () => {
  const sesion = useSession();
  const emisoras = useEmisoras();
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

      <EnVivoEmisor />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Transmisión por emisora</CardTitle>
          <CardDescription className="text-xs">Configura aquí lo que necesita quien va a transmitir: punto de transmisión, contraseña y calidad.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {emisoras.isLoading && <p className="p-4 text-xs text-muted-foreground">Cargando emisoras…</p>}
          <ul className="divide-y divide-border/60">
            {(emisoras.data ?? []).map((e) => (
              <EmisoraTransmision key={e.id} emisora={e} avanzado={avanzado} />
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
interface EstadoVivo { status?: { online: boolean; listeners: number; title: string | null } }

const EmisoraTransmision: React.FC<{ emisora: ApiEmisora; avanzado: boolean }> = ({ emisora, avanzado }) => {
  const transmision = useTransmision(emisora.id);
  const [abierta, setAbierta] = useState(false);
  const [locutores, setLocutores] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const sincronizar = useMutacionGestion((id: string) => luzApi.sincronizarRadio(id), 'Radio sincronizada', 'No se pudo sincronizar la radio');
  const t: ApiTransmision | undefined = transmision.data?.transmision;
  const vivo = (transmision.data?.radio as EstadoVivo | null)?.status;

  // Al salir de la página, corta el audio de prueba
  useEffect(() => () => { audio.current?.pause(); }, []);

  const alternarEscucha = async () => {
    const a = audio.current;
    if (!a || !t?.streamUrl) return;
    if (escuchando) {
      a.pause();
      a.removeAttribute('src');
      a.load();
      setEscuchando(false);
      return;
    }
    a.src = t.streamUrl; // conexión nueva: el stream es en vivo
    try {
      await a.play();
      setEscuchando(true);
    } catch {
      pillToast.error('No se pudo reproducir', 'Revisa que la radio esté al aire y que este equipo llegue al servidor.');
    }
  };

  const estado = !t ? null : !t.mountPoint ? { texto: 'Sin transmisión', variante: 'outline' as const }
    : !t.livePasswordConfigurada ? { texto: 'Falta contraseña', variante: 'warning' as const }
    : { texto: 'Lista', variante: 'success' as const };

  const copiarEnlace = async () => {
    if (!t?.streamUrl) return;
    try {
      await navigator.clipboard.writeText(t.streamUrl);
      pillToast.success('Enlace copiado');
    } catch {
      pillToast.error('No se pudo copiar');
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold text-sm">{emisora.name}</p>
        <p className="text-muted-foreground font-mono mt-0.5">{t?.mountPoint ?? 'Sin mount'}{t?.streamUrl ? ` · ${t.streamUrl}` : ''}</p>
        {vivo?.online && (
          <p className="text-[11px] text-emerald-500 mt-0.5">
            Al aire · {vivo.listeners} oyente{vivo.listeners === 1 ? '' : 's'}{vivo.title ? ` · ${vivo.title}` : ''}
          </p>
        )}
      </div>
      {estado && <Badge variant={estado.variante} className="text-[10px]">{estado.texto}</Badge>}
      <div className="flex items-center gap-1">
        {t?.streamUrl && (
          <Button type="button" variant={escuchando ? 'secondary' : 'ghost'} size="sm" className="text-xs" onClick={alternarEscucha}>
            {escuchando ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
            {escuchando ? 'Parar' : 'Escuchar'}
          </Button>
        )}
        <audio ref={audio} preload="none" />
        {t?.streamUrl && (
          <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={copiarEnlace}><Copy className="h-3.5 w-3.5 mr-1" /> Enlace</Button>
        )}
        {t?.mountPoint && (
          <Button type="button" variant="ghost" size="sm" className="text-xs" disabled={sincronizar.isPending} onClick={() => sincronizar.mutate(emisora.id)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Sincronizar
          </Button>
        )}
        {t?.mountPoint && (
          <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setLocutores(true)}>Locutores</Button>
        )}
        <Button type="button" size="sm" className="text-xs" disabled={!t} onClick={() => setAbierta(true)}>
          <Settings2 className="h-3.5 w-3.5 mr-1" /> Transmisión
        </Button>
      </div>
      {locutores && <LocutoresDialog emisora={emisora} onClose={() => setLocutores(false)} />}
      {abierta && t && <TransmisionDialog emisora={emisora} transmision={t} avanzado={avanzado} onClose={() => setAbierta(false)} />}
    </li>
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

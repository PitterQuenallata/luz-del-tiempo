import React, { useEffect, useRef, useState } from 'react';
import { Copy, Pause, Play, RefreshCw } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { ApiEmisora, ApiTransmision, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { confirmar } from '../../../shared/lib/confirm';
import { LocutoresDialog } from './locutores-dialog';

// Estado en vivo que devuelve la API de transmisión (Icecast)
export interface EstadoVivo { online: boolean; listeners: number; title: string | null }

// Controles de una estación: encender/apagar, escuchar, enlace, sincronizar y locutores.
// Se usa en Configuración de radio y en la página de la estación (misma lógica en los dos lados).
export const EstacionControles: React.FC<{ emisora: ApiEmisora; transmision: ApiTransmision }> = ({ emisora, transmision: t }) => {
  const [escuchando, setEscuchando] = useState(false);
  const [locutores, setLocutores] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const sincronizar = useMutacionGestion((id: string) => luzApi.sincronizarRadio(id), 'Radio sincronizada', 'No se pudo sincronizar la radio');
  const cambiarEmisora = useMutacionGestion((encendida: boolean) => luzApi.setEmisoraEncendida(emisora.id, encendida), 'Estación actualizada', 'No se pudo cambiar la estación');

  // Al salir de la página, corta el audio de prueba
  useEffect(() => () => { audio.current?.pause(); }, []);

  const alternarEscucha = async () => {
    const a = audio.current;
    if (!a || !t.streamUrl) return;
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

  const alternarEmisora = async (encendida: boolean) => {
    if (!encendida) {
      const ok = await confirmar({ title: `¿Apagar ${emisora.name}?`, text: 'Deja de sonar para los oyentes hasta que la vuelvas a encender. Puede haber un corte de unos segundos en todas las emisoras.', type: 'danger', confirmText: 'Apagar' });
      if (!ok) return;
    }
    cambiarEmisora.mutate(encendida);
  };

  const copiarEnlace = async () => {
    if (!t.streamUrl) return;
    try {
      await navigator.clipboard.writeText(t.streamUrl);
      pillToast.success('Enlace copiado');
    } catch {
      pillToast.error('No se pudo copiar');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 pr-2 text-xs text-muted-foreground" title="Encender o apagar esta estación">
        <Switch checked={Boolean(t.encendida)} onCheckedChange={alternarEmisora} disabled={!t.mountPoint || cambiarEmisora.isPending} />
        {t.encendida ? 'Encendida' : 'Apagada'}
      </label>
      {t.streamUrl && (
        <Button type="button" variant={escuchando ? 'secondary' : 'outline'} size="sm" className="text-xs" onClick={alternarEscucha}>
          {escuchando ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
          {escuchando ? 'Parar' : 'Escuchar'}
        </Button>
      )}
      <audio ref={audio} preload="none" />
      {t.streamUrl && (
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={copiarEnlace}><Copy className="mr-1 h-3.5 w-3.5" /> Enlace</Button>
      )}
      {t.mountPoint && (
        <Button type="button" variant="outline" size="sm" className="text-xs" disabled={sincronizar.isPending} onClick={() => sincronizar.mutate(emisora.id)}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Sincronizar
        </Button>
      )}
      {t.mountPoint && (
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setLocutores(true)}>Locutores</Button>
      )}
      {locutores && <LocutoresDialog emisora={emisora} onClose={() => setLocutores(false)} />}
    </div>
  );
};

// Línea de estado de la estación en palabras simples (lo mismo en Configuración y en la estación)
export function estadoEstacion(emisora: ApiEmisora, t: ApiTransmision | undefined, vivo: EstadoVivo | undefined, radioEncendida: boolean) {
  if (!t) return null;
  if (emisora.status === 'draft') return { texto: 'Borrador', variante: 'outline' as const };
  if (!t.mountPoint) return { texto: 'Sin transmisión', variante: 'outline' as const };
  if (!t.livePasswordConfigurada) return { texto: 'Falta contraseña', variante: 'warning' as const };
  if (!radioEncendida) return { texto: 'Radio apagada', variante: 'outline' as const };
  if (!t.encendida) return { texto: 'Apagada', variante: 'outline' as const };
  if (vivo?.online) return { texto: 'Al aire', variante: 'success' as const };
  return { texto: 'Encendida, sin señal', variante: 'warning' as const };
}

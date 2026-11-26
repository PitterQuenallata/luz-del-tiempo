import React, { useState } from 'react';
import { Copy, KeyRound } from 'lucide-react';
import { emisionSchema, nombreSalidaPorDefecto, type EmisionInput } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Button } from '../../../shared/components/ui/button';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiEmisora, ApiTransmision, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { DialogoContenido, EtiquetaCampo, ErrorCampo } from '../../contenido/components/dialogo-contenido';
import { pillToast } from '../../../shared/components/ui/pill-toast';

const BITRATES = [64, 96, 128, 192, 256, 320];

// Contraseña aleatoria legible (sin caracteres confusos)
function generarClave(largo = 12) {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(largo));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}

export const copiarTexto = async (texto: string, etiqueta: string) => {
  try {
    await navigator.clipboard.writeText(texto);
    pillToast.success(`${etiqueta} copiado`);
  } catch {
    pillToast.error('No se pudo copiar', 'Selecciona el texto y cópialo a mano.');
  }
};

// Estado y guardado del formulario de transmisión. Lo usan la pestaña de la estación y el diálogo de Configuración.
export function useFormularioTransmision(emisora: ApiEmisora, transmision: ApiTransmision) {
  const [mount, setMount] = useState(transmision.mountPoint ?? `/${emisora.slug}`);
  const [clave, setClave] = useState('');
  const [bitrate, setBitrate] = useState(transmision.bitrateKbps);
  const [autodj, setAutodj] = useState(transmision.autodjEnabled);
  const [maxOyentes, setMaxOyentes] = useState(transmision.maxListeners);
  const [cuota, setCuota] = useState(transmision.storageQuotaMb);
  const [nombreSalida, setNombreSalida] = useState(transmision.streamName ?? '');
  const [error, setError] = useState<string | null>(null);
  // La contraseña nueva se muestra una sola vez, después de guardar
  const [recien, setRecien] = useState<{ clave: string | null; mount: string } | null>(null);

  const guardar = useMutacionGestion(
    (datos: EmisionInput) => luzApi.saveTransmision(emisora.id, datos),
    'Transmisión guardada',
    'No se pudo guardar la transmisión',
  );

  const enviar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const parsed = emisionSchema.safeParse({
      mountPoint: mount.trim(),
      livePassword: clave || undefined,
      bitrateKbps: Number(bitrate),
      autodjEnabled: autodj,
      maxListeners: Number(maxOyentes),
      storageQuotaMb: Number(cuota),
      streamName: nombreSalida.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
      return false;
    }
    setError(null);
    const r = await guardar.mutateAsync(parsed.data);
    if (r.sincronizado?.estado !== 'ok') {
      pillToast.error('La radio aún no recibió la configuración', r.sincronizado?.message ?? 'Revisa que la radio esté encendida y vuelve a guardar.');
    }
    setRecien({ clave: clave || null, mount: parsed.data.mountPoint });
    setClave('');
    return true;
  };

  const mountFinal = recien?.mount ?? transmision.locutor.mount ?? mount;
  const puedeEnviar = mount.trim().length > 1 && (Boolean(transmision.livePasswordConfigurada) || clave.length >= 8);

  return {
    campos: { mount, setMount, clave, setClave, bitrate, setBitrate, autodj, setAutodj, maxOyentes, setMaxOyentes, cuota, setCuota, nombreSalida, setNombreSalida },
    enviar,
    error,
    recien,
    mountFinal,
    puedeEnviar,
    guardando: guardar.isPending,
  };
}

// Los campos del formulario, sin marco: se ponen dentro de una sección de la pestaña o de un diálogo.
export const CamposTransmision: React.FC<{
  emisora: ApiEmisora;
  transmision: ApiTransmision;
  avanzado: boolean;
  f: ReturnType<typeof useFormularioTransmision>['campos'];
}> = ({ emisora, transmision, avanzado, f }) => (
  <div className="space-y-6">
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <EtiquetaCampo htmlFor="tr-mount">Punto de transmisión</EtiquetaCampo>
        <Input id="tr-mount" value={f.mount} onChange={(e) => f.setMount(e.target.value)} className="font-mono text-xs" />
        <p className="mt-1.5 text-[11px] text-muted-foreground">Empieza con /. Cada estación tiene el suyo.</p>
      </div>
      <div>
        <EtiquetaCampo htmlFor="tr-salida">Nombre de salida</EtiquetaCampo>
        <Input id="tr-salida" value={f.nombreSalida} onChange={(e) => f.setNombreSalida(e.target.value)} placeholder={nombreSalidaPorDefecto(emisora.name)} maxLength={80} className="text-xs" />
        <p className="mt-1.5 text-[11px] text-muted-foreground">Es el nombre que ve el oyente en su reproductor. Vacío = «{nombreSalidaPorDefecto(emisora.name)}».</p>
      </div>
      <div>
        <EtiquetaCampo htmlFor="tr-clave">Contraseña del locutor</EtiquetaCampo>
        <div className="flex gap-2">
          <Input id="tr-clave" value={f.clave} onChange={(e) => f.setClave(e.target.value)} placeholder={transmision.livePasswordConfigurada ? '•••••• (sin cambios)' : 'Mínimo 8 caracteres'} className="font-mono text-xs" autoComplete="new-password" />
          <Button type="button" variant="outline" size="sm" className="shrink-0 text-xs" onClick={() => f.setClave(generarClave())}>
            <KeyRound className="mr-1 h-3.5 w-3.5" /> Generar
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">Vacía = se conserva la actual. Se guarda cifrada y no se vuelve a mostrar.</p>
      </div>
      <div>
        <EtiquetaCampo htmlFor="tr-bitrate">Calidad del audio</EtiquetaCampo>
        <SelectField id="tr-bitrate" value={f.bitrate} onChange={(e) => f.setBitrate(Number(e.target.value))}>
          {BITRATES.map((b) => <option key={b} value={b}>{b} kbps{b === 128 ? ' (recomendada)' : ''}</option>)}
        </SelectField>
      </div>
    </div>

    <div className="flex items-start justify-between gap-4 border-t border-border/60 pt-5">
      <div>
        <p className="text-xs font-medium">Música automática (AutoDJ)</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {transmision.autodjEnabled
            ? 'Ya está encendido: se eligió al crear la estación y no se puede apagar.'
            : 'Suena cuando no hay programa ni locutor. Solo se puede encender si la estación se creó sin AutoDJ.'}
        </p>
      </div>
      <Switch checked={f.autodj} onCheckedChange={f.setAutodj} id="tr-autodj" disabled={transmision.autodjEnabled} />
    </div>

    {avanzado && (
      <div className="space-y-4 border-t border-border/60 pt-5">
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Ajustes avanzados (superadmin)</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <EtiquetaCampo htmlFor="tr-max">Oyentes máximos</EtiquetaCampo>
            <Input id="tr-max" type="number" min={1} max={2000} value={f.maxOyentes} onChange={(e) => f.setMaxOyentes(Number(e.target.value))} className="text-xs" />
          </div>
          <div>
            <EtiquetaCampo htmlFor="tr-cuota">Espacio para audios (MB)</EtiquetaCampo>
            <Input id="tr-cuota" type="number" min={100} max={10240} value={f.cuota} onChange={(e) => f.setCuota(Number(e.target.value))} className="text-xs" />
          </div>
        </div>
      </div>
    )}
  </div>
);

// Diálogo (solo para Configuración de radio: ahí la lista de estaciones es un resumen y la edición va en ventana).
interface TransmisionDialogProps {
  emisora: ApiEmisora;
  transmision: ApiTransmision;
  avanzado: boolean;
  onClose: () => void;
}

export const TransmisionDialog: React.FC<TransmisionDialogProps> = ({ emisora, transmision, avanzado, onClose }) => {
  const form = useFormularioTransmision(emisora, transmision);
  const guardarYCerrar = async (e: React.FormEvent) => {
    if (await form.enviar(e)) onClose();
  };
  return (
    <DialogoContenido
      titulo={`Transmisión: ${emisora.name}`}
      onClose={onClose}
      onSubmit={guardarYCerrar}
      puedeEnviar={form.puedeEnviar}
      enviando={form.guardando}
      textoBoton="Guardar transmisión"
      ancho="xl"
    >
      <CamposTransmision emisora={emisora} transmision={transmision} avanzado={avanzado} f={form.campos} />
      <ErrorCampo texto={form.error} />
    </DialogoContenido>
  );
};

export const DatoTransmision: React.FC<{ etiqueta: string; valor: string; onCopiar?: (texto: string, etiqueta: string) => void }> = ({ etiqueta, valor, onCopiar }) => (
  <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
    <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
    <dd className="flex min-w-0 items-center gap-2">
      <span className={valor.length > 28 ? 'break-all text-right font-mono text-xs' : 'truncate font-mono text-xs'}>{valor}</span>
      {onCopiar && (
        <button type="button" aria-label={`Copiar ${etiqueta}`} onClick={() => onCopiar(valor, etiqueta)} className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer">
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </dd>
  </div>
);

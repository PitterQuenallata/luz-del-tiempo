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

interface TransmisionDialogProps {
  emisora: ApiEmisora;
  transmision: ApiTransmision;
  avanzado: boolean; // solo superadmin: límites y cuota
  onClose: () => void;
}

export const TransmisionDialog: React.FC<TransmisionDialogProps> = ({ emisora, transmision, avanzado, onClose }) => {
  const [mount, setMount] = useState(transmision.mountPoint ?? `/${emisora.slug}`);
  const [clave, setClave] = useState('');
  const [bitrate, setBitrate] = useState(transmision.bitrateKbps);
  const [autodj, setAutodj] = useState(transmision.autodjEnabled);
  const [maxOyentes, setMaxOyentes] = useState(transmision.maxListeners);
  const [cuota, setCuota] = useState(transmision.storageQuotaMb);
  const [nombreSalida, setNombreSalida] = useState(transmision.streamName ?? '');
  const [error, setError] = useState<string | null>(null);
  // Lo que el locutor necesita. La contraseña solo se muestra aquí, en el momento en que se guarda.
  const [recien, setRecien] = useState<{ clave: string | null; mount: string } | null>(null);

  const guardar = useMutacionGestion(
    (datos: EmisionInput) => luzApi.saveTransmision(emisora.id, datos),
    'Transmisión guardada',
    'No se pudo guardar la transmisión',
  );

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
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
      return;
    }
    setError(null);
    const r = await guardar.mutateAsync(parsed.data);
    if (r.sincronizado?.estado !== 'ok') {
      pillToast.error('La radio aún no recibió la configuración', r.sincronizado?.message ?? 'Revisa que la radio esté encendida y vuelve a guardar.');
    }
    setRecien({ clave: clave || null, mount: parsed.data.mountPoint });
    setClave('');
  };

  const copiar = async (texto: string, etiqueta: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      pillToast.success(`${etiqueta} copiado`);
    } catch {
      pillToast.error('No se pudo copiar', 'Selecciona el texto y cópialo a mano.');
    }
  };

  const mountFinal = recien?.mount ?? transmision.locutor.mount ?? mount;
  const puedeEnviar = mount.trim().length > 1 && (Boolean(transmision.livePasswordConfigurada) || clave.length >= 8);

  return (
    <DialogoContenido
      titulo={`Transmisión: ${emisora.name}`}
      onClose={onClose}
      onSubmit={enviar}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
      textoBoton="Guardar transmisión"
      ancho="xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <EtiquetaCampo htmlFor="tr-mount">Punto de transmisión (mount)</EtiquetaCampo>
          <Input id="tr-mount" value={mount} onChange={(e) => setMount(e.target.value)} className="font-mono text-xs" />
          <p className="text-[11px] text-muted-foreground mt-1">Empieza con /. Ej.: /salud. Cada emisora tiene el suyo.</p>
        </div>
        <div className="sm:col-span-2">
          <EtiquetaCampo htmlFor="tr-salida">Nombre de salida (lo que ve el oyente)</EtiquetaCampo>
          <Input id="tr-salida" value={nombreSalida} onChange={(e) => setNombreSalida(e.target.value)} placeholder={nombreSalidaPorDefecto(emisora.name)} maxLength={80} className="text-xs" />
          <p className="text-[11px] text-muted-foreground mt-1">
            Vacío = «{nombreSalidaPorDefecto(emisora.name)}». Es el nombre que ven los oyentes en su reproductor.
          </p>
        </div>
        <div>
          <EtiquetaCampo htmlFor="tr-clave">Contraseña del locutor</EtiquetaCampo>
          <div className="flex gap-2">
            <Input id="tr-clave" value={clave} onChange={(e) => setClave(e.target.value)} placeholder={transmision.livePasswordConfigurada ? '•••••• (sin cambios)' : 'Mínimo 8 caracteres'} className="font-mono text-xs" autoComplete="new-password" />
            <Button type="button" variant="outline" size="sm" className="text-xs shrink-0" onClick={() => setClave(generarClave())}>
              <KeyRound className="h-3.5 w-3.5 mr-1" /> Generar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Déjala vacía para conservar la actual. Se guarda cifrada y no se vuelve a mostrar.</p>
        </div>
        <div>
          <EtiquetaCampo htmlFor="tr-bitrate">Calidad del audio</EtiquetaCampo>
          <SelectField id="tr-bitrate" value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))}>
            {BITRATES.map((b) => <option key={b} value={b}>{b} kbps{b === 128 ? ' (recomendada)' : ''}</option>)}
          </SelectField>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={autodj} onCheckedChange={setAutodj} id="tr-autodj" />
            <span>
              <span className="block font-medium">Música automática (AutoDJ)</span>
              <span className="block text-[11px] text-muted-foreground">Cuando no hay locutor, suenan las playlists.</span>
            </span>
          </label>
        </div>
      </div>

      {avanzado && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="font-semibold text-amber-600 dark:text-amber-400 mb-3">Ajustes avanzados (superadmin)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <EtiquetaCampo htmlFor="tr-max">Oyentes máximos</EtiquetaCampo>
              <Input id="tr-max" type="number" min={1} max={2000} value={maxOyentes} onChange={(e) => setMaxOyentes(Number(e.target.value))} className="text-xs" />
            </div>
            <div>
              <EtiquetaCampo htmlFor="tr-cuota">Espacio para audios (MB)</EtiquetaCampo>
              <Input id="tr-cuota" type="number" min={100} max={10240} value={cuota} onChange={(e) => setCuota(Number(e.target.value))} className="text-xs" />
            </div>
          </div>
        </div>
      )}

      <ErrorCampo texto={error} />

      {recien && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <p className="font-semibold">Datos para transmitir (BUTT, OBS o la app de la radio)</p>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Dato etiqueta="Servidor" valor={transmision.locutor.servidor} onCopiar={copiar} />
            <Dato etiqueta="Puerto" valor={String(transmision.locutor.puerto)} onCopiar={copiar} />
            <Dato etiqueta="Mount" valor={mountFinal} onCopiar={copiar} />
            <Dato etiqueta="Contraseña" valor={recien.clave ?? 'No se muestra: ya está guardada'} onCopiar={recien.clave ? copiar : undefined} />
          </dl>
          <p className="text-[11px] text-muted-foreground">Oyentes escuchan en: <span className="font-mono">{transmision.streamUrl ?? '—'}</span></p>
        </div>
      )}
    </DialogoContenido>
  );
};

const Dato: React.FC<{ etiqueta: string; valor: string; onCopiar?: (texto: string, etiqueta: string) => void }> = ({ etiqueta, valor, onCopiar }) => (
  <div className="rounded-lg border border-border bg-background px-3 py-2">
    <dt className="text-[11px] text-muted-foreground">{etiqueta}</dt>
    <dd className="flex items-center justify-between gap-2">
      <span className="font-mono text-xs truncate">{valor}</span>
      {onCopiar && (
        <button type="button" aria-label={`Copiar ${etiqueta}`} onClick={() => onCopiar(valor, etiqueta)} className="text-muted-foreground hover:text-foreground cursor-pointer">
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </dd>
  </div>
);


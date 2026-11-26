import React, { useState } from 'react';
import { estacionSchema, type EstacionInput } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiEmisora, ApiRadio, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { DialogoContenido, EtiquetaCampo, ErrorCampo } from '../../contenido/components/dialogo-contenido';
import { slugDe } from '../../contenido/components/area-dialog';
import { ImagenCampo } from '../../contenido/components/imagen-campo';

interface EstacionDialogProps {
  estacion: ApiEmisora | null; // null = nueva
  emisoras: ApiRadio[]; // para elegir la emisora de una estación nueva
  radioIdInicial?: string;
  onClose: () => void;
}

// Estación dentro de una emisora. Al crearla se elige si lleva AutoDJ (con las listas de la emisora) o solo transmite.
export const EstacionDialog: React.FC<EstacionDialogProps> = ({ estacion, emisoras, radioIdInicial, onClose }) => {
  const [radioId, setRadioId] = useState(estacion?.radioId ?? radioIdInicial ?? emisoras[0]?.id ?? '');
  const [nombre, setNombre] = useState(estacion?.name ?? '');
  const [enlace, setEnlace] = useState(estacion?.slug ?? '');
  const [estado, setEstado] = useState<EstacionInput['status']>(estacion?.status ?? 'active');
  const [autodj, setAutodj] = useState(estacion?.autodjEnabled ?? true);
  const [programacion, setProgramacion] = useState(estacion?.tieneProgramacion ?? true);
  const [visible, setVisible] = useState(estacion?.visibleInMinistry ?? true);
  const [imagen, setImagen] = useState<string | null>(estacion?.imageUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutacionGestion(
    (datos: Partial<EstacionInput>) => (estacion ? luzApi.updateEstacion(estacion.id, datos) : luzApi.createEstacion(datos as EstacionInput)),
    estacion ? 'Estación guardada' : 'Estación creada',
    'No se pudo guardar la estación',
  );

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const datos = { radioId, name: nombre.trim(), slug: enlace.trim(), status: estado, autodjEnabled: autodj, tieneProgramacion: programacion, visibleInMinistry: visible, sortOrder: estacion?.sortOrder ?? 0, imageUrl: imagen };
    const parsed = estacionSchema.safeParse(datos);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
      return;
    }
    setError(null);
    await guardar.mutateAsync(estacion ? { name: datos.name, slug: datos.slug, status: estado, autodjEnabled: autodj, tieneProgramacion: programacion, visibleInMinistry: visible, imageUrl: imagen } : parsed.data);
    onClose();
  };

  return (
    <DialogoContenido
      titulo={estacion ? `Estación · ${estacion.name}` : 'Nueva estación'}
      onClose={onClose}
      onSubmit={enviar}
      ancho="xl"
      puedeEnviar={nombre.trim().length >= 2 && enlace.trim().length >= 2 && Boolean(radioId)}
      enviando={guardar.isPending}
      textoBoton={estacion ? 'Guardar' : 'Crear estación'}
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
        <div className="space-y-2">
          <ImagenCampo
                    etiqueta="Foto de la estación"
                    valor={imagen}
                    onChange={(url) => setImagen(url)}
                    ratio={16 / 9}
                    etiquetaRatio="16:9"
                    recomendacion="Horizontal (16:9). Es la foto que ve el oyente en la lista de estaciones de la web."
                  />
        </div>
        <div className="space-y-5">
          <div>
                    <EtiquetaCampo htmlFor="est-emisora">Emisora</EtiquetaCampo>
                    <SelectField id="est-emisora" value={radioId} disabled={Boolean(estacion)} onChange={(e) => setRadioId(e.target.value)}>
                      {emisoras.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </SelectField>
                  </div>
          <div>
            <EtiquetaCampo htmlFor="est-nombre">Nombre</EtiquetaCampo>
            <Input id="est-nombre" value={nombre} onChange={(e) => { setNombre(e.target.value); if (!estacion) setEnlace(slugDe(e.target.value)); }} placeholder="Luz Música" className="text-xs" />
          </div>
          <div>
            <EtiquetaCampo htmlFor="est-enlace">Enlace (slug)</EtiquetaCampo>
            <Input id="est-enlace" value={enlace} onChange={(e) => setEnlace(e.target.value)} className="text-xs font-mono" />
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border p-3">
        <input type="checkbox" checked={autodj} onChange={(e) => setAutodj(e.target.checked)} disabled={Boolean(estacion?.autodjEnabled)} className="mt-0.5 accent-primary" />
        <span>
          <span className="block font-medium">AutoDJ</span>
          <span className="block text-[11px] text-muted-foreground">
            {estacion?.autodjEnabled
              ? 'Ya está encendido: no se puede apagar.'
              : 'Cuando no hay programa ni locutor en vivo, suena con las listas de la estación. Solo se puede encender si se crea sin AutoDJ.'}
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border p-3">
        <input type="checkbox" checked={programacion} onChange={(e) => setProgramacion(e.target.checked)} className="mt-0.5 accent-primary" />
        <span>
          <span className="block font-medium">Tiene programas</span>
          <span className="block text-[11px] text-muted-foreground">
            Marcado: tiene programación (pestaña Programación y se ve en la web). Desmarcado: solo música o transmisión, sin programas.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <EtiquetaCampo htmlFor="est-estado">Estado</EtiquetaCampo>
          <SelectField id="est-estado" value={estado} onChange={(e) => setEstado(e.target.value as EstacionInput['status'])}>
            {estacion?.status === 'draft' && <option value="draft">Borrador (no suena ni se ve)</option>}
            <option value="active">Activa</option>
            <option value="suspended">Suspendida</option>
            <option value="disabled">Deshabilitada</option>
          </SelectField>
        </div>
        <label className="flex items-end gap-2 pb-2 text-xs cursor-pointer">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="accent-primary" /> Visible en el ministerio
        </label>
      </div>
      <ErrorCampo texto={error} />
    </DialogoContenido>
  );
};

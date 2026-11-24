import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { pistaEditarSchema } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { ApiPista, luzApi } from '../../../shared/api/luz-api';
import { confirmar } from '../../../shared/lib/confirm';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { DialogoContenido, EtiquetaCampo, ErrorCampo } from '../../contenido/components/dialogo-contenido';
import { duracion, faltantes, megas, nombreDeArchivo, tituloReal } from '../lib/pistas';

interface Props {
  pista: ApiPista;
  carpetas: string[];
  onClose: () => void;
}

// Metadatos de un audio. Lo importante (título y artista) va marcado en rojo si falta;
// año, álbum y género son opcionales y solo se sugieren.
export const PistaMetadatosDialog: React.FC<Props> = ({ pista, carpetas, onClose }) => {
  const [titulo, setTitulo] = useState(tituloReal(pista) ?? '');
  const [artista, setArtista] = useState(pista.artist ?? '');
  const [album, setAlbum] = useState(pista.album ?? '');
  const [anio, setAnio] = useState(pista.year ? String(pista.year) : '');
  const [genero, setGenero] = useState(pista.genre ?? '');
  const [carpeta, setCarpeta] = useState(pista.folder ?? '');
  const [error, setError] = useState<string | null>(null);
  const estado = faltantes(pista);

  const guardar = useMutacionGestion(
    (datos: Parameters<typeof luzApi.editarPista>[1]) => luzApi.editarPista(pista.id, datos),
    'Datos guardados',
    'No se pudieron guardar los datos',
  );
  const borrar = useMutacionGestion((id: string) => luzApi.borrarPista(id), 'Audio eliminado', 'No se pudo eliminar el audio');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = pistaEditarSchema.safeParse({
      title: titulo,
      artist: artista.trim() || null,
      album: album.trim() || null,
      year: anio.trim() ? Number(anio) : null,
      genre: genero.trim() || null,
      folder: carpeta.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
      return;
    }
    setError(null);
    await guardar.mutateAsync(parsed.data);
    onClose();
  };

  const eliminar = async () => {
    const ok = await confirmar({ title: `¿Eliminar "${pista.title}"?`, text: 'Se borra el archivo de la radio y sale de todas las playlists.', type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    await borrar.mutateAsync(pista.id);
    onClose();
  };

  const rotulo = (texto: string, obligatorio: boolean) => (
    <EtiquetaCampo htmlFor={`pista-${texto}`}>
      <span className={obligatorio && !(texto === 'Título' ? titulo.trim() : artista.trim()) ? 'text-red-400' : undefined}>
        {texto}{obligatorio ? ' *' : ' (opcional)'}
      </span>
    </EtiquetaCampo>
  );

  return (
    <DialogoContenido
      titulo={tituloReal(pista) ?? 'Audio sin título'}
      onClose={onClose}
      onSubmit={enviar}
      puedeEnviar={titulo.trim().length > 0}
      enviando={guardar.isPending}
      textoBoton="Guardar datos"
      ancho="xl"
    >
      <div className="rounded-xl bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span className="font-mono">{pista.storageKey}</span>
        <span>{duracion(pista.durationSec)}</span>
        <span>{megas(pista.sizeBytes)}</span>
      </div>

      {estado.obligatorios.length > 0 && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
          Falta: {estado.obligatorios.join(' y ')}. Sin esto el oyente ve un nombre de archivo en lugar de la canción.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          {rotulo('Título', true)}
          <Input id="pista-Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={nombreDeArchivo(pista)} className="text-xs" />
        </div>
        <div>
          {rotulo('Artista', true)}
          <Input id="pista-Artista" value={artista} onChange={(e) => setArtista(e.target.value)} placeholder="Ej.: Coro Esperanza" className="text-xs" />
        </div>
        <div>
          {rotulo('Álbum', false)}
          <Input id="pista-Álbum" value={album} onChange={(e) => setAlbum(e.target.value)} className="text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            {rotulo('Año', false)}
            <Input id="pista-Año" inputMode="numeric" value={anio} onChange={(e) => setAnio(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2024" className="text-xs" />
          </div>
          <div>
            {rotulo('Género', false)}
            <Input id="pista-Género" value={genero} onChange={(e) => setGenero(e.target.value)} className="text-xs" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <EtiquetaCampo htmlFor="pista-carpeta">Carpeta (para organizar; la radio no la usa)</EtiquetaCampo>
          <Input id="pista-carpeta" list="pista-carpetas" value={carpeta} onChange={(e) => setCarpeta(e.target.value)} placeholder="Sin carpeta" className="text-xs" />
          <datalist id="pista-carpetas">
            {carpetas.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <button type="button" onClick={eliminar} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 cursor-pointer">
          <Trash2 className="h-3.5 w-3.5" /> Eliminar audio
        </button>
        <span className="text-[11px] text-muted-foreground">{estado.opcionales.length ? `Sin: ${estado.opcionales.join(', ')}` : 'Datos completos'}</span>
      </div>
      <ErrorCampo texto={error} />
    </DialogoContenido>
  );
};

import React, { useRef, useState } from 'react';
import { ImagePlus, Pencil, X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { EditorImagen } from './editor-imagen';

interface ImagenCampoProps {
  etiqueta: string;
  valor: string | null;
  onChange: (url: string | null) => void;
  recomendacion?: string;
  ratio?: number; // proporción fija del campo: 16/9 por defecto
  maxAncho?: number;
  etiquetaRatio?: string; // p. ej. "16:9", para mostrarlo al usuario
}

// Imagen con proporción fija: al subirla se recorta al centro en esa proporción y se reduce.
// El botón "Editar" abre el editor (recorte bloqueado a la misma proporción).
export const ImagenCampo: React.FC<ImagenCampoProps> = ({
  etiqueta, valor, onChange, recomendacion, ratio = 16 / 9, maxAncho = 1600, etiquetaRatio = '16:9',
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState(false);

  const subirArchivo = async (archivo: File) => {
    setSubiendo(true);
    try {
      onChange(await luzApi.subirImagen(archivo, { ratio, maxAncho }));
    } catch (err) {
      pillToast.error('No se pudo subir la imagen', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-medium block">{etiqueta}</span>
        <span className="text-[11px] font-mono text-muted-foreground">Proporción {etiquetaRatio}</span>
      </div>
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-muted/40 flex items-center justify-center" style={{ aspectRatio: String(ratio) }}>
        {valor ? (
          <img src={valor} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[11px] text-muted-foreground">Sin imagen</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="text-xs" disabled={subiendo} onClick={() => input.current?.click()}>
          <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
          {subiendo ? 'Subiendo…' : valor ? 'Cambiar' : 'Subir imagen'}
        </Button>
        {valor && (
          <>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setEditando(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Editar imagen
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => onChange(null)}>
              <X className="h-3.5 w-3.5 mr-1" />
              Quitar
            </Button>
          </>
        )}
      </div>
      {recomendacion && <p className="text-[11px] text-muted-foreground">{recomendacion}</p>}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) subirArchivo(archivo);
          e.target.value = '';
        }}
      />
      {editando && valor && (
        <EditorImagen
          src={valor}
          ratio={ratio}
          nombre="imagen"
          onCancel={() => setEditando(false)}
          onSave={async (archivo) => {
            setEditando(false);
            await subirArchivo(archivo);
          }}
        />
      )}
    </div>
  );
};

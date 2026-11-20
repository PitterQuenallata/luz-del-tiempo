import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { useQueryClient } from '@tanstack/react-query';

interface FotoPerfilProps {
  id: string;
  fotoUrl: string | null;
  iniciales: string;
  tamano?: string; // clases de tamaño
  editable?: boolean;
  onUpdated?: () => void;
}

// Foto de perfil con botón para subir una nueva (JPG, PNG o WebP, máx. 2 MB).
export const FotoPerfil: React.FC<FotoPerfilProps> = ({ id, fotoUrl, iniciales, tamano = 'h-16 w-16', editable = false, onUpdated }) => {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const qc = useQueryClient();

  const subir = async (archivo: File) => {
    setSubiendo(true);
    try {
      await luzApi.subirFoto(id, archivo);
      await qc.invalidateQueries({ queryKey: ['usuarios'] });
      await qc.invalidateQueries({ queryKey: ['session'] });
      pillToast.success('Foto actualizada');
      onUpdated?.();
    } catch (err) {
      pillToast.error('No se pudo subir la foto', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="relative shrink-0">
      {fotoUrl ? (
        <img src={fotoUrl} alt="Foto de perfil" className={`${tamano} rounded-2xl object-cover border border-border`} />
      ) : (
        <div className={`${tamano} rounded-2xl bg-primary/15 text-primary font-bold flex items-center justify-center text-sm`}>{iniciales}</div>
      )}
      {editable && (
        <>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={subiendo}
            aria-label="Cambiar foto"
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center shadow-xs hover:text-primary cursor-pointer disabled:opacity-60"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subir(archivo);
              e.target.value = '';
            }}
          />
        </>
      )}
    </div>
  );
};

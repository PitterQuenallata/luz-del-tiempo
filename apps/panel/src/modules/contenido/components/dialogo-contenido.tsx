import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';

// 'pagina': el formulario se muestra como página de edición (lo normal).
// 'modal': sigue como ventana emergente (solo para lo muy pequeño, como agregar una franja).
export const ModoEdicion = createContext<'pagina' | 'modal'>('modal');

interface DialogoContenidoProps {
  titulo: string;
  onClose: () => void; // en página: volver a la lista
  onSubmit: (e: React.FormEvent) => void;
  puedeEnviar: boolean;
  enviando: boolean;
  textoBoton: string;
  children: React.ReactNode;
  /** Solo en ventana emergente: ancho del diálogo. Por defecto 'lg' (como antes). */
  ancho?: 'lg' | 'xl';
}

// Contenedor común de los formularios de contenido.
export const DialogoContenido: React.FC<DialogoContenidoProps> = ({
  titulo, onClose, onSubmit, puedeEnviar, enviando, textoBoton, children, ancho = 'lg',
}) => {
  const modo = useContext(ModoEdicion);
  const formulario = (
    <form
      role={modo === 'modal' ? 'dialog' : undefined}
      aria-modal={modo === 'modal' ? true : undefined}
      aria-label={titulo}
      noValidate
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); onSubmit(e); }}
      className={
        modo === 'modal'
          ? `flex max-h-[90vh] w-full ${ancho === 'xl' ? 'max-w-3xl' : 'max-w-lg'} flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-xl`
          : 'mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card text-card-foreground shadow-xs'
      }
    >
      <div className="flex items-center justify-between gap-3 p-5 border-b border-border/60">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <button type="button" onClick={onClose} aria-label={modo === 'modal' ? 'Cerrar' : 'Volver'} className="text-muted-foreground hover:text-foreground cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className={modo === 'modal' ? 'space-y-4 overflow-y-auto p-5 text-xs' : 'space-y-5 p-5 text-xs'}>{children}</div>
      <div className={modo === 'modal' ? 'flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-card rounded-b-2xl' : 'sticky bottom-24 z-10 flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-card/95 backdrop-blur rounded-b-2xl'}>
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
        <Button type="submit" variant="default" size="sm" disabled={!puedeEnviar || enviando} className="text-xs">
          {enviando ? 'Guardando…' : textoBoton}
        </Button>
      </div>
    </form>
  );

  if (modo === 'pagina') return formulario;
  // Como ventana emergente va en body: ninguna tarjeta puede recortarla
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      {formulario}
    </div>,
    document.body,
  );
};

// Clases comunes de los campos de texto largo (no hay componente de textarea en la plantilla).
export const claseTextarea =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring';

export const EtiquetaCampo: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="font-medium block mb-1.5">{children}</label>
);

export const ErrorCampo: React.FC<{ texto: string | null }> = ({ texto }) =>
  texto ? <p className="text-[11px] text-red-400 mt-1">{texto}</p> : null;

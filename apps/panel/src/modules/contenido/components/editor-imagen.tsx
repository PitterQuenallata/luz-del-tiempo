import React, { Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import type { EditorImagenLibProps } from './editor-imagen-lib';

// El editor de Filerobot pesa mucho: su código solo se descarga cuando el usuario lo abre.
const EditorLib = lazy(() => import('./editor-imagen-lib'));

// Overlay a pantalla completa, montado en body para que no lo recorte ninguna tarjeta.
export const EditorImagen: React.FC<EditorImagenLibProps> = (props) =>
  createPortal(
    <div className="fixed inset-0 z-[60] bg-black/85">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-white">Cargando editor…</div>}>
        <EditorLib {...props} />
      </Suspense>
    </div>,
    document.body,
  );

import React from 'react';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';

// La librería usa React como variable global (JSX clásico). Aquí lo dejamos disponible antes de renderizar.
(globalThis as unknown as { React: typeof React }).React = React;
import { ajustarDataUrlAArchivo } from '../lib/imagen';

// Este archivo carga la librería de Filerobot. Se importa con lazy desde editor-imagen.tsx.
export interface EditorImagenLibProps {
  src: string;
  ratio: number;
  nombre: string;
  onCancel: () => void;
  onSave: (archivo: File) => Promise<void> | void;
}

export default function EditorImagenLib({ src, ratio, nombre, onCancel, onSave }: EditorImagenLibProps) {
  return (
    <FilerobotImageEditor
      source={src}
      onSave={async (datos) => {
        if (!datos.imageBase64) return;
        const archivo = await ajustarDataUrlAArchivo(datos.imageBase64, `${nombre}-editada`);
        await onSave(archivo);
      }}
      onClose={() => onCancel()}
      annotationsCommon={{ fill: '#e2a927' }}
      theme={{ palette: { 'bg-primary': '#0b1324', 'accent-primary': '#e2a927' } }}
      tabsIds={[TABS.ADJUST, TABS.FINETUNE, TABS.FILTERS, TABS.ANNOTATE, TABS.RESIZE]}
      defaultTabId={TABS.ADJUST}
      defaultToolId={TOOLS.CROP}
      Crop={{ ratio, noPresets: true, autoResize: true }}
      useBackendTranslations={false}
      savingPixelRatio={1}
      previewPixelRatio={1}
    />
  );
}

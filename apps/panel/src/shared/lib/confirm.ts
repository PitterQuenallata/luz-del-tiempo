import type { SweetAlertOptions } from '../components/ui/sweet-alert';

// Confirmaciones con SweetAlert (componente de la plantilla). Devuelve una promesa: true si confirma.
type Solicitud = { opciones: Omit<SweetAlertOptions, 'onConfirm' | 'onCancel'>; resolver: (ok: boolean) => void };
type Anfitrion = (solicitud: Solicitud) => void;

let anfitrion: Anfitrion | null = null;

export const registrarAnfitrionConfirm = (fn: Anfitrion | null) => {
  anfitrion = fn;
};

export function confirmar(opciones: Omit<SweetAlertOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> {
  return new Promise((resolve) => {
    if (!anfitrion) return resolve(window.confirm(opciones.title));
    anfitrion({ opciones: { showCancelButton: true, confirmText: 'Confirmar', cancelText: 'Cancelar', ...opciones }, resolver: resolve });
  });
}

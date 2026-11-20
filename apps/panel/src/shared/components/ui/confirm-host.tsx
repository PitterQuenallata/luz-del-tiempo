import React, { useEffect, useState } from 'react';
import { SweetAlert } from './sweet-alert';
import { registrarAnfitrionConfirm } from '../../lib/confirm';

interface Actual {
  opciones: Parameters<typeof SweetAlert>[0] extends infer P ? Omit<P, 'isOpen' | 'onClose'> : never;
  resolver: (ok: boolean) => void;
}

// Anfitrión único de las confirmaciones de la app (se monta una vez en los proveedores).
export const ConfirmHost: React.FC = () => {
  const [actual, setActual] = useState<Actual | null>(null);

  useEffect(() => {
    registrarAnfitrionConfirm(({ opciones, resolver }) => setActual({ opciones, resolver }));
    return () => registrarAnfitrionConfirm(null);
  }, []);

  const responder = (ok: boolean) => {
    actual?.resolver(ok);
    setActual(null);
  };

  return (
    <SweetAlert
      {...(actual?.opciones ?? { title: '' })}
      isOpen={!!actual}
      onClose={() => responder(false)}
      onConfirm={() => responder(true)}
      onCancel={() => responder(false)}
    />
  );
};

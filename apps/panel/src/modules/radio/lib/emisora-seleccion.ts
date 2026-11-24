import { useEffect, useState } from 'react';
import type { ApiEmisora } from '../../../shared/api/luz-api';

// La emisora elegida viaja en la URL (?emisora=ID) para que Archivos y Playlists se abran en la misma.
const leerUrl = () => {
  const q = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  return q.get('estacion') ?? q.get('emisora') ?? '';
};

export function useEmisoraSeleccionada(emisoras: ApiEmisora[]) {
  const [id, setId] = useState(leerUrl);
  useEffect(() => {
    // Mientras carga (lista vacía) no toca lo que viene de la URL
    if (emisoras.length && !emisoras.some((e) => e.id === id)) setId(emisoras[0].id);
  }, [emisoras, id]);
  return [id, setId] as const;
}

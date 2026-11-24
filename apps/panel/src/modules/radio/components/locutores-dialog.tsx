import React, { useEffect, useState } from 'react';
import { Input } from '../../../shared/components/ui/input';
import { ApiEmisora, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion } from '../../gestion/hooks/use-gestion';
import { DialogoContenido } from '../../contenido/components/dialogo-contenido';
import { useLocutores } from '../hooks/use-radio';

// Quién puede salir al aire en esta emisora con el emisor de Windows.
// Los administradores de estaciones pueden en todas; aquí se autoriza a los demás (por ejemplo, operadores).
export const LocutoresDialog: React.FC<{ emisora: ApiEmisora; onClose: () => void }> = ({ emisora, onClose }) => {
  const consulta = useLocutores(emisora.id);
  const [elegidos, setElegidos] = useState<Set<string> | null>(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    if (consulta.data && elegidos === null) setElegidos(new Set(consulta.data.asignados.map((u) => u.id)));
  }, [consulta.data, elegidos]);

  const guardar = useMutacionGestion(
    (usuarios: string[]) => luzApi.saveLocutores(emisora.id, usuarios),
    'Locutores guardados',
    'No se pudieron guardar los locutores',
  );

  const alternar = (id: string) =>
    setElegidos((actual) => {
      const s = new Set(actual ?? []);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const texto = filtro.trim().toLowerCase();
  const candidatos = (consulta.data?.candidatos ?? []).filter(
    (u) => !texto || u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto),
  );

  return (
    <DialogoContenido
      titulo={`Locutores: ${emisora.name}`}
      onClose={onClose}
      onSubmit={async () => {
        await guardar.mutateAsync([...(elegidos ?? [])]);
        onClose();
      }}
      puedeEnviar={elegidos !== null}
      enviando={guardar.isPending}
      textoBoton="Guardar locutores"
    >
      <p className="text-muted-foreground">
        Las personas marcadas pueden salir al aire en esta emisora con el emisor de Windows, iniciando sesión con su usuario del panel.
        Necesitan además el permiso «Transmitir en vivo con el emisor de Windows» en su rol. Los administradores de estaciones pueden transmitir en todas.
      </p>
      <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar por nombre o correo" className="text-xs" />
      {consulta.isLoading && <p className="text-muted-foreground">Cargando usuarios…</p>}
      {consulta.isError && <p className="text-red-400">No se pudieron cargar los usuarios.</p>}
      <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border">
        {candidatos.map((u) => (
          <li key={u.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/40">
              <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={elegidos?.has(u.id) ?? false} onChange={() => alternar(u.id)} />
              <span className="min-w-0">
                <span className="block font-medium">{u.nombre}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{u.email}</span>
              </span>
            </label>
          </li>
        ))}
        {consulta.data && candidatos.length === 0 && <li className="px-3 py-3 text-muted-foreground">Ningún usuario coincide.</li>}
      </ul>
      <p className="text-[11px] text-muted-foreground">{elegidos?.size ?? 0} autorizado(s).</p>
    </DialogoContenido>
  );
};

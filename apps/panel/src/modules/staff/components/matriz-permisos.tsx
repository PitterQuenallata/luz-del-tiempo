import React, { useEffect, useMemo, useState } from 'react';
import { ApiPermiso, ApiRole, luzApi } from '../../../shared/api/luz-api';
import { Button } from '../../../shared/components/ui/button';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { ROLES_KEY } from '../../usuarios/hooks/use-usuarios';
import { useQueryClient } from '@tanstack/react-query';

interface MatrizProps {
  roles: ApiRole[];
  permisos: ApiPermiso[];
  editable: boolean;
}

const iguales = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

// Matriz de permisos por rol. El superadmin siempre tiene todos y no se edita.
export const MatrizPermisos: React.FC<MatrizProps> = ({ roles, permisos, editable }) => {
  const qc = useQueryClient();
  const originales = useMemo(
    () => Object.fromEntries(roles.map((r) => [r.id, [...r.permisos].sort()])),
    [roles]
  );
  const [borrador, setBorrador] = useState<Record<string, string[]>>(originales);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => setBorrador(originales), [originales]);

  const cambiados = roles.filter((r) => r.key !== 'superadmin' && !iguales(borrador[r.id] ?? [], originales[r.id] ?? []));

  const alternar = (rolId: string, permiso: string) => {
    setBorrador((prev) => {
      const actual = prev[rolId] ?? [];
      const nuevo = actual.includes(permiso) ? actual.filter((p) => p !== permiso) : [...actual, permiso].sort();
      return { ...prev, [rolId]: nuevo };
    });
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      for (const rol of cambiados) {
        await luzApi.updateRol(rol.id, { permisos: borrador[rol.id] ?? [] });
      }
      await qc.invalidateQueries({ queryKey: ROLES_KEY });
      pillToast.success('Permisos guardados', `${cambiados.length} rol(es) actualizados.`);
    } catch (err) {
      pillToast.error('No se pudieron guardar los permisos', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  if (permisos.length === 0) return <p className="text-xs text-muted-foreground p-4">Sin permisos en el catálogo.</p>;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-y border-border/60 bg-secondary/30 text-left">
              <th className="px-4 py-2.5 font-medium">Permiso</th>
              {roles.map((r) => (
                <th key={r.id} className="px-3 py-2.5 font-medium text-center whitespace-nowrap">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permisos.map((p) => (
              <tr key={p.key} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-2.5">
                  <p>{p.descripcion}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{p.key}</p>
                </td>
                {roles.map((r) => {
                  const marcado = r.key === 'superadmin' || (borrador[r.id] ?? []).includes(p.key);
                  const bloqueado = !editable || r.key === 'superadmin';
                  return (
                    <td key={r.id} className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${p.descripcion} — ${r.name}`}
                        checked={marcado}
                        disabled={bloqueado}
                        onChange={() => alternar(r.id, p.key)}
                        className="h-4 w-4 accent-[#e2a927] cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={cambiados.length === 0 || guardando} onClick={() => setBorrador(originales)} className="text-xs">
            Descartar
          </Button>
          <Button variant="default" size="sm" disabled={cambiados.length === 0 || guardando} onClick={guardar} className="text-xs">
            {guardando ? 'Guardando…' : `Guardar permisos${cambiados.length ? ` (${cambiados.length})` : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
};

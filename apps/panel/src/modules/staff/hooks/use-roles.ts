import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { luzApi, NuevoRolInput, EditarRolInput } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { ROLES_KEY } from '../../usuarios/hooks/use-usuarios';

const mensaje = (err: unknown) => (err instanceof Error ? err.message : 'Inténtalo de nuevo.');

export const usePermisos = () =>
  useQuery({ queryKey: ['permisos'], queryFn: () => luzApi.listPermisos(), staleTime: 1000 * 60 * 5 });

export const useCrearRol = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoRolInput) => luzApi.createRol(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES_KEY });
      pillToast.success('Rol creado');
    },
    onError: (err) => pillToast.error('No se pudo crear el rol', mensaje(err)),
  });
};

export const useEditarRol = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EditarRolInput }) => luzApi.updateRol(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES_KEY });
      pillToast.success('Cambios guardados');
    },
    onError: (err) => pillToast.error('No se pudieron guardar los cambios', mensaje(err)),
  });
};

export const useEliminarRol = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => luzApi.deleteRol(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLES_KEY });
      pillToast.info('Rol eliminado');
    },
    onError: (err) => pillToast.error('No se pudo eliminar el rol', mensaje(err)),
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { luzApi, ApiUsuario, NuevoUsuarioInput } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { iniciales } from '../../../shared/lib/utils';
import { Usuario } from '../types/usuarios.types';

export const USUARIOS_KEY = ['usuarios'] as const;
export const ROLES_KEY = ['roles'] as const;

const mensaje = (err: unknown) => (err instanceof Error ? err.message : 'Inténtalo de nuevo.');

export const toUsuario = (u: ApiUsuario): Usuario => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.roleName ?? 'Sin rol',
  roleKey: u.roleKey ?? undefined,
  status: u.isActive ? 'Activo' : 'Inactivo',
  subscription: '',
  avatarText: iniciales(u.name),
  joinedAt: new Date(u.createdAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }),
  phone: u.phone ?? undefined,
});

export const useUsuarios = () =>
  useQuery({
    queryKey: USUARIOS_KEY,
    queryFn: async () => (await luzApi.listUsuarios()).map(toUsuario),
  });

// Roles (lista) para selectores y filtros
export const useRoles = () => {
  const query = useQuery({ queryKey: ROLES_KEY, queryFn: () => luzApi.listRoles(), staleTime: 1000 * 60 });
  return { ...query, data: query.data ?? [] };
};

export const useCreateUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoUsuarioInput) => luzApi.createUsuario(input),
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: USUARIOS_KEY });
      qc.invalidateQueries({ queryKey: ROLES_KEY });
      pillToast.success('Usuario creado', `${input.email} ya puede ingresar al panel.`);
    },
    onError: (err) => pillToast.error('No se pudo crear el usuario', mensaje(err)),
  });
};

export const useUpdateUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; phone?: string | null; roleKey?: string; isActive?: boolean } }) =>
      luzApi.updateUsuario(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USUARIOS_KEY });
      qc.invalidateQueries({ queryKey: ROLES_KEY });
      pillToast.success('Cambios guardados');
    },
    onError: (err) => pillToast.error('No se pudieron guardar los cambios', mensaje(err)),
  });
};

// "Eliminar" desactiva la cuenta: no se borra el historial.
export const useDeleteUsuario = () => {
  const update = useUpdateUsuario();
  return {
    ...update,
    mutate: (id: string) => update.mutate({ id, patch: { isActive: false } }),
  };
};

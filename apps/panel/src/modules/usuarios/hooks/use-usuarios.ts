import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { luzApi, ApiUsuario, NuevoUsuarioInput } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { iniciales } from '../../../shared/lib/utils';
import { Usuario } from '../types/usuarios.types';

const USUARIOS_QUERY_KEY = ['usuarios'] as const;
const ROLES_QUERY_KEY = ['roles'] as const;

// Adapta la respuesta de la API al tipo que usa la tabla
export const toUsuario = (u: ApiUsuario): Usuario => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.roleName ?? 'Sin rol',
  roleKey: u.roleKey ?? undefined,
  status: u.isActive ? 'Activo' : 'Inactivo',
  subscription: '—',
  avatarText: iniciales(u.name),
  joinedAt: new Date(u.createdAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }),
  phone: u.phone ?? undefined,
});

export const useUsuarios = () =>
  useQuery({
    queryKey: USUARIOS_QUERY_KEY,
    queryFn: async () => (await luzApi.listUsuarios()).map(toUsuario),
  });

// Roles y catálogo de permisos desde la API
export const useRolesPermisos = () =>
  useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => luzApi.listRoles(),
    staleTime: 1000 * 60,
  });

export const useRoles = () => {
  const query = useRolesPermisos();
  return { ...query, data: query.data?.roles ?? [] };
};

export const useCreateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoUsuarioInput) => luzApi.createUsuario(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
      pillToast.success('Usuario creado', `${input.email} ya puede ingresar al panel.`);
    },
    onError: (err) => {
      pillToast.error('No se pudo crear el usuario', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    },
  });
};

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { roleKey?: string; isActive?: boolean } }) =>
      luzApi.updateUsuario(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
      pillToast.success('Cambios guardados');
    },
    onError: (err) => {
      pillToast.error('No se pudieron guardar los cambios', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    },
  });
};

// Desactivar desde la tabla (no se borra el historial)
export const useDeleteUsuario = () => {
  const updateUsuario = useUpdateUsuario();
  return {
    ...updateUsuario,
    mutate: (id: string) => updateUsuario.mutate({ id, patch: { isActive: false } }),
  };
};

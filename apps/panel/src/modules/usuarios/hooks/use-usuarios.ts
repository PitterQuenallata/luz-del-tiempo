import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { luzApi, ApiUsuario, NuevoUsuarioInput } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { Usuario } from '../types/usuarios.types';

const USUARIOS_QUERY_KEY = ['usuarios'] as const;
const ROLES_QUERY_KEY = ['roles'] as const;

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase() || 'US';

// Adapta la respuesta de la API al tipo que usa la plantilla de la tabla
export const toUsuario = (u: ApiUsuario): Usuario => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.roleName ?? 'Sin rol',
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

export const useRoles = () =>
  useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => luzApi.listRoles(),
    staleTime: 1000 * 60 * 10,
  });

export const useCreateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoUsuarioInput) => luzApi.createUsuario(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      pillToast.success('Usuario creado', `${input.email} ya puede ingresar al panel.`);
    },
    onError: (err) => {
      pillToast.error('No se pudo crear el usuario', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    },
  });
};

// En el panel "eliminar" desactiva la cuenta: no se borra el historial.
export const useDeleteUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => luzApi.updateUsuario(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      pillToast.info('Usuario desactivado', 'Ya no podrá ingresar al panel.');
    },
    onError: (err) => {
      pillToast.error('No se pudo desactivar', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    },
  });
};

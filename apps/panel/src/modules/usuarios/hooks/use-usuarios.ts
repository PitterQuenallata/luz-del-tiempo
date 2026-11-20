import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { luzApi, ApiUsuario, EditarUsuarioInput, NuevoUsuarioInput } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { iniciales } from '../../../shared/lib/utils';
import { Usuario, EstadoUsuario } from '../types/usuarios.types';

export const USUARIOS_KEY = ['usuarios'] as const;
export const ROLES_KEY = ['roles'] as const;

const mensaje = (err: unknown) => (err instanceof Error ? err.message : 'Inténtalo de nuevo.');

export type Estado = 'vigentes' | 'eliminados' | 'todos';

const estadoDe = (u: ApiUsuario): EstadoUsuario => (u.deletedAt ? 'Eliminado' : u.isActive ? 'Activo' : 'Inactivo');

export const toUsuario = (u: ApiUsuario): Usuario => ({
  id: u.id,
  name: u.name,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  role: u.roleName ?? 'Sin rol',
  roleKey: u.roleKey ?? undefined,
  status: estadoDe(u),
  avatarText: iniciales(u.name),
  fotoUrl: u.fotoUrl,
  phoneCode: u.phoneCode,
  phone: u.phone,
  lastLoginAt: u.lastLoginAt,
  mustChangePassword: u.mustChangePassword,
  joinedAt: new Date(u.createdAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }),
});

export const useUsuarios = (estado: Estado = 'vigentes') =>
  useQuery({
    queryKey: [...USUARIOS_KEY, estado],
    queryFn: async () => (await luzApi.listUsuarios(estado)).map(toUsuario),
  });

export const useRoles = () => {
  const query = useQuery({ queryKey: ROLES_KEY, queryFn: () => luzApi.listRoles(), staleTime: 1000 * 60 });
  return { ...query, data: query.data ?? [] };
};

const invalidar = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: USUARIOS_KEY });
  qc.invalidateQueries({ queryKey: ROLES_KEY });
};

export const useCreateUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevoUsuarioInput) => luzApi.createUsuario(input),
    onSuccess: (res) => {
      invalidar(qc);
      pillToast.success('Usuario creado', `Contraseña inicial: ${res.contrasenaInicial}. Debe cambiarla al entrar.`);
    },
    onError: (err) => pillToast.error('No se pudo crear el usuario', mensaje(err)),
  });
};

export const useUpdateUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EditarUsuarioInput }) => luzApi.updateUsuario(id, patch),
    onSuccess: () => {
      invalidar(qc);
      pillToast.success('Cambios guardados');
    },
    onError: (err) => pillToast.error('No se pudieron guardar los cambios', mensaje(err)),
  });
};

export const useEliminarUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => luzApi.deleteUsuario(id),
    onSuccess: (res) => {
      invalidar(qc);
      if (res.tipo === 'limpia') pillToast.info('Usuario eliminado', 'La cuenta no tenía actividad y se borró.');
      else pillToast.info('Usuario eliminado', 'Tenía actividad: se marcó como eliminado y se conserva el historial.');
    },
    onError: (err) => pillToast.error('No se pudo eliminar', mensaje(err)),
  });
};

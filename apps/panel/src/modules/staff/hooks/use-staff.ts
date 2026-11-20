import { useQuery } from '@tanstack/react-query';
import { luzApi } from '../../../shared/api/luz-api';
import { iniciales } from '../../../shared/lib/utils';
import { StaffMember, PermissionRow } from '../types/staff.types';

// Miembros del equipo = cuentas del panel (API 1)
export const useStaffMembers = () =>
  useQuery({
    queryKey: ['staff-members'],
    queryFn: async (): Promise<StaffMember[]> =>
      (await luzApi.listUsuarios()).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.roleName ?? 'Sin rol',
        access: u.isActive ? 'Acceso activo' : 'Desactivada',
        twoFactor: false,
        lastActive: '—',
        avatar: iniciales(u.name),
      })),
    staleTime: 1000 * 60,
  });

// Matriz de permisos desde el catálogo de la API.
// Columnas de la plantilla: superAdmin=superadmin, security=admin, devOps=editor, billing=station_operator.
export const useStaffPermissions = () =>
  useQuery({
    queryKey: ['staff-permissions'],
    queryFn: async (): Promise<PermissionRow[]> => {
      const { permisos } = await luzApi.listRoles();
      return permisos.map((p) => ({
        module: p.descripcion,
        superAdmin: p.roles.includes('superadmin'),
        security: p.roles.includes('admin'),
        devOps: p.roles.includes('editor'),
        billing: p.roles.includes('station_operator'),
      }));
    },
    staleTime: 1000 * 60,
  });

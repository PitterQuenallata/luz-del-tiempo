export type EstadoUsuario = 'Activo' | 'Inactivo' | 'Eliminado';

export interface Usuario {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  roleKey?: string;
  status: EstadoUsuario;
  avatarText: string;
  fotoUrl: string | null;
  phoneCode: string | null;
  phone: string | null;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  joinedAt: string;
}

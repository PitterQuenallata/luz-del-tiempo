export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  roleKey?: string;
  status: 'Activo' | 'Inactivo';
  subscription: string;
  avatarText: string;
  joinedAt: string;
  phone?: string;
}

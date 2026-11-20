// Cliente de la API 1 (apps/api). La sesión viaja en una cookie HttpOnly de Better Auth,
// por eso todas las peticiones usan credentials: 'include'.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

export class ApiRequestError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

const MENSAJES_ERROR: Record<string, string> = {
  correo_existente: 'Ya existe una cuenta con ese correo.',
  sin_permiso: 'No tienes permiso para esta acción.',
  rol_invalido: 'El rol seleccionado no es válido.',
  rol_no_existe: 'El rol seleccionado no existe.',
  datos_invalidos: 'Revisa los datos del formulario.',
  auto_desactivacion: 'No puedes desactivar tu propia cuenta.',
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && (data.message || MENSAJES_ERROR[data.error])) || `Error ${res.status}`;
    throw new ApiRequestError(message, res.status);
  }
  return data as T;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  roleKey: string | null;
  roleName: string | null;
  roleScope: 'global' | 'station' | null;
}

export interface ApiUsuario {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  roleKey: string | null;
  roleName: string | null;
}

export interface ApiRole {
  key: string;
  name: string;
  scope: 'global' | 'station';
  miembros: number;
  permisos: string[];
}

export interface ApiPermiso {
  key: string;
  descripcion: string;
  roles: string[];
  aplicado: boolean;
}

export interface ApiRolesResponse {
  roles: ApiRole[];
  permisos: ApiPermiso[];
}

export interface NuevoUsuarioInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleKey: string;
}

export const luzApi = {
  async signIn(email: string, password: string, rememberMe = true) {
    try {
      return await request('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        throw new ApiRequestError('Correo o contraseña incorrectos.', 401);
      }
      throw err;
    }
  },

  signOut() {
    return request('/api/auth/sign-out', { method: 'POST', body: '{}' });
  },

  async me(): Promise<SessionUser> {
    const data = await request<{ user: SessionUser }>('/api/v1/me');
    return data.user;
  },

  async listUsuarios(): Promise<ApiUsuario[]> {
    const data = await request<{ usuarios: ApiUsuario[] }>('/api/v1/usuarios');
    return data.usuarios;
  },

  listRoles(): Promise<ApiRolesResponse> {
    return request<ApiRolesResponse>('/api/v1/usuarios/roles');
  },

  createUsuario(input: NuevoUsuarioInput) {
    return request('/api/v1/usuarios', { method: 'POST', body: JSON.stringify(input) });
  },

  updateUsuario(id: string, patch: { roleKey?: string; isActive?: boolean }) {
    return request(`/api/v1/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
};

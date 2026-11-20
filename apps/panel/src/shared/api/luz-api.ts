// Cliente de la API 1 (apps/api). La sesión viaja en una cookie de Better Auth.
// Vacío = mismo origen: Vite reenvía /api a la API. En producción se define VITE_API_URL.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

const MENSAJES_ERROR: Record<string, string> = {
  correo_existente: 'Ya existe una cuenta con ese correo.',
  sin_permiso: 'No tienes permiso para esta acción.',
  no_autenticado: 'Tu sesión venció. Vuelve a iniciar sesión.',
  datos_invalidos: 'Revisa los datos del formulario.',
  auto_desactivacion: 'No puedes desactivar tu propia cuenta.',
  rol_no_existe: 'El rol seleccionado no existe.',
  permiso_invalido: 'Hay un permiso que no existe.',
  clave_existente: 'Ya existe un rol con esa clave.',
  nombre_requerido: 'El nombre es obligatorio.',
  rol_de_sistema: 'Los roles de sistema no se pueden eliminar.',
};

const MENSAJE_SERVIDOR =
  'El servidor no respondió bien. Revisa que la base de datos (Docker) y la API (pnpm dev) estén activas.';

export class ApiRequestError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiRequestError('No hay conexión con la API. Revisa que esté corriendo (pnpm dev).', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status >= 500) throw new ApiRequestError(MENSAJE_SERVIDOR, res.status);
    const message = (data && (data.message || MENSAJES_ERROR[data.error])) || `Error ${res.status}`;
    throw new ApiRequestError(message, res.status);
  }
  return data as T;
}

const json = (body: unknown) => JSON.stringify(body);

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
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: 'global' | 'station';
  isSystem: boolean;
  miembros: number;
  permisos: string[];
}

export interface ApiPermiso {
  key: string;
  descripcion: string;
  grupo: string;
}

export interface NuevoUsuarioInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleKey: string;
}

export interface NuevoRolInput {
  key: string;
  name: string;
  description?: string;
  permisos: string[];
}

export interface EditarRolInput {
  name?: string;
  description?: string | null;
  permisos?: string[];
}

export const luzApi = {
  async signIn(email: string, password: string, rememberMe = true) {
    try {
      return await request('/api/auth/sign-in/email', { method: 'POST', body: json({ email, password, rememberMe }) });
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

  createUsuario(input: NuevoUsuarioInput) {
    return request('/api/v1/usuarios', { method: 'POST', body: json(input) });
  },

  updateUsuario(id: string, patch: { name?: string; phone?: string | null; roleKey?: string; isActive?: boolean }) {
    return request(`/api/v1/usuarios/${id}`, { method: 'PATCH', body: json(patch) });
  },

  async listRoles(): Promise<ApiRole[]> {
    const data = await request<{ roles: ApiRole[] }>('/api/v1/roles');
    return data.roles;
  },

  async listPermisos(): Promise<ApiPermiso[]> {
    const data = await request<{ permisos: ApiPermiso[] }>('/api/v1/roles/permisos');
    return data.permisos;
  },

  createRol(input: NuevoRolInput) {
    return request('/api/v1/roles', { method: 'POST', body: json(input) });
  },

  updateRol(id: string, patch: EditarRolInput) {
    return request(`/api/v1/roles/${id}`, { method: 'PATCH', body: json(patch) });
  },

  deleteRol(id: string) {
    return request(`/api/v1/roles/${id}`, { method: 'DELETE' });
  },
};

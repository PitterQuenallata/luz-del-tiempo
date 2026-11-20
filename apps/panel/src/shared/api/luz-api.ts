// Cliente de la API 1 (apps/api). La sesión viaja en una cookie de Better Auth.
// Vacío = mismo origen: Vite reenvía /api a la API. En producción se define VITE_API_URL.

import { normalizarNombre } from './../lib/validaciones';

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
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneCode: string | null;
  phone: string | null;
  fotoUrl: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  roleKey: string | null;
  roleName: string | null;
  roleScope: 'global' | 'station' | null;
}

export interface ApiUsuario {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneCode: string | null;
  phone: string | null;
  fotoUrl: string | null;
  isActive: boolean;
  deletedAt: string | null;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roleKey: string | null;
  roleName: string | null;
}

export interface Pais {
  codigo: string;
  iso: string;
  nombre: string;
  digitosMin: number;
  digitosMax: number;
}

export interface EventoLog {
  id: string;
  fecha: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: string | null;
  cambios: Record<string, unknown> | null;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
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
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  roleKey: string;
}

export interface EditarUsuarioInput {
  firstName?: string;
  lastName?: string;
  phoneCode?: string;
  phone?: string | null;
  roleKey?: string;
  isActive?: boolean;
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
    const u = data.user;
    return {
      ...u,
      name: normalizarNombre(u.name),
      firstName: u.firstName ? normalizarNombre(u.firstName) : null,
      lastName: u.lastName ? normalizarNombre(u.lastName) : null,
    };
  },

  async listUsuarios(estado: 'vigentes' | 'eliminados' | 'todos' = 'vigentes'): Promise<ApiUsuario[]> {
    const data = await request<{ usuarios: ApiUsuario[] }>(`/api/v1/usuarios?estado=${estado}`);
    return data.usuarios;
  },

  async listPaises(): Promise<{ paises: Pais[]; predeterminado: string }> {
    return request('/api/v1/usuarios/paises');
  },

  createUsuario(input: NuevoUsuarioInput) {
    return request<{ usuario: { id: string; name: string; email: string }; contrasenaInicial: string }>(
      '/api/v1/usuarios',
      { method: 'POST', body: json(input) }
    );
  },

  updateUsuario(id: string, patch: EditarUsuarioInput) {
    return request(`/api/v1/usuarios/${id}`, { method: 'PATCH', body: json(patch) });
  },

  deleteUsuario(id: string) {
    return request<{ ok: boolean; tipo: 'limpia' | 'logica' }>(`/api/v1/usuarios/${id}`, { method: 'DELETE' });
  },

  async subirFoto(id: string, archivo: File) {
    const cuerpo = new FormData();
    cuerpo.append('foto', archivo);
    const res = await fetch(`${API_URL}/api/v1/usuarios/${id}/foto`, { method: 'POST', body: cuerpo, credentials: 'include' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiRequestError(data?.message ?? `Error ${res.status}`, res.status);
    return data;
  },

  updateMe(patch: { firstName?: string; lastName?: string; phoneCode?: string; phone?: string | null }) {
    return request('/api/v1/me', { method: 'PATCH', body: json(patch) });
  },

  changePassword(actual: string, nueva: string) {
    return request('/api/v1/me/contrasena', { method: 'POST', body: json({ actual, nueva }) });
  },

  async listLogs(accion?: string): Promise<EventoLog[]> {
    const q = accion ? `&accion=${encodeURIComponent(accion)}` : '';
    const data = await request<{ eventos: EventoLog[] }>(`/api/v1/logs?limite=200${q}`);
    return data.eventos;
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

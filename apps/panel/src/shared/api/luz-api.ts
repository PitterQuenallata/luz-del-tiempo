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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Error ${res.status}`;
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

export const luzApi = {
  async signIn(email: string, password: string) {
    try {
      return await request('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
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
};

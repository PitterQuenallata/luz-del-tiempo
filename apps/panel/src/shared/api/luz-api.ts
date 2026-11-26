// Cliente de la API 1 (apps/api). La sesión viaja en una cookie de Better Auth.
// Vacío = mismo origen: Vite reenvía /api a la API. En producción se define VITE_API_URL.

import { normalizarNombre } from './../lib/validaciones';
import type { RadioInput, EstacionInput, DatosMinisterioInput, HeroInput, AreaInput, PersonaInput, PostInput, ActividadInput, SerieInput, VideoInput, EnVivoInput, ProgramaInput, FranjaInput, DonacionMetodoInput, NecesidadInput, EmisionInput, PistaEditarInput, PistasCarpetaInput, PlaylistInput } from '@luz/shared';

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
  slug_existente: 'Ya existe un área con ese enlace.',
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
  permisos: string[];
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

// ---------- Contenido de la web ----------
export interface ApiHero {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ghost: string[];
  ctaLabel: string;
  ctaTo: string;
  imageUrl: string | null;
  tint: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface ApiFotoArea {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

export interface ApiArea {
  id: string;
  slug: string;
  name: string;
  template: 'hero' | 'gallery' | 'simple';
  summary: string | null;
  content: string | null;
  color: string;
  icon: string;
  coverUrl: string | null;
  whatsapp: string | null;
  eventEnabled: boolean;
  isPublished: boolean;
  sortOrder: number;
  fotosGaleria: number;
  galeria?: ApiFotoArea[];
}

export interface ApiPersona {
  id: string;
  name: string;
  roleTitle: string;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
}

// ---------- Gestión de contenido (noticias, actividades, videos, en vivo, emisoras, donaciones) ----------
export interface ApiNoticia {
  id: string; slug: string; title: string; excerpt: string | null; content: string | null; coverUrl: string | null;
  areaId: string | null; status: 'draft' | 'scheduled' | 'published' | 'archived'; publishedAt: string | null; authorPersonId: string | null;
  createdAt: string; updatedAt: string;
}
// Agenda: lista (resumen) y ficha completa para editar
export interface ApiActividadResumen {
  id: string; slug: string; kind: string; title: string; coverUrl: string | null; status: 'borrador' | 'publicada' | 'cancelada';
  isFree: boolean; primeraFecha: string | null; ultimaFecha: string | null; sesiones: number; areaIds: string[]; inscritos: number;
}
export interface ApiActividad {
  id: string; slug: string; kind: string; title: string; summary: string | null; content: string | null; coverUrl: string | null;
  report: string | null; language: 'es' | 'en' | 'pt'; isVirtual: boolean; isFree: boolean; priceAmount: number | null; priceNote: string | null;
  capacity: number | null; qrUrl: string | null; status: 'borrador' | 'publicada' | 'cancelada'; areaIds: string[];
  sesiones: {
    id: string; startsAt: string; endsAt: string | null; locationId: string | null; locationNote: string | null;
    programa: { startTime: string | null; durationMin: number | null; title: string; description: string | null; personId: string | null }[];
  }[];
  personas: { personId: string; role: string }[];
  canales: { channel: 'web' | 'whatsapp' | 'correo' | 'enlace'; value: string; enabled: boolean }[];
  galeria: { imageUrl: string; caption: string }[];
  inscritosTotal: number;
}
export interface ApiSede { id: string; name: string; address: string | null; city: string | null; mapUrl: string | null; }
export interface ApiInscrito {
  id: string; fullName: string; phoneCode: string | null; phone: string | null; email: string | null; origin: 'web' | 'manual';
  status: 'pendiente' | 'confirmada' | 'cancelada' | 'asistio'; notes: string | null; createdAt: string;
}
export interface ApiSerie {
  id: string; slug: string; name: string; description: string | null; areaId: string; youtubePlaylistId: string | null; sortOrder: number;
}
export interface ApiVideo {
  id: string; youtubeId: string; title: string; description: string | null; areaId: string; seriesId: string | null;
  isFeatured: boolean; isPublished: boolean; publishedAt: string | null; createdAt: string;
}
export interface ApiEnVivo {
  isLive: boolean; platform: 'youtube' | 'tiktok' | 'facebook' | 'radio' | null; url: string | null; title: string | null;
  startedAt: string | null; updatedAt: string | null;
}
// Emisora (contenedor): «Radio La Luz del Tiempo», o la de un tercero. Dentro tiene sus estaciones.
export type ArchivoDestino = 'estacion' | 'emisora';

export interface ApiRadio {
  id: string; slug: string; name: string; description: string | null; genre: string | null; kind: 'own' | 'external'; imageUrl: string | null;
  isMain: boolean; areaId: string | null; operatedByName: string | null; ownerUserId: string | null; visibleInMinistry: boolean;
  status: 'draft' | 'active' | 'suspended' | 'disabled'; sortOrder: number; contactName: string | null; contactPhone: string | null;
  contactEmail: string | null; notes: string | null;
  estaciones: { id: string; name: string; slug: string; status: string; autodjEnabled: boolean; mountPoint: string | null }[];
}
// Estación: lo que transmite dentro de una emisora (con su AutoDJ y su archivo)
export interface ApiEmisora {
  id: string; radioId: string; slug: string; name: string; kind: 'own' | 'external'; isMain: boolean; visibleInMinistry: boolean;
  status: 'draft' | 'active' | 'suspended' | 'disabled'; sortOrder: number; autodjEnabled: boolean; tieneProgramacion: boolean; imageUrl: string | null;
  /** Si la estación ya puede verse en la web, y lo que le falta */
  paraWeb: { lista: boolean; faltan: string[] };
  transmision: { mountPoint: string | null; livePasswordConfigurada: boolean; encendida: boolean; radioEncendida: boolean; enAire: boolean; oyentes: number; autodjEnabled: boolean };
}
export interface ApiFranja { id: string; programId: string; dayOfWeek: number; startTime: string; endTime: string; isLive: boolean; }
export interface ApiPrograma {
  id: string; stationId: string; areaId: string | null; name: string; description: string | null; hostName: string | null;
  isActive: boolean; franjas: ApiFranja[];
}
// ---------- Radio: transmisión, pistas y playlists ----------
export interface ApiTransmision {
  mountPoint: string | null; livePasswordConfigurada: boolean; bitrateKbps: number; calidadBajaKbps: number; hlsUrl: string | null; autodjEnabled: boolean;
  limiteServidorOyentes: number; streamUrl: string | null; encendida: boolean;
  streamName: string; streamNameEfectivo: string;
  locutor: { servidor: string; puerto: number; mount: string | null };
}
export interface ApiUsuarioBreve { id: string; nombre: string; email: string }
export interface ApiTransmisionEmisor {
  id: string; emisoraId: string; emisora: string; usuario: string | null; email: string | null;
  equipo: string | null; ip: string | null; version: string | null; programa: string | null;
  estado: 'conectando' | 'al_aire' | 'reconectando'; kbps: number | null;
  cortes: number; silencios: number; saturaciones: number;
  inicio: string; ultimoAviso: string; fin: string | null; motivoFin: string | null;
}
export interface ApiTotalesTransmision { transmisiones: number; segundos: number; cortes: number; silencios: number; saturaciones: number }
export interface ApiReporteTransmisiones {
  mes: string;
  general: ApiTotalesTransmision;
  porEmisora: Array<ApiTotalesTransmision & { id: string; nombre: string }>;
  porLocutor: Array<ApiTotalesTransmision & { id: string | null; nombre: string; email: string | null }>;
  porPrograma: Array<ApiTotalesTransmision & { nombre: string }>;
}
export interface ApiVersionEmisor { version: string; notas: string; fecha: string; archivo: string; bytes: number }
export interface ApiEquipoEmisor { equipo: string; version: string | null; ultimaVez: string }
export interface ApiEspacio {
  disco: { disponible: boolean; totalMb: number; libreMb: number; reservaMb: number; disponibleMb: number; asignadoMb: number };
  emisoras: { id: string; name: string; kind: 'own' | 'external'; cuotaMb: number; usadoBytes: number; maximoMb: number }[];
}
export interface ApiEstadoRadio {
  radioApi: 'ok' | 'sin_conexion'; icecastOnline: boolean; emisorasEnRadio: number; encendida: boolean; limiteOyentes?: number;
}
export interface ApiSincronizacion { estado: 'ok' | 'sin_transmision' | 'falta_contrasena' | 'radio_no_disponible' | 'error'; message?: string; status?: number }
export interface ApiPista {
  id: string; stationId: string | null; radioId: string | null; storageKey: string; title: string; artist: string | null; album: string | null;
  year: number | null; genre: string | null; folder: string; durationSec: number | null; sizeBytes: number; createdAt: string;
}
export interface ApiHorarioPlaylist { dayOfWeek: number; startTime: string; endTime: string }
export interface ApiPlaylist {
  id: string; stationId: string | null; radioId: string | null; ambito: 'estacion' | 'emisora'; activa: boolean; /** Posición en la estación (de arriba abajo); -1 si es de la estación */ orden: number; /** Cómo suenan los audios: uno solo por lista */ ordenPistas: 'mezclado' | 'aleatorio' | 'secuencial'; /** Solo programadas: interrumpe lo que suena a la hora */ interrumpe: boolean; /** Solo programadas: una sola pista por horario */ unaSola: boolean; name: string; description: string | null; mode: 'rotacion' | 'secuencial' | 'programada';
  weight: number; shuffle: boolean; isActive: boolean; trackIds: string[]; schedules: ApiHorarioPlaylist[];
  /** Solo en la biblioteca institucional: emisoras propias que la usan */
  estacionesIds?: string[];
}

export interface ApiMetodoDonacion { id: 'qr' | 'bank' | 'paypal' | 'remittance'; title: string; detail: string; lines: string[]; }
export interface ApiNecesidad { title: string; detail: string; }

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
  // Contenido de la web
  async listHero(): Promise<ApiHero[]> {
    return (await request<{ slides: ApiHero[] }>('/api/v1/contenido/hero')).slides;
  },

  createHero(input: HeroInput) {
    return request('/api/v1/contenido/hero', { method: 'POST', body: json(input) });
  },

  updateHero(id: string, patch: Partial<HeroInput>) {
    return request(`/api/v1/contenido/hero/${id}`, { method: 'PATCH', body: json(patch) });
  },

  deleteHero(id: string) {
    return request(`/api/v1/contenido/hero/${id}`, { method: 'DELETE' });
  },

  async listAreas(): Promise<ApiArea[]> {
    return (await request<{ areas: ApiArea[] }>('/api/v1/contenido/areas')).areas;
  },

  async getArea(id: string): Promise<ApiArea> {
    return (await request<{ area: ApiArea }>(`/api/v1/contenido/areas/${id}`)).area;
  },

  createArea(input: AreaInput) {
    return request<{ area: ApiArea }>('/api/v1/contenido/areas', { method: 'POST', body: json(input) });
  },

  updateArea(id: string, patch: Partial<AreaInput>) {
    return request(`/api/v1/contenido/areas/${id}`, { method: 'PATCH', body: json(patch) });
  },

  deleteArea(id: string) {
    return request(`/api/v1/contenido/areas/${id}`, { method: 'DELETE' });
  },

  addFotoGaleria(areaId: string, imageUrl: string, caption?: string | null) {
    return request(`/api/v1/contenido/areas/${areaId}/galeria`, { method: 'POST', body: json({ imageUrl, caption }) });
  },

  deleteFotoGaleria(areaId: string, fotoId: string) {
    return request(`/api/v1/contenido/areas/${areaId}/galeria/${fotoId}`, { method: 'DELETE' });
  },

  async listPersonas(): Promise<ApiPersona[]> {
    return (await request<{ personas: ApiPersona[] }>('/api/v1/contenido/personas')).personas;
  },

  createPersona(input: PersonaInput) {
    return request('/api/v1/contenido/personas', { method: 'POST', body: json(input) });
  },

  updatePersona(id: string, patch: Partial<PersonaInput>) {
    return request(`/api/v1/contenido/personas/${id}`, { method: 'PATCH', body: json(patch) });
  },

  deletePersona(id: string) {
    return request(`/api/v1/contenido/personas/${id}`, { method: 'DELETE' });
  },

  getSitio(): Promise<{ datos: DatosMinisterioInput }> { return request('/api/v1/contenido/sitio'); },
  setSitio(input: DatosMinisterioInput) { return request('/api/v1/contenido/sitio', { method: 'PUT', body: json(input) }); },

  // Sube una imagen y devuelve su URL pública (la guarda la API en uploads/contenido)
  // El servidor recorta a la proporción pedida, reduce y comprime (ver contenido.routes.ts)
  async subirImagen(archivo: File, opciones: { ratio: number; maxAncho: number }): Promise<string> {
    const cuerpo = new FormData();
    cuerpo.append('imagen', archivo);
    cuerpo.append('ratio', String(opciones.ratio));
    cuerpo.append('maxAncho', String(opciones.maxAncho));
    const res = await fetch(`${API_URL}/api/v1/contenido/imagenes`, { method: 'POST', body: cuerpo, credentials: 'include' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiRequestError(data?.message ?? `Error ${res.status}`, res.status);
    return (data as { url: string }).url;
  },
  // Gestión de contenido
  async listNoticias(): Promise<ApiNoticia[]> { return (await request<{ noticias: ApiNoticia[] }>('/api/v1/contenido/noticias')).noticias; },
  createNoticia(input: PostInput) { return request('/api/v1/contenido/noticias', { method: 'POST', body: json(input) }); },
  updateNoticia(id: string, input: PostInput) { return request(`/api/v1/contenido/noticias/${id}`, { method: 'PATCH', body: json(input) }); },
  deleteNoticia(id: string) { return request(`/api/v1/contenido/noticias/${id}`, { method: 'DELETE' }); },

  async listActividades(): Promise<ApiActividadResumen[]> { return (await request<{ actividades: ApiActividadResumen[] }>('/api/v1/contenido/actividades')).actividades; },
  async getActividad(id: string): Promise<ApiActividad> { return (await request<{ actividad: ApiActividad }>(`/api/v1/contenido/actividades/${id}`)).actividad; },
  createActividad(input: ActividadInput) { return request<{ actividad: ApiActividad }>('/api/v1/contenido/actividades', { method: 'POST', body: json(input) }); },
  updateActividad(id: string, input: ActividadInput) { return request<{ actividad: ApiActividad }>(`/api/v1/contenido/actividades/${id}`, { method: 'PATCH', body: json(input) }); },
  deleteActividad(id: string) { return request(`/api/v1/contenido/actividades/${id}`, { method: 'DELETE' }); },

  async listSedes(): Promise<ApiSede[]> { return (await request<{ sedes: ApiSede[] }>('/api/v1/contenido/sedes')).sedes; },
  createSede(input: { name: string; address: string; city: string; mapUrl: string }) { return request<{ sede: ApiSede }>('/api/v1/contenido/sedes', { method: 'POST', body: json(input) }); },
  deleteSede(id: string) { return request(`/api/v1/contenido/sedes/${id}`, { method: 'DELETE' }); },

  async listInscritos(actividadId: string): Promise<ApiInscrito[]> { return (await request<{ inscritos: ApiInscrito[] }>(`/api/v1/contenido/actividades/${actividadId}/inscritos`)).inscritos; },
  addInscritoManual(actividadId: string, input: { fullName: string; phoneCode: string; phone: string; email: string; status: string; notes: string }) {
    return request(`/api/v1/contenido/actividades/${actividadId}/inscritos`, { method: 'POST', body: json(input) });
  },
  setEstadoInscrito(id: string, status: ApiInscrito['status']) { return request(`/api/v1/contenido/inscritos/${id}`, { method: 'PATCH', body: json({ status }) }); },
  deleteInscrito(id: string) { return request(`/api/v1/contenido/inscritos/${id}`, { method: 'DELETE' }); },

  async listSeries(): Promise<ApiSerie[]> { return (await request<{ series: ApiSerie[] }>('/api/v1/contenido/series')).series; },
  createSerie(input: SerieInput) { return request('/api/v1/contenido/series', { method: 'POST', body: json(input) }); },
  updateSerie(id: string, input: SerieInput) { return request(`/api/v1/contenido/series/${id}`, { method: 'PATCH', body: json(input) }); },
  deleteSerie(id: string) { return request(`/api/v1/contenido/series/${id}`, { method: 'DELETE' }); },

  async listVideos(): Promise<ApiVideo[]> { return (await request<{ videos: ApiVideo[] }>('/api/v1/contenido/videos')).videos; },
  createVideo(input: VideoInput | Record<string, unknown>) { return request('/api/v1/contenido/videos', { method: 'POST', body: json(input) }); },
  updateVideo(id: string, input: VideoInput | Record<string, unknown>) { return request(`/api/v1/contenido/videos/${id}`, { method: 'PATCH', body: json(input) }); },
  deleteVideo(id: string) { return request(`/api/v1/contenido/videos/${id}`, { method: 'DELETE' }); },

  getEnVivo(): Promise<{ estado: ApiEnVivo; transmisiones: { platform: 'youtube' | 'tiktok' | 'facebook' | 'radio'; url: string }[] }> { return request('/api/v1/contenido/en-vivo'); },
  setEnVivo(input: EnVivoInput) { return request('/api/v1/contenido/en-vivo', { method: 'PUT', body: json(input) }); },

  async listRadios(): Promise<ApiRadio[]> { return (await request<{ emisoras: ApiRadio[] }>('/api/v1/radio/emisoras')).emisoras; },
  createRadio(input: RadioInput) { return request('/api/v1/radio/emisoras', { method: 'POST', body: json(input) }); },
  updateRadio(id: string, input: RadioInput) { return request(`/api/v1/radio/emisoras/${id}`, { method: 'PATCH', body: json(input) }); },
  deleteRadio(id: string) { return request(`/api/v1/radio/emisoras/${id}`, { method: 'DELETE' }); },
  async listEstaciones(): Promise<ApiEmisora[]> { return (await request<{ estaciones: ApiEmisora[] }>('/api/v1/radio/estaciones')).estaciones; },
  createEstacion(input: EstacionInput) { return request<{ estacion: ApiEmisora }>('/api/v1/radio/estaciones', { method: 'POST', body: json(input) }); },
  updateEstacion(id: string, input: Partial<EstacionInput>) { return request(`/api/v1/radio/estaciones/${id}`, { method: 'PATCH', body: json(input) }); },
  deleteEstacion(id: string) { return request(`/api/v1/radio/estaciones/${id}`, { method: 'DELETE' }); },

  async listProgramas(emisoraId: string): Promise<ApiPrograma[]> { return (await request<{ programas: ApiPrograma[] }>(`/api/v1/radio/estaciones/${emisoraId}/programas`)).programas; },
  createPrograma(emisoraId: string, input: ProgramaInput) { return request(`/api/v1/radio/estaciones/${emisoraId}/programas`, { method: 'POST', body: json(input) }); },
  updatePrograma(id: string, input: ProgramaInput) { return request(`/api/v1/radio/programas/${id}`, { method: 'PATCH', body: json(input) }); },
  deletePrograma(id: string) { return request(`/api/v1/radio/programas/${id}`, { method: 'DELETE' }); },
  createFranja(programaId: string, input: FranjaInput) { return request(`/api/v1/radio/programas/${programaId}/franjas`, { method: 'POST', body: json(input) }); },
  deleteFranja(id: string) { return request(`/api/v1/radio/franjas/${id}`, { method: 'DELETE' }); },
  // Transmisión (locutor), pistas y playlists
  getServicioRadio() { return request<ApiEstadoRadio>('/api/v1/radio/servicio'); },
  getEspacioEmisoras() {
    return request<ApiEspacio>('/api/v1/radio/emisoras/espacio');
  },
  setCuotaEmisora(emisoraId: string, storageQuotaMb: number) {
    return request(`/api/v1/radio/emisoras/${emisoraId}/cuota`, { method: 'PATCH', body: json({ storageQuotaMb }) });
  },
  async getTransmision(emisoraId: string): Promise<{ transmision: ApiTransmision; radio?: unknown; sincronizado?: ApiSincronizacion }> {
    return request(`/api/v1/radio/estaciones/${emisoraId}/transmision`);
  },
  saveTransmision(emisoraId: string, input: EmisionInput) {
    return request<{ transmision: ApiTransmision; sincronizado: ApiSincronizacion }>(`/api/v1/radio/estaciones/${emisoraId}/transmision`, { method: 'PUT', body: json(input) });
  },
  getReporteTransmisiones(mes: string) { return request<ApiReporteTransmisiones>(`/api/v1/radio/reportes/transmisiones?mes=${mes}`); },
  getVersionesEmisor() { return request<{ publicada: ApiVersionEmisor | null; equipos: ApiEquipoEmisor[] }>('/api/v1/radio/emisor/versiones'); },
  descargaEmisor() { return request<{ version: string | null; url?: string; bytes?: number }>('/api/v1/public/emisor/ultima'); },
  async publicarEmisor(datos: { version: string; notas: string; instalador: File; firma: File }) {
    const cuerpo = new FormData();
    cuerpo.append('version', datos.version);
    cuerpo.append('notas', datos.notas);
    cuerpo.append('instalador', datos.instalador);
    cuerpo.append('firma', datos.firma);
    const res = await fetch(`${API_URL}/api/v1/radio/emisor/versiones`, { method: 'POST', body: cuerpo, credentials: 'include' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiRequestError(data?.message ?? MENSAJES_ERROR[data?.error] ?? `Error ${res.status}`, res.status);
    return data as { publicada: ApiVersionEmisor };
  },
  // Emisor de Windows: quién transmite y quién puede hacerlo
  getEnVivoEmisor() { return request<{ ahora: ApiTransmisionEmisor[]; recientes: ApiTransmisionEmisor[] }>('/api/v1/radio/en-vivo'); },
  getLocutores(emisoraId: string) {
    return request<{ asignados: ApiUsuarioBreve[]; candidatos: ApiUsuarioBreve[] }>(`/api/v1/radio/estaciones/${emisoraId}/locutores`);
  },
  saveLocutores(emisoraId: string, usuarios: string[]) {
    return request<{ ok: boolean; total: number }>(`/api/v1/radio/estaciones/${emisoraId}/locutores`, { method: 'PUT', body: json({ usuarios }) });
  },
  sincronizarRadio(emisoraId: string) {
    return request(`/api/v1/radio/estaciones/${emisoraId}/sincronizar`, { method: 'POST' });
  },
  async listPistas(emisoraId: string): Promise<{ pistas: ApiPista[]; archivoEmisora: ApiPista[]; espacioUsadoBytes: number; espacioCuotaBytes: number; espacioEmisoraUsadoBytes: number; espacioEmisoraCuotaBytes: number }> {
    return request(`/api/v1/radio/estaciones/${emisoraId}/pistas`);
  },
  importarPistas(emisoraId: string, destino: ArchivoDestino = 'estacion') {
    return request<{ importadas: number; total: number }>(`/api/v1/radio/estaciones/${emisoraId}/pistas/importar?destino=${destino}`, { method: 'POST' });
  },
  async subirPista(emisoraId: string, archivo: File, destino: ArchivoDestino = 'estacion') {
    const cuerpo = new FormData();
    cuerpo.append('file', archivo);
    const res = await fetch(`${API_URL}/api/v1/radio/estaciones/${emisoraId}/pistas?destino=${destino}`, { method: 'POST', body: cuerpo, credentials: 'include' });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiRequestError(data?.message ?? MENSAJES_ERROR[data?.error] ?? `Error ${res.status}`, res.status);
    return data;
  },
  editarPista(id: string, input: PistaEditarInput) { return request(`/api/v1/radio/pistas/${id}`, { method: 'PATCH', body: json(input) }); },
  releerEtiquetas(emisoraId: string, destino: ArchivoDestino = 'estacion') {
    return request<{ revisadas: number; actualizadas: number; sinEtiquetas: number; noLeidas: number }>(`/api/v1/radio/estaciones/${emisoraId}/pistas/releer?destino=${destino}`, { method: 'POST' });
  },
  setEmisoraEncendida(emisoraId: string, encendida: boolean) {
    return request(`/api/v1/radio/estaciones/${emisoraId}/encendida`, { method: 'PUT', body: json({ encendida }) });
  },
  setRadioEncendida(encendida: boolean) {
    return request<{ encendida: boolean }>('/api/v1/radio/encendida', { method: 'PUT', body: json({ encendida }) });
  },
  moverPistas(emisoraId: string, input: PistasCarpetaInput) { return request<{ movidas: number }>(`/api/v1/radio/estaciones/${emisoraId}/pistas/carpeta`, { method: 'POST', body: json(input) }); },
  borrarPista(id: string) { return request(`/api/v1/radio/pistas/${id}`, { method: 'DELETE' }); },
  /** Lo que suena ahora en la estación (o null si no hay dato). */
  async getAhoraSuena(estacionId: string): Promise<{ ahora: { titulo: string; artista: string; lista: string; inicio: number | null; siguienteLista?: string | null } | null }> {
    return request(`/api/v1/radio/estaciones/${estacionId}/ahora`);
  },
  /** Sistema (superadmin): tareas de fondo y copias de seguridad */
  ajustesSistema() { return request<{ ajustes: { respaldoActivo: boolean; respaldoHora: string; respaldoDiasRetencion: number; muestrasDiasRetencion: number } }>('/api/v1/sistema/ajustes'); },
  guardarAjustesSistema(input: Partial<{ respaldoActivo: boolean; respaldoHora: string; respaldoDiasRetencion: number; muestrasDiasRetencion: number }>) { return request<{ ajustes: { respaldoActivo: boolean; respaldoHora: string; respaldoDiasRetencion: number; muestrasDiasRetencion: number } }>('/api/v1/sistema/ajustes', { method: 'PUT', body: JSON.stringify(input) }); },
  tareasSistema() { return request<{ tareas: { clave: string; nombre: string; ultimaEjecucion: string | null; ultimoResultado: 'ok' | 'error' | null; detalle: string }[] }>('/api/v1/sistema/tareas'); },
  ejecutarTareaSistema(clave: string) { return request<{ tarea: unknown }>(`/api/v1/sistema/tareas/${clave}/ejecutar`, { method: 'POST' }); },
  respaldosSistema() { return request<{ respaldos: { nombre: string; bytes: number; creado: string }[] }>('/api/v1/sistema/respaldos'); },
  crearRespaldoSistema() { return request<{ nombre: string }>('/api/v1/sistema/respaldos', { method: 'POST' }); },
  borrarRespaldoSistema(nombre: string) { return request(`/api/v1/sistema/respaldos/${nombre}`, { method: 'DELETE' }); },
  historialEstacion(estacionId: string, limite = 200) { return request<{ pistas: { inicio: string; titulo: string; artista: string; lista: string; archivo: string }[] }>(`/api/v1/radio/estaciones/${estacionId}/historial?limite=${limite}`); },
  revisionPistas(radioId: string) { return request<{ duplicados: { id: string; title: string; artist: string | null; archivo: string }[][]; sinAsignar: { id: string; title: string; artist: string | null; archivo: string }[] }>(`/api/v1/radio/emisoras/${radioId}/revision-pistas`); },
  oyentesRadio(dias = 7) { return request<{ filas: { slug: string; nombre: string; dia: string; pico: number; promedio: number; muestras: number }[]; porHora: { hora: number; promedio: number }[]; porDiaSemana: { dia: number; promedio: number }[] }>(`/api/v1/radio/reportes/oyentes?dias=${dias}`); },
  registrosRadio(proceso: string, lineas = 200) { return request<{ registros: { archivo: string; lineas: string[] }[] }>(`/api/v1/sistema/registros/${encodeURIComponent(proceso)}?lineas=${lineas}`); },
  async descargarRespaldoSistema(nombre: string): Promise<Blob> {
    const res = await fetch(`${API_URL}/api/v1/sistema/respaldos/${nombre}`, { credentials: 'include' });
    if (!res.ok) throw new ApiRequestError('No se pudo descargar la copia.', res.status);
    return res.blob();
  },
  /** Estado del proceso de Liquidsoap de la emisora (o null si la radio no responde). */
  async getProceso(estacionId: string): Promise<{ proceso: { estado: 'en_marcha' | 'reiniciando' | 'sin_proceso'; reinicios: number; desde: number | null; ultimoCodigo: number | null } | null }> {
    return request(`/api/v1/radio/estaciones/${estacionId}/proceso`);
  },
  reiniciarServicio(estacionId: string, servicio: 'icecast' | 'autodj') {
    return request(`/api/v1/radio/estaciones/${estacionId}/servicio`, { method: 'POST', body: JSON.stringify({ servicio }) });
  },
  saltarLista(estacionId: string) {
    return request(`/api/v1/radio/estaciones/${estacionId}/saltar-lista`, { method: 'POST' });
  },
  saltarCancion(estacionId: string) {
    return request(`/api/v1/radio/estaciones/${estacionId}/saltar`, { method: 'POST' });
  },
  guardarHorarios(playlistId: string, input: { programada: boolean; horarios: { dayOfWeek: number; startTime: string; endTime: string }[]; interrumpe: boolean; unaSola: boolean }) {
    return request(`/api/v1/radio/playlists/${playlistId}/horarios`, { method: 'PUT', body: json(input) });
  },
  setModoPistas(playlistId: string, orden: 'mezclado' | 'aleatorio' | 'secuencial') {
    return request(`/api/v1/radio/playlists/${playlistId}/modo-pistas`, { method: 'PUT', body: json({ orden }) });
  },
  ordenarPistas(playlistId: string, trackIds: string[]) {
    return request(`/api/v1/radio/playlists/${playlistId}/pistas-orden`, { method: 'PUT', body: json({ trackIds }) });
  },
  ordenarPlaylists(estacionId: string, ids: string[]) {
    return request(`/api/v1/radio/estaciones/${estacionId}/playlists/orden`, { method: 'PUT', body: json({ ids }) });
  },
  /** URL del audio de una pista (para el reproductor del panel). */
  urlAudioPista(pistaId: string) {
    return `${API_URL}/api/v1/radio/pistas/${pistaId}/audio`;
  },
  setUsoPlaylist(estacionId: string, playlistId: string, usar: boolean) {
    return request(`/api/v1/radio/estaciones/${estacionId}/playlists/${playlistId}/uso`, { method: 'PUT', body: json({ usar }) });
  },
  async listPlaylists(estacionId: string): Promise<ApiPlaylist[]> { return (await request<{ playlists: ApiPlaylist[] }>(`/api/v1/radio/estaciones/${estacionId}/playlists`)).playlists; },
  createPlaylist(estacionId: string, input: PlaylistInput, ambito: 'estacion' | 'emisora' = 'estacion') {
    return request(`/api/v1/radio/estaciones/${estacionId}/playlists`, { method: 'POST', body: json({ ...input, ambito }) });
  },
  updatePlaylist(id: string, input: PlaylistInput) { return request(`/api/v1/radio/playlists/${id}`, { method: 'PUT', body: json(input) }); },
  deletePlaylist(id: string) { return request(`/api/v1/radio/playlists/${id}`, { method: 'DELETE' }); },


  getDonaciones(): Promise<{ metodos: ApiMetodoDonacion[]; necesidades: ApiNecesidad[] }> { return request('/api/v1/donaciones'); },
  setMetodosDonacion(metodos: DonacionMetodoInput[]) { return request('/api/v1/donaciones/metodos', { method: 'PUT', body: json(metodos) }); },
  setNecesidades(necesidades: NecesidadInput[]) { return request('/api/v1/donaciones/necesidades', { method: 'PUT', body: json(necesidades) }); },
};

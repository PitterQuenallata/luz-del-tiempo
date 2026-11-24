// Llamadas al núcleo nativo (Rust). La interfaz no habla con la red: todo pasa por aquí.
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface Ajustes {
  servidor: string;
  puerto: number;
  puertoOyentes: number;
  mount: string;
  bitrate: number;
  /** "entrada:<nombre>" o "salida:<nombre>"; null = micrófono predeterminado */
  dispositivo: string | null;
  /** Canales del dispositivo que van a izquierda y derecha (0 = canal 1) */
  canalIzq: number;
  canalDer: number;
  frecuencia: number;
  mono: boolean;
  calidad: 'alta' | 'normal' | 'ligera';
  nombreEmision: string;
  /** Limitador de seguridad en la salida */
  limitador: boolean;
  /** Soltar el aire al AutoDJ tras `minutosSilencio` de silencio */
  soltarPorSilencio: boolean;
  minutosSilencio: number;
  /** Guardar en MP3 lo que sale al aire */
  grabar: boolean;
  /** Al minimizar mientras se transmite, mostrar la ventana mini */
  miniAlMinimizar: boolean;
  /** Abrir el emisor al iniciar Windows */
  iniciarConWindows: boolean;
  /** Volver a salir al aire si la PC se apagó o reinició transmitiendo */
  retomarTransmision: boolean;
  /** Segundos de cuenta regresiva antes de salir al aire (0 = sin cuenta) */
  cuentaRegresiva: number;
}

export interface Dispositivo {
  id: string;
  nombre: string;
  /** entrada = micrófono / interfaz / consola; salida = lo que suena en la PC */
  tipo: 'entrada' | 'salida';
  canales: number;
  predeterminado: boolean;
}

export interface AjustesVista extends Ajustes {
  contrasenaGuardada: boolean;
  carpetaGrabaciones: string;
}

export interface AjustesEntrada extends Ajustes {
  contrasena: string | null;
}

export type NombreEstado = 'desconectado' | 'conectando' | 'al_aire' | 'reconectando' | 'error' | 'detenido';

export interface EstadoEmision {
  estado: NombreEstado;
  mensaje: string;
}

export interface Medidores {
  /** Pico por lado (0–1), antes del limitador */
  izq: number;
  der: number;
  /** Reducción del limitador en dB */
  reduccion: number;
  /** Saturaciones en esta emisión */
  recortes: number;
  silencioSeg: number;
  /** kbps que realmente salen hacia la radio */
  kbps: number;
  redLenta: boolean;
}

export const MEDIDORES_VACIOS: Medidores = { izq: 0, der: 0, reduccion: 0, recortes: 0, silencioSeg: 0, kbps: 0, redLenta: false };

export interface Sondeo {
  alcanzable: boolean;
  mountEnLinea: boolean;
  oyentes: number | null;
}

/** Foto del momento que guarda el núcleo (para una ventana que recién se abre) */
export interface Resumen {
  estado: NombreEstado | '';
  mensaje: string;
  desde: number | null;
  silencio: boolean;
  oyentes: number | null;
  grabacion: string | null;
  /** Programación del panel */
  programa: string | null;
  conductor: string | null;
  /** Lo que escribió el operador para mostrar al aire */
  tituloPrograma: string | null;
  tituloConductor: string | null;
  /** Título que están viendo los oyentes */
  titulo: string | null;
}

export interface Actualizacion {
  disponible: boolean;
  actual: string;
  version: string | null;
  notas: string | null;
}

export interface Programa {
  nombre: string;
  conductor: string | null;
}

/** Emisora en la que el usuario puede transmitir (la contraseña queda en el llavero, no llega aquí) */
export interface Emisora {
  id: string;
  slug: string;
  nombre: string;
  principal: boolean;
  servidor: string;
  puerto: number;
  mount: string;
  puertoOyentes: number;
  mountOyentes: string | null;
  programa: Programa | null;
}

export interface CuentaVista {
  sesion: boolean;
  apiUrl: string;
  nombre: string;
  email: string;
  emisoras: Emisora[];
  emisoraId: string | null;
  actualizada: string | null;
  /** La API no respondió: se muestra la última lista guardada */
  sinConexion: boolean;
  /** Dirección de fábrica del panel */
  panelPredeterminado: string;
}

export interface Suceso {
  fecha: string;
  tipo: string;
  mensaje: string;
}

export const api = {
  cargarAjustes: () => invoke<AjustesVista>('ajustes_cargar'),
  guardarAjustes: (datos: AjustesEntrada) => invoke<void>('ajustes_guardar', { datos }),
  dispositivos: () => invoke<Dispositivo[]>('dispositivos'),
  pruebaIniciar: (dispositivo: string | null, canalIzq: number, canalDer: number) =>
    invoke<void>('prueba_iniciar', { dispositivo, canalIzq, canalDer }),
  pruebaDetener: () => invoke<void>('prueba_detener'),
  iniciar: () => invoke<void>('emision_iniciar'),
  detener: () => invoke<void>('emision_detener'),
  silencio: (activo: boolean) => invoke<void>('silencio', { activo }),
  estadoActual: () => invoke<Resumen>('estado_actual'),
  probarServidor: () => invoke<Sondeo>('probar_servidor'),
  historial: () => invoke<Suceso[]>('historial_leer'),
  borrarHistorial: () => invoke<void>('historial_borrar'),
  abrirGrabaciones: () => invoke<void>('abrir_grabaciones'),
  ventanaMini: (mostrar: boolean) => invoke<void>('ventana_mini', { mostrar }),
  cuenta: () => invoke<CuentaVista>('cuenta_estado'),
  iniciarSesion: (apiUrl: string, email: string, contrasena: string) => invoke<CuentaVista>('cuenta_iniciar', { apiUrl, email, contrasena }),
  cerrarSesion: () => invoke<void>('cuenta_cerrar'),
  actualizarEmisoras: () => invoke<CuentaVista>('emisoras_actualizar'),
  elegirEmisora: (id: string) => invoke<CuentaVista>('emisora_elegir', { id }),
  definirTitulo: (programa: string, conductor: string) => invoke<Resumen>('titulo_definir', { programa, conductor }),
  buscarActualizacion: () => invoke<Actualizacion>('actualizacion_buscar'),
  instalarActualizacion: () => invoke<void>('actualizacion_instalar'),
};

const oir =
  <T,>(evento: string) =>
  (f: (v: T) => void): Promise<UnlistenFn> =>
    listen<T>(evento, (ev) => f(ev.payload));

export const escuchar = {
  estado: oir<EstadoEmision>('estado'),
  medidores: oir<Medidores>('medidores'),
  nivelPrueba: oir<Medidores>('nivel_prueba'),
  oyentes: oir<Sondeo>('oyentes'),
  silencio: oir<boolean>('silencio'),
  grabacion: oir<string | null>('grabacion'),
  historial: oir<null>('historial'),
  programa: oir<string | null>('programa'),
  cuenta: oir<null>('cuenta'),
  titulo: oir<string>('titulo'),
  actualizacion: oir<Actualizacion>('actualizacion'),
};

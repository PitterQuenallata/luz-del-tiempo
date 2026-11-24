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
};

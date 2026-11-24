// Llamadas al núcleo nativo (Rust). La interfaz no habla con la red: todo pasa por aquí.
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface Ajustes {
  servidor: string;
  puerto: number;
  puertoOyentes: number;
  mount: string;
  bitrate: number;
  dispositivo: string | null;
  nombreEmision: string;
}

export interface AjustesVista extends Ajustes {
  contrasenaGuardada: boolean;
}

export interface AjustesEntrada extends Ajustes {
  contrasena: string | null;
}

export interface EstadoEmision {
  estado: 'desconectado' | 'conectando' | 'al_aire' | 'reconectando' | 'error' | 'detenido';
  mensaje: string;
}

export interface Sondeo {
  alcanzable: boolean;
  mountEnLinea: boolean;
  oyentes: number | null;
}

export interface EstadoActual {
  alAire: boolean;
  silencio: boolean;
}

export const api = {
  cargarAjustes: () => invoke<AjustesVista>('ajustes_cargar'),
  guardarAjustes: (datos: AjustesEntrada) => invoke<void>('ajustes_guardar', { datos }),
  dispositivos: () => invoke<string[]>('dispositivos'),
  iniciar: () => invoke<void>('emision_iniciar'),
  detener: () => invoke<void>('emision_detener'),
  silencio: (activo: boolean) => invoke<void>('silencio', { activo }),
  estadoActual: () => invoke<EstadoActual>('estado_actual'),
  probarServidor: () => invoke<Sondeo>('probar_servidor'),
};

export const escuchar = {
  estado: (f: (e: EstadoEmision) => void): Promise<UnlistenFn> => listen<EstadoEmision>('estado', (ev) => f(ev.payload)),
  nivel: (f: (n: number) => void): Promise<UnlistenFn> => listen<number>('nivel', (ev) => f(ev.payload)),
  oyentes: (f: (s: Sondeo) => void): Promise<UnlistenFn> => listen<Sondeo>('oyentes', (ev) => f(ev.payload)),
};

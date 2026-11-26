function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

export const config = {
  port: Number(process.env.PORT ?? 4100),
  token: requerida('RADIO_API_TOKEN'),
  configDir: process.env.CONFIG_DIR ?? './data/config',
  musicDir: process.env.MUSIC_DIR ?? './data/music',
  /** Carpeta donde Liquidsoap escribe el HLS (listas y segmentos) */
  hlsDir: process.env.HLS_DIR ?? './data/hls',
  /** Clave de los comandos de control a Liquidsoap (la misma que en Liquidsoap: CONTROL_KEY) */
  controlKey: requerida('RADIO_CONTROL_KEY'),
  /** Nombre del servicio de Liquidsoap en la red de Docker */
  /** Carpeta donde supervisa.sh escribe el estado de cada emisora */
  procesosDir: process.env.PROCESOS_DIR ?? './data/procesos',
  liquidsoapHost: process.env.LIQUIDSOAP_HOST ?? 'liquidsoap',
  /** Carpeta donde supervisord escribe los registros de cada proceso */
  logsDir: process.env.LOGS_DIR ?? './data/logs',
  /** Servicio de Liquidsoap + Icecast (un Icecast por emisora, en su puerto) */
  icecastHost: process.env.ICECAST_HOST ?? 'liquidsoap',
  icecastAdminPassword: process.env.ICECAST_ADMIN_PASSWORD ?? '',
  /** Dirección pública del servidor (sin puerto): cada emisora añade su puerto de oyentes */
  publicStreamHost: (process.env.PUBLIC_STREAM_HOST ?? 'http://localhost').replace(/\/$/, ''),
  /** Tamaño máximo de un audio subido al AutoDJ */
  maxUploadBytes: 300 * 1024 * 1024,
};

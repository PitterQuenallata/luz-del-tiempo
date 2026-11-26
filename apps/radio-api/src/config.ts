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
  icecastUrl: (process.env.ICECAST_URL ?? 'http://localhost:8000').replace(/\/$/, ''),
  icecastAdminPassword: process.env.ICECAST_ADMIN_PASSWORD ?? '',
  publicStreamBase: (process.env.PUBLIC_STREAM_BASE ?? 'http://localhost:8000').replace(/\/$/, ''),
  /** Tamaño máximo de un audio subido al AutoDJ */
  maxUploadBytes: 300 * 1024 * 1024,
};

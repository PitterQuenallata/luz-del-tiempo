import { config } from './config.js';

/**
 * Comandos en caliente a una emisora (como AzuraCast): POST /telnet al puerto de control de la emisora,
 * con la clave en la cabecera. El puerto de control es parte de su bloque de puertos y solo lo ve la red de Docker.
 */

export class ControlError extends Error {
  constructor(public readonly motivo: 'no_responde' | 'rechazado', public readonly status?: number) {
    super(motivo);
  }
}

/** Envía un comando (p. ej. "saltar") a la emisora. Lanza ControlError si no responde o lo rechaza. */
export async function comandoEmisora(slug: string, controlPort: number, comando: string): Promise<string> {
  const url = `http://${config.liquidsoapHost}:${controlPort}/telnet`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'x-liquidsoap-api-key': config.controlKey },
      body: `${slug}.${comando}`,
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    throw new ControlError('no_responde');
  }
  if (!res.ok) throw new ControlError('rechazado', res.status);
  return (await res.text()).trim();
}

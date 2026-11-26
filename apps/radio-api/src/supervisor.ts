// Control de los procesos de cada emisora a través de supervisord (XML-RPC sobre su socket Unix).
// El socket vive en un volumen compartido con el contenedor de Liquidsoap (ver compose.yaml).
import http from 'node:http';

const SOCKET = process.env.SUPERVISOR_SOCKET ?? '/control/supervisor.sock';

function llamar(metodo: string, parametros: string[]): Promise<string> {
  const cuerpo = `<?xml version="1.0"?><methodCall><methodName>${metodo}</methodName><params>${parametros
    .map((p) => `<param><value><string>${p}</string></value></param>`)
    .join('')}</params></methodCall>`;
  return new Promise((resolver, rechazar) => {
    const req = http.request({ socketPath: SOCKET, path: '/RPC2', method: 'POST', headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(cuerpo) }, timeout: 15_000 }, (res) => {
      let datos = '';
      res.on('data', (d) => (datos += d));
      res.on('end', () => (datos.includes('<fault>') ? rechazar(new Error(datos.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200))) : resolver(datos)));
    });
    req.on('error', rechazar);
    req.on('timeout', () => req.destroy(new Error('supervisord no responde')));
    req.end(cuerpo);
  });
}

/** Programas de una emisora: su Icecast y su Liquidsoap (grupo = slug). */
export const programas = (slug: string) => ({ icecast: `${slug}:icecast-${slug}`, autodj: `${slug}:liquidsoap-${slug}` });

/** Reinicia un programa: lo detiene (si corre) y lo vuelve a arrancar. */
export async function reiniciarPrograma(nombre: string): Promise<void> {
  try {
    await llamar('supervisor.stopProcess', [nombre]);
  } catch {
    // ya estaba detenido: se arranca igual
  }
  await llamar('supervisor.startProcess', [nombre]);
}

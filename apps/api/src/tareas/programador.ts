// Tareas de fondo de la API (como las tareas de AzuraCast). Corren dentro de este proceso:
//  - Muestreo de oyentes cada 5 min → station_listener_samples (base del informe de oyentes).
//  - Copia de seguridad cada día a las 03:00 (hora de La Paz) y limpieza de copias viejas.
//  - Limpieza de muestras de oyentes de más de 180 días.
// Cada tarea guarda su último resultado para verlo en el panel (sistema/tareas).
import { and, eq, lt, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { stations, stationListenerSamples } from '../db/schema.js';
import { crearRespaldo } from './respaldo.js';

export interface EstadoTarea { clave: string; nombre: string; ultimaEjecucion: string | null; ultimoResultado: 'ok' | 'error' | null; detalle: string; }

const estado: Record<string, EstadoTarea> = {
  muestreo_oyentes: { clave: 'muestreo_oyentes', nombre: 'Muestreo de oyentes', ultimaEjecucion: null, ultimoResultado: null, detalle: 'Cada 5 minutos' },
  respaldo_diario: { clave: 'respaldo_diario', nombre: 'Copia de seguridad diaria', ultimaEjecucion: null, ultimoResultado: null, detalle: 'Cada día a las 03:00 (La Paz)' },
  limpieza_muestras: { clave: 'limpieza_muestras', nombre: 'Limpieza de muestras antiguas', ultimaEjecucion: null, ultimoResultado: null, detalle: 'Muestras de más de 180 días' },
};

export const estadoTareas = (): EstadoTarea[] => Object.values(estado);

function registrar(clave: string, resultado: 'ok' | 'error', detalle: string) {
  estado[clave] = { ...estado[clave]!, ultimaEjecucion: new Date().toISOString(), ultimoResultado: resultado, detalle };
}

const URL_RADIO = process.env.RADIO_API_URL ?? 'http://localhost:4100';
const TOKEN_RADIO = process.env.RADIO_API_TOKEN ?? '';

/** Guarda cuántos oyentes tiene cada emisora ahora mismo, según la radio-api. */
export async function muestrearOyentes(): Promise<number> {
  const res = await fetch(`${URL_RADIO}/v1/listeners`, { headers: { Authorization: `Bearer ${TOKEN_RADIO}` }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`radio-api respondió ${res.status}`);
  const { stations: filas } = (await res.json()) as { stations: { slug: string; listeners: number }[] };
  const ahora = new Date();
  const sitios = await db.select({ id: stations.id, slug: stations.slug }).from(stations).where(inArray(stations.slug, filas.map((f) => f.slug)));
  const idPorSlug = new Map(sitios.map((s) => [s.slug, s.id]));
  const datos = filas
    .filter((f) => idPorSlug.has(f.slug))
    .map((f) => ({ stationId: idPorSlug.get(f.slug)!, sampledAt: ahora, listeners: f.listeners }));
  if (datos.length) await db.insert(stationListenerSamples).values(datos).onConflictDoNothing();
  return datos.length;
}

async function limpiarMuestras(): Promise<number> {
  const limite = new Date(Date.now() - 180 * 86_400_000);
  const borradas = await db.delete(stationListenerSamples).where(lt(stationListenerSamples.sampledAt, limite)).returning({ s: stationListenerSamples.sampledAt });
  return borradas.length;
}

/** Ejecuta una tarea a mano (desde el panel) o por el programador. */
export async function ejecutarTarea(clave: 'muestreo_oyentes' | 'respaldo_diario' | 'limpieza_muestras'): Promise<EstadoTarea> {
  try {
    if (clave === 'muestreo_oyentes') registrar(clave, 'ok', `${await muestrearOyentes()} muestras guardadas`);
    if (clave === 'respaldo_diario') registrar(clave, 'ok', `Copia creada: ${await crearRespaldo()}`);
    if (clave === 'limpieza_muestras') registrar(clave, 'ok', `${await limpiarMuestras()} muestras borradas`);
  } catch (err) {
    registrar(clave, 'error', (err as Error).message.slice(0, 300));
  }
  return estado[clave]!;
}

let ultimoDiaRespaldo = '';

function horaLaPaz(): { dia: string; hora: number; minuto: number } {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? '0';
  return { dia: `${v('year')}-${v('month')}-${v('day')}`, hora: Number(v('hour')), minuto: Number(v('minute')) };
}

/** Arranca las tareas. Llamar una sola vez al iniciar la API. */
export function iniciarTareas() {
  const desactivadas = process.env.TAREAS_DESACTIVADAS === '1';
  if (desactivadas) {
    console.log('[tareas] desactivadas (TAREAS_DESACTIVADAS=1)');
    return;
  }
  // Oyentes: al arrancar y luego cada 5 min
  const muestrear = () => ejecutarTarea('muestreo_oyentes');
  setTimeout(muestrear, 10_000);
  setInterval(muestrear, 5 * 60_000);
  // Cada minuto: respaldo diario a las 03:00 y limpieza justo después
  setInterval(() => {
    const { dia, hora, minuto } = horaLaPaz();
    if (hora === 3 && minuto < 5 && ultimoDiaRespaldo !== dia) {
      ultimoDiaRespaldo = dia;
      ejecutarTarea('respaldo_diario').then(() => ejecutarTarea('limpieza_muestras'));
    }
  }, 60_000);
  console.log('[tareas] en marcha: oyentes cada 5 min, copia diaria a las 03:00');
}

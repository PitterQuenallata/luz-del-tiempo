// Tareas de fondo de la API (como las tareas de AzuraCast). Corren dentro de este proceso:
//  - Muestreo de oyentes cada 5 min → station_listener_samples (base de los informes de oyentes).
//  - Copia de seguridad diaria a la hora que fija el panel (Sistema, ajustes) y limpieza de copias viejas.
//  - Limpieza de muestras de oyentes más viejas que el plazo del panel.
// Los ajustes se leen de la base en cada ciclo: cambiarlos en el panel no necesita reiniciar la API.
import { and, eq, inArray, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { historialReproduccion, stations, stationListenerSamples } from '../db/schema.js';
import { radioApi } from '../modules/radio/radio-sync.js';
import { crearRespaldo, leerAjustesSistema, limpiarViejos } from './respaldo.js';

export type ClaveTarea = 'muestreo_oyentes' | 'respaldo_diario' | 'limpieza_muestras';
export interface EstadoTarea { clave: ClaveTarea; nombre: string; ultimaEjecucion: string | null; ultimoResultado: 'ok' | 'error' | null; detalle: string }

const estado: Record<ClaveTarea, Omit<EstadoTarea, 'detalle'> & { detalle: string }> = {
  muestreo_oyentes: { clave: 'muestreo_oyentes', nombre: 'Oyentes e historial', ultimaEjecucion: null, ultimoResultado: null, detalle: 'Cada 5 minutos' },
  respaldo_diario: { clave: 'respaldo_diario', nombre: 'Copia de seguridad diaria', ultimaEjecucion: null, ultimoResultado: null, detalle: '' },
  limpieza_muestras: { clave: 'limpieza_muestras', nombre: 'Limpieza de muestras antiguas', ultimaEjecucion: null, ultimoResultado: null, detalle: '' },
};

/** Estado de las tareas, con el detalle según los ajustes actuales. */
export async function estadoTareas(): Promise<EstadoTarea[]> {
  const a = await leerAjustesSistema();
  estado.respaldo_diario.detalle = a.respaldoActivo
    ? `Cada día a las ${a.respaldoHora} (La Paz), guarda ${a.respaldoDiasRetencion} días`
    : 'Desactivada (ver ajustes)';
  estado.limpieza_muestras.detalle = `Muestras de más de ${a.muestrasDiasRetencion} días`;
  return Object.values(estado);
}

function registrar(clave: ClaveTarea, resultado: 'ok' | 'error', detalle: string) {
  estado[clave] = { ...estado[clave], ultimaEjecucion: new Date().toISOString(), ultimoResultado: resultado, detalle };
}

const URL_RADIO = process.env.RADIO_API_URL ?? 'http://localhost:4100';
const TOKEN_RADIO = process.env.RADIO_API_TOKEN ?? '';

/** Trae de la radio las pistas nuevas de cada emisora (historial de reproducción). Idempotente: no duplica. */
export async function importarHistorial(): Promise<number> {
  const todas = await db.select({ id: stations.id, slug: stations.slug }).from(stations);
  let nuevas = 0;
  for (const e of todas) {
    const r = await radioApi<{ pistas: { inicio: number; titulo: string; artista: string; lista: string; archivo: string }[] }>(`/v1/historial/${e.slug}?limite=2000`).catch(() => null);
    if (!r?.pistas?.length) continue;
    // Solo pistas con archivo: los cambios sin audio (silencio, transición) no cuentan
    const filas = r.pistas.filter((p) => p.archivo).map((p) => ({ stationId: e.id, startedAt: new Date(p.inicio * 1000), titulo: p.titulo, artista: p.artista, lista: p.lista, archivo: p.archivo }));
    const insertadas = await db.insert(historialReproduccion).values(filas).onConflictDoNothing().returning({ s: historialReproduccion.startedAt });
    nuevas += insertadas.length;
  }
  return nuevas;
}
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
  const a = await leerAjustesSistema();
  const limite = new Date(Date.now() - a.muestrasDiasRetencion * 86_400_000);
  const borradas = await db.delete(stationListenerSamples).where(lt(stationListenerSamples.sampledAt, limite)).returning({ s: stationListenerSamples.sampledAt });
  await db.delete(historialReproduccion).where(lt(historialReproduccion.startedAt, limite));
  return borradas.length;
}

/** Ejecuta una tarea a mano (desde el panel) o por el programador. */
export async function ejecutarTarea(clave: ClaveTarea): Promise<EstadoTarea> {
  try {
    if (clave === 'muestreo_oyentes') {
      const muestras = await muestrearOyentes();
      const pistas = await importarHistorial();
      registrar(clave, 'ok', `${muestras} muestras de oyentes · ${pistas} pistas nuevas en el historial`);
    }
    if (clave === 'respaldo_diario') {
      const nombre = await crearRespaldo();
      const a = await leerAjustesSistema();
      const borradas = await limpiarViejos(a.respaldoDiasRetencion);
      registrar(clave, 'ok', `Copia creada: ${nombre}${borradas ? ` · ${borradas} vieja(s) borrada(s)` : ''}`);
    }
    if (clave === 'limpieza_muestras') registrar(clave, 'ok', `${await limpiarMuestras()} muestras borradas`);
  } catch (err) {
    registrar(clave, 'error', (err as Error).message.slice(0, 300));
  }
  return estado[clave];
}

/** Hora y día actuales en La Paz. */
function horaLaPaz(): { dia: string; hm: string } {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? '0';
  return { dia: `${v('year')}-${v('month')}-${v('day')}`, hm: `${v('hour')}:${v('minute')}` };
}

let ultimoDiaRespaldo = '';

/** Arranca las tareas. Llamar una sola vez al iniciar la API. */
export function iniciarTareas() {
  if (process.env.TAREAS_DESACTIVADAS === '1') {
    console.log('[tareas] desactivadas (TAREAS_DESACTIVADAS=1)');
    return;
  }
  const muestrear = () => ejecutarTarea('muestreo_oyentes');
  setTimeout(muestrear, 10_000);
  setInterval(muestrear, 5 * 60_000);
  // Cada minuto: si la hora del panel coincide con ahora y la copia está activa, se hace (una vez al día)
  setInterval(async () => {
    try {
      const a = await leerAjustesSistema();
      if (!a.respaldoActivo) return;
      const { dia, hm } = horaLaPaz();
      if (hm === a.respaldoHora && ultimoDiaRespaldo !== dia) {
        ultimoDiaRespaldo = dia;
        await ejecutarTarea('respaldo_diario');
        await ejecutarTarea('limpieza_muestras');
      }
    } catch (err) {
      console.error('[tareas] ciclo de copias:', (err as Error).message);
    }
  }, 60_000);
  console.log('[tareas] en marcha: oyentes cada 5 min; copia diaria según el panel');
}

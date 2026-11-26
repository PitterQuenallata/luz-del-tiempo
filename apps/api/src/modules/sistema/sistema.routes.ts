// Sistema: copias de seguridad y tareas de fondo. Solo superadmin.
import { readFile, unlink } from 'node:fs/promises';
import { Hono } from 'hono';
import { requirePermission } from '../../lib/authz.js';
import { crearRespaldo, leerAjustesSistema, listarRespaldos, rutaRespaldo } from '../../tareas/respaldo.js';
import { db } from '../../db/index.js';
import { sistemaAjustes } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ejecutarTarea, estadoTareas } from '../../tareas/programador.js';
import { radioApi } from '../radio/radio-sync.js';

export const sistemaRoutes = new Hono();
sistemaRoutes.use('*', requirePermission('sistema:respaldos'));

sistemaRoutes.get('/tareas', async (c) => c.json({ tareas: await estadoTareas() }));

sistemaRoutes.get('/ajustes', async (c) => c.json({ ajustes: await leerAjustesSistema() }));

sistemaRoutes.put('/ajustes', async (c) => {
  const cuerpo = (await c.req.json().catch(() => ({}))) as Partial<{ respaldoActivo: boolean; respaldoHora: string; respaldoDiasRetencion: number; muestrasDiasRetencion: number }>;
  const errores: string[] = [];
  if (cuerpo.respaldoHora !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(cuerpo.respaldoHora)) errores.push('La hora debe ser HH:MM (ej. 03:00).');
  if (cuerpo.respaldoDiasRetencion !== undefined && !(Number.isInteger(cuerpo.respaldoDiasRetencion) && cuerpo.respaldoDiasRetencion >= 1 && cuerpo.respaldoDiasRetencion <= 365)) errores.push('Las copias se guardan entre 1 y 365 días.');
  if (cuerpo.muestrasDiasRetencion !== undefined && !(Number.isInteger(cuerpo.muestrasDiasRetencion) && cuerpo.muestrasDiasRetencion >= 7 && cuerpo.muestrasDiasRetencion <= 3650)) errores.push('Las muestras de oyentes se guardan entre 7 y 3650 días.');
  if (cuerpo.respaldoActivo !== undefined && typeof cuerpo.respaldoActivo !== 'boolean') errores.push('Activa o desactiva la copia diaria.');
  if (errores.length) return c.json({ error: 'validacion', message: errores.join(' ') }, 422);
  await leerAjustesSistema();
  await db.update(sistemaAjustes).set(cuerpo).where(eq(sistemaAjustes.id, 1));
  return c.json({ ajustes: await leerAjustesSistema() });
});

sistemaRoutes.post('/tareas/:clave/ejecutar', async (c) => {
  const clave = c.req.param('clave');
  if (!['muestreo_oyentes', 'respaldo_diario', 'limpieza_muestras'].includes(clave)) return c.json({ error: 'no_existe' }, 404);
  const tarea = await ejecutarTarea(clave as 'muestreo_oyentes' | 'respaldo_diario' | 'limpieza_muestras');
  return c.json({ tarea });
});

sistemaRoutes.get('/respaldos', async (c) => c.json({ respaldos: await listarRespaldos() }));

sistemaRoutes.post('/respaldos', async (c) => {
  try {
    const nombre = await crearRespaldo();
    return c.json({ nombre }, 201);
  } catch (err) {
    return c.json({ error: 'respaldo_fallido', message: (err as Error).message.slice(0, 300) }, 500);
  }
});

sistemaRoutes.get('/respaldos/:nombre', async (c) => {
  const ruta = rutaRespaldo(c.req.param('nombre'));
  if (!ruta) return c.json({ error: 'no_existe' }, 404);
  try {
    const datos = await readFile(ruta);
    return new Response(datos, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${c.req.param('nombre')}"`,
      },
    });
  } catch {
    return c.json({ error: 'no_existe' }, 404);
  }
});

sistemaRoutes.delete('/respaldos/:nombre', async (c) => {
  const ruta = rutaRespaldo(c.req.param('nombre'));
  if (!ruta) return c.json({ error: 'no_existe' }, 404);
  await unlink(ruta).catch(() => undefined);
  return c.body(null, 204);
});

// Registros de la radio (supervisord): últimas líneas de una emisora, o "sistema"
sistemaRoutes.get('/registros/:proceso', async (c) => {
  const proceso = c.req.param('proceso');
  const lineas = Math.min(Math.max(Number(c.req.query('lineas') ?? 200), 1), 1000);
  try {
    const r = await radioApi<{ registros: { archivo: string; lineas: string[] }[] }>(`/v1/registros/${encodeURIComponent(proceso)}?lineas=${lineas}`);
    return c.json(r);
  } catch {
    return c.json({ error: 'radio_no_responde', message: 'La radio no responde: no se pueden leer los registros.' }, 503);
  }
});

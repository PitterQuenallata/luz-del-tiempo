// Sistema: copias de seguridad y tareas de fondo. Solo superadmin.
import { readFile, unlink } from 'node:fs/promises';
import { Hono } from 'hono';
import { requirePermission } from '../../lib/authz.js';
import { crearRespaldo, listarRespaldos, rutaRespaldo } from '../../tareas/respaldo.js';
import { ejecutarTarea, estadoTareas } from '../../tareas/programador.js';
import { radioApi } from '../radio/radio-sync.js';

export const sistemaRoutes = new Hono();
sistemaRoutes.use('*', requirePermission('sistema:respaldos'));

sistemaRoutes.get('/tareas', (c) => c.json({ tareas: estadoTareas() }));

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

// Simulador del núcleo nativo para diseñar la interfaz en un navegador (`pnpm dev`, sin Tauri).
// Solo se carga en desarrollo y fuera de la app; nunca entra en el instalador.
// En la consola del navegador: simular.silencio(), simular.sonido(), simular.saturar(), simular.redLenta(), simular.corte()

type Llamada = (args: Record<string, unknown>) => unknown;

const callbacks = new Map<number, (v: unknown) => void>();
const oyentes = new Map<string, number[]>();
let siguiente = 1;

function emitir(evento: string, payload: unknown) {
  for (const id of oyentes.get(evento) ?? []) callbacks.get(id)?.({ event: evento, id, payload });
}

const ajustes = {
  servidor: '192.168.1.11',
  puerto: 8005,
  puertoOyentes: 8000,
  mount: '/principal',
  bitrate: 128,
  dispositivo: 'entrada:Line In (Behringer UMC204HD)',
  canalIzq: 0,
  canalDer: 1,
  frecuencia: 44100,
  mono: false,
  calidad: 'alta',
  nombreEmision: 'Radio La Luz del Tiempo',
  limitador: true,
  soltarPorSilencio: true,
  minutosSilencio: 3,
  grabar: true,
  miniAlMinimizar: true,
  iniciarConWindows: true,
  retomarTransmision: true,
  cuentaRegresiva: 5,
  contrasenaGuardada: true,
  carpetaGrabaciones: 'C:\\Users\\Operador\\Documents\\Emisor La Luz del Tiempo\\Grabaciones',
};

// Con ?login en la dirección se empieza sin cuenta ni conexión manual (pantalla de inicio de sesión)
if (location.search.includes('login')) ajustes.servidor = '';

const EMISORAS = [
  { id: 'e1', slug: 'principal', nombre: 'Radio La Luz del Tiempo', principal: true, servidor: '192.168.1.11', puerto: 8005, mount: '/principal', puertoOyentes: 8000, mountOyentes: '/principal', programa: { nombre: 'Culto dominical', conductor: 'Pastor Juan' } },
  { id: 'e2', slug: 'juvenil', nombre: 'Juvenil', principal: false, servidor: '192.168.1.11', puerto: 8005, mount: '/juvenil', puertoOyentes: 8000, mountOyentes: '/juvenil', programa: null },
];
const cuenta = {
  sesion: false,
  apiUrl: 'https://api.laluzdeltiempo.org',
  panelPredeterminado: 'https://api.laluzdeltiempo.org',
  nombre: '',
  email: '',
  emisoras: [] as typeof EMISORAS,
  emisoraId: null as string | null,
  actualizada: null as string | null,
  sinConexion: false,
};

const titulos = { programa: null as string | null, conductor: null as string | null };

const resumen = { estado: '', mensaje: '', desde: null as number | null, silencio: false, oyentes: 7 as number | null, grabacion: null as string | null };
const sim = { nivel: 0.35, silencioDesde: null as number | null, recortes: 0, redLentaHasta: 0, kbps: 0 };
let reloj: ReturnType<typeof setInterval> | undefined;
let prueba: ReturnType<typeof setInterval> | undefined;

function estado(e: string, mensaje: string) {
  resumen.estado = e;
  resumen.mensaje = mensaje;
  if (e === 'al_aire' && !resumen.desde) resumen.desde = Date.now();
  if (e === 'detenido' || e === 'error') resumen.desde = null;
  emitir('estado', { estado: e, mensaje });
}

function lectura(base: number) {
  const t = Date.now() / 1000;
  const v = base * (0.55 + 0.45 * Math.abs(Math.sin(t * 2.3) * Math.cos(t * 0.7)));
  return { izq: v, der: v * (0.85 + 0.1 * Math.sin(t * 5)) };
}

const comandos: Record<string, Llamada> = {
  ajustes_cargar: () => ({ ...ajustes }),
  ajustes_guardar: ({ datos }) => void Object.assign(ajustes, datos as object),
  dispositivos: () => [
    { id: 'entrada:Line In (Behringer UMC204HD)', nombre: 'Line In (Behringer UMC204HD)', tipo: 'entrada', canales: 4, predeterminado: false },
    { id: 'entrada:Micrófono (USBFC1-A)', nombre: 'Micrófono (USBFC1-A)', tipo: 'entrada', canales: 2, predeterminado: true },
    { id: 'salida:Altavoces (Realtek Audio)', nombre: 'Altavoces (Realtek Audio)', tipo: 'salida', canales: 2, predeterminado: true },
  ],
  prueba_iniciar: () => {
    clearInterval(prueba);
    prueba = setInterval(() => emitir('nivel_prueba', { ...lectura(0.3), reduccion: 0, recortes: 0, silencioSeg: 0, kbps: 0, redLenta: false }), 80);
  },
  prueba_detener: () => clearInterval(prueba),
  emision_iniciar: () => {
    sim.recortes = 0;
    sim.silencioDesde = null;
    resumen.grabacion = ajustes.grabar ? `${ajustes.carpetaGrabaciones}\\2026-11-24 19.30.05.mp3` : null;
    emitir('grabacion', resumen.grabacion);
    estado('conectando', `Conectando con ${ajustes.servidor}…`);
    setTimeout(() => estado('al_aire', 'Estás al aire'), 900);
    clearInterval(reloj);
    reloj = setInterval(() => {
      const callado = resumen.silencio || sim.silencioDesde !== null;
      const l = callado ? { izq: 0, der: 0 } : lectura(sim.nivel);
      const silencioSeg = sim.silencioDesde ? Math.floor((Date.now() - sim.silencioDesde) / 1000) : resumen.silencio ? 0 : 0;
      const enAire = resumen.estado === 'al_aire';
      emitir('medidores', {
        ...l,
        reduccion: sim.nivel > 0.9 && !callado ? 2.4 : 0,
        recortes: sim.recortes,
        silencioSeg,
        kbps: enAire ? (Date.now() < sim.redLentaHasta ? 96 : ajustes.bitrate) : 0,
        redLenta: Date.now() < sim.redLentaHasta,
      });
    }, 100);
  },
  emision_detener: () => {
    clearInterval(reloj);
    estado('detenido', 'Fuera del aire');
    emitir('medidores', { izq: 0, der: 0, reduccion: 0, recortes: 0, silencioSeg: 0, kbps: 0, redLenta: false });
  },
  silencio: ({ activo }) => {
    resumen.silencio = Boolean(activo);
    emitir('silencio', resumen.silencio);
  },
  estado_actual: () => ({ ...resumen, programa: null, conductor: null, tituloPrograma: titulos.programa, tituloConductor: titulos.conductor, titulo: null }),
  probar_servidor: () => ({ alcanzable: true, mountEnLinea: resumen.estado === 'al_aire', oyentes: resumen.oyentes }),
  historial_leer: () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    return [
      { fecha: `${hoy}T19:48:12`, tipo: 'fin', mensaje: 'Fuera del aire. Duración 01:17:40' },
      { fecha: `${hoy}T19:12:03`, tipo: 'saturacion', mensaje: 'La entrada saturó (llegó a 0 dB). Baja el nivel en la consola.' },
      { fecha: `${hoy}T18:55:41`, tipo: 'reconectado', mensaje: 'Se recuperó la conexión con la radio' },
      { fecha: `${hoy}T18:55:29`, tipo: 'corte', mensaje: 'Se perdió la conexión con la radio. Reintentando…' },
      { fecha: `${hoy}T18:30:33`, tipo: 'al_aire', mensaje: 'Al aire' },
      { fecha: `${hoy}T18:30:32`, tipo: 'grabacion', mensaje: `Grabando en ${ajustes.carpetaGrabaciones}\\${hoy} 18.30.32.mp3 (128 kbps)` },
      { fecha: `${hoy}T18:30:31`, tipo: 'inicio', mensaje: 'Salida al aire hacia 192.168.1.11/principal a 128 kbps desde Line In (Behringer UMC204HD)' },
      { fecha: `${ayer}T21:03:10`, tipo: 'fin', mensaje: 'Se soltó el aire al AutoDJ tras 3 min de silencio. Duración 02:01:05' },
      { fecha: `${ayer}T20:59:55`, tipo: 'silencio', mensaje: 'No llega sonido de la fuente' },
    ];
  },
  historial_borrar: () => undefined,
  cuenta_estado: () => ({ ...cuenta }),
  cuenta_iniciar: ({ apiUrl, email, contrasena }) => {
    if (contrasena !== 'sopademani1') throw 'Correo o contraseña incorrectos.';
    Object.assign(cuenta, {
      sesion: true,
      apiUrl,
      nombre: 'María Quispe',
      email,
      emisoras: EMISORAS,
      emisoraId: 'e1',
      actualizada: new Date().toISOString(),
    });
    return { ...cuenta };
  },
  cuenta_cerrar: () => void Object.assign(cuenta, { sesion: false, nombre: '', email: '', emisoras: [], emisoraId: null }),
  emisoras_actualizar: () => ({ ...cuenta, actualizada: new Date().toISOString() }),
  emisora_elegir: ({ id }) => {
    cuenta.emisoraId = id as string;
    return { ...cuenta };
  },
  abrir_grabaciones: () => undefined,
  ventana_mini: () => undefined,
  'plugin:event|listen': ({ event, handler }) => {
    const lista = oyentes.get(event as string) ?? [];
    lista.push(handler as number);
    oyentes.set(event as string, lista);
    return handler;
  },
  'plugin:event|unlisten': () => undefined,
  'plugin:app|version': () => '0.2.0',
  titulo_definir: ({ programa, conductor }) => {
    titulos.programa = String(programa).trim() || null;
    titulos.conductor = String(conductor).trim() || null;
    return { ...resumen, tituloPrograma: titulos.programa, tituloConductor: titulos.conductor };
  },
  actualizacion_buscar: () => ({ disponible: true, actual: '0.2.0', version: '0.2.1', notas: 'Mejoras en la reconexión.' }),
  actualizacion_instalar: () => {
    throw 'Simulador: aquí el emisor se actualizaría y reiniciaría.';
  },
};

const w = window as unknown as Record<string, unknown>;
w.__TAURI_INTERNALS__ = {
  invoke: async (cmd: string, args: Record<string, unknown> = {}) => {
    const f = comandos[cmd];
    if (!f) throw new Error(`Simulador: comando desconocido ${cmd}`);
    return f(args);
  },
  transformCallback: (cb: (v: unknown) => void) => {
    const id = siguiente++;
    callbacks.set(id, cb);
    return id;
  },
  unregisterCallback: (id: number) => callbacks.delete(id),
  metadata: { currentWindow: { label: 'main' }, currentWebview: { windowLabel: 'main', label: 'main' } },
};
w.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => undefined };

w.simular = {
  silencio: () => (sim.silencioDesde = Date.now() - 12_000),
  sonido: () => (sim.silencioDesde = null),
  saturar: () => {
    sim.nivel = 1;
    sim.recortes += 1;
    setTimeout(() => (sim.nivel = 0.35), 1500);
  },
  redLenta: () => (sim.redLentaHasta = Date.now() + 8000),
  corte: () => {
    estado('reconectando', 'Se perdió la conexión con la radio. Reintento 1 de 2 en 3 s.');
    setTimeout(() => estado('al_aire', 'Estás al aire'), 4000);
  },
  caida: () => {
    estado('reconectando', 'Se perdió la conexión con la radio. Reintento 1 de 2 en 3 s.');
    setTimeout(() => {
      clearInterval(reloj);
      estado('error', 'Se perdió la conexión con la radio y entró el AutoDJ. Pulsa «Reintentar conexión» cuando vuelva la red.');
    }, 1500);
  },
};

export {};

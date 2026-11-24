import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api, escuchar, MEDIDORES_VACIOS, type AjustesVista, type CuentaVista, type Dispositivo, type Medidores, type Suceso } from './api';
import { AVISO_SILENCIO, ETIQUETA_ESTADO, MedidorEstereo, minutos, reloj, useEmision } from './comun';

type Pestana = 'transmision' | 'historial' | 'configuracion';
type Emision = ReturnType<typeof useEmision>;

const BITRATES = [64, 96, 112, 128, 160, 192, 224, 256, 320];
const MINUTOS_SILENCIO = [1, 2, 3, 5, 10, 15, 30];

/** Ajustes antiguos guardaban solo el nombre del micrófono */
const normalizarId = (id: string | null) => (!id ? '' : id.startsWith('entrada:') || id.startsWith('salida:') ? id : `entrada:${id}`);
const nombreDispositivo = (id: string | null) => (id ? id.replace(/^(entrada|salida):/, '') : 'Micrófono predeterminado');

/** Opciones de canales para un dispositivo: pares estéreo y cada canal suelto */
function opcionesCanales(canales: number): Array<{ valor: string; texto: string }> {
  if (canales <= 1) return [{ valor: '0-0', texto: 'Mono (canal 1)' }];
  const op: Array<{ valor: string; texto: string }> = [];
  for (let i = 0; i + 1 < canales; i += 2) op.push({ valor: `${i}-${i + 1}`, texto: `${i + 1} y ${i + 2}, estéreo` });
  for (let i = 0; i < canales; i++) op.push({ valor: `${i}-${i}`, texto: `Solo canal ${i + 1}` });
  return op;
}

export default function App() {
  const [pestana, setPestana] = useState<Pestana>('transmision');
  const [ajustes, setAjustes] = useState<AjustesVista | null>(null);
  const [cuenta, setCuenta] = useState<CuentaVista | null>(null);
  // Sin cuenta, el operador puede elegir configurar la conexión a mano
  const [manual, setManual] = useState(false);
  const emision = useEmision();

  const recargar = async () => {
    const a = await api.cargarAjustes();
    setAjustes(a);
    return a;
  };

  useEffect(() => {
    recargar();
    api.cuenta().then(setCuenta).catch(() => {});
    // El núcleo avisa cuando actualizó la lista de emisoras en segundo plano
    let quitar: (() => void) | undefined;
    escuchar.cuenta(() => api.cuenta().then(setCuenta).catch(() => {})).then((u) => (quitar = u)).catch(() => {});
    return () => quitar?.();
  }, []);

  if (!ajustes || !cuenta) return <div className="app vacia"><p className="tenue">Cargando…</p></div>;

  if (!cuenta.sesion && !ajustes.servidor && !manual) {
    return (
      <div className="app">
        <main className="contenido inicio-sesion">
          <p className="marca-nombre">Emisor · La Luz del Tiempo</p>
          <p className="tenue inicio-sesion-texto">Inicia sesión con tu usuario del panel. El emisor recibe solo las emisoras en las que puedes transmitir.</p>
          <InicioSesion apiUrlInicial={cuenta.apiUrl} onListo={setCuenta} />
          <button
            className="boton-texto"
            onClick={() => {
              setManual(true);
              setPestana('configuracion');
            }}
          >
            Configurar la conexión a mano, sin cuenta
          </button>
        </main>
      </div>
    );
  }

  const elegida = cuenta.sesion ? cuenta.emisoras.find((e) => e.id === cuenta.emisoraId) ?? null : null;

  const pestanas: Array<[Pestana, string]> = [
    ['transmision', 'Transmisión'],
    ['historial', 'Historial'],
    ['configuracion', 'Configuración'],
  ];

  return (
    <div className="app">
      <header className="barra-superior">
        <div className="marca">
          <p className="marca-nombre">{cuenta.sesion ? elegida?.nombre ?? 'Sin emisora elegida' : ajustes.nombreEmision || 'Emisor'}</p>
          <p className="marca-detalle">
            {cuenta.sesion ? `${cuenta.nombre || cuenta.email} · ${elegida ? `${elegida.servidor}${elegida.mount}` : 'sin emisora'}` : ajustes.servidor ? `${ajustes.servidor}${ajustes.mount}` : 'Sin configurar'}
          </p>
        </div>
        <nav className="pestanas" aria-label="Secciones">
          {pestanas.map(([id, texto]) => (
            <button key={id} className="pestana" aria-current={pestana === id ? 'page' : undefined} onClick={() => setPestana(id)}>
              {texto}
            </button>
          ))}
        </nav>
      </header>

      <main className="contenido">
        {pestana === 'transmision' && <Transmision ajustes={ajustes} emision={emision} cuenta={cuenta} onCuenta={setCuenta} />}
        {pestana === 'historial' && <Historial />}
        {pestana === 'configuracion' && (
          <Configuracion
            inicial={ajustes}
            cuenta={cuenta}
            onCuenta={setCuenta}
            alAire={emision.activo}
            onGuardado={async () => {
              await recargar();
              setPestana('transmision');
            }}
          />
        )}
      </main>
    </div>
  );
}

// ---------------- Transmisión ----------------

function Transmision({
  ajustes,
  emision,
  cuenta,
  onCuenta,
}: {
  ajustes: AjustesVista;
  emision: Emision;
  cuenta: CuentaVista;
  onCuenta: (c: CuentaVista) => void;
}) {
  const { estado, medidores: m, activo } = emision;
  const [ocupado, setOcupado] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programaVivo, setProgramaVivo] = useState<string | null | undefined>(undefined);
  const saturando = useSaturacion(m.recortes);
  const elegida = cuenta.sesion ? cuenta.emisoras.find((e) => e.id === cuenta.emisoraId) ?? null : null;
  const programa = programaVivo !== undefined && activo ? programaVivo : elegida?.programa?.nombre ?? null;

  useEffect(() => {
    api.probarServidor().then((s) => emision.setOyentes(s.oyentes)).catch(() => {});
    let quitar: (() => void) | undefined;
    escuchar.programa(setProgramaVivo).then((u) => (quitar = u)).catch(() => {});
    return () => quitar?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuenta.emisoraId]);

  const elegir = async (id: string) => {
    setError(null);
    try {
      onCuenta(await api.elegirEmisora(id));
    } catch (e) {
      setError(String(e));
    }
  };

  const iniciar = async () => {
    setPreparando(false);
    setError(null);
    setOcupado(true);
    try {
      await api.iniciar();
      emision.setEstado({ estado: 'conectando', mensaje: 'Conectando con la radio…' });
    } catch (e) {
      setError(String(e));
    } finally {
      setOcupado(false);
    }
  };

  const detener = async () => {
    setOcupado(true);
    try {
      await api.detener();
    } catch (e) {
      setError(String(e));
    } finally {
      setOcupado(false);
    }
  };

  const alternarSilencio = async () => {
    const nuevo = !emision.silencio;
    try {
      await api.silencio(nuevo);
      emision.setSilencio(nuevo);
    } catch (e) {
      setError(String(e));
    }
  };

  const tono = estado.estado === 'al_aire' ? 'vivo' : estado.estado === 'error' ? 'error' : activo ? 'aviso' : 'neutro';
  const esSalida = ajustes.dispositivo?.startsWith('salida:');

  const red = !activo
    ? '—'
    : estado.estado === 'reconectando'
      ? 'Sin conexión'
      : estado.estado === 'conectando'
        ? 'Conectando'
        : m.redLenta
          ? 'Lenta'
          : 'Estable';
  const grabacion = emision.grabacion ? 'Grabando' : !ajustes.grabar ? 'Desactivada' : activo ? 'No se pudo grabar' : 'Activada';
  const limitador = !ajustes.limitador ? 'Desactivado' : m.reduccion >= 0.1 ? `Reduce ${m.reduccion.toFixed(1)} dB` : activo ? 'Sin actuar' : 'Activado';
  const restante = ajustes.minutosSilencio * 60 - m.silencioSeg;

  return (
    <div className="transmision">
      {cuenta.sesion && (
        <section className="emisora">
          {cuenta.emisoras.length > 0 ? (
            <label className="campo">
              <span>Emisora</span>
              <select value={cuenta.emisoraId ?? ''} onChange={(e) => elegir(e.target.value)} disabled={activo || preparando}>
                {cuenta.emisoras.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </label>
          ) : (
            <Aviso tipo="aviso" titulo="No tienes emisoras asignadas">
              Pide al administrador que te agregue como locutor de una emisora en el panel (Configuración de radio, Locutores) y pulsa «Actualizar emisoras» en Configuración.
            </Aviso>
          )}
          {programa && (
            <p className="programa">
              <span className="tenue">Programa ahora</span> {programa}
            </p>
          )}
          {cuenta.sinConexion && <p className="nota">Sin conexión con el panel: se usa la última lista guardada. Puedes salir al aire igual.</p>}
        </section>
      )}
      <section className="estado" aria-live="polite">
        <div className="estado-cabeza">
          <span className={`chip chip-${tono}`}>{emision.silencio && activo ? 'Silenciado' : ETIQUETA_ESTADO[estado.estado]}</span>
          <span className="estado-mensaje">{estado.mensaje}</span>
        </div>
        <p className="tiempo numero">{activo ? reloj(emision.segundosAlAire) : '00:00:00'}</p>
      </section>

      {preparando && !activo ? (
        <Preparacion ajustes={ajustes} emisora={cuenta.sesion ? elegida?.nombre ?? null : undefined} onListo={iniciar} onCancelar={() => setPreparando(false)} />
      ) : (
      <div className="acciones">
        {activo ? (
          <>
            <button className="boton grande detener" onClick={detener} disabled={ocupado}>Terminar transmisión</button>
            <button className={`boton grande${emision.silencio ? ' marcado' : ''}`} onClick={alternarSilencio}>
              {emision.silencio ? 'Activar sonido' : 'Silenciar'}
            </button>
          </>
        ) : (
          <button
            className="boton grande principal"
            onClick={() => {
              setError(null);
              setPreparando(true);
            }}
            disabled={ocupado || (cuenta.sesion ? !elegida : !ajustes.servidor)}
          >
            {ocupado ? 'Conectando…' : 'Salir al aire'}
          </button>
        )}
      </div>
      )}

      {error && <Aviso tipo="error">{error}</Aviso>}
      {emision.sinSonido && (
        <Aviso tipo="aviso" titulo={`Sin sonido desde hace ${minutos(m.silencioSeg)}`}>
          Los oyentes escuchan silencio. {esSalida ? 'Reproduce algo en esa salida' : 'Revisa la consola y el cable de entrada'}, o elige otra fuente.
          {ajustes.soltarPorSilencio && restante > 0 && ` Si sigue así, en ${minutos(restante)} se suelta el aire al AutoDJ.`}
        </Aviso>
      )}
      {saturando && (
        <Aviso tipo="aviso" titulo="La entrada está saturando">
          Baja el nivel de salida en la consola.{ajustes.limitador ? ' El limitador evita la distorsión, pero el sonido pierde dinámica.' : ''}
        </Aviso>
      )}
      {m.redLenta && (
        <Aviso tipo="aviso" titulo="La conexión no alcanza">
          Se está perdiendo audio a {ajustes.bitrate} kbps. Baja el bitrate en Configuración o revisa la red.
        </Aviso>
      )}

      <section className="bloque">
        <h2>Señal</h2>
        <MedidorEstereo izq={m.izq} der={m.der} />
        <dl className="datos datos-linea">
          <Dato nombre="Limitador" valor={limitador} />
          <Dato nombre="Saturaciones" valor={activo ? String(m.recortes) : '—'} alerta={m.recortes > 0} />
        </dl>
      </section>

      <section className="bloque">
        <h2>Conexión</h2>
        <dl className="datos">
          <Dato nombre="Oyentes" valor={emision.oyentes == null ? '—' : String(emision.oyentes)} grande />
          <Dato nombre="Envío" valor={activo && m.kbps > 0 ? `${m.kbps} kbps` : '—'} grande />
          <Dato nombre="Red" valor={red} alerta={red === 'Lenta' || red === 'Sin conexión'} />
          <Dato nombre="Grabación" valor={grabacion} titulo={emision.grabacion ?? undefined} alerta={grabacion === 'No se pudo grabar'} />
        </dl>
      </section>

      <footer className="pie">
        <p className="pie-fuente">
          <span className="tenue">{esSalida ? 'Sonido de la PC' : 'Entrada'}</span> {nombreDispositivo(ajustes.dispositivo)}
          <br />
          <span className="tenue">{ajustes.bitrate} kbps · {ajustes.frecuencia / 1000} kHz · {ajustes.mono ? 'Mono' : 'Estéreo'}</span>
        </p>
        {activo && (
          <button className="boton pequeno" onClick={() => api.ventanaMini(true).catch(() => {})}>Ventana mini</button>
        )}
      </footer>
    </div>
  );
}

type Revision = 'pendiente' | 'bien' | 'mal';

/**
 * Antes de salir al aire: comprueba la radio, la contraseña y que la fuente tenga sonido,
 * y después cuenta hacia atrás. Recién en el cero se conecta (y reemplaza al AutoDJ).
 */
function Preparacion({
  ajustes,
  emisora,
  onListo,
  onCancelar,
}: {
  ajustes: AjustesVista;
  /** Con sesión del panel: nombre de la emisora elegida (null = ninguna); sin sesión: undefined */
  emisora?: string | null;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [radio, setRadio] = useState<Revision>('pendiente');
  const [sonido, setSonido] = useState<Revision>('pendiente');
  const [nivel, setNivel] = useState<Medidores>(MEDIDORES_VACIOS);
  const [sinSonidoAceptado, setSinSonidoAceptado] = useState(false);
  const [restante, setRestante] = useState<number | null>(null);
  const [intento, setIntento] = useState(0);
  const listo = useRef(false);
  const conCuenta = emisora !== undefined;
  const clave: Revision = (conCuenta ? Boolean(emisora) : ajustes.contrasenaGuardada) ? 'bien' : 'mal';

  // Escuchar la fuente y preguntar a la radio, a la vez
  useEffect(() => {
    setRadio('pendiente');
    setSonido('pendiente');
    setSinSonidoAceptado(false);
    let quitar: (() => void) | undefined;
    let hubo = false;
    escuchar
      .nivelPrueba((n) => {
        setNivel(n);
        if (!hubo && Math.max(n.izq, n.der) > 0.0018) {
          hubo = true;
          setSonido('bien');
        }
      })
      .then((u) => (quitar = u))
      .catch(() => {});
    api.pruebaIniciar(ajustes.dispositivo, ajustes.canalIzq, ajustes.canalDer).catch(() => setSonido('mal'));
    const plazo = setTimeout(() => !hubo && setSonido('mal'), 3000);
    api
      .probarServidor()
      .then((s) => setRadio(s.alcanzable ? 'bien' : 'mal'))
      .catch(() => setRadio('mal'));
    return () => {
      clearTimeout(plazo);
      quitar?.();
      api.pruebaDetener().catch(() => {});
    };
  }, [ajustes, intento]);

  const todoBien = radio === 'bien' && clave === 'bien' && (sonido === 'bien' || sinSonidoAceptado);

  // Cuenta regresiva cuando todo está en orden
  useEffect(() => {
    if (!todoBien) {
      setRestante(null);
      return;
    }
    let n = ajustes.cuentaRegresiva;
    setRestante(n);
    if (n <= 0) {
      salir();
      return;
    }
    const t = setInterval(() => {
      n -= 1;
      setRestante(n);
      if (n <= 0) {
        clearInterval(t);
        salir();
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todoBien]);

  function salir() {
    if (listo.current) return;
    listo.current = true;
    onListo();
  }

  const texto = (r: Revision, bien: string, mal: string) => (r === 'pendiente' ? 'Comprobando…' : r === 'bien' ? bien : mal);
  const esSalida = ajustes.dispositivo?.startsWith('salida:');

  return (
    <div className="preparacion">
      <ul className="revision" aria-live="polite">
        <li>
          <span className="nombre">Radio</span>
          <span className={`resultado ${radio}`}>{texto(radio, 'Responde', 'No responde')}</span>
        </li>
        <li>
          <span className="nombre">{conCuenta ? 'Emisora' : 'Contraseña del locutor'}</span>
          <span className={`resultado ${clave}`}>{conCuenta ? emisora ?? 'Sin elegir' : clave === 'bien' ? 'Guardada' : 'Falta'}</span>
        </li>
        <li>
          <span className="nombre">Sonido de la fuente</span>
          <span className={`resultado ${sonido}`}>{sonido === 'pendiente' ? 'Escuchando…' : sonido === 'bien' ? 'Llega sonido' : 'Sin sonido'}</span>
        </li>
      </ul>
      <MedidorEstereo izq={nivel.izq} der={nivel.der} escala={false} />

      {radio === 'mal' && (
        <Aviso tipo="error" titulo="La radio no responde">
          Revisa que el servidor esté encendido y que la dirección en Configuración sea correcta.
        </Aviso>
      )}
      {clave === 'mal' && <Aviso tipo="error">{conCuenta ? 'Elige una emisora antes de salir al aire.' : 'Falta la contraseña del locutor. Guárdala en Configuración.'}</Aviso>}
      {sonido === 'mal' && !sinSonidoAceptado && radio !== 'mal' && (
        <Aviso tipo="aviso" titulo="No llega sonido de la fuente">
          {esSalida ? 'Reproduce algo en esa salida.' : 'Sube el nivel en la consola o revisa el cable.'} Si sales así, los oyentes escucharán silencio.
        </Aviso>
      )}

      {restante !== null && restante > 0 && (
        <div className="cuenta" aria-live="assertive">
          <span className="cuenta-numero numero">{restante}</span>
          <span className="cuenta-texto">Al aire en {restante} {restante === 1 ? 'segundo' : 'segundos'}</span>
        </div>
      )}

      <div className="acciones">
        <button className="boton grande" onClick={onCancelar}>Cancelar</button>
        {radio === 'mal' ? (
          <button className="boton grande" onClick={() => setIntento((i) => i + 1)}>Volver a comprobar</button>
        ) : sonido === 'mal' && !sinSonidoAceptado && clave === 'bien' ? (
          <button className="boton grande" onClick={() => setSinSonidoAceptado(true)}>Salir sin sonido</button>
        ) : (
          <button className="boton grande principal" onClick={salir} disabled={!todoBien}>Salir ya</button>
        )}
      </div>
    </div>
  );
}

/** true durante 3 s después de cada saturación nueva */
function useSaturacion(recortes: number) {
  const anterior = useRef(recortes);
  const [activa, setActiva] = useState(false);
  useEffect(() => {
    if (recortes > anterior.current) {
      setActiva(true);
      const t = setTimeout(() => setActiva(false), 3000);
      anterior.current = recortes;
      return () => clearTimeout(t);
    }
    anterior.current = recortes;
  }, [recortes]);
  return activa;
}

function Dato({ nombre, valor, grande, alerta, titulo }: { nombre: string; valor: string; grande?: boolean; alerta?: boolean; titulo?: string }) {
  return (
    <div className="dato" title={titulo}>
      <dt>{nombre}</dt>
      <dd className={`numero${grande ? ' grande' : ''}${alerta ? ' alerta' : ''}`}>{valor}</dd>
    </div>
  );
}

function Aviso({ tipo, titulo, children }: { tipo: 'aviso' | 'error' | 'info'; titulo?: string; children: ReactNode }) {
  return (
    <div className={`aviso aviso-${tipo}`} role={tipo === 'info' ? 'status' : 'alert'}>
      {titulo && <p className="aviso-titulo">{titulo}</p>}
      <p>{children}</p>
    </div>
  );
}

// ---------------- Historial ----------------

const TIPOS: Record<string, { texto: string; tono: 'ok' | 'aviso' | 'error' | 'neutro' }> = {
  inicio: { texto: 'Inicio', tono: 'neutro' },
  al_aire: { texto: 'Al aire', tono: 'ok' },
  corte: { texto: 'Corte', tono: 'error' },
  reconectado: { texto: 'Reconectado', tono: 'ok' },
  silencio: { texto: 'Silencio', tono: 'aviso' },
  sonido: { texto: 'Sonido', tono: 'ok' },
  saturacion: { texto: 'Saturación', tono: 'aviso' },
  red: { texto: 'Red lenta', tono: 'aviso' },
  grabacion: { texto: 'Grabación', tono: 'neutro' },
  error: { texto: 'Error', tono: 'error' },
  fin: { texto: 'Fin', tono: 'neutro' },
};

function nombreDia(fecha: string) {
  const dia = fecha.slice(0, 10);
  const hoy = new Date();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (dia === iso(hoy)) return 'Hoy';
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (dia === iso(ayer)) return 'Ayer';
  return new Date(`${dia}T12:00:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
}

function Historial() {
  const [sucesos, setSucesos] = useState<Suceso[] | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    const cargar = () => api.historial().then(setSucesos).catch(() => setSucesos([]));
    cargar();
    let quitar: (() => void) | undefined;
    escuchar.historial(cargar).then((u) => (quitar = u)).catch(() => {});
    return () => quitar?.();
  }, []);

  const borrar = async () => {
    if (!confirmar) {
      setConfirmar(true);
      setTimeout(() => setConfirmar(false), 4000);
      return;
    }
    await api.borrarHistorial().catch(() => {});
    setConfirmar(false);
    setSucesos([]);
  };

  const dias: Array<[string, Suceso[]]> = [];
  for (const s of sucesos ?? []) {
    const d = nombreDia(s.fecha);
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo[0] === d) ultimo[1].push(s);
    else dias.push([d, [s]]);
  }

  return (
    <div className="historial">
      <div className="historial-acciones">
        <button className="boton pequeno" onClick={() => api.abrirGrabaciones().catch(() => {})}>Abrir grabaciones</button>
        <button className={`boton pequeno${confirmar ? ' peligro' : ''}`} onClick={borrar} disabled={!sucesos?.length}>
          {confirmar ? 'Confirmar borrado' : 'Borrar historial'}
        </button>
      </div>

      {sucesos === null && <p className="tenue">Cargando…</p>}
      {sucesos?.length === 0 && (
        <div className="vacio">
          <p>Todavía no hay nada registrado.</p>
          <p className="tenue">Aquí quedan las salidas al aire, los cortes de conexión, los silencios y las saturaciones de cada emisión.</p>
        </div>
      )}

      {dias.map(([dia, lista]) => (
        <section key={dia} className="dia">
          <h2>{dia}</h2>
          <ol className="sucesos">
            {lista.map((s, i) => {
              const tipo = TIPOS[s.tipo] ?? { texto: s.tipo, tono: 'neutro' as const };
              return (
                <li key={`${s.fecha}-${i}`} className="suceso">
                  <time className="numero tenue">{s.fecha.slice(11, 16)}</time>
                  <span className={`suceso-tipo tono-${tipo.tono}`}>{tipo.texto}</span>
                  <span className="suceso-texto">{s.mensaje}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

// ---------------- Configuración ----------------

function Opcion({ marcada, onCambio, titulo, detalle, children }: { marcada: boolean; onCambio: (v: boolean) => void; titulo: string; detalle: string; children?: ReactNode }) {
  return (
    <div className="opcion">
      <label className="opcion-fila">
        <input type="checkbox" checked={marcada} onChange={(e) => onCambio(e.target.checked)} />
        <span>
          <span className="opcion-titulo">{titulo}</span>
          <span className="opcion-detalle">{detalle}</span>
        </span>
      </label>
      {children && <div className="opcion-extra">{children}</div>}
    </div>
  );
}

function Configuracion({
  inicial,
  cuenta,
  onCuenta,
  alAire,
  onGuardado,
}: {
  inicial: AjustesVista;
  cuenta: CuentaVista;
  onCuenta: (c: CuentaVista) => void;
  alAire: boolean;
  onGuardado: () => void;
}) {
  const [servidor, setServidor] = useState(inicial.servidor);
  const [puerto, setPuerto] = useState(String(inicial.puerto));
  const [puertoOyentes, setPuertoOyentes] = useState(String(inicial.puertoOyentes));
  const [mount, setMount] = useState(inicial.mount || '/');
  const [bitrate, setBitrate] = useState(inicial.bitrate);
  const [frecuencia, setFrecuencia] = useState(inicial.frecuencia);
  const [mono, setMono] = useState(inicial.mono);
  const [calidad, setCalidad] = useState(inicial.calidad);
  const [dispositivo, setDispositivo] = useState(normalizarId(inicial.dispositivo));
  const [canalesSel, setCanalesSel] = useState(`${inicial.canalIzq}-${inicial.canalDer}`);
  const [nombre, setNombre] = useState(inicial.nombreEmision);
  const [limitador, setLimitador] = useState(inicial.limitador);
  const [soltar, setSoltar] = useState(inicial.soltarPorSilencio);
  const [minutosSilencio, setMinutosSilencio] = useState(inicial.minutosSilencio);
  const [grabar, setGrabar] = useState(inicial.grabar);
  const [miniAlMinimizar, setMiniAlMinimizar] = useState(inicial.miniAlMinimizar);
  const [iniciarConWindows, setIniciarConWindows] = useState(inicial.iniciarConWindows);
  const [retomar, setRetomar] = useState(inicial.retomarTransmision);
  const [cuentaRegresiva, setCuentaRegresiva] = useState(inicial.cuentaRegresiva);
  const [contrasena, setContrasena] = useState('');
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [probando, setProbando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [nivel, setNivel] = useState<Medidores>(MEDIDORES_VACIOS);
  const [errorPrueba, setErrorPrueba] = useState<string | null>(null);
  const sinSenal = useSinSenalPrueba(nivel, escuchando);

  const cargarDispositivos = () => api.dispositivos().then(setDispositivos).catch(() => setDispositivos([]));

  useEffect(() => {
    cargarDispositivos();
    let quitar: (() => void) | undefined;
    escuchar.nivelPrueba(setNivel).then((u) => (quitar = u)).catch(() => {});
    return () => {
      quitar?.();
      api.pruebaDetener().catch(() => {});
    };
  }, []);

  const entradas = dispositivos.filter((d) => d.tipo === 'entrada');
  const salidas = dispositivos.filter((d) => d.tipo === 'salida');
  const elegido = dispositivos.find((d) => d.id === dispositivo) ?? (dispositivo ? undefined : entradas.find((d) => d.predeterminado));
  const opciones = opcionesCanales(elegido?.canales ?? 2);
  // Si el par guardado no existe en este dispositivo, se usa el primero
  const canalesValidos = opciones.some((o) => o.valor === canalesSel) ? canalesSel : opciones[0].valor;
  const [canalIzq, canalDer] = canalesValidos.split('-').map(Number);

  // La prueba de nivel sigue al dispositivo y a los canales elegidos
  useEffect(() => {
    if (!escuchando) return;
    setErrorPrueba(null);
    api.pruebaIniciar(dispositivo || null, canalIzq, canalDer).catch((e) => {
      setErrorPrueba(String(e));
      setEscuchando(false);
    });
  }, [escuchando, dispositivo, canalIzq, canalDer]);

  const alternarPrueba = () => {
    if (escuchando) {
      api.pruebaDetener().catch(() => {});
      setNivel(MEDIDORES_VACIOS);
    }
    setEscuchando(!escuchando);
  };

  const datos = (clave: string | null) => ({
    servidor,
    puerto: Number(puerto),
    puertoOyentes: Number(puertoOyentes),
    mount: mount.trim(),
    bitrate,
    frecuencia,
    mono,
    calidad,
    dispositivo: dispositivo || null,
    canalIzq,
    canalDer,
    nombreEmision: nombre,
    limitador,
    soltarPorSilencio: soltar,
    minutosSilencio,
    grabar,
    miniAlMinimizar,
    iniciarConWindows,
    retomarTransmision: retomar,
    cuentaRegresiva,
    contrasena: clave,
  });

  const probar = async () => {
    setProbando(true);
    setMensaje(null);
    try {
      await api.guardarAjustes(datos(null));
      const s = await api.probarServidor();
      if (!s.alcanzable) setMensaje({ tipo: 'error', texto: 'No hay respuesta del servidor. Revisa la dirección y que la radio esté encendida.' });
      else if (s.mountEnLinea) setMensaje({ tipo: 'ok', texto: `Servidor en línea. Ya hay una transmisión en ${mount}.` });
      else setMensaje({ tipo: 'ok', texto: 'Servidor en línea. La radio está fuera del aire: puedes salir al aire cuando quieras.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: String(e) });
    } finally {
      setProbando(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      await api.guardarAjustes(datos(contrasena || null));
      await api.pruebaDetener().catch(() => {});
      onGuardado();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: String(e) });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="configuracion" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
      {alAire && <Aviso tipo="info">Estás al aire. Los cambios se aplican la próxima vez que salgas al aire.</Aviso>}

      <SeccionCuenta cuenta={cuenta} onCuenta={onCuenta} alAire={alAire} />

      <section className="bloque">
        <h2>Fuente de audio</h2>
        <label className="campo">
          <span>Dispositivo</span>
          <select value={dispositivo} onChange={(e) => setDispositivo(e.target.value)}>
            <option value="">Micrófono predeterminado de Windows</option>
            {entradas.length > 0 && (
              <optgroup label="Entradas: consola, interfaz, micrófono">
                {entradas.map((d) => <option key={d.id} value={d.id}>{d.nombre}{d.predeterminado ? ' (predeterminado)' : ''}</option>)}
              </optgroup>
            )}
            {salidas.length > 0 && (
              <optgroup label="Sonido de la PC: lo que suena en una salida">
                {salidas.map((d) => <option key={d.id} value={d.id}>{d.nombre}{d.predeterminado ? ' (predeterminado)' : ''}</option>)}
              </optgroup>
            )}
            {dispositivo && dispositivos.length > 0 && !elegido && (
              <option value={dispositivo}>{nombreDispositivo(dispositivo)} (no conectado)</option>
            )}
          </select>
        </label>
        {elegido?.tipo === 'salida' && (
          <p className="nota">Se transmite todo lo que suena en «{elegido.nombre}». Si también hablas por micrófono, usa audífonos.</p>
        )}
        <div className="fila-campos">
          <label className="campo">
            <span>Canales</span>
            <select value={canalesValidos} onChange={(e) => setCanalesSel(e.target.value)}>
              {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
            </select>
          </label>
          <div className="campo-acciones">
            <button type="button" className={`boton${escuchando ? ' marcado' : ''}`} onClick={alternarPrueba} disabled={alAire}>
              {escuchando ? 'Detener prueba' : 'Probar nivel'}
            </button>
            <button type="button" className="boton" onClick={cargarDispositivos}>Buscar de nuevo</button>
          </div>
        </div>
        {escuchando && <MedidorEstereo izq={nivel.izq} der={nivel.der} />}
        {sinSenal && (
          <Aviso tipo="aviso" titulo="Este dispositivo no entrega sonido">
            {elegido?.tipo === 'salida' ? 'Reproduce algo en esa salida para comprobarlo.' : 'Habla o sube el nivel en la consola; si el medidor no se mueve, revisa el cable o prueba otro dispositivo.'}
          </Aviso>
        )}
        {errorPrueba && <Aviso tipo="error">{errorPrueba}</Aviso>}
      </section>

      <section className="bloque">
        <h2>Calidad</h2>
        <div className="fila-campos">
          <label className="campo">
            <span>Bitrate MP3</span>
            <select value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))}>
              {BITRATES.map((b) => <option key={b} value={b}>{b} kbps</option>)}
            </select>
          </label>
          <label className="campo">
            <span>Frecuencia</span>
            <select value={frecuencia} onChange={(e) => setFrecuencia(Number(e.target.value))}>
              <option value={44100}>44.1 kHz</option>
              <option value={48000}>48 kHz</option>
            </select>
          </label>
          <label className="campo">
            <span>Modo</span>
            <select value={mono ? 'mono' : 'estereo'} onChange={(e) => setMono(e.target.value === 'mono')}>
              <option value="estereo">Estéreo</option>
              <option value="mono">Mono</option>
            </select>
          </label>
          <label className="campo">
            <span>Codificador</span>
            <select value={calidad} onChange={(e) => setCalidad(e.target.value as typeof calidad)}>
              <option value="alta">Alta calidad</option>
              <option value="normal">Normal</option>
              <option value="ligera">Ligera, para PC lenta</option>
            </select>
          </label>
        </div>
        <p className="nota">
          {bitrate >= 256
            ? `A ${bitrate} kbps cada oyente gasta unos ${Math.round((bitrate * 3600) / 8 / 1024)} MB por hora. Con internet lento conviene 128 kbps.`
            : 'Para la mayoría de los oyentes, 128 kbps en estéreo es el equilibrio entre calidad y consumo de datos.'}
        </p>
      </section>

      <section className="bloque">
        <h2>Protección y respaldo</h2>
        <Opcion
          marcada={limitador}
          onCambio={setLimitador}
          titulo="Limitador de seguridad"
          detalle="Evita que un pico distorsione en internet. Con niveles normales no actúa."
        />
        <Opcion
          marcada={soltar}
          onCambio={setSoltar}
          titulo="Soltar el aire al AutoDJ si hay silencio"
          detalle={`Si no llega sonido durante ${minutosSilencio} min, el emisor se desconecta y entra el AutoDJ. A los ${AVISO_SILENCIO} s de silencio siempre avisa.`}
        >
          <label className="campo campo-corto">
            <span>Después de</span>
            <select value={minutosSilencio} onChange={(e) => setMinutosSilencio(Number(e.target.value))} disabled={!soltar}>
              {MINUTOS_SILENCIO.map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </label>
        </Opcion>
        <Opcion
          marcada={grabar}
          onCambio={setGrabar}
          titulo="Grabar cada emisión"
          detalle="Guarda en MP3 lo mismo que sale al aire, un archivo por emisión. Sigue grabando aunque se corte internet."
        >
          <p className="ruta" title={inicial.carpetaGrabaciones}>{inicial.carpetaGrabaciones}</p>
          <button type="button" className="boton pequeno" onClick={() => api.abrirGrabaciones().catch(() => {})}>Abrir carpeta</button>
        </Opcion>
        <Opcion
          marcada={miniAlMinimizar}
          onCambio={setMiniAlMinimizar}
          titulo="Ventana mini al minimizar"
          detalle="Mientras transmites, al minimizar aparece una barra pequeña siempre visible con el estado y el nivel."
        />
      </section>

      <section className="bloque">
        <h2>Inicio y salida al aire</h2>
        <label className="campo campo-corto">
          <span>Cuenta regresiva al salir al aire</span>
          <select value={cuentaRegresiva} onChange={(e) => setCuentaRegresiva(Number(e.target.value))}>
            <option value={0}>Sin cuenta</option>
            <option value={3}>3 segundos</option>
            <option value={5}>5 segundos</option>
            <option value={10}>10 segundos</option>
          </select>
        </label>
        <p className="nota">Antes de la cuenta, el emisor comprueba que la radio responda y que llegue sonido de la fuente.</p>
        <Opcion
          marcada={iniciarConWindows}
          onCambio={setIniciarConWindows}
          titulo="Abrir el emisor al iniciar Windows"
          detalle="Queda listo en la bandeja del sistema, junto al reloj."
        />
        <Opcion
          marcada={retomar}
          onCambio={setRetomar}
          titulo="Retomar la transmisión tras un corte de luz o reinicio"
          detalle="Si la PC se apaga o se reinicia mientras estás al aire, al volver a abrir el emisor sale al aire solo."
        />
      </section>

      {/* Con sesión del panel, la conexión viene de la emisora elegida */}
      {!cuenta.sesion && (
      <section className="bloque">
        <h2>Conexión manual (sin cuenta)</h2>
        <label className="campo">
          <span>Servidor</span>
          <input value={servidor} onChange={(e) => setServidor(e.target.value)} placeholder="192.168.1.11" autoComplete="off" spellCheck={false} />
        </label>
        <div className="fila-campos">
          <label className="campo">
            <span>Puerto de locutores</span>
            <input inputMode="numeric" value={puerto} onChange={(e) => setPuerto(e.target.value)} />
          </label>
          <label className="campo">
            <span>Puerto de oyentes</span>
            <input inputMode="numeric" value={puertoOyentes} onChange={(e) => setPuertoOyentes(e.target.value)} />
          </label>
        </div>
        <label className="campo">
          <span>Punto de transmisión (mount)</span>
          <input value={mount} onChange={(e) => setMount(e.target.value)} placeholder="/principal" autoComplete="off" spellCheck={false} />
        </label>
        <label className="campo">
          <span>Contraseña del locutor</span>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder={inicial.contrasenaGuardada ? 'Guardada. Escribe otra para cambiarla' : 'Mínimo 8 caracteres'}
            autoComplete="new-password"
          />
        </label>
        <label className="campo">
          <span>Nombre de la emisión</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
      </section>
      )}

      <div className="barra-guardar">
        {mensaje && <p className={mensaje.tipo === 'ok' ? 'texto-ok' : 'texto-error'}>{mensaje.texto}</p>}
        <div className="barra-guardar-botones">
          {!cuenta.sesion && (
            <button type="button" className="boton" onClick={probar} disabled={probando || guardando || !servidor}>
              {probando ? 'Probando…' : 'Probar conexión'}
            </button>
          )}
          <button type="submit" className="boton principal" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------- Cuenta del panel ----------------

function InicioSesion({ apiUrlInicial, onListo }: { apiUrlInicial: string; onListo: (c: CuentaVista) => void }) {
  const [apiUrl, setApiUrl] = useState(apiUrlInicial);
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      onListo(await api.iniciarSesion(apiUrl, email, contrasena));
    } catch (err) {
      setError(String(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario-sesion" onSubmit={enviar}>
      <label className="campo">
        <span>Dirección del panel</span>
        <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="http://192.168.1.11:4000" autoComplete="off" spellCheck={false} />
      </label>
      <label className="campo">
        <span>Correo</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" spellCheck={false} />
      </label>
      <label className="campo">
        <span>Contraseña</span>
        <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} autoComplete="current-password" />
      </label>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <button type="submit" className="boton grande principal" disabled={enviando || !apiUrl.trim() || !email.trim() || !contrasena}>
        {enviando ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}

function SeccionCuenta({ cuenta, onCuenta, alAire }: { cuenta: CuentaVista; onCuenta: (c: CuentaVista) => void; alAire: boolean }) {
  const [ocupado, setOcupado] = useState<'actualizar' | 'cerrar' | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const actualizar = async () => {
    setOcupado('actualizar');
    setMensaje(null);
    try {
      const c = await api.actualizarEmisoras();
      onCuenta(c);
      setMensaje(
        c.sinConexion
          ? { tipo: 'error', texto: 'No hay conexión con el panel. Se mantiene la lista guardada.' }
          : { tipo: 'ok', texto: `Lista actualizada: ${c.emisoras.length} emisora${c.emisoras.length === 1 ? '' : 's'}.` },
      );
    } catch (e) {
      setMensaje({ tipo: 'error', texto: String(e) });
      api.cuenta().then(onCuenta).catch(() => {});
    } finally {
      setOcupado(null);
    }
  };

  const cerrar = async () => {
    setOcupado('cerrar');
    setMensaje(null);
    try {
      await api.cerrarSesion();
      onCuenta(await api.cuenta());
    } catch (e) {
      setMensaje({ tipo: 'error', texto: String(e) });
    } finally {
      setOcupado(null);
    }
  };

  return (
    <section className="bloque">
      <h2>Cuenta del panel</h2>
      {cuenta.sesion ? (
        <>
          <dl className="datos datos-linea">
            <div className="dato">
              <dt>Usuario</dt>
              <dd>{cuenta.nombre || cuenta.email}</dd>
            </div>
            <div className="dato">
              <dt>Panel</dt>
              <dd title={cuenta.apiUrl}>{cuenta.apiUrl.replace(/^https?:\/\//, '')}</dd>
            </div>
          </dl>
          <p className="nota">
            {cuenta.emisoras.length} emisora{cuenta.emisoras.length === 1 ? '' : 's'} disponible{cuenta.emisoras.length === 1 ? '' : 's'}
            {cuenta.actualizada ? `, actualizada${cuenta.emisoras.length === 1 ? '' : 's'} el ${new Date(cuenta.actualizada).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}` : ''}.
          </p>
          <div className="campo-acciones">
            <button type="button" className="boton" onClick={actualizar} disabled={ocupado !== null}>
              {ocupado === 'actualizar' ? 'Actualizando…' : 'Actualizar emisoras'}
            </button>
            <button type="button" className="boton" onClick={cerrar} disabled={ocupado !== null || alAire}>
              {ocupado === 'cerrar' ? 'Cerrando…' : 'Cerrar sesión'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="nota">Con tu usuario del panel, el emisor recibe las emisoras en las que puedes transmitir y el panel sabe quién está al aire.</p>
          <InicioSesion apiUrlInicial={cuenta.apiUrl} onListo={onCuenta} />
        </>
      )}
      {mensaje && <p className={mensaje.tipo === 'ok' ? 'texto-ok' : 'texto-error'}>{mensaje.texto}</p>}
    </section>
  );
}

/** true si la prueba de nivel lleva 4 s sin sonido */
function useSinSenalPrueba(nivel: Medidores, activo: boolean) {
  const ultima = useRef(Date.now());
  const [sin, setSin] = useState(false);
  useEffect(() => {
    if (!activo || Math.max(nivel.izq, nivel.der) > 0.0018) ultima.current = Date.now();
  }, [nivel, activo]);
  useEffect(() => {
    if (!activo) {
      setSin(false);
      return;
    }
    ultima.current = Date.now();
    const t = setInterval(() => setSin(Date.now() - ultima.current > 4000), 500);
    return () => clearInterval(t);
  }, [activo]);
  return sin;
}

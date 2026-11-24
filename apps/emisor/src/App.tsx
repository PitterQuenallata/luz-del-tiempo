import { useEffect, useRef, useState } from 'react';
import { api, escuchar, type AjustesVista, type EstadoEmision, type Sondeo } from './api';

type Pantalla = 'aire' | 'configuracion';

const BITRATES = [64, 96, 128, 192];

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('aire');
  const [ajustes, setAjustes] = useState<AjustesVista | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = async () => {
    const a = await api.cargarAjustes();
    setAjustes(a);
    return a;
  };

  useEffect(() => {
    recargar()
      .then((a) => setPantalla(a.servidor ? 'aire' : 'configuracion'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando || !ajustes) return <div className="pantalla centro"><p className="suave">Cargando…</p></div>;

  return pantalla === 'configuracion' ? (
    <Configuracion
      inicial={ajustes}
      onGuardado={async () => {
        await recargar();
        setPantalla('aire');
      }}
      onCancelar={ajustes.servidor ? () => setPantalla('aire') : undefined}
    />
  ) : (
    <Aire ajustes={ajustes} onConfigurar={() => setPantalla('configuracion')} />
  );
}

// ---------------- Al aire ----------------

function Aire({ ajustes, onConfigurar }: { ajustes: AjustesVista; onConfigurar: () => void }) {
  const [estado, setEstado] = useState<EstadoEmision>({ estado: 'desconectado', mensaje: 'Fuera del aire' });
  const [nivel, setNivel] = useState(0);
  const [oyentes, setOyentes] = useState<Sondeo | null>(null);
  const [silencio, setSilencio] = useState(false);
  const [desde, setDesde] = useState<number | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alAire = estado.estado === 'al_aire' || estado.estado === 'conectando' || estado.estado === 'reconectando';

  useEffect(() => {
    const cancelar: Array<() => void> = [];
    escuchar.estado((e) => {
      setEstado(e);
      if (e.estado === 'al_aire' && desde === null) setDesde(Date.now());
      if (e.estado === 'desconectado' || e.estado === 'detenido' || e.estado === 'error') setDesde(null);
    }).then((u) => cancelar.push(u));
    escuchar.nivel(setNivel).then((u) => cancelar.push(u));
    escuchar.oyentes(setOyentes).then((u) => cancelar.push(u));
    api.estadoActual().then((s) => setSilencio(s.silencio)).catch(() => {});
    api.probarServidor().then(setOyentes).catch(() => {});
    const reloj = setInterval(() => setAhora(Date.now()), 1000);
    return () => {
      cancelar.forEach((f) => f());
      clearInterval(reloj);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iniciar = async () => {
    setError(null);
    setOcupado(true);
    try {
      await api.iniciar();
      setEstado({ estado: 'conectando', mensaje: 'Conectando con la radio…' });
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
      setEstado({ estado: 'detenido', mensaje: 'Fuera del aire' });
      setDesde(null);
      setSilencio(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setOcupado(false);
    }
  };

  const alternarSilencio = async () => {
    const nuevo = !silencio;
    try {
      await api.silencio(nuevo);
      setSilencio(nuevo);
    } catch (e) {
      setError(String(e));
    }
  };

  const segundos = desde ? Math.floor((ahora - desde) / 1000) : 0;
  const tiempo = `${String(Math.floor(segundos / 3600)).padStart(2, '0')}:${String(Math.floor((segundos % 3600) / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
  const etiqueta: Record<EstadoEmision['estado'], string> = {
    desconectado: 'Fuera del aire',
    conectando: 'Conectando…',
    al_aire: 'Al aire',
    reconectando: 'Reconectando…',
    error: 'Sin transmitir',
    detenido: 'Fuera del aire',
  };
  const color = estado.estado === 'al_aire' ? 'en-vivo' : estado.estado === 'error' ? 'error' : alAire ? 'aviso' : '';

  return (
    <div className="pantalla">
      <header className="cabecera">
        <div>
          <p className="etiqueta">{ajustes.nombreEmision || 'Radio'}</p>
          <p className="suave pequeno">{ajustes.servidor}{ajustes.mount} · {ajustes.bitrate} kbps</p>
        </div>
        <button className="icono" onClick={onConfigurar} disabled={alAire} title={alAire ? 'Detén la transmisión para configurar' : 'Configuración'}>
          ⚙
        </button>
      </header>

      <main className="centro columna">
        <div className={`estado ${color}`}>
          <span className="punto" />
          {etiqueta[estado.estado]}
        </div>

        <button className={`gran-boton ${alAire ? 'activo' : ''}`} onClick={alAire ? detener : iniciar} disabled={ocupado}>
          {alAire ? 'Terminar' : 'Salir al aire'}
        </button>

        <p className="mensaje">{estado.mensaje}</p>
        {error && <p className="error">{error}</p>}

        <div className="medidor" aria-label="Nivel del micrófono">
          {Array.from({ length: 24 }).map((_, i) => {
            const umbral = (i + 1) / 24;
            const encendida = nivel >= umbral * 0.9;
            return <span key={i} className={encendida ? (umbral > 0.85 ? 'roja' : i > 16 ? 'amarilla' : 'verde') : ''} />;
          })}
        </div>

        <div className="cifras">
          <div>
            <p className="cifra">{alAire ? tiempo : '--:--:--'}</p>
            <p className="suave pequeno">Tiempo al aire</p>
          </div>
          <div>
            <p className="cifra">{oyentes?.oyentes ?? '—'}</p>
            <p className="suave pequeno">Oyentes</p>
          </div>
        </div>

        <div className="fila">
          <button className={`boton ${silencio ? 'activo' : ''}`} onClick={alternarSilencio} disabled={!alAire}>
            {silencio ? 'Quitar silencio' : 'Silenciar micrófono'}
          </button>
        </div>

        {oyentes && !oyentes.mountEnLinea && !alAire && (
          <p className="suave pequeno">Oyentes: la radio está fuera del aire en este momento.</p>
        )}
      </main>
    </div>
  );
}

// ---------------- Configuración ----------------

function Configuracion({
  inicial,
  onGuardado,
  onCancelar,
}: {
  inicial: AjustesVista;
  onGuardado: () => void;
  onCancelar?: () => void;
}) {
  const [servidor, setServidor] = useState(inicial.servidor);
  const [puerto, setPuerto] = useState(String(inicial.puerto));
  const [puertoOyentes, setPuertoOyentes] = useState(String(inicial.puertoOyentes));
  const [mount, setMount] = useState(inicial.mount || '/');
  const [bitrate, setBitrate] = useState(inicial.bitrate);
  const [dispositivo, setDispositivo] = useState(inicial.dispositivo ?? '');
  const [nombre, setNombre] = useState(inicial.nombreEmision);
  const [contrasena, setContrasena] = useState('');
  const [dispositivos, setDispositivos] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [probando, setProbando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.dispositivos().then(setDispositivos).catch(() => setDispositivos([]));
  }, []);

  const probar = async () => {
    setProbando(true);
    setMensaje(null);
    try {
      await api.guardarAjustes(datos(null));
      const s = await api.probarServidor();
      if (!s.alcanzable) setMensaje({ tipo: 'error', texto: 'No hay respuesta del servidor. Revisa la dirección y que la radio esté encendida.' });
      else if (s.mountEnLinea) setMensaje({ tipo: 'ok', texto: `Servidor en línea. Ya hay una transmisión en ${mount}.` });
      else setMensaje({ tipo: 'ok', texto: 'Servidor en línea. La radio está fuera del aire, así que puedes salir al aire cuando quieras.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: String(e) });
    } finally {
      setProbando(false);
    }
  };

  const datos = (clave: string | null) => ({
    servidor,
    puerto: Number(puerto),
    puertoOyentes: Number(puertoOyentes),
    mount: mount.trim(),
    bitrate,
    dispositivo: dispositivo || null,
    nombreEmision: nombre,
    contrasena: clave,
  });

  const guardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      await api.guardarAjustes(datos(contrasena || null));
      onGuardado();
    } catch (e) {
      setMensaje({ tipo: 'error', texto: String(e) });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pantalla">
      <header className="cabecera">
        <div>
          <p className="etiqueta">Configuración</p>
          <p className="suave pequeno">Datos que te dio el administrador de la radio</p>
        </div>
        {onCancelar && <button className="boton pequeno" onClick={onCancelar}>Volver</button>}
      </header>

      <form className="formulario" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
        <label>
          Servidor de la radio
          <input value={servidor} onChange={(e) => setServidor(e.target.value)} placeholder="192.168.1.11" autoComplete="off" />
        </label>

        <div className="dos">
          <label>
            Puerto de locutores
            <input inputMode="numeric" value={puerto} onChange={(e) => setPuerto(e.target.value)} />
          </label>
          <label>
            Puerto de oyentes
            <input inputMode="numeric" value={puertoOyentes} onChange={(e) => setPuertoOyentes(e.target.value)} />
          </label>
        </div>

        <label>
          Punto de transmisión (mount)
          <input value={mount} onChange={(e) => setMount(e.target.value)} placeholder="/principal" autoComplete="off" />
        </label>

        <label>
          Contraseña del locutor
          <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} placeholder={inicial.contrasenaGuardada ? '•••••• (guardada; escribe otra para cambiarla)' : 'Mínimo 8 caracteres'} autoComplete="new-password" />
        </label>

        <div className="dos">
          <label>
            Calidad
            <select value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))}>
              {BITRATES.map((b) => <option key={b} value={b}>{b} kbps{b === 128 ? ' (recomendada)' : ''}</option>)}
            </select>
          </label>
          <label>
            Micrófono
            <select value={dispositivo} onChange={(e) => setDispositivo(e.target.value)}>
              <option value="">Predeterminado del sistema</option>
              {dispositivos.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>

        <label>
          Nombre de la emisión
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>

        {mensaje && <p className={mensaje.tipo === 'ok' ? 'ok' : 'error'}>{mensaje.texto}</p>}

        <div className="fila">
          <button type="button" className="boton" onClick={probar} disabled={probando || guardando || !servidor}>
            {probando ? 'Probando…' : 'Probar conexión'}
          </button>
          <button type="submit" className="boton principal" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

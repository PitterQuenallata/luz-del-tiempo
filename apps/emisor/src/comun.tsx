// Piezas que comparten la ventana principal y la mini: el estado de la emisión y los medidores.
import { useEffect, useRef, useState } from 'react';
import { api, escuchar, MEDIDORES_VACIOS, type EstadoEmision, type Medidores, type NombreEstado } from './api';

export const ETIQUETA_ESTADO: Record<NombreEstado, string> = {
  desconectado: 'Fuera del aire',
  conectando: 'Conectando',
  al_aire: 'Al aire',
  reconectando: 'Reconectando',
  error: 'Sin transmitir',
  detenido: 'Fuera del aire',
};

/** Segundos sin sonido a partir de los cuales se avisa (igual que el núcleo) */
export const AVISO_SILENCIO = 10;

export const transmitiendo = (e: NombreEstado) => e === 'al_aire' || e === 'conectando' || e === 'reconectando';

export function reloj(segundos: number) {
  const s = Math.max(0, Math.floor(segundos));
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(Math.floor(s / 3600))}:${dos(Math.floor((s % 3600) / 60))}:${dos(s % 60)}`;
}

export function minutos(segundos: number) {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Estado vivo de la emisión, sincronizado con el núcleo (sirve igual en la ventana grande y en la mini) */
export function useEmision() {
  const [estado, setEstado] = useState<EstadoEmision>({ estado: 'desconectado', mensaje: '' });
  const [medidores, setMedidores] = useState<Medidores>(MEDIDORES_VACIOS);
  const [oyentes, setOyentes] = useState<number | null>(null);
  const [silencio, setSilencio] = useState(false);
  const [desde, setDesde] = useState<number | null>(null);
  const [grabacion, setGrabacion] = useState<string | null>(null);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const quitar: Array<() => void> = [];
    const guardar = (p: Promise<() => void>) => p.then((u) => quitar.push(u)).catch(() => {});
    guardar(
      escuchar.estado((e) => {
        setEstado(e);
        if (e.estado === 'al_aire') setDesde((d) => d ?? Date.now());
        if (!transmitiendo(e.estado)) {
          setDesde(null);
          setSilencio(false);
        }
      }),
    );
    guardar(escuchar.medidores(setMedidores));
    guardar(escuchar.oyentes((s) => setOyentes(s.oyentes)));
    guardar(escuchar.silencio(setSilencio));
    guardar(escuchar.grabacion(setGrabacion));
    api
      .estadoActual()
      .then((r) => {
        if (r.estado) setEstado({ estado: r.estado, mensaje: r.mensaje });
        setDesde(r.desde);
        setSilencio(r.silencio);
        setOyentes(r.oyentes);
        setGrabacion(r.grabacion);
      })
      .catch(() => {});
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => {
      quitar.forEach((f) => f());
      clearInterval(t);
    };
  }, []);

  const activo = transmitiendo(estado.estado);
  return {
    estado,
    setEstado,
    medidores: activo ? medidores : MEDIDORES_VACIOS,
    oyentes,
    setOyentes,
    silencio,
    setSilencio,
    grabacion: activo ? grabacion : null,
    activo,
    segundosAlAire: desde ? (ahora - desde) / 1000 : 0,
    /** Sin sonido hace rato (y no fue el operador quien silenció) */
    sinSonido: estado.estado === 'al_aire' && !silencio && medidores.silencioSeg >= AVISO_SILENCIO,
  };
}

// ---------------- Medidores ----------------

/** Rango del medidor en dBFS */
export const PISO_DB = -60;
export const aDb = (nivel: number) => 20 * Math.log10(Math.max(nivel, 1e-6));
/** Posición (0–100 %) de un valor en dB dentro del medidor */
export const posicion = (db: number) => Math.min(100, Math.max(0, ((db - PISO_DB) / -PISO_DB) * 100));

/**
 * Suaviza la lectura como un medidor de consola: sube al instante, baja ~20 dB por segundo,
 * y guarda el pico más alto 1.5 s.
 */
export function useBalistica(nivel: number) {
  const [, redibujar] = useState(0);
  const entrada = useRef(nivel);
  entrada.current = nivel;
  const r = useRef({ t: Date.now(), valor: PISO_DB, pico: PISO_DB, picoT: 0 });
  // Paso propio a ~30 cuadros por segundo: así la barra cae aunque la lectura no cambie (silencio)
  useEffect(() => {
    const paso = () => {
      const s = r.current;
      const ahora = Date.now();
      const db = aDb(entrada.current);
      const antes = [s.valor, s.pico];
      s.valor = Math.max(db, s.valor - ((ahora - s.t) / 1000) * 20, PISO_DB);
      s.t = ahora;
      if (db >= s.pico || ahora - s.picoT > 1500) {
        s.pico = Math.max(db, PISO_DB);
        s.picoT = ahora;
      }
      if (antes[0] !== s.valor || antes[1] !== s.pico) redibujar((n) => n + 1);
    };
    const t = setInterval(paso, 33);
    return () => clearInterval(t);
  }, []);
  return { db: r.current.valor, pico: r.current.pico };
}

function Barra({ nivel, lado, fina }: { nivel: number; lado: string; fina?: boolean }) {
  const { db, pico } = useBalistica(nivel);
  return (
    <div className={`barra${fina ? ' fina' : ''}`} role="meter" aria-label={`Canal ${lado}`} aria-valuemin={PISO_DB} aria-valuemax={0} aria-valuenow={Math.round(db)}>
      <div className="barra-lleno" style={{ clipPath: `inset(0 ${100 - posicion(db)}% 0 0)` }} />
      {pico > PISO_DB && <div className={`barra-pico${pico > -1 ? ' rojo' : ''}`} style={{ left: `calc(${posicion(pico)}% - 1px)` }} />}
    </div>
  );
}

const MARCAS = [-48, -36, -24, -18, -12, -6, 0];

/** Medidor estéreo L/R con escala en dB */
export function MedidorEstereo({ izq, der, escala = true }: { izq: number; der: number; escala?: boolean }) {
  const maximo = aDb(Math.max(izq, der));
  return (
    <div className="medidor-estereo">
      <div className="medidor-fila">
        <span className="medidor-lado">L</span>
        <Barra nivel={izq} lado="izquierdo" />
        <span className="medidor-valor" />
      </div>
      <div className="medidor-fila">
        <span className="medidor-lado">R</span>
        <Barra nivel={der} lado="derecho" />
        <span className="medidor-valor" />
      </div>
      {escala && (
        <div className="medidor-fila">
          <span className="medidor-lado" />
          <div className="escala" aria-hidden>
            {MARCAS.map((m) => (
              <span key={m} style={{ left: `${posicion(m)}%` }}>{m}</span>
            ))}
          </div>
          <span className="medidor-valor numero">{maximo <= PISO_DB ? '—' : `${Math.round(maximo)} dB`}</span>
        </div>
      )}
    </div>
  );
}

/** Dos barras finas para la ventana mini */
export function MedidorFino({ izq, der }: { izq: number; der: number }) {
  return (
    <div className="medidor-fino">
      <Barra nivel={izq} lado="izquierdo" fina />
      <Barra nivel={der} lado="derecho" fina />
    </div>
  );
}

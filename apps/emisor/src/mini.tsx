// Ventana mini: una barra siempre encima con lo esencial mientras se transmite.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { api } from './api';
import { aDb, ETIQUETA_ESTADO, MedidorFino, PISO_DB, reloj, useEmision } from './comun';
import './styles.css';

function Mini() {
  const e = useEmision();
  const { estado, medidores, activo } = e;
  const db = aDb(Math.max(medidores.izq, medidores.der));

  const tono = e.sinSonido || estado.estado === 'reconectando' || medidores.redLenta
    ? 'aviso'
    : estado.estado === 'al_aire'
      ? 'vivo'
      : estado.estado === 'error'
        ? 'error'
        : 'neutro';
  const etiqueta = e.sinSonido
    ? 'Sin sonido'
    : e.silencio && activo
      ? 'Silenciado'
      : ETIQUETA_ESTADO[estado.estado];

  const alternarSilencio = () => {
    const nuevo = !e.silencio;
    api.silencio(nuevo).then(() => e.setSilencio(nuevo)).catch(() => {});
  };

  return (
    <div className={`mini mini-${tono}`} data-tauri-drag-region title={estado.mensaje}>
      <span className={`chip chip-${tono}`} data-tauri-drag-region>{etiqueta}</span>
      <span className="mini-tiempo numero" data-tauri-drag-region>{activo ? reloj(e.segundosAlAire) : '--:--:--'}</span>
      <div className="mini-medidor" data-tauri-drag-region>
        <MedidorFino izq={medidores.izq} der={medidores.der} />
        <span className="mini-db numero" data-tauri-drag-region>{db <= PISO_DB ? '—' : Math.round(db)}</span>
      </div>
      <span className="mini-oyentes numero" data-tauri-drag-region >
        {e.oyentes ?? '—'} <small data-tauri-drag-region>oyentes</small>
      </span>
      <button className={`boton pequeno${e.silencio ? ' marcado' : ''}`} onClick={alternarSilencio} disabled={!activo}>
        {e.silencio ? 'Activar' : 'Silenciar'}
      </button>
      <button className="boton pequeno" onClick={() => api.ventanaMini(false).catch(() => {})}>Abrir</button>
    </div>
  );
}

const listo = import.meta.env.DEV && !('__TAURI_INTERNALS__' in window) ? import('./dev/simulador') : Promise.resolve();

listo.then(() =>
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Mini />
    </React.StrictMode>,
  ),
);

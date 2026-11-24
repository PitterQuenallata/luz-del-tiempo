import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// En un navegador sin Tauri (pnpm dev) se carga un simulador del núcleo para poder diseñar la interfaz
const listo = import.meta.env.DEV && !('__TAURI_INTERNALS__' in window) ? import('./dev/simulador') : Promise.resolve();

listo.then(() =>
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ),
);

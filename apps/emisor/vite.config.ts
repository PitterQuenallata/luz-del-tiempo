import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri espera el frontend en el puerto 1420 durante el desarrollo.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: {
    target: 'es2020',
    // Dos páginas: la ventana principal y la mini (siempre encima)
    rollupOptions: { input: { main: 'index.html', mini: 'mini.html' } },
  },
});

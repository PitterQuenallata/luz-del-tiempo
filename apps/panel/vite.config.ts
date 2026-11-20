import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('/motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('@animateicons') || id.includes('morphicons') || id.includes('lucide')) {
              return 'vendor-icons';
            }
            if (id.includes('zod') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    // La API corre en localhost:4000. El panel la llama por su propio origen (/api),
    // así funciona desde localhost, 127.0.0.1 o la IP de la red, y las cookies de sesión viajan.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://localhost:4000');
          });
        },
      },
    },
  },
});

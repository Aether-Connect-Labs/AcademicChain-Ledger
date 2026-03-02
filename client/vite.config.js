import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['@sentry/react','@sentry/tracing','@sentry-internal/replay','@sentry/core','@sentry/browser'],
    include: ['react','react-dom','react-router-dom', 'pdfjs-dist', 'fabric', 'hashconnect'],
    noDiscovery: false
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend Node.js Express
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:18789',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/metrics': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/live': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/ready': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/excel-metrics.html': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/n8n': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/n8n/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          pdfjs: ['pdfjs-dist'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          charts: ['chart.js', 'react-chartjs-2'],
          ui: ['framer-motion', '@headlessui/react', 'lucide-react'],
          utils: ['axios', 'date-fns', 'uuid', 'zustand'],
        },
      },
    },
  },
});

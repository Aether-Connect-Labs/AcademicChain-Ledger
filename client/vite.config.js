import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@sentry/react','@sentry/tracing','@sentry-internal/replay','@sentry/core','@sentry/browser'],
    include: ['react','react-dom','react-router-dom'],
    noDiscovery: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (!normalizedId.includes('/node_modules/')) {
            return;
          }

          if (
            /\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(
              normalizedId,
            )
          ) {
            return 'vendor-react';
          }

          if (normalizedId.includes('/node_modules/lucide-react/')) {
            return 'vendor-icons';
          }

          if (normalizedId.includes('/node_modules/axios/')) {
            return 'vendor-axios';
          }

          if (
            normalizedId.includes('/node_modules/firebase/') ||
            normalizedId.includes('/node_modules/@firebase/')
          ) {
            return 'vendor-firebase';
          }
        },
      },
    },
  },
});

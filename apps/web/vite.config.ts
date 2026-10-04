import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const apiPort = process.env.API_PORT ?? '3000';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  envDir: '../..',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
});

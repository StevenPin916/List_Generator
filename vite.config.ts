import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Tauri espera un puerto fijo y no debe limpiar la consola en modo dev.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['tests/**/*.test.ts', 'private/**/*.test.ts'], testTimeout: 20000 },
});

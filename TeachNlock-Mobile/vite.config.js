import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Electron için bu yol kritik!
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
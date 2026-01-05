import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Electron'da dosyaları bulabilmesi için ./ şart
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
        // 🔥 İŞTE SUPABASE HATASINI ÇÖZEN SİHİRLİ AYAR 🔥
        // Bu ayar, Vite'ın "default export" hatası veren kütüphaneleri 
        // otomatik düzeltmesini sağlar.
        transformMixedEsModules: true,
    }
  },
  server: {
    port: 5173,
    strictPort: true,
  }
})
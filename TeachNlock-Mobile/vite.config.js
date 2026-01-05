import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Electron için './' kalabilir, Web için de genelde sorun çıkarmaz.
  base: './', 
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // 👇 KRİTİK AYAR BURASI! 👇
    // Kodu eski tarayıcıların (iPhone 6/7/8, eski Android) anlayacağı dile çevirir.
    target: ['es2015', 'chrome58', 'safari11'], 
    
    // Eski telefonlarda CSS (Görünüm) bozulmasın diye bunu da ekliyoruz
    cssTarget: ['chrome58', 'safari11'],
    
    // Kodları sıkıştırırken bozmaması için güvenli ayar
    minify: 'esbuild',
  },
  
  // Telefondan test ederken (npm run dev) IP adresiyle girmek için:
  server: {
    host: true
  }
});
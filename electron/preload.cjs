const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // --- 1. SİSTEM KİMLİĞİ ---
  // React'in tahtayı tanıması için gerekli
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),

  // --- 2. KILLSWITCH (BİLGİSAYARI KAPAT) ---
  // "shutdown-pc" kanalını tetikler. Main.js'de bu komut 'shutdown /s /f /t 0' çalıştırır.
  shutdownPC: () => ipcRenderer.invoke('shutdown-pc'),

  // --- 3. UYGULAMADAN ÇIK ---
  // Sadece programı kapatır, bilgisayarı değil.
  quitApp: () => ipcRenderer.send('quit-app'),

  // --- 4. USB DİNLEYİCİSİ (VERİ GARANTİLİ) ---
  // Main.js'den gelen { status: 'INSERTED', data: {...} } paketini bozmadan React'e iletir.
  onUsbStatus: (callback) => {
    // Üst üste binmeyi önlemek için önceki dinleyicileri temizle
    ipcRenderer.removeAllListeners('usb-status');
    // Veriyi React'e callback fonksiyonu ile gönder
    ipcRenderer.on('usb-status', (event, data) => callback(data));
  },

  // --- 5. GÖRÜNÜM KONTROLLERİ ---
  // "LOCKED" (Tam Ekran), "MINI" (Köşe), "EXPANDED" (Açılır) modları arası geçiş
  setViewMode: (mode) => ipcRenderer.send('set-view-mode', mode),

  // --- 6. FARE KONTROLÜ ---
  // Pencere şeffafken farenin arkadaki Windows'a tıklayabilmesini sağlar
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),

  // --- 7. DOSYA VE LİNK AÇMA ---
  // Dosyaları veya web sitelerini varsayılan tarayıcıda açar
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // --- 8. GÜNCELLEME SİSTEMİ ---
  // Sunucudan gelen güncelleme exe'sini indirip kurar
  startUpdate: (url) => ipcRenderer.send('start-update', url)
});
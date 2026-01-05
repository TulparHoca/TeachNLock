const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // 🆔 Kimlik ve Sistem
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  shutdownPC: () => ipcRenderer.invoke('shutdown-pc'),
  quitApp: () => ipcRenderer.send('quit-app'),
  
  // 🔌 USB Dinleyici
  onUsbStatus: (callback) => {
    // Çakışmayı önlemek için önce temizle
    ipcRenderer.removeAllListeners('usb-status');
    
    // Yeni dinleyiciyi tanımla
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('usb-status', subscription);

    // React useEffect içinde kullanılabilecek temizleme fonksiyonu döndür
    return () => {
      ipcRenderer.removeListener('usb-status', subscription);
    };
  },
  // Alternatif manuel temizleme
  removeUsbListener: () => ipcRenderer.removeAllListeners('usb-status'),

  // 🖥️ Ekran ve Görünüm
  setViewMode: (mode) => ipcRenderer.send('set-view-mode', mode),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // 🔄 Güncelleme (Hash Korumalı)
  startUpdate: (downloadUrl, expectedHash) => ipcRenderer.send('start-update', { downloadUrl, expectedHash }),

  // 🔊 Ses ve Medya Kontrolü
  stopMedia: () => ipcRenderer.send('stop-media'),
  setSystemMute: (muted) => ipcRenderer.send('set-system-mute', muted),

  // 👇🔥 YENİ EKLENENLER: GÜÇ VE UYKU YÖNETİMİ (Power Monitor) 🔥👇
  
  // 1. Sistem Uykuya Dalıyor (Power Tuşuna Basıldı)
  onSystemSuspend: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('system-suspend', subscription);
  },

  // 2. Sistem Uyandı
  onSystemResume: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('system-resume', subscription);
  },

  // 3. Temizlik (Dinleyicileri Kaldır)
  removeSystemListeners: () => {
    ipcRenderer.removeAllListeners('system-suspend');
    ipcRenderer.removeAllListeners('system-resume');
  }
});
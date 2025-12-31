const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  shutdownPC: () => ipcRenderer.invoke('shutdown-pc'),
  quitApp: () => ipcRenderer.send('quit-app'),
  
  // 👇 BURASI GÜNCELLENDİ: Artık temizlik fonksiyonu döndürüyor
  onUsbStatus: (callback) => {
    // Öncekileri temizle (Senin taktik - Güvenlik sigortası)
    ipcRenderer.removeAllListeners('usb-status');
    
    // Yeni dinleyiciyi tanımla
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('usb-status', subscription);

    // React tarafına "Beni susturmak istersen bunu çalıştır" diye anahtar veriyoruz
    return () => {
      ipcRenderer.removeListener('usb-status', subscription);
    };
  },

  setViewMode: (mode) => ipcRenderer.send('set-view-mode', mode),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  startUpdate: (url) => ipcRenderer.send('start-update', url)
});
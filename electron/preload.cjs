const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  onUsbStatus: (callback) => ipcRenderer.on('usb-status', (event, status) => callback(status)),
  setViewMode: (mode) => ipcRenderer.send('set-view-mode', mode),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Uygulamadan Çık (Masaüstüne dön)
  quitApp: () => ipcRenderer.send('quit-app'),
  
  // 🔥 BİLGİSAYARI KAPAT (FİŞİ ÇEK)
  shutdownPC: () => ipcRenderer.invoke('shutdown-pc'),

  send: (channel, data) => {
    let validChannels = ['start-update'];
    if (validChannels.includes(channel)) ipcRenderer.send(channel, data);
  }
}); 
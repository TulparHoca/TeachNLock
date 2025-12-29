const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  shutdownPC: () => ipcRenderer.invoke('shutdown-pc'),
  quitApp: () => ipcRenderer.send('quit-app'),
  onUsbStatus: (callback) => {
    ipcRenderer.removeAllListeners('usb-status');
    ipcRenderer.on('usb-status', (event, data) => callback(data));
  },
  setViewMode: (mode) => ipcRenderer.send('set-view-mode', mode),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  startUpdate: (url) => ipcRenderer.send('start-update', url)
});
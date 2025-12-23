/// <reference types="vite/client" />

interface Window {
  electron: {
    shutdownPC(): unknown;
    send(arg0: string, download_url: any): unknown;
    shutdownSystem(): unknown;
    setIgnoreMouse(arg0: boolean): void;
    setViewMode: (mode: 'LOCKED' | 'TOOLBAR' | 'EXPANDED' | 'MINI') => void;
    quitApp: () => void;
    openExternal: (url: string) => void;
    onUsbStatus: (callback: (status: string) => void) => () => void;
    getMachineId: () => Promise<string>;
    
    // 🔥 YENİ: Koordinat alan fonksiyon tanımı
    moveWindow: (pos: { x: number; y: number }) => void;
  };
}
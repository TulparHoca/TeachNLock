/// <reference types="vite/client" />

interface Window {
  electron: {
    // Makine Kimliği
    getMachineId: () => Promise<string>;
    
    // Güç ve Çıkış
    shutdownPC: () => Promise<void>;
    quitApp: () => void;
    
    // Görünüm ve Mouse
    setViewMode: (mode: 'LOCKED' | 'TOOLBAR' | 'EXPANDED' | 'MINI') => void;
    setIgnoreMouse: (ignore: boolean) => void;
    
    // USB (Cleanup fonksiyonu döndürür)
    onUsbStatus: (callback: (data: any) => void) => () => void;
    
    // Harici Link
    openExternal: (url: string) => Promise<void>;
    
    // 👇 KRİTİK DÜZELTME BURADA 👇
    // Artık 'startUpdate' bir obje değil, argüman alan bir fonksiyon olarak tanımlandı.
    startUpdate: (arg: { downloadUrl: string; expectedHash: string }) => void;
  };
}
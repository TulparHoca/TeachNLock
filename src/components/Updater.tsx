import { useEffect, useState } from 'react';
import { supabase } from '../db';
import { Download } from 'lucide-react';

// TypeScript için Veri Tipi Tanımı
interface UpdateData {
  version: string;
  download_url: string;
  file_hash: string;
}

// 🔥 VERSİYON KONTROLÜ (Her güncellemede burayı manuel artırıyorsun)
const CURRENT_VERSION = '1.0.0'; 

export default function Updater() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateData | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        // 👇 DÜZELTME BURADA: 'yb' silindi, temizlendi.
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .single();

        if (error) {
          console.error("Güncelleme kontrol hatası:", error);
          return;
        }
        
        // Versiyon karşılaştırması
        if (data && data.version !== CURRENT_VERSION) {
          console.log(`Yeni güncelleme bulundu: ${data.version}`);
          setUpdateAvailable(data as UpdateData);
        }
      } catch (err) {
        console.error("Beklenmedik hata:", err);
      }
    };

    checkUpdate();
  }, []);

  const startUpdate = () => {
    if (!updateAvailable) return;
    setDownloading(true);

    const electronAPI = (window as any).electron;

    if (electronAPI && electronAPI.startUpdate) {
        // Main process'e hem URL hem Hash gönderiyoruz
        electronAPI.startUpdate({
            downloadUrl: updateAvailable.download_url,
            expectedHash: updateAvailable.file_hash 
        });
    } else {
        console.error("Electron API bulunamadı!");
        setDownloading(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/95 flex items-center justify-center text-white backdrop-blur-md pointer-events-auto">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border border-cyan-500 w-[500px] animate-in fade-in zoom-in duration-300">
        
        <h2 className="text-3xl font-bold mb-4 text-cyan-400">Yeni Güncelleme!</h2>
        
        <div className="bg-slate-900/50 p-4 rounded-xl mb-6 flex justify-between items-center text-sm">
            <div className="text-left">
                <span className="block text-slate-500 text-xs uppercase font-bold">Mevcut</span>
                <span className="text-red-400 font-mono text-lg">{CURRENT_VERSION}</span>
            </div>
            <div className="text-right">
                <span className="block text-slate-500 text-xs uppercase font-bold">Yeni</span>
                <span className="text-green-400 font-mono text-lg font-bold">{updateAvailable.version}</span>
            </div>
        </div>

        {downloading ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="animate-pulse font-bold text-cyan-400">İndiriliyor ve Doğrulanıyor...</p>
            <p className="text-xs text-slate-500 mt-2 max-w-xs">
              Dosya bütünlüğü (SHA256) kontrol edildikten sonra uygulama otomatik olarak yeniden başlatılacaktır.
            </p>
          </div>
        ) : (
          <button 
            onClick={startUpdate}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 w-full transition-all active:scale-95 shadow-lg shadow-green-900/20"
          >
            <Download size={24} />
            HEMEN GÜNCELLE
          </button>
        )}
      </div>
    </div>
  );
}
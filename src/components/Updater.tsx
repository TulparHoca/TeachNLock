import { useEffect, useState } from 'react';
import { supabase } from '../db';
import { Download } from 'lucide-react';

// 🔥 Her yeni versiyonda burayı manuel arttıracaksın: '1.0.1', '1.0.2' gibi.
const CURRENT_VERSION = '1.0.0'; 

export default function Updater() {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      // Veritabanından son sürümü çek
      const { data } = await supabase.from('app_settings').select('*').single();
      
      // Eğer veritabanındaki sürüm bizimkinden farklıysa
      if (data && data.version !== CURRENT_VERSION) {
        console.log(`Yeni güncelleme bulundu: ${data.version}`);
        setUpdateAvailable(data);
      }
    };

    checkUpdate();
  }, []);

  const startUpdate = () => {
    if (!updateAvailable) return;
    setDownloading(true);
    // Main process'e indir emri gönder
    window.electron?.send('start-update', updateAvailable.download_url);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/95 flex items-center justify-center text-white backdrop-blur-md pointer-events-auto">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border border-cyan-500 w-[500px] animate-in fade-in zoom-in duration-300">
        <h2 className="text-3xl font-bold mb-4 text-cyan-400">Yeni Güncelleme!</h2>
        <p className="text-slate-300 mb-2">Şu Anki Sürüm: <span className="text-red-400">{CURRENT_VERSION}</span></p>
        <p className="text-slate-300 mb-8">Yeni Sürüm: <span className="text-green-400 font-bold text-2xl">{updateAvailable.version}</span></p>

        {downloading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="animate-pulse font-bold text-cyan-400">İndiriliyor... Lütfen bekleyin.</p>
            <p className="text-xs text-slate-500 mt-2">Tamamlanınca uygulama kapanıp yeniden açılacak.</p>
          </div>
        ) : (
          <button 
            onClick={startUpdate}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 w-full transition-all active:scale-95 shadow-lg shadow-green-900/20"
          >
            <Download size={24} />
            GÜNCELLE
          </button>
        )}
      </div>
    </div>
  );
}
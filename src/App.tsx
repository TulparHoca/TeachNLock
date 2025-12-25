import { useEffect } from 'react';
import { useLock } from './context/LockContext';
import LockScreen from './components/LockScreen';
import TeacherToolbar from './components/TeacherToolbar';
import SetupScreen from './components/SetupScreen';
import Updater from './components/Updater';
import { createClient } from '@supabase/supabase-js';

// --- GÜVENLİK İÇİN SUPABASE BAĞLANTISI ---
// (Web panelindeki anahtarların aynısı)
const supabaseUrl = 'https://raawrpvdlduvazxincdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYXdycHZkbGR1dmF6eGluY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjU4NjYsImV4cCI6MjA3OTg0MTg2Nn0.S9Iogzz6rCp-gOy0pa2s8RHYyxEgGmAv6DopNAEbnvE';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const { isLocked, announcement, isSetupRequired } = useLock();

  // 🔥 KRİTİK GÜVENLİK YAMASI: AÇILIŞTA VERİTABANINI EZME
  // Uygulama her başladığında (elektrik kesintisi veya reset sonrası),
  // veritabanındaki "Açık" durumunu zorla "KİLİTLİ" olarak değiştirir.
  useEffect(() => {
    const forceDbToLockState = async () => {
      try {
        // 1. Bu bilgisayarın ID'sini al
        // (window as any) kullanımı TypeScript hatasını önlemek içindir
        const deviceId = await (window as any).electron.getMachineId();

        if (deviceId) {
           console.log("Güvenlik Protokolü: Veritabanı durumu kilitleniyor...", deviceId);
           
           // 2. Veritabanını GÜNCELLE (Zorla Kilitle)
           await supabase
             .from('boards')
             .update({ 
               is_locked: true,       // Durumu KİLİTLİ yap
               lock_command: 'LOCK',  // Komutu sıfırla
               last_seen: new Date().toISOString() 
             })
             .eq('machine_id', deviceId);
             
           console.log("Güvenlik Protokolü: Başarılı. Cihaz güvenli modda başlatıldı.");
        }
      } catch (err) {
        console.error("Kritik Hata: Veritabanı güvenlik güncellemesi yapılamadı:", err);
      }
    };

    // Fonksiyonu çalıştır
    forceDbToLockState();
  }, []); // [] sayesinde sadece uygulama ilk açıldığında 1 kez çalışır.

  if (isSetupRequired) return <SetupScreen />;

  const showAnnouncement = announcement && typeof announcement === 'string' && announcement.trim().length > 0;

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent flex flex-col items-center select-none font-sans relative pointer-events-none">
      
      <Updater />

      {/* DUYURU BANDI */}
      {showAnnouncement && (
        <div 
          className="fixed top-0 left-0 w-full z-50 pointer-events-auto" 
          onMouseEnter={() => (window as any).electron?.setIgnoreMouse(false)}
          onMouseLeave={() => (window as any).electron?.setIgnoreMouse(true)}
        >
           <div className="bg-slate-950/90 backdrop-blur-md border-b border-white/10 text-yellow-400 py-2 shadow-xl">
             <div className="whitespace-nowrap animate-marquee font-bold text-sm tracking-[0.2em] uppercase drop-shadow-md">
               📢 {announcement}
             </div>
           </div>
        </div>
      )}

      <div className="pointer-events-auto w-full h-full">
        {/* State ne olursa olsun açılışta veritabanı ezildiği için burası güvenli hale gelir */}
        {isLocked ? <LockScreen /> : <TeacherToolbar />}
      </div>
      
      <style>{`
        .animate-marquee { animation: marquee 25s linear infinite; display: inline-block; padding-left: 100vw; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        .animate-fade-in { animation: fadeIn 1s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
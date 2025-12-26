import { useLock } from './context/LockContext';
import LockScreen from './components/LockScreen';
import TeacherToolbar from './components/TeacherToolbar';
import SetupScreen from './components/SetupScreen';
import Updater from './components/Updater';

export default function App() {
  const { isLocked, announcement, isSetupRequired } = useLock();

  // Kurulum gerekiyorsa (ilk açılış)
  if (isSetupRequired) return <SetupScreen />;

  const showAnnouncement = announcement && typeof announcement === 'string' && announcement.trim().length > 0;

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent flex flex-col items-center select-none font-sans relative pointer-events-none">
      
      {/* Otomatik Güncelleyici */}
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

      {/* EKRAN YÖNETİMİ (Kilitli mi Açık mı?) */}
      <div className="pointer-events-auto w-full h-full">
        {isLocked ? <LockScreen /> : <TeacherToolbar />}
      </div>
      
      <style>{`
        .animate-marquee { animation: marquee 25s linear infinite; display: inline-block; padding-left: 100vw; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
}
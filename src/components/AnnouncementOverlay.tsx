import { useLock } from '../context/LockContext';

export default function AnnouncementOverlay() {
  const { announcement, isLocked } = useLock();

  const showAnnouncement = announcement && typeof announcement === 'string' && announcement.trim().length > 0;

  if (!showAnnouncement) return null;

  // 🔥 MOUSE GÜVENLİK AYARLARI
  // Eğer tahta kilitliyse (isLocked=true), mouse ASLA boşa düşmemeli.
  // Sadece kilit açıkken (isLocked=false) mouse arkadaki Windows'a geçebilir.

  const handleMouseEnter = () => {
    if (!isLocked) {
      (window as any).electron?.setIgnoreMouse(false);
    }
  };

  const handleMouseLeave = () => {
    if (!isLocked) {
      (window as any).electron?.setIgnoreMouse(true);
    }
  };

  return (
    <div 
      className="fixed top-0 left-0 w-full z-50 pointer-events-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bg-slate-950/90 backdrop-blur-md border-b border-white/10 text-yellow-400 py-2 shadow-xl cursor-default">
        <div className="whitespace-nowrap animate-marquee font-bold text-sm tracking-[0.2em] uppercase drop-shadow-md flex items-center gap-4">
          <span>📢</span> 
          {announcement}
        </div>
      </div>
      
      <style>{`
        .animate-marquee { animation: marquee 25s linear infinite; display: inline-block; padding-left: 100%; }
        @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }
      `}</style>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useLock } from '../context/LockContext';
import { supabase } from '../db'; // 🔥 Veritabanı bağlantısı eklendi (Sayaç için)
import { Lock, Unlock, FolderOpen, ChevronDown, FileText, ExternalLink, Image, Video, Download, X, Play } from 'lucide-react';

export default function TeacherToolbar() {
  // 🔥 GEREKLİ VERİLERİ ÇEKTİK
  const { lock, files, announcement, teacherName, scheduleStatus, sessionId } = useLock();
  
  const [viewMode, setViewMode] = useState<'NORMAL' | 'EXPANDED' | 'MINI'>('MINI');
  
  // 🔥 SAYAÇ BAŞLANGICI 0 (Veritabanından dolacak)
  const [secondsLeft, setSecondsLeft] = useState(0);
  
  const [miniPos, setMiniPos] = useState({ x: window.innerWidth - 100, y: 100 });
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [lastSeenCount, setLastSeenCount] = useState(0);

  // Sürükleme Referansları
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // 🔥 1. AKILLI SAYAÇ MANTIĞI (Veritabanı Odaklı)
  useEffect(() => {
    let interval: any;

    const fetchDurationAndStartTimer = async () => {
        if (!sessionId) return;

        // Veritabanından oturumun ne zaman başladığını ve süresini çek
        const { data } = await supabase
            .from('sessions')
            .select('created_at, duration')
            .eq('qr_code', sessionId)
            .single();

        if (data) {
            const startTime = new Date(data.created_at).getTime();
            const durationMinutes = data.duration || 40; // Veri yoksa varsayılan 40
            const endTime = startTime + (durationMinutes * 60 * 1000);

            // Sayaç Fonksiyonu
            const updateTimer = () => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
                setSecondsLeft(remaining);
            };

            updateTimer(); // İlk açılışta hemen güncelle
            interval = setInterval(updateTimer, 1000); // Her saniye güncelle
        }
    };

    fetchDurationAndStartTimer();

    return () => { if (interval) clearInterval(interval); };
  }, [sessionId]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Pencere Modu Ayarları
  useEffect(() => {
    if (viewMode === 'NORMAL') window.electron?.setViewMode('TOOLBAR');
    if (viewMode === 'EXPANDED') window.electron?.setViewMode('EXPANDED');
    if (viewMode === 'MINI') window.electron?.setViewMode('MINI');

    if (viewMode !== 'MINI') window.electron?.setIgnoreMouse(false);
    if (viewMode === 'EXPANDED') setLastSeenCount(files.length);
  }, [viewMode, files.length]);

  const unreadCount = Math.max(0, files.length - lastSeenCount);

  // Mouse Davranışları
  const handleMouseEnter = () => window.electron?.setIgnoreMouse(false);
  const handleMouseLeave = () => { if (!isDragging.current && !selectedMedia) window.electron?.setIgnoreMouse(true); };

  // Sürükleme Mantığı
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...miniPos };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;
    setMiniPos({ x: initialPos.current.x + dx, y: initialPos.current.y + dy });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
    if (!hasMoved.current) setViewMode('NORMAL');
  };

  const getFileIcon = (type: string) => {
      if (type.includes('image')) return <Image size={20} className="text-purple-400"/>;
      if (type.includes('video')) return <Video size={20} className="text-red-400"/>;
      if (type === 'link') return <ExternalLink size={20} className="text-blue-400"/>;
      return <FileText size={20} className="text-cyan-400"/>;
  };

  const handleFileClick = (file: any) => {
    if (!file || !file.file_url) return;
    if (file.file_type.includes('image') || file.file_type.includes('video')) {
      setSelectedMedia(file);
      window.electron?.setIgnoreMouse(false);
    } else {
      let targetUrl = file.file_url.trim();
      if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
      window.electron?.openExternal(targetUrl);
    }
  };

  const closeMedia = () => { setSelectedMedia(null); if (viewMode === 'MINI') window.electron?.setIgnoreMouse(true); };

  // --- GÖRÜNÜM 1: MİNİ MOD ---
  if (viewMode === 'MINI') {
    return (
      <>
        {selectedMedia && <MediaViewer file={selectedMedia} onClose={closeMedia} />}
        <div style={{ left: miniPos.x, top: miniPos.y }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} className="fixed w-[70px] h-[70px] flex items-center justify-center select-none z-[9999]">
          <div className="relative w-14 h-14 bg-slate-900/90 rounded-full border-4 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center animate-pulse hover:scale-105 active:scale-95 transition cursor-move">
            <Lock size={20} className="text-cyan-400 pointer-events-none" />
            {unreadCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce">{unreadCount}</span>)}
          </div>
        </div>
      </>
    );
  }

  // --- GÖRÜNÜM 2: NORMAL & EXPANDED MOD ---
  return (
    <>
      {selectedMedia && <MediaViewer file={selectedMedia} onClose={closeMedia} />}
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className={`fixed top-0 left-1/2 -translate-x-1/2 w-[530px] flex flex-col bg-slate-900 text-white border-b-4 border-cyan-500 shadow-2xl overflow-hidden rounded-b-xl transition-all duration-300 ease-in-out z-[9998] ${viewMode === 'EXPANDED' ? 'h-[600px]' : 'h-[180px]'}`}>
        <div className={`h-[180px] flex flex-col px-4 pb-4 justify-between shrink-0 transition-all ${announcement ? 'pt-12' : 'pt-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 select-none">
               <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center"><Unlock size={20}/></div>
               <div>
                   {/* 🔥 DİNAMİK İSİM VE DERS BİLGİSİ */}
                   <h2 className="font-bold text-lg leading-none">{teacherName || 'Misafir Öğretmen'}</h2>
                   <span className="text-xs text-green-400 font-mono tracking-wide mt-1 block">{scheduleStatus || 'Sistem Aktif'}</span>
               </div>
            </div>
            <div className="flex gap-3"> 
               <button onClick={() => setViewMode(viewMode === 'EXPANDED' ? 'NORMAL' : 'EXPANDED')} className={`relative p-3 rounded-lg flex items-center gap-2 transition hover:brightness-110 active:scale-95 ${viewMode === 'EXPANDED' ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}><FolderOpen size={18}/>{unreadCount > 0 && (<span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-lg animate-pulse">{unreadCount}</span>)}</button>
               <button onClick={() => setViewMode('MINI')} className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 flex items-center gap-2 hover:brightness-110 active:scale-95"><ChevronDown size={18}/> Gizle</button>
               <button onClick={() => lock()} className="p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-lg hover:bg-red-500 hover:text-white flex items-center gap-2 font-bold hover:brightness-110 active:scale-95"><Lock size={18}/></button>
            </div>
          </div>
          {/* 🔥 AKILLI SAYAÇ GÖSTERİMİ */}
          <div className="mt-2 bg-black/40 p-3 rounded-lg border border-white/10 flex items-center justify-center select-none"><span className="font-mono text-4xl font-bold text-yellow-400 tracking-wider drop-shadow-md">{formatTime(secondsLeft)}</span></div>
        </div>
        
        {viewMode === 'EXPANDED' && (
          <div className="flex-1 bg-slate-950 p-4 overflow-y-auto border-t border-white/10 custom-scrollbar flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider sticky top-0 bg-slate-950 pb-2 z-10">Paylaşılan İçerikler</h3>
            {files.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50"><FolderOpen size={48} className="mb-2"/><p>Henüz dosya yok.</p></div> : 
              files.map((file, i) => (
                <div key={i} onClick={() => handleFileClick(file)} className="group flex gap-3 bg-slate-800 hover:bg-slate-700 p-3 rounded-xl cursor-pointer transition-all border border-white/5 hover:border-cyan-500/30 hover:shadow-lg active:scale-[0.98]">
                  <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/10 transition">{getFileIcon(file.file_type || 'file')}</div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center"><div className="text-sm font-bold text-white truncate">{file.file_name || 'İsimsiz Dosya'}</div><div className="flex justify-between items-center mt-1"><span className="text-[10px] text-slate-400 uppercase font-bold bg-slate-900 px-1.5 py-0.5 rounded">{file.sender_name || 'Öğretmen'}</span><span className="text-[10px] text-slate-500">{new Date(file.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div>
                  <div className="flex items-center justify-center text-slate-500 group-hover:text-cyan-400 opacity-50 group-hover:opacity-100 transition">{(file.file_type.includes('image') || file.file_type.includes('video')) ? <Play size={18}/> : file.file_type === 'link' ? <ExternalLink size={18}/> : <Download size={18}/>}</div>
                </div>
              ))
            }
          </div>
        )}
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; borderRadius: 3px; }`}</style>
    </>
  );
}

const MediaViewer = ({ file, onClose }: { file: any, onClose: () => void }) => {
  useEffect(() => { const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', handleEsc); return () => window.removeEventListener('keydown', handleEsc); }, []);
  const isVideo = file.file_type.includes('video');
  const openOriginal = () => { let targetUrl = file.file_url; if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl; window.electron?.openExternal(targetUrl); };
  return ( <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300"> <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-linear-to-b from-black/80 to-transparent z-10"> <div className="text-white font-bold truncate max-w-[80%] pl-4">{file.file_name} <span className="text-xs text-slate-400 ml-2">({file.sender_name})</span></div> <button onClick={onClose} className="p-3 bg-white/10 hover:bg-red-500 rounded-full text-white transition backdrop-blur-sm"><X size={24} /></button> </div> <div className="w-full h-full flex items-center justify-center p-4 md:p-10"> {isVideo ? <video src={file.file_url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"/> : <img src={file.file_url} alt="View" className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]"/>} </div> <div className="absolute bottom-10 flex gap-4"><button onClick={openOriginal} className="flex items-center gap-2 bg-slate-800 hover:bg-cyan-600 px-6 py-3 rounded-full text-white font-bold transition shadow-lg border border-white/10"><Download size={20}/> Orijinali İndir / Aç</button></div> </div> );
};
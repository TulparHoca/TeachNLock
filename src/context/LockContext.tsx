import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ SUPABASE BİLGİLERİN
const supabaseUrl = 'https://raawrpvdlduvazxincdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYXdycHZkbGR1dmF6eGluY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjU4NjYsImV4cCI6MjA3OTg0MTg2Nn0.S9Iogzz6rCp-gOy0pa2s8RHYyxEgGmAv6DopNAEbnvE';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true }
});

// Ses dosyalarını sadece Client tarafında oluştur (SSR hatasını önler)
const sfx = typeof window !== 'undefined' ? {
  unlock: new Audio('./sounds/unlock.mp3'),
  lock: new Audio('./sounds/lock.mp3'),
  file: new Audio('./sounds/file.mp3'),
  alarm: new Audio('./sounds/alarm.mp3')
} : null;

interface LockContextType {
  isLocked: boolean; isSetupRequired: boolean; sessionId: string; machineId: string; announcement: string; files: any[]; teacherName: string; scheduleStatus: string;
  unlock: (fromRemote?: boolean, teacherNameVal?: string) => void;
  lock: (fromRemote?: boolean) => void;
  saveBoardName: (name: string) => Promise<void>; markFilesAsRead: () => void; playErrorSound: () => void;
}

const LockContext = createContext<LockContextType | null>(null);

export const LockProvider = ({ children }: { children: ReactNode }) => {
  const [isLocked, setIsLocked] = useState(true);
  const isLockedRef = useRef(true); 

  const [, setInitializing] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [announcement, setAnnouncement] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState(""); 
  const [scheduleStatus, setScheduleStatus] = useState("SERBEST ZAMAN");

  const lastCommandTime = useRef<number>(0);
  const sessionIdRef = useRef(''); 

  const playSoundSafe = useCallback((type: 'unlock' | 'lock' | 'file' | 'alarm') => { 
      if (!sfx || !sfx[type]) return;
      try { 
        const audio = sfx[type];
        audio.pause(); 
        audio.currentTime = 0; 
        audio.play().catch(() => {}); 
      } catch (e) {} 
  }, []);

  const updateLockState = useCallback((locked: boolean) => {
      setIsLocked(locked);
      isLockedRef.current = locked; 
  }, []);

  // 1. SİSTEM BAŞLANGICI VE KİMLİK OLUŞTURMA
  useEffect(() => {
    const initSystem = async () => {
      let newSessionId = sessionIdRef.current;
      if (!newSessionId) {
          newSessionId = self.crypto.randomUUID(); 
          setSessionId(newSessionId);
          sessionIdRef.current = newSessionId;
      }

      let currentMachineId = 'BROWSER_DEV_ID';
      // Electron kontrolü
      if (typeof window !== 'undefined' && (window as any).electron?.getMachineId) {
        try { currentMachineId = await (window as any).electron.getMachineId(); } catch (e) {}
      }
      setMachineId(currentMachineId);

      const { data: existingBoard } = await supabase.from('boards').select('name, announcement, is_locked').eq('machine_id', currentMachineId).single();
      const { data: schoolSettings } = await supabase.from('school_settings').select('system_command, announcement').limit(1).single();
      
      if (schoolSettings && schoolSettings.announcement) setAnnouncement(schoolSettings.announcement);
      
      if (!existingBoard) {
        await supabase.from('boards').upsert({ machine_id: currentMachineId, is_active: true, is_locked: true, last_seen: new Date().toISOString() });
        setIsSetupRequired(true); 
        updateLockState(true);
      } else {
        if (!existingBoard.name) setIsSetupRequired(true);
        if (existingBoard.announcement) setAnnouncement(existingBoard.announcement);
        // Tahta açıldığında durumu güncelle ama kilit komutunu sıfırla
        await supabase.from('boards').update({ is_active: true, last_seen: new Date().toISOString(), is_locked: true }).eq('machine_id', currentMachineId);
        updateLockState(true);
      }
      
      await supabase.from('sessions').insert([{ qr_code: newSessionId, status: 'LOCKED', created_at: new Date().toISOString() }]);
      setInitializing(false);
    };
    
    initSystem();
  }, [updateLockState]); 

  // Kilit Açma / Kapama Fonksiyonları (useCallback ile stabilize edildi)
  const unlock = useCallback(async (_fromRemote = false, teacherNameVal?: string) => {
    const now = Date.now();
    // Spam koruması: Eğer son 1 saniye içinde komut geldiyse yoksay
    if (now - lastCommandTime.current < 1000) return;
    lastCommandTime.current = now;

    if (teacherNameVal) setTeacherName(teacherNameVal);
    else if (!teacherName) setTeacherName("Nöbetçi Öğretmen");

    if (!isLockedRef.current) return; // Zaten açıksa işlem yapma
    
    updateLockState(false); 
    (window as any).electron?.setViewMode('MINI'); 
    playSoundSafe('unlock');
    
    const currentSessId = sessionIdRef.current;
    if (currentSessId) {
        const updateData: any = { status: 'OPEN', created_at: new Date().toISOString() };
        if (teacherNameVal) updateData.teacher_name = teacherNameVal;
        await supabase.from('sessions').update(updateData).eq('qr_code', currentSessId);
    }
    // Board tablosunu güncelle ama 'lock_command'ı null yap ki loop'a girmesin
    if (machineId) supabase.from('boards').update({ is_locked: false, lock_command: null }).eq('machine_id', machineId).then();
  }, [machineId, teacherName, playSoundSafe, updateLockState]);

  const lock = useCallback((_fromRemote = false, remainingSeconds?: number) => {
    const now = Date.now();
    if (now - lastCommandTime.current < 1000) return;
    lastCommandTime.current = now;

    if (isLockedRef.current) return;
    
    console.log("🔒 Kilitleniyor...");
    updateLockState(true); 
    setTeacherName(""); 
    (window as any).electron?.setViewMode('LOCKED'); 
    playSoundSafe('lock');
    
    const currentSessId = sessionIdRef.current;
    if (machineId) supabase.from('boards').update({ is_locked: true, lock_command: null }).eq('machine_id', machineId).then();
    
    if (currentSessId) {
        const updateData: any = { status: 'LOCKED' };
        if (remainingSeconds !== undefined && remainingSeconds > 0) {
            const remainingMinutes = Math.ceil(remainingSeconds / 60);
            updateData.duration = remainingMinutes;
        }
        supabase.from('sessions').update(updateData).eq('qr_code', currentSessId).then();
    }
  }, [machineId, playSoundSafe, updateLockState]);

  // 🔥 2. USB DİNLEYİCİSİ (FIXED: ARTIK TEMİZLENİYOR!)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron?.onUsbStatus) {
       // Bu fonksiyon clean-up için bir "unsubscribe" fonksiyonu döndürmeli
       // Eğer preload.js'in bunu desteklemiyorsa bile bu yapı daha güvenli
       const removeListener = (window as any).electron.onUsbStatus(async (response: any) => { 
           console.log("🔌 USB Sinyali:", response?.status);

           if (response?.status === 'INSERTED') {
               const incomingName = response.data?.teacher_name || "Misafir Öğretmen";
               if (isLockedRef.current) {
                   console.log("🔓 USB ile Açılıyor...");
                   unlock(false, incomingName);
               }
           }
       });

       // CLEANUP FONKSİYONU: Component silinince veya machineId değişince dinleyiciyi kaldır
       return () => {
           if (removeListener && typeof removeListener === 'function') {
               removeListener();
           } else if ((window as any).electron?.removeUsbListener) {
               // Eğer removeListener dönmüyorsa, manuel silme metodu varsa onu çağır
               (window as any).electron.removeUsbListener();
           }
       };
    }
  }, [machineId, unlock]); 

  // 🔥 3. REALTIME (FIXED: TEKİL KANAL YÖNETİMİ)
  useEffect(() => {
    if (!sessionId || !machineId) return;
    
    // Dosyaları ilk başta çek
    supabase.from('files').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).then(({ data }) => { if (data) setFiles(data); });

    const channel = supabase.channel(`system_sync_${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `qr_code=eq.${sessionId}` }, (payload: any) => {
          if (payload.new.status === 'OPEN' && isLockedRef.current) {
              unlock(true, payload.new.teacher_name);
          }
          if (payload.new.status === 'LOCKED' && !isLockedRef.current) { 
              lock(true); 
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards', filter: `machine_id=eq.${machineId}` }, (payload: any) => {
          if (payload.new.announcement !== undefined) setAnnouncement(payload.new.announcement || "");
          
          // Sadece "lock_command" varsa işlem yap, yoksa (null ise) yapma
          if (payload.new.lock_command === 'UNLOCK' && isLockedRef.current) {
              unlock(true);
          }
          if (payload.new.lock_command === 'LOCK' && !isLockedRef.current) {
               lock(true);
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'school_settings' }, (payload: any) => {
          if (payload.new.announcement !== undefined) setAnnouncement(payload.new.announcement || "");
          if (payload.new.system_command === 'SHUTDOWN_ALL') { 
              playSoundSafe('alarm'); 
              if ((window as any).electron) setTimeout(() => { (window as any).electron.shutdownPC(); }, 2000); 
          }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'files', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
          setFiles(prev => [payload.new, ...prev]); 
          playSoundSafe('file');
      })
      .subscribe();

    // CLEANUP: Kanalı mutlaka kapat
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, machineId, unlock, lock, playSoundSafe]); 

  // 4. DERS PROGRAMI (Aynı mantık, sadece interval temizliği garanti edildi)
  useEffect(() => {
    const calculateSchedule = async () => {
        try {
            const today = new Date(); const isFriday = today.getDay() === 5;
            const { data: schedule } = await supabase.from('lecture_schedule').select('*').eq('is_friday', isFriday).order('start_time');
            if (!schedule || schedule.length === 0) { setScheduleStatus("SERBEST ZAMAN"); return; }
            const nowStr = today.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const currentSlot = schedule.find(s => nowStr >= s.start_time.slice(0,5) && nowStr <= s.end_time.slice(0,5));
            if (currentSlot) {
                setScheduleStatus(currentSlot.name.toUpperCase());
            } else setScheduleStatus("SERBEST ZAMAN");
        } catch (e) { setScheduleStatus("SERBEST ZAMAN"); }
    };
    calculateSchedule();
    const interval = setInterval(calculateSchedule, 30000); 
    return () => clearInterval(interval);
  }, []);

  const saveBoardName = async (name: string) => { if (!machineId) return; await supabase.from('boards').update({ name }).eq('machine_id', machineId); setIsSetupRequired(false); };
  const markFilesAsRead = () => {};
  const playErrorSound = () => { playSoundSafe('alarm'); };

  return (
    <LockContext.Provider value={{ isLocked, isSetupRequired, sessionId, machineId, announcement, files, teacherName, scheduleStatus, unlock, lock, saveBoardName, markFilesAsRead, playErrorSound }}>
      {children}
    </LockContext.Provider>
  );
};

export const useLock = () => { const context = useContext(LockContext); if (!context) throw new Error("useLock must be used within LockProvider"); return context; };
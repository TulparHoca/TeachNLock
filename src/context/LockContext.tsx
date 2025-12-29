import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ SUPABASE BİLGİLERİN
const supabaseUrl = 'https://raawrpvdlduvazxincdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYXdycHZkbGR1dmF6eGluY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjU4NjYsImV4cCI6MjA3OTg0MTg2Nn0.S9Iogzz6rCp-gOy0pa2s8RHYyxEgGmAv6DopNAEbnvE';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true }
});

const sfx = {
  unlock: typeof window !== 'undefined' ? new Audio('./sounds/unlock.mp3') : null, 
  lock: typeof window !== 'undefined' ? new Audio('./sounds/lock.mp3') : null,
  file: typeof window !== 'undefined' ? new Audio('./sounds/file.mp3') : null,
  alarm: typeof window !== 'undefined' ? new Audio('./sounds/alarm.mp3') : null
};

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
  
  const [initializing, setInitializing] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [announcement, setAnnouncement] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState(""); 
  const [scheduleStatus, setScheduleStatus] = useState("SERBEST ZAMAN");

  const lastCommandTime = useRef<number>(0);
  const sessionIdRef = useRef(''); 

  const playSoundSafe = (audioObj: HTMLAudioElement | null) => { 
      if (!audioObj) return;
      try { audioObj.pause(); audioObj.currentTime = 0; audioObj.play().catch(() => {}); } catch (e) {} 
  };

  const updateLockState = (locked: boolean) => {
      setIsLocked(locked);
      isLockedRef.current = locked; 
  };

  // 1. BAŞLANGIÇ
  useEffect(() => {
    const initSystem = async () => {
      const newSessionId = self.crypto.randomUUID(); 
      setSessionId(newSessionId);
      sessionIdRef.current = newSessionId; 

      let currentMachineId = 'BROWSER_DEV_ID';
      if (typeof window !== 'undefined' && (window as any).electron?.getMachineId) {
        try { currentMachineId = await (window as any).electron.getMachineId(); } catch (e) {}
      }
      setMachineId(currentMachineId);

      const { data: existingBoard } = await supabase.from('boards').select('name, announcement, is_locked').eq('machine_id', currentMachineId).single();
      const { data: schoolSettings } = await supabase.from('school_settings').select('system_command, announcement').limit(1).single();
      
      if (schoolSettings && schoolSettings.announcement) setAnnouncement(schoolSettings.announcement);
      
      if (!existingBoard) {
        await supabase.from('boards').upsert({ machine_id: currentMachineId, is_active: true, is_locked: true, last_seen: new Date().toISOString() });
        setIsSetupRequired(true); updateLockState(true);
      } else {
        if (!existingBoard.name) setIsSetupRequired(true);
        if (existingBoard.announcement) setAnnouncement(existingBoard.announcement);
        await supabase.from('boards').update({ is_active: true, last_seen: new Date().toISOString(), is_locked: true, lock_command: 'LOCK' }).eq('machine_id', currentMachineId);
        updateLockState(true);
      }
      
      await supabase.from('sessions').insert([{ qr_code: newSessionId, status: 'LOCKED', created_at: new Date().toISOString() }]);
      setInitializing(false);
    };
    initSystem();
  }, []); 

  // 🔥 2. DEBUG İÇİN GÜÇLENDİRİLMİŞ USB DİNLEYİCİ
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron?.onUsbStatus) {
       (window as any).electron.onUsbStatus(async (response: any) => { 
           // USB'den gelen her sinyali konsola yazdır
           console.log("🔌 USB Sinyali Geldi:", response);

           if (response?.status === 'INSERTED') {
               console.error("🚨 SUÇLU BULUNDU: Main.js 'USB Takıldı' sinyali gönderiyor!");
               console.error("🚨 Veri:", response.data);
               
               let incomingName = "Misafir Öğretmen"; 
               if (response.data) incomingName = response.data.teacher_name || incomingName;
               
               if (isLockedRef.current) {
                   console.log("🔓 Kilit Açılıyor (Kaynak: USB)");
                   unlock(false, incomingName);
               }
           }
       });
    }
  }, [machineId]); 

  // 🔥 3. DEBUG İÇİN GÜÇLENDİRİLMİŞ REALTIME
  useEffect(() => {
    if (!sessionId || !machineId) return;
    
    supabase.from('files').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).then(({ data }) => { if (data) setFiles(data); });

    const channel = supabase.channel(`system_sync`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `qr_code=eq.${sessionId}` }, (payload: any) => {
          console.log("☁️ Veritabanı (Session) Güncellemesi:", payload.new);
          
          if (payload.new.status === 'OPEN') {
              console.error("🚨 SUÇLU BULUNDU: Veritabanı 'OPEN' emri gönderdi!");
              unlock(true, payload.new.teacher_name);
          }
          if (payload.new.status === 'LOCKED') { 
              if (!isLockedRef.current && shouldExecuteCommand()) lock(true); 
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards' }, (payload: any) => {
          console.log("☁️ Veritabanı (Board) Güncellemesi:", payload.new);

          if (payload.new.machine_id === machineId) {
             if (payload.new.announcement !== undefined) setAnnouncement(payload.new.announcement || "");
             
             if (payload.new.lock_command === 'UNLOCK' && isLockedRef.current && shouldExecuteCommand()) {
                 console.error("🚨 SUÇLU BULUNDU: Admin Paneli 'UNLOCK' emri gönderdi!");
                 unlock(true);
             }
             if (payload.new.lock_command === 'LOCK' && !isLockedRef.current && shouldExecuteCommand()) lock(true);
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'school_settings' }, (payload: any) => {
          if (payload.new.announcement !== undefined) setAnnouncement(payload.new.announcement || "");
          if (payload.new.system_command === 'SHUTDOWN_ALL') { 
              playSoundSafe(sfx.alarm); 
              if ((window as any).electron) setTimeout(() => { (window as any).electron.shutdownPC(); }, 2000); 
          }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'files', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
          setFiles(prev => [payload.new, ...prev]); playSoundSafe(sfx.file);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, machineId]); 

  // 4. DERS PROGRAMI
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

  const shouldExecuteCommand = () => {
      const now = Date.now();
      if (now - lastCommandTime.current < 2000) return false;
      lastCommandTime.current = now; return true;
  };

  const unlock = async (_fromRemote = false, teacherNameVal?: string) => {
    if (teacherNameVal) setTeacherName(teacherNameVal);
    else if (!teacherName) setTeacherName("Nöbetçi Öğretmen");

    if (!isLockedRef.current) return; // Zaten açıksa tekrar açma (Spam önle)
    
    if (initializing && !_fromRemote) return;
    
    updateLockState(false); 
    (window as any).electron?.setViewMode('MINI'); 
    playSoundSafe(sfx.unlock);
    
    const currentSessId = sessionIdRef.current || sessionId;
    if (currentSessId) {
        const updateData: any = { status: 'OPEN', created_at: new Date().toISOString() };
        if (teacherNameVal) updateData.teacher_name = teacherNameVal;
        await supabase.from('sessions').update(updateData).eq('qr_code', currentSessId);
    }
    if (machineId) supabase.from('boards').update({ is_locked: false, lock_command: null }).eq('machine_id', machineId).then();
  };

  const lock = (_fromRemote = false, remainingSeconds?: number) => {
    if (isLockedRef.current) return;
    
    console.log("🔒 Kilitleniyor...");

    updateLockState(true); 
    setTeacherName(""); 
    (window as any).electron?.setViewMode('LOCKED'); 
    playSoundSafe(sfx.lock);
    
    const currentSessId = sessionIdRef.current || sessionId;
    if (machineId) supabase.from('boards').update({ is_locked: true, lock_command: null }).eq('machine_id', machineId).then();
    
    if (currentSessId) {
        const updateData: any = { status: 'LOCKED' };
        if (remainingSeconds !== undefined && remainingSeconds > 0) {
            const remainingMinutes = Math.ceil(remainingSeconds / 60);
            updateData.duration = remainingMinutes;
        }
        supabase.from('sessions').update(updateData).eq('qr_code', currentSessId).then();
    }
  };
  
  const saveBoardName = async (name: string) => { if (!machineId) return; await supabase.from('boards').update({ name }).eq('machine_id', machineId); setIsSetupRequired(false); };
  const markFilesAsRead = () => {};
  const playErrorSound = () => { playSoundSafe(sfx.alarm); };

  return (
    <LockContext.Provider value={{ isLocked, isSetupRequired, sessionId, machineId, announcement, files, teacherName, scheduleStatus, unlock, lock, saveBoardName, markFilesAsRead, playErrorSound }}>
      {children}
    </LockContext.Provider>
  );
};
export const useLock = () => { const context = useContext(LockContext); if (!context) throw new Error("useLock must be used within LockProvider"); return context; };
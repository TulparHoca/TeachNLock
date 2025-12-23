import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../db';

const sfx = {
  unlock: new Audio('sounds/unlock.mp3'), 
  lock: new Audio('sounds/lock.mp3'),
  file: new Audio('sounds/file.mp3'),
  alarm: new Audio('sounds/alarm.mp3')
};

Object.values(sfx).forEach(sound => { sound.volume = 1.0; sound.load(); });

interface LockContextType {
  isLocked: boolean;
  isSetupRequired: boolean;
  sessionId: string;
  machineId: string;
  announcement: string;
  files: any[];
  teacherName: string;
  scheduleStatus: string;
  unlock: (fromRemote?: boolean) => void;
  lock: (fromRemote?: boolean) => void;
  saveBoardName: (name: string) => Promise<void>;
  markFilesAsRead: () => void;
  playErrorSound: () => void;
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
  
  const [scheduleStatus, setScheduleStatus] = useState("Serbest Zaman");

  const lastCommandTime = useRef<number>(0);

  const updateLockState = (locked: boolean) => {
      setIsLocked(locked);
      isLockedRef.current = locked; 
  };

  useEffect(() => {
    const initSystem = async () => {
      const newSessionId = self.crypto.randomUUID(); 
      setSessionId(newSessionId);

      let currentMachineId = 'BROWSER_DEV_ID';
      if (typeof window !== 'undefined' && window.electron?.getMachineId) {
        try { currentMachineId = await window.electron.getMachineId(); } catch (e) {}
      }
      setMachineId(currentMachineId);

      const { data: existingBoard } = await supabase
        .from('boards').select('name, announcement, is_locked').eq('machine_id', currentMachineId).single();

      if (!existingBoard) {
        await supabase.from('boards').upsert({ 
          machine_id: currentMachineId, is_active: true, is_locked: true, last_seen: new Date().toISOString()
        });
        setIsSetupRequired(true);
        updateLockState(true);
      } else {
        if (!existingBoard.name) setIsSetupRequired(true);
        await supabase.from('boards').update({ 
          is_active: true, last_seen: new Date().toISOString(), lock_command: null 
        }).eq('machine_id', currentMachineId);
        
        updateLockState(existingBoard.is_locked);
        if (existingBoard.announcement) setAnnouncement(existingBoard.announcement);
      }

      await supabase.from('sessions').insert([{ 
        qr_code: newSessionId, status: existingBoard?.is_locked ? 'LOCKED' : 'OPEN', created_at: new Date().toISOString()
      }]);

      setTimeout(() => setInitializing(false), 2000);
    };

    initSystem();

    if (typeof window !== 'undefined' && window.electron?.onUsbStatus) {
       window.electron.onUsbStatus((status: string) => { if (status === 'INSERTED') unlock(false); });
    }
  }, []);

  // --- 🔥 AKILLI DERS PROGRAMI GÜNCELLEMESİ (DÜZELTİLDİ) ---
  useEffect(() => {
    const fetchSchedule = async () => {
        try {
            const { data, error } = await supabase.rpc('get_current_lecture_status');
            
            if (!error && data) {
                let text = data.name; 
                
                if (data.status === 'IN_LECTURE' || data.status === 'BREAK_TIME') {
                    const kalan = Math.ceil(data.remaining_minutes);
                    
                    // 🔥 MANTIK FİLTRESİ: 
                    // Eğer kalan süre 90 dakikadan fazlaysa, bu teneffüs değil gece arasıdır.
                    // O yüzden sayaç gösterme, "Serbest Zaman" moduna geç.
                    if (kalan > 90) {
                        setScheduleStatus("Serbest Zaman");
                    } else {
                        text += ` (Kalan: ${kalan} dk)`;
                        setScheduleStatus(text);
                    }
                } else {
                    setScheduleStatus(text);
                }
            } else {
                setScheduleStatus("Serbest Zaman");
            }
        } catch (e) {
            setScheduleStatus("Serbest Zaman");
        }
    };
    
    fetchSchedule(); 
    const interval = setInterval(fetchSchedule, 60 * 1000); 
    return () => clearInterval(interval);
  }, []);

  const shouldExecuteCommand = () => {
      const now = Date.now();
      if (now - lastCommandTime.current < 2000) return false;
      lastCommandTime.current = now;
      return true;
  };

  useEffect(() => {
    if (!sessionId || !machineId) return;

    supabase.from('files').select('*').eq('session_id', sessionId).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setFiles(data); });

    const channel = supabase.channel(`system_sync`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `qr_code=eq.${sessionId}` }, (payload: any) => {
          if (payload.new.status === 'OPEN') {
              if (isLockedRef.current) {
                  if (payload.new.teacher_name) setTeacherName(payload.new.teacher_name);
                  unlock(true);
              }
          }
          if (payload.new.status === 'LOCKED') {
              if (!isLockedRef.current) {
                   if(shouldExecuteCommand()) lock(true);
              }
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards' }, (payload: any) => {
          if (payload.new.machine_id === machineId) {
             if (payload.new.announcement !== undefined) setAnnouncement(payload.new.announcement);
             
             if (payload.new.lock_command === 'UNLOCK') {
                 if (isLockedRef.current && shouldExecuteCommand()) unlock(true);
             }
             if (payload.new.lock_command === 'LOCK') {
                 if (!isLockedRef.current && shouldExecuteCommand()) lock(true);
             }
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'school_settings', filter: 'id=eq.1' }, (payload: any) => {
          setAnnouncement(payload.new.announcement || ""); 
          if (payload.new.announcement) { playSoundSafe(sfx.file); }
          if (payload.new.system_command === 'SHUTDOWN_ALL') { 
              playSoundSafe(sfx.alarm); 
              setTimeout(() => { window.electron?.shutdownPC(); }, 3000); 
          }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'files', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
          setFiles(prev => [payload.new, ...prev]);
          playSoundSafe(sfx.file);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, machineId]);

  useEffect(() => {
    if (!machineId) return;
    const checkTimeIntegrity = async () => {
      if (isLockedRef.current) return;
      try {
        const { data: session } = await supabase.from('sessions').select('created_at, duration, status').eq('qr_code', sessionId).single();
        if (session && session.status === 'OPEN') {
           const startTime = new Date(session.created_at).getTime();
           const durationMs = (session.duration || 40) * 60 * 1000;
           if (Date.now() > startTime + durationMs) { lock(true); return; }
           if (Date.now() < startTime - (5 * 60 * 1000)) { playSoundSafe(sfx.alarm); } 
        }
      } catch (err) {}
    };
    const timer = setInterval(checkTimeIntegrity, 60 * 1000);
    return () => clearInterval(timer);
  }, [isLocked, sessionId, machineId]);

  const playSoundSafe = (audioObj: HTMLAudioElement) => {
    try { audioObj.pause(); audioObj.currentTime = 0; audioObj.play().catch(() => {}); } catch (e) {}
  };

  const unlock = async (fromRemote = false) => {
    if (!isLockedRef.current) return;
    if (initializing && !fromRemote) return;
    updateLockState(false); 
    window.electron?.setViewMode('MINI'); 
    playSoundSafe(sfx.unlock);
    if (sessionId) await supabase.from('sessions').update({ status: 'OPEN', created_at: new Date().toISOString() }).eq('qr_code', sessionId);
    if (machineId) supabase.from('boards').update({ is_locked: false, lock_command: null }).eq('machine_id', machineId).then();
  };

  const lock = (fromRemote = false) => {
    if (isLockedRef.current) return;
    updateLockState(true); 
    setTeacherName(""); 
    window.electron?.setViewMode('LOCKED');
    playSoundSafe(sfx.lock);
    if (machineId) supabase.from('boards').update({ is_locked: true, lock_command: null }).eq('machine_id', machineId).then();
    if (!fromRemote && sessionId) supabase.from('sessions').update({ status: 'LOCKED' }).eq('qr_code', sessionId).then();
  };

  const saveBoardName = async (name: string) => { 
      if (!machineId) return;
      await supabase.from('boards').update({ name }).eq('machine_id', machineId);
      setIsSetupRequired(false);
  };
  const markFilesAsRead = () => {};
  const playErrorSound = () => { playSoundSafe(sfx.alarm); };

  return (
    <LockContext.Provider value={{ isLocked, isSetupRequired, sessionId, machineId, announcement, files, teacherName, scheduleStatus, unlock, lock, saveBoardName, markFilesAsRead, playErrorSound }}>
      {children}
    </LockContext.Provider>
  );
};

export const useLock = () => {
  const context = useContext(LockContext);
  if (!context) throw new Error("useLock must be used within LockProvider");
  return context;
};
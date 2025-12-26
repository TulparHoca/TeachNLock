import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../db';

// Ses Efektleri
const sfx = {
  unlock: new Audio('sounds/unlock.mp3'), 
  lock: new Audio('sounds/lock.mp3'),
  file: new Audio('sounds/file.mp3'),
  alarm: new Audio('sounds/alarm.mp3')
};

if (typeof window !== 'undefined') {
    Object.values(sfx).forEach(sound => { sound.volume = 1.0; sound.load(); });
}

interface LockContextType {
  isLocked: boolean;
  isSetupRequired: boolean;
  sessionId: string;
  machineId: string;
  announcement: string;
  files: any[];
  teacherName: string;
  scheduleStatus: string;
  unlock: (fromRemote?: boolean, teacherNameVal?: string) => void;
  lock: (fromRemote?: boolean) => void;
  saveBoardName: (name: string) => Promise<void>;
  markFilesAsRead: () => void;
  playErrorSound: () => void;
}

const LockContext = createContext<LockContextType | null>(null);

export const LockProvider = ({ children }: { children: ReactNode }) => {
  const [isLocked, setIsLocked] = useState(true);
  const isLockedRef = useRef(true); 

  // Oturumu kim açtı? ('USB' | 'REMOTE' | null)
  const openedByRef = useRef<'USB' | 'REMOTE' | null>(null);

  const [initializing, setInitializing] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [announcement, setAnnouncement] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState(""); 
  
  const [scheduleStatus, setScheduleStatus] = useState("SERBEST ZAMAN");

  const lastCommandTime = useRef<number>(0);
  const lastSystemCommandRef = useRef<string | null>(null);
  const sessionIdRef = useRef(''); 

  const updateLockState = (locked: boolean) => {
      setIsLocked(locked);
      isLockedRef.current = locked; 
  };

  // --- 1. SİSTEM BAŞLANGICI ---
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

      // Veritabanı Kontrolü
      const { data: existingBoard } = await supabase
        .from('boards').select('name, announcement, is_locked').eq('machine_id', currentMachineId).single();

      const { data: schoolSettings } = await supabase
        .from('school_settings').select('system_command, announcement').eq('id', 1).single();
      
      // Global Duyuru ve Komutlar
      if (schoolSettings) {
          lastSystemCommandRef.current = schoolSettings.system_command; 
          if (schoolSettings.announcement) setAnnouncement(schoolSettings.announcement);
      }

      if (!existingBoard) {
        // Yeni Tahta Kaydı
        await supabase.from('boards').upsert({ 
          machine_id: currentMachineId, is_active: true, is_locked: true, last_seen: new Date().toISOString()
        });
        setIsSetupRequired(true);
        updateLockState(true);
      } else {
        // Mevcut Tahta
        if (!existingBoard.name) setIsSetupRequired(true);
        
        // Tahtaya Özel Duyuru Varsa, Globali Ez
        if (existingBoard.announcement) setAnnouncement(existingBoard.announcement);

        // Güvenlik: Başlangıçta veritabanını kilitle
        await supabase.from('boards').update({ 
          is_active: true, last_seen: new Date().toISOString(), is_locked: true, lock_command: 'LOCK'
        }).eq('machine_id', currentMachineId);
        
        updateLockState(true);
      }

      await supabase.from('sessions').insert([{ 
        qr_code: newSessionId, status: 'LOCKED', created_at: new Date().toISOString()
      }]);

      setInitializing(false);
    };

    initSystem();
  }, []); 


  // --- 2. USB ve REALTIME DİNLEYİCİSİ ---
  useEffect(() => {
    // A) USB Dinleyicisi
    if (typeof window !== 'undefined' && (window as any).electron?.onUsbStatus) {
       (window as any).electron.onUsbStatus(async (response: any) => { 
           
           // USB ÇIKARILDI -> KİLİTLE
           if (response?.status === 'REMOVED') {
               // Sadece oturum USB ile açıldıysa kilitle!
               if (!isLockedRef.current && openedByRef.current === 'USB') {
                   lock(false);
               }
               return;
           }

           // USB TAKILDI -> KİLİT AÇ
           let incomingName = "Misafir Öğretmen";
           let teacherUsername = "unknown";
           
           if (response?.status === 'INSERTED' && response.data) {
               incomingName = response.data.teacher_name || incomingName;
               teacherUsername = response.data.teacher_username || teacherUsername;
           }

           if (response?.status === 'INSERTED') {
               if (!isLockedRef.current && openedByRef.current === 'USB') return;

               console.log("🔑 USB Anahtar Algılandı:", incomingName);
               setTeacherName(incomingName);

               if (navigator.onLine && machineId) {
                   supabase.from('board_logs').insert([{
                        machine_id: machineId,
                        teacher_username: teacherUsername,
                        action_type: 'USB_UNLOCK',
                        details: `${incomingName} tarafından USB ile fiziksel erişim sağlandı.`
                   }]).then();
               }

               // USB ile açıldığını belirt
               unlock(false, incomingName, 'USB');
           }
       });
    }

    // B) Supabase Realtime
    if (!sessionId || !machineId) return;

    // Dosyaları çek
    supabase.from('files').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).then(({ data }) => { if (data) setFiles(data); });

    const channel = supabase.channel(`system_sync`)
      
      // 1. QR KOD DURUMU (QR İLE AÇMA)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `qr_code=eq.${sessionId}` }, (payload: any) => {
          console.log("🔔 Session Update:", payload.new.status); // Debug
          
          if (payload.new.status === 'OPEN') {
              // 🔥 DÜZELTME: QR Sinyali Geldiğinde KİLİDİ AÇ
              unlock(true, payload.new.teacher_name, 'REMOTE');
          }
          if (payload.new.status === 'LOCKED') {
              if (!isLockedRef.current && shouldExecuteCommand()) lock(true);
          }
      })

      // 2. TAHTA KOMUTLARI VE DUYURU (Boards Tablosu)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards' }, (payload: any) => {
          if (payload.new.machine_id === machineId) {
             
             // 🔥 DÜZELTME: DUYURU SİLME (NULL KONTROLÜ)
             // Payload içinde 'announcement' anahtarı varsa (null olsa bile) işleme al.
             if (Object.prototype.hasOwnProperty.call(payload.new, 'announcement')) {
                 const text = payload.new.announcement || ""; // Null ise boş string yap
                 console.log("📢 Duyuru Güncellendi:", text);
                 setAnnouncement(text);
             }

             if (payload.new.lock_command === 'UNLOCK' && isLockedRef.current && shouldExecuteCommand()) unlock(true, undefined, 'REMOTE');
             if (payload.new.lock_command === 'LOCK' && !isLockedRef.current && shouldExecuteCommand()) lock(true);
          }
      })

      // 3. GLOBAL AYARLAR (School Settings)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'school_settings', filter: 'id=eq.1' }, (payload: any) => {
          // Global duyuru da boş gelebilir
          if (Object.prototype.hasOwnProperty.call(payload.new, 'announcement')) {
              setAnnouncement(payload.new.announcement || "");
          }
          
          const newCommand = payload.new.system_command;
          if (newCommand && newCommand !== lastSystemCommandRef.current) {
              if (newCommand === 'SHUTDOWN_ALL') { 
                  playSoundSafe(sfx.alarm); 
                  setTimeout(() => { (window as any).electron?.shutdownPC(); }, 3000); 
              }
              lastSystemCommandRef.current = newCommand;
          }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'files', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
          setFiles(prev => [payload.new, ...prev]); 
          playSoundSafe(sfx.file);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, machineId]); 


  // --- 3. DERS PROGRAMI ---
  useEffect(() => {
    const calculateSchedule = async () => {
        try {
            const today = new Date();
            const isFriday = today.getDay() === 5;
            const { data: schedule } = await supabase.from('lecture_schedule').select('*').eq('is_friday', isFriday).order('start_time');
            if (!schedule || schedule.length === 0) { setScheduleStatus("SERBEST ZAMAN"); return; }
            
            const nowStr = today.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const currentSlot = schedule.find(s => nowStr >= s.start_time.slice(0,5) && nowStr <= s.end_time.slice(0,5));

            if (currentSlot) {
                const [endH, endM] = currentSlot.end_time.split(':').map(Number);
                const endTimeDate = new Date(); endTimeDate.setHours(endH, endM, 0);
                const diffMs = endTimeDate.getTime() - today.getTime();
                const remainingMins = Math.ceil(diffMs / 60000);
                
                let statusText = currentSlot.name.toUpperCase();
                if (currentSlot.type === 'LUNCH') statusText = "ÖĞLE ARASI";
                if (currentSlot.type === 'BREAK') statusText = "TENEFFÜS";
                
                if (remainingMins > 0 && remainingMins < 120) setScheduleStatus(`${statusText} (Kalan: ${remainingMins} dk)`);
                else setScheduleStatus(statusText);
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
      lastCommandTime.current = now;
      return true;
  };

  const playSoundSafe = (audioObj: HTMLAudioElement) => {
    try { audioObj.pause(); audioObj.currentTime = 0; audioObj.play().catch(() => {}); } catch (e) {}
  };

  // 🔥 GÜNCELLENMİŞ UNLOCK FONKSİYONU
  const unlock = async (_fromRemote = false, teacherNameVal?: string, type: 'USB' | 'REMOTE' = 'REMOTE') => {
    if (teacherNameVal) setTeacherName(teacherNameVal);
    
    // Zaten açıksa tekrar açma (sadece ismi güncelle)
    if (!isLockedRef.current) {
        if (sessionIdRef.current && teacherNameVal) {
             supabase.from('sessions').update({ teacher_name: teacherNameVal }).eq('qr_code', sessionIdRef.current).then();
        }
        return;
    }

    // 🔥 KRİTİK DÜZELTME: QR İle Açılış (REMOTE) veya USB ise Initializing'i Takma
    if (initializing && type !== 'USB' && type !== 'REMOTE') return;
    
    openedByRef.current = type;
    console.log(`🔓 Kilit açılıyor... Yöntem: ${type}`);

    updateLockState(false); 
    (window as any).electron?.setViewMode('MINI'); 
    playSoundSafe(sfx.unlock);
    
    // DB Güncelle
    const currentSessId = sessionIdRef.current || sessionId;
    if (currentSessId) {
        const updateData: any = { status: 'OPEN', created_at: new Date().toISOString() };
        if (teacherNameVal) updateData.teacher_name = teacherNameVal;
        await supabase.from('sessions').update(updateData).eq('qr_code', currentSessId);
    }
    if (machineId) supabase.from('boards').update({ is_locked: false, lock_command: null }).eq('machine_id', machineId).then();
  };

  const lock = (fromRemote = false) => {
    if (isLockedRef.current) return;
    
    updateLockState(true); 
    setTeacherName(""); 
    openedByRef.current = null; // Yöntemi sıfırla

    (window as any).electron?.setViewMode('LOCKED');
    playSoundSafe(sfx.lock);
    
    const currentSessId = sessionIdRef.current || sessionId;
    if (machineId) supabase.from('boards').update({ is_locked: true, lock_command: null }).eq('machine_id', machineId).then();
    if (!fromRemote && currentSessId) supabase.from('sessions').update({ status: 'LOCKED' }).eq('qr_code', currentSessId).then();
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
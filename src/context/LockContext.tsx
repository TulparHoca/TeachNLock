import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ SUPABASE BİLGİLERİN
const supabaseUrl = 'https://raawrpvdlduvazxincdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYXdycHZkbGR1dmF6eGluY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjU4NjYsImV4cCI6MjA3OTg0MTg2Nn0.S9Iogzz6rCp-gOy0pa2s8RHYyxEgGmAv6DopNAEbnvE';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { detectSessionInUrl: false, persistSession: true, autoRefreshToken: true }
});

// Ses dosyalarını Client tarafında oluştur
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
  
  // 🔥 Hayalet Komut Koruması
  const processedCommandRef = useRef<string>("");

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
      
      // Başlangıçta veritabanında "SHUTDOWN" emri varsa bile, sistem yeni açıldığı için onu yoksay.
      if (schoolSettings && schoolSettings.system_command) {
          processedCommandRef.current = schoolSettings.system_command; 
      }

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

  // Kilit Açma Fonksiyonu
  const unlock = useCallback(async (_fromRemote = false, teacherNameVal?: string) => {
    const now = Date.now();
    if (now - lastCommandTime.current < 1000) return;
    lastCommandTime.current = now;

    if (teacherNameVal) setTeacherName(teacherNameVal);
    else if (!teacherName) setTeacherName("Nöbetçi Öğretmen");

    if (!isLockedRef.current) return;
    
    updateLockState(false); 
    (window as any).electron?.setViewMode('MINI'); 
    playSoundSafe('unlock');
    
    const currentSessId = sessionIdRef.current;
    if (currentSessId) {
        const updateData: any = { status: 'OPEN', created_at: new Date().toISOString() };
        if (teacherNameVal) updateData.teacher_name = teacherNameVal;
        await supabase.from('sessions').update(updateData).eq('qr_code', currentSessId);
    }
    if (machineId) supabase.from('boards').update({ is_locked: false, lock_command: null }).eq('machine_id', machineId).then();
  }, [machineId, teacherName, playSoundSafe, updateLockState]);

  // Kilit Kapama Fonksiyonu
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

    // MEDYAYI DURDUR
    if ((window as any).electron?.stopMedia) {
        (window as any).electron.stopMedia();
    }
    
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

  // 🔥 2. USB DİNLEYİCİSİ
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron?.onUsbStatus) {
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

       return () => {
           if (removeListener && typeof removeListener === 'function') {
               removeListener();
           } else if ((window as any).electron?.removeUsbListener) {
               (window as any).electron.removeUsbListener();
           }
       };
    }
  }, [machineId, unlock]); 

  // 🔥 3. REALTIME VE "HAYALET KOMUT" KORUMASI
  useEffect(() => {
    if (!sessionId || !machineId) return;
    
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
          
          if (payload.new.lock_command === 'UNLOCK' && isLockedRef.current) {
              unlock(true);
          }
          if (payload.new.lock_command === 'LOCK' && !isLockedRef.current) {
               lock(true);
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'school_settings' }, (payload: any) => {
          if (payload.new.announcement !== undefined) {
             setAnnouncement(payload.new.announcement || "");
          }

          // 🛑 SİSTEM KOMUTU KONTROLÜ
          const incomingCmd = payload.new.system_command;
          if (incomingCmd === 'SHUTDOWN_ALL') {
              if (processedCommandRef.current === incomingCmd) {
                  console.log("⚠️ Eski kapatma emri algılandı, yoksayılıyor.");
                  return;
              }
              console.log("🚨 SİSTEM KAPATMA EMRİ ALINDI!");
              processedCommandRef.current = incomingCmd; 
              playSoundSafe('alarm'); 
              if ((window as any).electron) setTimeout(() => { (window as any).electron.shutdownPC(); }, 2000); 
          }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'files', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
          setFiles(prev => [payload.new, ...prev]); 
          playSoundSafe('file');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, machineId, unlock, lock, playSoundSafe]); 

  // 4. DERS PROGRAMI
  useEffect(() => {
    const calculateSchedule = async () => {
        try {
            const today = new Date(); 
            const isFriday = today.getDay() === 5;
            const { data: schedule } = await supabase.from('lecture_schedule').select('*').eq('is_friday', isFriday).order('start_time');
            
            if (!schedule || schedule.length === 0) { setScheduleStatus("SERBEST ZAMAN"); return; }
            
            const hours = today.getHours().toString().padStart(2, '0');
            const minutes = today.getMinutes().toString().padStart(2, '0');
            const nowStr = `${hours}:${minutes}`;
            
            const currentSlot = schedule.find(s => nowStr >= s.start_time.slice(0,5) && nowStr <= s.end_time.slice(0,5));
            if (currentSlot) {
                setScheduleStatus(currentSlot.name.toUpperCase());
            } else {
                setScheduleStatus("SERBEST ZAMAN");
            }
        } catch (e) { setScheduleStatus("SERBEST ZAMAN"); }
    };
    calculateSchedule();
    const interval = setInterval(calculateSchedule, 30000); 
    return () => clearInterval(interval);
  }, []);

  // 🔥 5. NABIZ (HEARTBEAT) SİSTEMİ
  useEffect(() => {
    if (!machineId) return;

    const heartbeat = async () => {
        try {
            await supabase.from('boards').update({ 
                last_seen: new Date().toISOString(),
                is_active: true 
            }).eq('machine_id', machineId);
        } catch (e) { console.error("Nabız hatası", e); }
    };
    heartbeat();
    const interval = setInterval(heartbeat, 60000);
    return () => clearInterval(interval);
  }, [machineId]);

  // 👇 🔥 6. OTOMATİK GÜNCELLEME KONTROLÜ (DERS BÖLMEZ, SORAR)
  useEffect(() => {
    // Sadece Electron ortamında çalışsın
    if (typeof window === 'undefined' || !(window as any).electron) return;

    const checkUpdate = async () => {
        try {
            // 1. En son sürümü veritabanından çek
            const { data, error } = await supabase
                .from('app_settings') 
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) return;

            // ✅ TAHTANIN MEVCUT SÜRÜMÜ
            const currentVersion = '2.0.2'; 
            const remoteVersion = data.version;

            console.log(`Versiyon Kontrolü: Tahta=${currentVersion} | Sunucu=${remoteVersion}`);

            // 2. Eğer sunucudaki versiyon daha büyükse SOR
            if (remoteVersion > currentVersion) {
                
                // 🔔 ÖĞRETMENE SOR PENCERESİ
                const onay = window.confirm(
                    `📢 YENİ SİSTEM GÜNCELLEMESİ MEVCUT!\n\n` +
                    `Yeni Sürüm: v${remoteVersion}\n` +
                    `Mevcut Sürüm: v${currentVersion}\n\n` +
                    `Ders arasında mısınız? Güncellemeyi şimdi başlatmak ister misiniz?\n` +
                    `(İptal derseniz bir sonraki açılışta tekrar sorulur.)`
                );

                if (onay) {
                    (window as any).electron.startUpdate(data.download_url, data.update_hash);
                } else {
                    console.log("Kullanıcı güncellemeyi erteledi.");
                }
            }
        } catch (e) {
            console.error("Güncelleme kontrol hatası:", e);
        }
    };

    // Açılıştan 10 saniye sonra kontrol et (Sistem kendine gelsin)
    const timer = setTimeout(checkUpdate, 10000);
    return () => clearTimeout(timer);
  }, []);

  // 👇 🔥 7. GÜÇ VE UYKU YÖNETİMİ (YENİ EKLENDİ)
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).electron) return;

    // Uykuya dalınca (Power tuşuna basılınca)
    const handleSuspend = () => {
       console.log("💤 Sistem uykuya geçiyor -> KİLİTLENİYOR");
       lock(true); // Zorla kilitle
    };

    // Uyanınca
    const handleResume = () => {
       console.log("☀️ Sistem uyandı -> Güvenlik kontrolü");
       lock(true); // Uyanınca da kilitle
    };

    // Dinleyicileri başlat
    if ((window as any).electron.onSystemSuspend) {
        (window as any).electron.onSystemSuspend(handleSuspend);
    }
    if ((window as any).electron.onSystemResume) {
        (window as any).electron.onSystemResume(handleResume);
    }

    // Temizlik
    return () => {
      if ((window as any).electron.removeSystemListeners) {
        (window as any).electron.removeSystemListeners();
      }
    };
  }, [lock]);

  // 👇 SAVE BOARD NAME
  const saveBoardName = async (name: string) => {
    if (!machineId) {
        console.error("ID Yok, Kayıt Yapılamaz.");
        return;
    }
    try {
        const { error } = await supabase.from('boards').update({ name }).eq('machine_id', machineId);
        if (error) throw error;
        setIsSetupRequired(false);
    } catch (err) {
        console.error("Kayıt Hatası:", err);
    }
  };

  const markFilesAsRead = () => {};
  const playErrorSound = () => { playSoundSafe('alarm'); };

  return (
    <LockContext.Provider value={{ isLocked, isSetupRequired, sessionId, machineId, announcement, files, teacherName, scheduleStatus, unlock, lock, saveBoardName, markFilesAsRead, playErrorSound }}>
      {children}
    </LockContext.Provider>
  );
};

export const useLock = () => { const context = useContext(LockContext); if (!context) throw new Error("useLock must be used within LockProvider"); return context; };
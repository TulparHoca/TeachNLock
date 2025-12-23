import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../db'; 

const ipcRenderer = (window as any).ipcRenderer;

export function useLockSystem() {
  const [isLocked, setIsLocked] = useState(true);
  const [dersSuresi, setDersSuresi] = useState(40);
  const [sessionId, setSessionId] = useState('');
  
  // Ref kullanıyoruz ki anlık değişimlerde React render beklemesin
  const isLockedRef = useRef(true);

  // --- 1. ELECTRON (USB ve Kilit) DİNLEME ---
  useEffect(() => {
    if (ipcRenderer) {
      // Başlangıç durumu
      ipcRenderer.invoke('get-lock-status').then((status: boolean) => {
        setIsLocked(status);
        isLockedRef.current = status;
      });

      // Anlık Sinyaller
      const removeListener = ipcRenderer.on('app-state-changed', (_event: any, state: string) => {
        console.log("⚡ Electron Sinyali:", state);
        
        if (state === 'unlocked') {
          setIsLocked(false);
          isLockedRef.current = false;
          setDersSuresi(40); // USB ile açılışta varsayılan 40dk
        } else if (state === 'locked') {
          setIsLocked(true);
          isLockedRef.current = true;
        }
      });

      return () => { if (removeListener) removeListener(); };
    }
  }, []);

  // --- 2. SUPABASE (QR ve Uzaktan Kontrol) ---
  const sessionBaslat = useCallback(() => {
    // Temizlik
    supabase.removeAllChannels();

    const id = uuidv4();
    setSessionId(id);
    console.log("🔄 Yeni QR Oturumu:", id);

    // DB Kayıt
    supabase.from('sessions').insert([{ qr_code: id, status: 'LOCKED', duration: 40 }]).then();

    // Dinleme (Basit Kanal İsmi)
    const channel = supabase
      .channel('public:sessions') 
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `qr_code=eq.${id}` }, 
      (payload: any) => {
        console.log("🔔 DB Sinyali:", payload);
        
        if (payload.new.status === 'OPEN') {
          const sure = payload.new.duration || 40;
          kilitAc(sure, false); 
        } else if (payload.new.status === 'LOCKED') {
          kilitle(false);
        }
      })
      .subscribe((status) => console.log("Bağlantı:", status));

  }, []);

  useEffect(() => {
    sessionBaslat();
    return () => { supabase.removeAllChannels(); };
  }, [sessionBaslat]);

  // --- 3. AKSİYONLAR ---
  const dbGuncelle = async (durum: 'LOCKED' | 'OPEN') => {
    if(sessionId) await supabase.from('sessions').update({ status: durum }).eq('qr_code', sessionId);
  };

  const kilitAc = (sure = 40, updateDb = true) => {
    // Eğer zaten açıksa tekrar tetikleme (Zıplama önlemi)
    if (!isLockedRef.current) return; 
    
    setDersSuresi(sure);
    setIsLocked(false);
    isLockedRef.current = false;

    if (updateDb) dbGuncelle('OPEN');
    if (ipcRenderer) ipcRenderer.send('set-mode-unlocked');
  };

  const kilitle = (updateDb = true) => {
    if (isLockedRef.current) return; 
    
    setIsLocked(true);
    isLockedRef.current = true;

    if (updateDb) dbGuncelle('LOCKED');
    if (ipcRenderer) ipcRenderer.send('set-mode-locked');
  };

  return {
    isLocked, dersSuresi, sessionId, kilitAc, kilitle, sessionYenile: sessionBaslat
  };
}
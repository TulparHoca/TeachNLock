import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// --- TİP TANIMLAMALARI ---
interface FileData {
  id: string;
  sender_name: string;
  file_type: 'image' | 'video' | 'link' | 'file';
  file_url: string;
  file_name: string;
  created_at: string;
}

// Kilit durumu için gelen veri tipi
interface SessionPayload {
  new: {
    status: string;
    duration?: number;
  };
}

// 🔥 ARTIK KULLANILIYOR: Dosya için gelen veri tipi
interface FilePayload {
  new: FileData;
}

export function useRealtimeConnection(
  sessionId: string, 
  onStatusChange: (status: string, duration?: number) => void
) {
  const [receivedFiles, setReceivedFiles] = useState<FileData[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!sessionId) {
      console.log("⚠️ [Hook] Session ID bekleniyor...");
      return;
    }

    console.log(`🔌 [Hook] ${sessionId} kanalına bağlanılıyor...`);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`board_room_${sessionId}`)
      
      // --- A. KİLİT DURUMUNU DİNLEME ---
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `qr_code=eq.${sessionId}` }, 
        (payload: any) => {
          // Gelen veriyi SessionPayload tipine çeviriyoruz
          const data = payload as SessionPayload;
          console.log("🔔 [Hook] Kilit Durumu Değişti:", data.new.status);
          onStatusChange(data.new.status, data.new.duration);
        }
      )

      // --- B. DOSYA TRANSFERİNİ DİNLEME ---
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'files', filter: `session_id=eq.${sessionId}` }, 
        (payload: any) => {
          // 🔥 DÜZELTME BURADA: FilePayload artık kullanılıyor!
          const data = payload as FilePayload;
          const newFile = data.new;
          
          console.log("📂 [Hook] Yeni Dosya Teslim Alındı:", newFile.file_name);
          setReceivedFiles((prevFiles) => [newFile, ...prevFiles]);
        }
      )
      
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log("✅ [Hook] Bağlantı Başarılı!");
        if (status === 'CLOSED') console.log("❌ [Hook] Bağlantı Koptu!");
        if (status === 'CHANNEL_ERROR') console.error("🚨 [Hook] Kanal Hatası:", err);
      });

    channelRef.current = channel;

    return () => {
      console.log("🔌 [Hook] Bağlantı Kapatılıyor...");
      supabase.removeChannel(channel);
    };

  }, [sessionId]);

  return { 
    receivedFiles,      
    clearFiles: () => setReceivedFiles([]) 
  };
}
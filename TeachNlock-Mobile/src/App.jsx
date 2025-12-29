import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Lock, Unlock, Zap, FileUp, CheckCircle2, Wifi, LogOut, ArrowLeft, Send, Link, AlertTriangle, Megaphone, RefreshCw, RefreshCcw, Image as ImageIcon, FileText, Settings, UserPlus, KeyRound, Clock, Save, ChevronDown, ChevronUp, ChevronRight, Plus, Trash2, BookOpen, Utensils, Coffee, Moon, Sun } from 'lucide-react';

// ⚠️ SUPABASE BİLGİLERİN
const supabaseUrl = 'https://raawrpvdlduvazxincdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYXdycHZkbGR1dmF6eGluY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjU4NjYsImV4cCI6MjA3OTg0MTg2Nn0.S9Iogzz6rCp-gOy0pa2s8RHYyxEgGmAv6DopNAEbnvE';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 🎨 RENK PALETLERİ (Pastel & Lila) ---
const PALETTES = {
  light: {
    bg: '#F8F7FF', 
    bgGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F3F0FF 100%)',
    cardBg: 'rgba(255, 255, 255, 0.65)',
    headerBg: 'rgba(255, 255, 255, 0.80)',
    textMain: '#2D2B35',
    textMuted: '#9CA3AF',
    primary: '#8B5CF6',
    primaryLight: '#EDE9FE',
    danger: '#FF4757',
    dangerLight: '#FFE2E5',
    success: '#2ED573',
    successLight: '#DCFCE7',
    warning: '#FFA502',
    warningLight: '#FFF4D6',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(139, 92, 246, 0.15)',
    shadow: '0 8px 32px rgba(139, 92, 246, 0.08)'
  },
  dark: {
    bg: '#000000',
    bgGradient: 'linear-gradient(180deg, #000000 0%, #121212 100%)',
    cardBg: 'rgba(28, 28, 30, 0.85)',
    headerBg: 'rgba(28, 28, 30, 0.85)',
    textMain: '#FFFFFF',
    textMuted: '#98989D',
    primary: '#A78BFA',
    primaryLight: 'rgba(139, 92, 246, 0.2)',
    danger: '#FF453A',
    dangerLight: 'rgba(255, 69, 58, 0.2)',
    success: '#32D74B',
    successLight: 'rgba(50, 215, 75, 0.2)',
    warning: '#FF9F0A',
    warningLight: 'rgba(255, 159, 10, 0.2)',
    inputBg: '#1C1C1E',
    border: 'rgba(255,255,255,0.1)',
    shadow: '0 4px 24px rgba(0,0,0,0.3)'
  }
};

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('teachnlock_theme') || 'light');
  const colors = PALETTES[theme]; 

  const [oturum, setOturum] = useState(null);
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [taramaAktif, setTaramaAktif] = useState(false);
  const [sure, setSure] = useState(40);
  const [aktifSession, setAktifSession] = useState(null);
  const [paylasimModu, setPaylasimModu] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [tahtalar, setTahtalar] = useState([]);
  const [adminPanelGoster, setAdminPanelGoster] = useState(true);
  const [ayarlarAcik, setAyarlarAcik] = useState(false);
  const [notification, setNotification] = useState(null);
  const [duyuruMetni, setDuyuruMetni] = useState('');

  const [dersProgrami, setDersProgrami] = useState([]);
  const [seciliGun, setSeciliGun] = useState('haftaIci'); 
  const [acikDersId, setAcikDersId] = useState(null);
  const [aktifAyarMenusu, setAktifAyarMenusu] = useState(null); 

  const [yeniOgretmen, setYeniOgretmen] = useState({ ad: '', kullanici: '', sifre: '' });
  const [sifreSifirlama, setSifreSifirlama] = useState({ kullanici: '', yeniSifre: '' });

  const scannerRef = useRef(null);
  const isAdmin = oturum?.is_admin || oturum?.kullanici_adi === 'admin';

  // --- STİLLER ---
  const s = {
    container: { minHeight: '100dvh', width: '100%', background: colors.bg, backgroundImage: theme === 'light' ? colors.bgGradient : 'none', color: colors.textMain, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflowX: 'hidden', boxSizing: 'border-box', transition: 'background 0.3s ease' },
    loginWrapper: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 50, background: colors.bgGradient },
    header: { width: '100%', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.headerBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0, zIndex: 50, boxSizing: 'border-box', height: '60px', transition: 'background 0.3s ease' },
    logo: { fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: colors.primary, display: 'flex', alignItems: 'center', gap: '6px' },
    main: { width: '100%', maxWidth: '500px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, boxSizing: 'border-box' },
    card: { background: colors.cardBg, backdropFilter: 'blur(30px)', borderRadius: '28px', padding: '24px', boxShadow: colors.shadow, width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, transition: 'background 0.3s ease' },
    cardTitle: { color: colors.textMuted, marginBottom: '16px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' },
    input: { width: '100%', padding: '16px', marginBottom: '12px', background: colors.inputBg, border: `1px solid ${theme==='light'?'transparent':colors.border}`, borderRadius: '16px', color: colors.textMain, fontSize: '16px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', fontWeight: '500' },
    textarea: { width: '100%', padding: '16px', marginBottom: '10px', background: colors.inputBg, border: `1px solid ${theme==='light'?'transparent':colors.border}`, borderRadius: '16px', color: colors.textMain, fontSize: '16px', outline: 'none', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
    btnPrimary: { width: '100%', padding: '16px', background: colors.primary, border: 'none', borderRadius: '18px', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 8px 20px ${theme === 'light' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(0,0,0,0.4)'}`, transition: 'transform 0.1s ease', boxSizing: 'border-box' },
    btnGhost: { background: 'transparent', border: 'none', color: colors.danger, padding: '14px', borderRadius: '14px', width: '100%', cursor: 'pointer', marginTop: '5px', fontWeight: '600', boxSizing: 'border-box', fontSize: '15px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' },
    bigIconBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', borderRadius: '24px', background: theme === 'light' ? 'rgba(255,255,255,0.8)' : colors.inputBg, border: theme==='light'?`1px solid ${colors.border}`:'none', color: colors.textMain, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', fontWeight: '600', transition: 'transform 0.1s', boxSizing: 'border-box' },
    scannerContainer: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    toast: { position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.9)', backdropFilter: 'blur(12px)', padding: '12px 24px', borderRadius: '50px', color: colors.textMain, zIndex: 200, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', minWidth: 'auto', fontWeight: '600', maxWidth: '90%', border: `1px solid ${colors.border}` },
    uploadBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', border: `2px dashed ${colors.primary}`, borderRadius: '24px', background: colors.primaryLight, cursor: 'pointer', transition: 'all 0.2s', gap: '12px', opacity: 0.9 },
    tabBtn: { flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' },
    accordionItem: { background: theme === 'light' ? 'rgba(255,255,255,0.8)' : colors.inputBg, borderRadius: '18px', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: `1px solid ${colors.border}` },
    accordionHeader: { padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '600', fontSize: '16px' },
    accordionContent: { padding: '16px', background: theme === 'light' ? '#FDFDFF' : '#1C1C1E', borderTop: `1px solid ${colors.border}` },
    manualTimeInput: { width: '100%', padding: '12px', background: theme === 'light' ? 'white' : colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '12px', fontSize: '18px', outline: 'none', textAlign: 'center', letterSpacing: '1px', fontWeight: '600', color: colors.textMain },
    settingMenuBtn: { width: '100%', boxSizing: 'border-box', padding: '16px', background: theme === 'light' ? 'rgba(255,255,255,0.8)' : colors.inputBg, borderRadius: '18px', border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '600', fontSize: '16px', color: colors.textMain, marginBottom: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
    typeBtn: { flex:1, padding:'10px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', fontSize:'13px', border:'1px solid transparent', fontWeight: '500' },
    iconBtn: { background: theme === 'light' ? 'white' : 'rgba(255,255,255,0.1)', border: theme==='light' ? `1px solid ${colors.border}` : 'none', cursor:'pointer', color: colors.textMain, borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: theme==='light' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }
  };

  const showToast = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('teachnlock_theme', newTheme);
  };
  
  useEffect(() => { document.body.style.backgroundColor = colors.bg; }, [theme, colors.bg]);

  useEffect(() => {
    document.body.style.margin = '0'; document.body.style.padding = '0'; document.body.style.overflowX = 'hidden'; document.body.style.width = '100%'; document.body.style.boxSizing = 'border-box';
    const kayitliOturum = localStorage.getItem('teachnlock_user');
    const kayitliSession = localStorage.getItem('teachnlock_session');
    if (kayitliOturum) setOturum(JSON.parse(kayitliOturum));
    if (kayitliSession) setAktifSession(kayitliSession);
  }, []);

  // --- 🔥 YENİ: OTURUM DURUMUNU CANLI TAKİP ET (Tahta Kilitlenirse Mobili Sıfırla) ---
  useEffect(() => {
    if (!aktifSession) return;

    const channel = supabase.channel('session_status_watch')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `qr_code=eq.${aktifSession}` }, 
        (payload) => {
          // Eğer durum LOCKED olduysa (İdare kilitlediyse veya süre bittiyse)
          if (payload.new.status === 'LOCKED') {
            setAktifSession(null);
            setPaylasimModu(false);
            localStorage.removeItem('teachnlock_session');
            showToast('Oturum sonlandı / Tahta kilitlendi', 'warning');
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [aktifSession]);

  useEffect(() => {
    const inSubView = taramaAktif || paylasimModu || (isAdmin && (!adminPanelGoster || ayarlarAcik));
    if (inSubView) {
        window.history.pushState(null, '', window.location.href);
        const handlePopState = (e) => { 
          e.preventDefault(); 
          if (paylasimModu) setPaylasimModu(false); 
          else if (taramaAktif) durdurVeKapat(); 
          else if (ayarlarAcik) setAyarlarAcik(false);
          else if (isAdmin && !adminPanelGoster) setAdminPanelGoster(true); 
        };
        window.addEventListener('popstate', handlePopState); return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [taramaAktif, paylasimModu, adminPanelGoster, isAdmin, ayarlarAcik]);

  useEffect(() => { if (ayarlarAcik) { dersProgramiGetir(); } }, [ayarlarAcik]);
  useEffect(() => { if (!isAdmin) return; if (adminPanelGoster) { tahtalariGetir(); duyuruGetir(); } const channel = supabase.channel('admin_board_watch').on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, () => tahtalariGetir()).subscribe(); return () => { supabase.removeChannel(channel); }; }, [oturum, adminPanelGoster]);

  const girisYap = async () => { if(!kullaniciAdi || !sifre) { showToast('Lütfen alanları doldurun', 'error'); return; } const { data } = await supabase.from('teachers').select('*').eq('kullanici_adi', kullaniciAdi).eq('sifre', sifre).single(); if (!data) showToast('Hatalı kullanıcı adı veya şifre', 'error'); else { setOturum(data); localStorage.setItem('teachnlock_user', JSON.stringify(data)); } };
  const cikisYap = () => { if(confirm("Çıkış yapmak istiyor musunuz?")) { setOturum(null); setAktifSession(null); localStorage.clear(); setAdminPanelGoster(true); setAyarlarAcik(false); } };
  const durdurVeKapat = async () => { try { if (scannerRef.current?.isScanning) await scannerRef.current.stop(); scannerRef.current?.clear(); } catch (e) {} finally { scannerRef.current = null; setTaramaAktif(false); } };
  const formatHocaIsmi = (kullaniciAdi) => { if (!kullaniciAdi) return "Öğretmen"; try { const ilkKisim = kullaniciAdi.split('.')[0]; const formatliIsim = ilkKisim.charAt(0).toLocaleUpperCase('tr-TR') + ilkKisim.slice(1).toLocaleLowerCase('tr-TR'); return `${formatliIsim} Hoca`; } catch (e) { return kullaniciAdi; } };
  const kilitAc = async (qrKodu) => { await durdurVeKapat(); showToast('Bağlanılıyor...', 'info'); const { data } = await supabase.from('sessions').select('*').eq('qr_code', qrKodu).single(); if(!data) { showToast('Geçersiz QR Kodu!', 'error'); return; } const hocaIsmi = formatHocaIsmi(oturum.kullanici_adi); await supabase.from('sessions').update({ status: 'OPEN', duration: parseInt(sure), teacher_name: hocaIsmi }).eq('qr_code', qrKodu); setAktifSession(qrKodu); localStorage.setItem('teachnlock_session', qrKodu); showToast(`Başarılı! Hoş geldin ${hocaIsmi}`, 'success'); };
  
  // 🔥🔥 BAĞLANTIYI KES VE TAHTAYI KİLİTLE 🔥🔥
  const baglantiyiKesVeKilitle = async () => {
    if (!aktifSession) return;
    
    // 1. Veritabanına "KİLİTLE" emri gönder
    await supabase.from('sessions').update({ status: 'LOCKED' }).eq('qr_code', aktifSession);
    
    // 2. Mobil arayüzü temizle
    setAktifSession(null);
    setPaylasimModu(false);
    localStorage.removeItem('teachnlock_session');
    
    showToast('Bağlantı kesildi ve tahta kilitlendi.', 'success');
  };

  useEffect(() => { 
    if (oturum && taramaAktif) { 
        if (scannerRef.current) try { scannerRef.current.clear(); } catch(e){} 
        const html5QrCode = new Html5Qrcode("reader"); 
        scannerRef.current = html5QrCode; 
        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            kilitAc, 
            () => {}
        ).catch((err) => {
            console.error("Kamera hatası:", err);
            setTaramaAktif(false);
            showToast("Kamera hatası! HTTPS bağlantısı olduğundan emin olun.", 'error');
        }); 
    } 
    return () => { if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {}); }; 
  }, [oturum, taramaAktif]);
  
  const dosyaYukle = async (file) => { if (!aktifSession) return; setYukleniyor(true); try { const fileName = `${Date.now()}.${file.name.split('.').pop()}`; await supabase.storage.from('class-files').upload(fileName, file); const { data: { publicUrl } } = supabase.storage.from('class-files').getPublicUrl(fileName); const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file'; await supabase.from('files').insert({ session_id: aktifSession, sender_name: oturum.ad_soyad, file_type: type, file_url: publicUrl, file_name: file.name }); showToast("Gönderildi!", 'success'); setPaylasimModu(false); } catch (e) { showToast("Yükleme hatası", 'error'); } finally { setYukleniyor(false); } };
  const linkGonder = async () => { if (!linkInput) return; setYukleniyor(true); await supabase.from('files').insert({ session_id: aktifSession, sender_name: oturum.ad_soyad, file_type: 'link', file_url: linkInput, file_name: 'Bağlantı' }); showToast("Link paylaşıldı!", 'success'); setLinkInput(''); setPaylasimModu(false); setYukleniyor(false); };
  
  const tahtalariGetir = async () => { const { data } = await supabase.from('boards').select('*').order('name', { ascending: true }); if (data) setTahtalar(data); };
  const duyuruGetir = async () => { const { data } = await supabase.from('school_settings').select('announcement').eq('id', 1).single(); if (data) setDuyuruMetni(data.announcement || ''); };
  const duyuruGuncelle = async () => { const { error } = await supabase.from('school_settings').update({ announcement: duyuruMetni }).eq('id', 1); if (error) showToast("Hata", 'error'); else showToast("Duyuru yayınlandı!", 'success'); };
  const duyuruKaldir = async () => { if (!confirm("Yayındaki duyuruyu kaldırmak istediğine emin misin?")) return; const { error } = await supabase.from('school_settings').update({ announcement: null }).eq('id', 1); if (error) { showToast("Hata oluştu!", 'error'); } else { showToast("Duyuru kaldırıldı.", 'success'); setDuyuruMetni(''); } };
  const kilitIslem = async (machineId, komut) => { if (!confirm(`${komut === 'LOCK' ? 'KİLİTLEMEK' : 'AÇMAK'} istediğine emin misin?`)) return; await supabase.from('boards').update({ lock_command: komut, last_seen: new Date().toISOString() }).eq('machine_id', machineId); tahtalariGetir(); showToast('Komut gönderildi', 'success'); };
  const topluIslem = async (komut) => { if (!confirm(`TÜMÜNÜ ${komut === 'LOCK' ? 'KİLİTLEMEK' : 'AÇMAK'} istediğine emin misin?`)) return; await supabase.from('boards').update({ lock_command: komut, last_seen: new Date().toISOString() }).neq('machine_id', '0'); showToast('Toplu komut gönderildi', 'success'); };
  const okuluKapat = async () => { if (!confirm("⚠️ DİKKAT: TÜM OKULU KAPATMAK (SHUTDOWN) üzeresin! Onaylıyor musun?")) return; await supabase.from('school_settings').update({ system_command: 'SHUTDOWN_ALL' }).eq('id', 1); showToast('KAPATMA EMRİ VERİLDİ!', 'danger'); setTimeout(() => supabase.from('school_settings').update({ system_command: null }).eq('id', 1), 5000); };
  const ogretmenEkle = async () => { if (!yeniOgretmen.ad || !yeniOgretmen.kullanici || !yeniOgretmen.sifre) { showToast("Tüm alanları doldur!", 'error'); return; } const { error } = await supabase.from('teachers').insert([{ ad_soyad: yeniOgretmen.ad, kullanici_adi: yeniOgretmen.kullanici, sifre: yeniOgretmen.sifre }]); if (error) showToast("Hata: Kullanıcı adı alınmış olabilir.", 'error'); else { showToast("Öğretmen eklendi!", 'success'); setYeniOgretmen({ad:'', kullanici:'', sifre:''}); } };
  const sifreGuncelle = async () => { if (!sifreSifirlama.kullanici || !sifreSifirlama.yeniSifre) { showToast("Tüm alanları doldur!", 'error'); return; } const { data } = await supabase.from('teachers').select('*').eq('kullanici_adi', sifreSifirlama.kullanici).single(); if (!data) { showToast("Böyle bir öğretmen bulunamadı.", 'error'); return; } const { error } = await supabase.from('teachers').update({ sifre: sifreSifirlama.yeniSifre }).eq('kullanici_adi', sifreSifirlama.kullanici); if (error) showToast("Güncelleme hatası!", 'error'); else { showToast("Şifre sıfırlandı!", 'success'); setSifreSifirlama({kullanici:'', yeniSifre:''}); } };
  const dersProgramiGetir = async () => { const { data } = await supabase.from('lecture_schedule').select('*').order('start_time', { ascending: true }); if (data) setDersProgrami(data); };
  const dersGuncelle = async (id, field, value) => { const yeniListe = dersProgrami.map(d => d.id === id ? { ...d, [field]: value } : d); setDersProgrami(yeniListe); };
  const dersKaydet = async (ders) => { const { error } = await supabase.from('lecture_schedule').update({ name: ders.name, start_time: ders.start_time, end_time: ders.end_time, type: ders.type }).eq('id', ders.id); if (error) showToast("Kayıt başarısız!", 'error'); else showToast("Güncellendi!", 'success'); };
  const dersEkle = async () => { const isFriday = seciliGun === 'cuma'; const { error } = await supabase.from('lecture_schedule').insert([{ name: 'Yeni Ders', start_time: '00:00', end_time: '00:00', is_friday: isFriday, type: 'LESSON' }]); if (error) { console.error(error); showToast("Ekleme hatası: İzinleri kontrol edin", 'error'); } else { showToast("Ders eklendi", 'success'); dersProgramiGetir(); } };
  const dersSil = async (id) => { if(!confirm("Bu dersi silmek istediğine emin misin?")) return; const { error } = await supabase.from('lecture_schedule').delete().eq('id', id); if (error) showToast("Silme hatası", 'error'); else { showToast("Silindi", 'success'); dersProgramiGetir(); } };
  const toggleAyarMenu = (menu) => { if (aktifAyarMenusu === menu) setAktifAyarMenusu(null); else setAktifAyarMenusu(menu); };
  const toggleDersAccordion = (id) => { if (acikDersId === id) setAcikDersId(null); else setAcikDersId(id); };

  if (!oturum) return (
    <div style={s.container}>
      <div style={s.loginWrapper}>
        <div style={{...s.card, maxWidth: '350px', textAlign: 'center', background: theme === 'light' ? 'rgba(255,255,255,0.85)' : colors.cardBg, borderRadius:'32px', boxShadow:'0 20px 60px rgba(0,0,0,0.1)'}}>
          <div style={{...s.logo, justifyContent:'center', marginBottom:'24px', fontSize:'22px', color: colors.primary}}>
             <Lock size={26} strokeWidth={2.5} style={{marginRight:6}} /> TEACHNLOCK
          </div>
          <p style={{color: colors.textMuted, marginBottom: '24px', fontSize: '15px', fontWeight:'500'}}>Hesabınıza Giriş Yapın</p>
          <input style={s.input} type="text" placeholder="Kullanıcı Adı" value={kullaniciAdi} onChange={e => setKullaniciAdi(e.target.value)} />
          <input style={s.input} type="password" placeholder="Şifre" value={sifre} onChange={e => setSifre(e.target.value)} />
          <button style={{...s.btnPrimary, marginTop:'10px', boxShadow:`0 10px 30px ${theme==='light'?'rgba(139, 92, 246, 0.4)':'rgba(0,0,0,0.5)'}`}} onClick={girisYap}>GİRİŞ YAP</button>
        </div>
      </div>
      {notification && <Toast notification={notification} colors={colors} s={s} />}
    </div>
  );

  const geriDon = () => { if (paylasimModu) setPaylasimModu(false); else if (taramaAktif) durdurVeKapat(); else if (ayarlarAcik) setAyarlarAcik(false); else if (isAdmin && !adminPanelGoster) setAdminPanelGoster(true); };
  const showBackBtn = taramaAktif || paylasimModu || (isAdmin && (!adminPanelGoster || ayarlarAcik));

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           {showBackBtn && <button onClick={geriDon} style={s.iconBtn}><ArrowLeft size={20}/></button>}
           <div style={s.logo}>TEACHN<span style={{color: colors.primary}}>LOCK</span></div>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
           <button onClick={toggleTheme} style={s.iconBtn}>
              {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
           </button>
           
           {isAdmin && !ayarlarAcik && <button onClick={() => setAyarlarAcik(true)} style={s.iconBtn}><Settings size={18}/></button>}
           <button onClick={cikisYap} style={{...s.iconBtn, background: theme === 'light' ? '#FFE5E5' : 'rgba(255, 69, 58, 0.1)', color: colors.danger, border:'none'}}><LogOut size={18}/></button>
        </div>
      </header>

      <main style={s.main}>
        {isAdmin && adminPanelGoster ? (
            ayarlarAcik ? (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                  <div onClick={() => toggleAyarMenu('dersler')} style={s.settingMenuBtn}>
                     <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                         <div style={{padding:10, background: colors.primaryLight, borderRadius:'12px', color:colors.primary}}><Clock size={20}/></div>
                         <span>Ders Saati Editörü</span>
                     </div>
                     {aktifAyarMenusu === 'dersler' ? <ChevronUp size={20} color={colors.textMuted}/> : <ChevronRight size={20} color={colors.textMuted}/>}
                  </div>
                  
                  {aktifAyarMenusu === 'dersler' && (
                      <div style={{...s.card, marginTop:0, animation:'fadeIn 0.2s'}}>
                         <div style={{display:'flex', background: theme==='light'?'#F4F1FF':colors.inputBg, borderRadius:'12px', marginBottom:'15px', padding:'4px'}}>
                             <div onClick={() => setSeciliGun('haftaIci')} style={{...s.tabBtn, background: seciliGun === 'haftaIci' ? (theme==='light'?'white':colors.cardBg) : 'transparent', color: seciliGun === 'haftaIci' ? colors.textMain : colors.textMuted, boxShadow: seciliGun === 'haftaIci' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', borderRadius:'10px'}}>Hafta İçi</div>
                             <div onClick={() => setSeciliGun('cuma')} style={{...s.tabBtn, background: seciliGun === 'cuma' ? (theme==='light'?'white':colors.cardBg) : 'transparent', color: seciliGun === 'cuma' ? colors.textMain : colors.textMuted, boxShadow: seciliGun === 'cuma' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', borderRadius:'10px'}}>Cuma</div>
                         </div>

                         <div style={{display:'flex', flexDirection:'column'}}>
                             {dersProgrami.filter(d => seciliGun === 'cuma' ? d.is_friday : !d.is_friday).map(ders => (
                                 <div key={ders.id} style={s.accordionItem}>
                                     <div onClick={() => toggleDersAccordion(ders.id)} style={s.accordionHeader}>
                                         <div style={{display:'flex', alignItems:'center', gap:10}}>
                                             {ders.type === 'LESSON' && <BookOpen size={18} color={colors.primary}/>}
                                             {ders.type === 'BREAK' && <Coffee size={18} color={colors.warning}/>}
                                             {ders.type === 'LUNCH' && <Utensils size={18} color={colors.danger}/>}
                                             <span style={{fontWeight:'500'}}>{ders.name}</span>
                                         </div>
                                         <div style={{display:'flex', alignItems:'center'}}>
                                             <span style={{fontSize:'13px', color:colors.textMuted, marginRight:'10px', fontWeight:'500', background: theme==='light'?'#F4F1FF':colors.inputBg, padding:'4px 8px', borderRadius:'6px'}}>{ders.start_time.slice(0,5)} - {ders.end_time.slice(0,5)}</span>
                                             {acikDersId === ders.id ? <ChevronUp size={16} color={colors.primary}/> : <ChevronDown size={16} color={colors.textMuted}/>}
                                         </div>
                                     </div>
                                     {acikDersId === ders.id && (
                                         <div style={s.accordionContent}>
                                             <input type="text" value={ders.name} onChange={(e) => dersGuncelle(ders.id, 'name', e.target.value)} style={{...s.input, background: theme==='light'?'#F4F1FF':colors.inputBg}} placeholder="Ders Adı" />
                                             <div style={{display:'flex', gap:8, marginBottom:16}}>
                                                 <div onClick={() => dersGuncelle(ders.id, 'type', 'LESSON')} style={{...s.typeBtn, background: ders.type==='LESSON' ? colors.primaryLight : 'transparent', color: ders.type==='LESSON' ? colors.primary : colors.textMuted, border: ders.type==='LESSON' ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`}}><BookOpen size={16}/> Ders</div>
                                                 <div onClick={() => dersGuncelle(ders.id, 'type', 'BREAK')} style={{...s.typeBtn, background: ders.type==='BREAK' ? colors.warningLight : 'transparent', color: ders.type==='BREAK' ? colors.warning : colors.textMuted, border: ders.type==='BREAK' ? `1px solid ${colors.warning}` : `1px solid ${colors.border}`}}><Coffee size={16}/> Teneffüs</div>
                                                 <div onClick={() => dersGuncelle(ders.id, 'type', 'LUNCH')} style={{...s.typeBtn, background: ders.type==='LUNCH' ? colors.dangerLight : 'transparent', color: ders.type==='LUNCH' ? colors.danger : colors.textMuted, border: ders.type==='LUNCH' ? `1px solid ${colors.danger}` : `1px solid ${colors.border}`}}><Utensils size={16}/> Öğle</div>
                                             </div>
                                             <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'15px'}}>
                                                 <div style={{flex:1}}><div style={{fontSize:'12px', color:colors.textMuted, marginBottom:'6px', textTransform:'uppercase', fontWeight:'600'}}>Başlangıç</div><input type="text" placeholder="09:00" maxLength={5} value={ders.start_time.slice(0,5)} onChange={(e) => dersGuncelle(ders.id, 'start_time', e.target.value)} style={{...s.manualTimeInput, border:'none'}} /></div>
                                                 <div style={{flex:1}}><div style={{fontSize:'12px', color:colors.textMuted, marginBottom:'6px', textTransform:'uppercase', fontWeight:'600'}}>Bitiş</div><input type="text" placeholder="09:40" maxLength={5} value={ders.end_time.slice(0,5)} onChange={(e) => dersGuncelle(ders.id, 'end_time', e.target.value)} style={{...s.manualTimeInput, border:'none'}} /></div>
                                             </div>
                                             <div style={{display:'flex', gap:10}}>
                                                 <button onClick={() => dersSil(ders.id)} style={{...s.btnGhost, width:'auto', padding:'12px', marginTop:0, background: colors.dangerLight, color:colors.danger}}><Trash2 size={20}/></button>
                                                 <button onClick={() => dersKaydet(ders)} style={{...s.btnPrimary, padding:'12px', marginTop:0}}><Save size={20}/> KAYDET</button>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             ))}
                             <button onClick={dersEkle} style={{...s.btnGhost, color:colors.primary, background: 'transparent', border:`1px dashed ${colors.primary}`, marginTop:15}}><Plus size={18}/> YENİ DERS EKLE</button>
                         </div>
                      </div>
                  )}

                  <div onClick={() => toggleAyarMenu('ogretmen')} style={s.settingMenuBtn}>
                     <div style={{display:'flex', alignItems:'center', gap:'12px'}}><div style={{padding:10, background: colors.successLight, borderRadius:'12px', color:colors.success}}><UserPlus size={20}/></div><span>Öğretmen Ekle</span></div>
                     {aktifAyarMenusu === 'ogretmen' ? <ChevronUp size={20} color={colors.textMuted}/> : <ChevronRight size={20} color={colors.textMuted}/>}
                  </div>
                  {aktifAyarMenusu === 'ogretmen' && (
                      <div style={{...s.card, marginTop:0, animation:'fadeIn 0.2s'}}>
                         <input style={s.input} type="text" placeholder="Ad Soyad" value={yeniOgretmen.ad} onChange={e => setYeniOgretmen({...yeniOgretmen, ad: e.target.value})} />
                         <input style={s.input} type="text" placeholder="Kullanıcı Adı" value={yeniOgretmen.kullanici} onChange={e => setYeniOgretmen({...yeniOgretmen, kullanici: e.target.value})} />
                         <input style={s.input} type="text" placeholder="Şifre" value={yeniOgretmen.sifre} onChange={e => setYeniOgretmen({...yeniOgretmen, sifre: e.target.value})} />
                         <button style={s.btnPrimary} onClick={ogretmenEkle}>KAYDET</button>
                      </div>
                  )}

                  <div onClick={() => toggleAyarMenu('sifre')} style={s.settingMenuBtn}>
                     <div style={{display:'flex', alignItems:'center', gap:'12px'}}><div style={{padding:10, background: colors.dangerLight, borderRadius:'12px', color:colors.danger}}><KeyRound size={20}/></div><span>Yeni Şifre Ver</span></div>
                     {aktifAyarMenusu === 'sifre' ? <ChevronUp size={20} color={colors.textMuted}/> : <ChevronRight size={20} color={colors.textMuted}/>}
                  </div>
                  {aktifAyarMenusu === 'sifre' && (
                      <div style={{...s.card, marginTop:0, animation:'fadeIn 0.2s'}}>
                         <input style={s.input} type="text" placeholder="Kullanıcı Adı" value={sifreSifirlama.kullanici} onChange={e => setSifreSifirlama({...sifreSifirlama, kullanici: e.target.value})} />
                         <input style={s.input} type="text" placeholder="Yeni Şifre" value={sifreSifirlama.yeniSifre} onChange={e => setSifreSifirlama({...sifreSifirlama, yeniSifre: e.target.value})} />
                         <button style={{...s.btnPrimary, background: colors.danger}} onClick={sifreGuncelle}>GÜNCELLE</button>
                      </div>
                  )}
                  <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`}</style>
              </div>
            ) : (
            /* --- NORMAL ADMİN PANELİ --- */
            <>
                <div style={s.card}>
                    <h3 style={s.cardTitle}><Zap size={16} color={colors.primary}/> Sistem Kontrolü</h3>
                    <div style={s.grid2}>
                        <div style={{...s.bigIconBtn, color: colors.danger}} onClick={() => topluIslem('LOCK')}><div style={{padding:16, background: colors.dangerLight, borderRadius:'50%'}}><Lock size={28}/></div> <span style={{fontSize:'13px'}}>TÜMÜNÜ KİLİTLE</span></div>
                        <div style={{...s.bigIconBtn, color: colors.success}} onClick={() => topluIslem('UNLOCK')}><div style={{padding:16, background: colors.successLight, borderRadius:'50%'}}><Unlock size={28}/></div> <span style={{fontSize:'13px'}}>TÜMÜNÜ AÇ</span></div>
                    </div>
                    <button style={{...s.btnPrimary, background: theme==='light'?'white':colors.cardBg, color: colors.danger, border: 'none', marginTop:'15px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}} onClick={okuluKapat}><Zap size={18}/> OKULU KAPAT (KILL SWITCH)</button>
                </div>
                
                <div style={s.card}>
                    <h3 style={s.cardTitle}><Megaphone size={16} color={colors.primary}/> Duyuru Yönetimi</h3>
                    <textarea style={s.textarea} value={duyuruMetni} onChange={(e) => setDuyuruMetni(e.target.value)} placeholder="Duyuru mesajı yazın..." />
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={duyuruGuncelle} style={{...s.btnPrimary, background: colors.textMain, flex: 2}}>
                            <RefreshCw size={18}/> YAYINLA
                        </button>
                        <button onClick={duyuruKaldir} style={{...s.btnPrimary, background: colors.dangerLight, color: colors.danger, flex: 1, boxShadow:'none'}}>
                            <Trash2 size={18}/>
                        </button>
                    </div>
                </div>
                <div style={s.card}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                        <h3 style={{...s.cardTitle, marginBottom:0}}>Sınıf Listesi</h3>
                        <button style={{border:'none', background:'none', color:colors.primary, fontSize:'14px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:4}} onClick={tahtalariGetir}><RefreshCcw size={16}/> Yenile</button>
                    </div>
                    {tahtalar.map(t => (
                        <div key={t.machine_id} style={{padding:'16px', background: theme==='light'?'rgba(255,255,255,0.6)':colors.inputBg, borderRadius:'18px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.02)'}}>
                            <div style={{display:'flex', alignItems:'center', gap:12}}>
                                <div style={{width:12, height:12, borderRadius:'50%', background: t.is_locked ? colors.danger : colors.success, boxShadow: t.is_locked ? `0 0 0 3px ${colors.dangerLight}` : `0 0 0 3px ${colors.successLight}`}}></div>
                                <div><div style={{fontWeight:'700', fontSize:'15px', color: colors.textMain}}>{t.name || 'İsimsiz Sınıf'}</div><div style={{fontSize:'12px', color: colors.textMuted, fontWeight:'500', marginTop:2}}>{t.is_locked ? 'Kilitli' : 'Açık'}</div></div>
                            </div>
                            <button onClick={() => kilitIslem(t.machine_id, t.is_locked ? 'UNLOCK' : 'LOCK')} style={{padding:'10px 18px', borderRadius:'30px', border:'none', fontWeight:'600', cursor:'pointer', fontSize:'13px', background: t.is_locked ? colors.successLight : colors.dangerLight, color: t.is_locked ? colors.success : colors.danger}}>{t.is_locked ? 'AÇ' : 'KİLİTLE'}</button>
                        </div>
                    ))}
                </div>
                <button style={{...s.btnPrimary, background: theme==='light'?'white':colors.cardBg, color: colors.primary, marginTop:10}} onClick={() => setAdminPanelGoster(false)}>KAMERAYI AÇ</button>
            </>
            )
        ) : (
            /* --- ÖĞRETMEN / QR EKRANI --- */
            <>
                {!taramaAktif && !aktifSession && (
                    <div style={{...s.card, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'50px 20px', background: theme==='light'?'rgba(255,255,255,0.8)':colors.cardBg}}>
                        <div onClick={() => setTaramaAktif(true)} style={{width:'180px', height:'180px', borderRadius:'50%', background: theme==='light'?'#F4F1FF':colors.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'40px', transition:'transform 0.2s', position:'relative'}}>
                            <div style={{position:'absolute', inset:0, borderRadius:'50%', border:`2px solid ${colors.primary}`, opacity:0.1}}></div>
                            <Scan size={80} color={colors.primary} strokeWidth={1.5} />
                        </div>
                        <h2 style={{color: colors.textMain, marginBottom:'10px', fontSize:'24px', fontWeight:'800'}}>Tahtayı Aç</h2>
                        <p style={{color:colors.textMuted, fontSize:'15px', marginBottom:'30px'}}>QR kodu okutmak için ikona dokunun</p>
                        
                        <div style={{display:'flex', alignItems:'center', gap:'15px', background: theme==='light'?'#F4F1FF':colors.bg, padding:'12px 24px', borderRadius:'20px'}}>
                            <Clock size={20} color={colors.textMuted}/>
                            <span style={{color:colors.textMain, fontSize:'15px', fontWeight:'600'}}>SÜRE (DK):</span>
                            <input type="number" value={sure} onChange={e=>setSure(e.target.value)} style={{width:'60px', border:'none', background:'transparent', textAlign:'center', fontSize:'20px', outline:'none', fontWeight:'bold', color:colors.primary}} />
                        </div>
                    </div>
                )}
                {aktifSession && !paylasimModu && (
                    <div style={{...s.card, textAlign:'center', background: theme==='light'?'rgba(255,255,255,0.8)':colors.cardBg}}>
                        <div style={{marginBottom:'24px', display:'inline-flex', padding:'30px', borderRadius:'50%', background: colors.successLight}}><Wifi size={50} color={colors.success}/></div>
                        <h2 style={{color: colors.textMain, marginBottom:'8px', fontSize:'22px', fontWeight:'700'}}>Başarıyla Bağlandı</h2>
                        <p style={{color: colors.textMuted, marginBottom:'40px', fontSize:'15px'}}>Sınıf tahtası şu an kullanımda</p>
                        <button style={{...s.btnPrimary, marginBottom:'15px', boxShadow:`0 10px 25px ${theme==='light'?'rgba(139, 92, 246, 0.3)':'rgba(0,0,0,0.4)'}`}} onClick={() => setPaylasimModu(true)}><FileUp size={22}/> İÇERİK PAYLAŞ</button>
                        
                        {/* 🔥 GÜNCELLENEN BUTON 🔥 */}
                        <button style={{...s.btnGhost, color: colors.danger}} onClick={baglantiyiKesVeKilitle}>BAĞLANTIYI KES VE KİLİTLE</button>
                    </div>
                )}
                {paylasimModu && (
                    <div style={s.card}>
                        <h3 style={s.cardTitle}><FileUp size={20} color={colors.primary}/> İçerik Seç</h3>
                        <div style={{display:'flex', flexDirection:'column', gap:16}}>
                            <label style={s.uploadBtn}>
                                <div style={{padding:16, background: colors.primaryLight, borderRadius:'50%'}}><ImageIcon size={32} color={colors.primary}/></div>
                                <div style={{textAlign:'center'}}><div style={{fontWeight:'700', fontSize:'16px', color:colors.textMain}}>Galeri / Kamera</div><div style={{fontSize:'13px', color:colors.textMuted, marginTop:4}}>Fotoğraf veya video yükle</div></div>
                                <input type="file" accept="image/*" onChange={e => {if(e.target.files[0]) dosyaYukle(e.target.files[0])}} style={{display:'none'}} />
                            </label>
                            <label style={s.uploadBtn}>
                                <div style={{padding:16, background: theme==='light'?'#F4F1FF':colors.inputBg, borderRadius:'50%'}}><FileText size={32} color={colors.textMuted}/></div>
                                <div style={{textAlign:'center'}}><div style={{fontWeight:'700', fontSize:'16px', color:colors.textMain}}>Belge</div><div style={{fontSize:'13px', color:colors.textMuted, marginTop:4}}>PDF, Word veya Excel</div></div>
                                <input type="file" onChange={e => {if(e.target.files[0]) dosyaYukle(e.target.files[0])}} style={{display:'none'}} />
                            </label>
                            
                            <div style={{background: theme==='light'?'#F4F1FF':colors.inputBg, padding:20, borderRadius:20, marginTop:10}}>
                                <div style={{position:'relative'}}>
                                    <Link size={20} style={{position:'absolute', left:'16px', top:'16px', color:colors.textMuted}}/>
                                    <input type="text" value={linkInput} onChange={e=>setLinkInput(e.target.value)} placeholder="Bağlantı yapıştır..." style={{...s.input, paddingLeft:'48px', marginBottom:'16px', background: theme==='light'?'white':colors.cardBg, border:`1px solid ${colors.border}`}} />
                                </div>
                                <button style={{...s.btnPrimary, background: colors.textMain, boxShadow:'none', color: 'white'}} onClick={linkGonder}><Send size={18}/> LİNK GÖNDER</button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
      </main>
      
      {taramaAktif && (
          <div style={s.scannerContainer}>
               <div style={{position:'relative', width:'280px', height:'280px', border:`4px solid ${colors.primary}`, borderRadius:'32px', overflow:'hidden', boxShadow:`0 0 0 1000px rgba(0,0,0,0.8)`}}><div id="reader" style={{width:'100%', height:'100%'}}></div><div style={{position:'absolute', top:'50%', left:0, width:'100%', height:'2px', background:colors.primary, boxShadow:`0 0 30px ${colors.primary}`, animation:'scan 2s infinite'}}></div></div>
               <button onClick={durdurVeKapat} style={{marginTop:'40px', padding:'16px 36px', background:'white', border:'none', color:'#1C1C1E', borderRadius:'100px', fontSize:'16px', fontWeight:'700', cursor:'pointer', boxShadow:'0 10px 30px rgba(255,255,255,0.2)'}}>İPTAL</button>
               <style>{`@keyframes scan {0%{top:0%;opacity:0}50%{opacity:1}100%{top:100%;opacity:0}} #reader video{object-fit:cover!important;transform:scale(1.4)}`}</style>
          </div>
      )}
      {notification && <Toast notification={notification} colors={colors} s={s} />}
    </div>
  );
}

const Toast = ({ notification, colors, s }) => {
  const isError = notification.type === 'error';
  if (!s || !colors) return null; 
  return (
    <div style={{...s.toast, background: 'rgba(30,30,30,0.85)', color: 'white'}}>
      {isError ? <AlertTriangle size={24} color="#FF4757"/> : <CheckCircle2 size={24} color="#2ED573"/>}
      <div style={{fontSize:'15px', fontWeight:'600'}}>{notification.msg}</div>
    </div>
  );
};
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Lock, Unlock, Zap, FileUp, CheckCircle2, Wifi, LogOut, ArrowLeft, Send, Link, AlertTriangle, Megaphone, RefreshCw, RefreshCcw, Image as ImageIcon, FileText, Settings, UserPlus, KeyRound, Clock, Save, ChevronDown, ChevronUp, ChevronRight, Plus, Trash2, BookOpen, Utensils, Coffee } from 'lucide-react';

// ⚠️ SUPABASE BİLGİLERİN
const supabaseUrl = 'https://raawrpvdlduvazxincdy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYXdycHZkbGR1dmF6eGluY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjU4NjYsImV4cCI6MjA3OTg0MTg2Nn0.S9Iogzz6rCp-gOy0pa2s8RHYyxEgGmAv6DopNAEbnvE';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- RENKLER & STİLLER ---
const colors = {
  textMain: '#1e293b', textMuted: '#64748b', primary: '#6366f1', danger: '#ef4444', success: '#10b981', warning: '#f59e0b',
  bgGradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  glass: 'rgba(255, 255, 255, 0.70)', glassBorder: 'rgba(255, 255, 255, 0.8)', shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
};

const s = {
  container: { minHeight: '100dvh', width: '100%', background: colors.bgGradient, color: colors.textMain, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflowX: 'hidden', boxSizing: 'border-box' },
  loginWrapper: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 50 },
  header: { width: '100%', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.5)', position: 'sticky', top: 0, zIndex: 50, boxSizing: 'border-box' },
  logo: { fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: colors.primary, display: 'flex', alignItems: 'center', gap: '5px' },
  main: { width: '100%', maxWidth: '600px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, boxSizing: 'border-box' },
  card: { background: colors.glass, backdropFilter: 'blur(12px)', border: `1px solid ${colors.glassBorder}`, borderRadius: '24px', padding: '24px', boxShadow: colors.shadow, width: '100%', boxSizing: 'border-box' },
  cardTitle: { color: colors.textMain, marginBottom: '15px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 },
  input: { width: '100%', padding: '16px', marginBottom: '12px', background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', borderRadius: '12px', color: colors.textMain, fontSize: '16px', outline: 'none', transition: 'border-color 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '16px', marginBottom: '10px', background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', borderRadius: '12px', color: colors.textMain, fontSize: '15px', outline: 'none', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
  btnPrimary: { width: '100%', padding: '16px', background: colors.primary, border: 'none', borderRadius: '14px', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', transition: 'transform 0.1s', boxSizing: 'border-box' },
  btnGhost: { background: 'transparent', border: `1px solid ${colors.danger}`, color: colors.danger, padding: '14px', borderRadius: '14px', width: '100%', cursor: 'pointer', marginTop: '10px', fontWeight: '600', boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%' },
  bigIconBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', color: colors.textMain, cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontWeight: '600', transition: 'all 0.2s', boxSizing: 'border-box' },
  scannerContainer: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)', background: 'white', borderLeft: '4px solid', padding: '16px 24px', borderRadius: '12px', color: colors.textMain, zIndex: 200, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', minWidth: '320px', fontWeight: '500', maxWidth: '90%' },
  uploadBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '25px', border: '2px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', gap: '10px' },
  tabBtn: { flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s' },
  
  accordionItem: { background: 'rgba(255,255,255,0.8)', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '8px', overflow: 'hidden', transition: 'all 0.2s' },
  accordionHeader: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '15px' },
  accordionContent: { padding: '15px', background: 'white', borderTop: '1px solid #e2e8f0' },
  manualTimeInput: { width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '16px', outline: 'none', textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold' },
  
  settingMenuBtn: { 
    width: '100%', 
    boxSizing: 'border-box', 
    padding: '18px', 
    background: 'white', 
    borderRadius: '16px', 
    border: '1px solid #e2e8f0', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    cursor: 'pointer', 
    fontWeight: '700', 
    fontSize: '16px', 
    color: colors.textMain, 
    marginBottom: '10px', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)' 
  },
  
  typeBtn: { flex:1, padding:'8px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', cursor:'pointer', fontSize:'12px', border:'1px solid transparent' }
};

export default function App() {
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

  const showToast = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    document.body.style.margin = '0'; document.body.style.padding = '0'; document.body.style.overflowX = 'hidden'; document.body.style.width = '100%'; document.body.style.boxSizing = 'border-box';
    const kayitliOturum = localStorage.getItem('teachnlock_user');
    const kayitliSession = localStorage.getItem('teachnlock_session');
    if (kayitliOturum) setOturum(JSON.parse(kayitliOturum));
    if (kayitliSession) setAktifSession(kayitliSession);
  }, []);

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
  
  useEffect(() => { if (oturum && taramaAktif) { if (scannerRef.current) try { scannerRef.current.clear(); } catch(e){} const html5QrCode = new Html5Qrcode("reader"); scannerRef.current = html5QrCode; html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, kilitAc, () => {}).catch(() => setTaramaAktif(false)); } return () => { if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {}); }; }, [oturum, taramaAktif]);
  
  const dosyaYukle = async (file) => { if (!aktifSession) return; setYukleniyor(true); try { const fileName = `${Date.now()}.${file.name.split('.').pop()}`; await supabase.storage.from('class-files').upload(fileName, file); const { data: { publicUrl } } = supabase.storage.from('class-files').getPublicUrl(fileName); const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'file'; await supabase.from('files').insert({ session_id: aktifSession, sender_name: oturum.ad_soyad, file_type: type, file_url: publicUrl, file_name: file.name }); showToast("Gönderildi!", 'success'); setPaylasimModu(false); } catch (e) { showToast("Yükleme hatası", 'error'); } finally { setYukleniyor(false); } };
  const linkGonder = async () => { if (!linkInput) return; setYukleniyor(true); await supabase.from('files').insert({ session_id: aktifSession, sender_name: oturum.ad_soyad, file_type: 'link', file_url: linkInput, file_name: 'Bağlantı' }); showToast("Link paylaşıldı!", 'success'); setLinkInput(''); setPaylasimModu(false); setYukleniyor(false); };
  
  const tahtalariGetir = async () => { const { data } = await supabase.from('boards').select('*').order('name', { ascending: true }); if (data) setTahtalar(data); };
  const duyuruGetir = async () => { const { data } = await supabase.from('school_settings').select('announcement').eq('id', 1).single(); if (data) setDuyuruMetni(data.announcement || ''); };
  const duyuruGuncelle = async () => { const { error } = await supabase.from('school_settings').update({ announcement: duyuruMetni }).eq('id', 1); if (error) showToast("Hata", 'error'); else showToast("Duyuru yayınlandı!", 'success'); };
  
  // 🔥 YENİ: DUYURU SİLME FONKSİYONU
  const duyuruKaldir = async () => {
    if (!confirm("Yayındaki duyuruyu kaldırmak istediğine emin misin?")) return;
    const { error } = await supabase.from('school_settings').update({ announcement: null }).eq('id', 1);
    if (error) { showToast("Hata oluştu!", 'error'); } 
    else { showToast("Duyuru kaldırıldı.", 'success'); setDuyuruMetni(''); }
  };

  const kilitIslem = async (machineId, komut) => { if (!confirm(`${komut === 'LOCK' ? 'KİLİTLEMEK' : 'AÇMAK'} istediğine emin misin?`)) return; await supabase.from('boards').update({ lock_command: komut, last_seen: new Date().toISOString() }).eq('machine_id', machineId); tahtalariGetir(); showToast('Komut gönderildi', 'success'); };
  const topluIslem = async (komut) => { if (!confirm(`TÜMÜNÜ ${komut === 'LOCK' ? 'KİLİTLEMEK' : 'AÇMAK'} istediğine emin misin?`)) return; await supabase.from('boards').update({ lock_command: komut, last_seen: new Date().toISOString() }).neq('machine_id', '0'); showToast('Toplu komut gönderildi', 'success'); };
  const okuluKapat = async () => { if (!confirm("⚠️ DİKKAT: TÜM OKULU KAPATMAK (SHUTDOWN) üzeresin! Onaylıyor musun?")) return; await supabase.from('school_settings').update({ system_command: 'SHUTDOWN_ALL' }).eq('id', 1); showToast('KAPATMA EMRİ VERİLDİ!', 'danger'); setTimeout(() => supabase.from('school_settings').update({ system_command: null }).eq('id', 1), 5000); };

  const ogretmenEkle = async () => {
    if (!yeniOgretmen.ad || !yeniOgretmen.kullanici || !yeniOgretmen.sifre) { showToast("Tüm alanları doldur!", 'error'); return; }
    const { error } = await supabase.from('teachers').insert([{ ad_soyad: yeniOgretmen.ad, kullanici_adi: yeniOgretmen.kullanici, sifre: yeniOgretmen.sifre }]);
    if (error) showToast("Hata: Kullanıcı adı alınmış olabilir.", 'error'); else { showToast("Öğretmen eklendi!", 'success'); setYeniOgretmen({ad:'', kullanici:'', sifre:''}); }
  };
  const sifreGuncelle = async () => {
    if (!sifreSifirlama.kullanici || !sifreSifirlama.yeniSifre) { showToast("Tüm alanları doldur!", 'error'); return; }
    const { data } = await supabase.from('teachers').select('*').eq('kullanici_adi', sifreSifirlama.kullanici).single();
    if (!data) { showToast("Böyle bir öğretmen bulunamadı.", 'error'); return; }
    const { error } = await supabase.from('teachers').update({ sifre: sifreSifirlama.yeniSifre }).eq('kullanici_adi', sifreSifirlama.kullanici);
    if (error) showToast("Güncelleme hatası!", 'error'); else { showToast("Şifre sıfırlandı!", 'success'); setSifreSifirlama({kullanici:'', yeniSifre:''}); }
  };

  const dersProgramiGetir = async () => {
      const { data } = await supabase.from('lecture_schedule').select('*').order('start_time', { ascending: true });
      if (data) setDersProgrami(data);
  };
  const dersGuncelle = async (id, field, value) => {
      const yeniListe = dersProgrami.map(d => d.id === id ? { ...d, [field]: value } : d);
      setDersProgrami(yeniListe);
  };
  const dersKaydet = async (ders) => {
      const { error } = await supabase.from('lecture_schedule').update({ 
          name: ders.name, start_time: ders.start_time, end_time: ders.end_time, type: ders.type 
      }).eq('id', ders.id);
      if (error) showToast("Kayıt başarısız!", 'error'); else showToast("Güncellendi!", 'success');
  };
  const dersEkle = async () => {
      const isFriday = seciliGun === 'cuma';
      const { error } = await supabase.from('lecture_schedule').insert([{
          name: 'Yeni Ders', start_time: '00:00', end_time: '00:00', is_friday: isFriday, type: 'LESSON'
      }]);
      // 🔥 HATA LOGLAMA
      if (error) { console.error(error); showToast("Ekleme hatası: İzinleri kontrol edin", 'error'); } 
      else { showToast("Ders eklendi", 'success'); dersProgramiGetir(); }
  };
  const dersSil = async (id) => {
      if(!confirm("Bu dersi silmek istediğine emin misin?")) return;
      const { error } = await supabase.from('lecture_schedule').delete().eq('id', id);
      if (error) showToast("Silme hatası", 'error');
      else { showToast("Silindi", 'success'); dersProgramiGetir(); }
  };

  const toggleAyarMenu = (menu) => { if (aktifAyarMenusu === menu) setAktifAyarMenusu(null); else setAktifAyarMenusu(menu); };
  const toggleDersAccordion = (id) => { if (acikDersId === id) setAcikDersId(null); else setAcikDersId(id); };

  if (!oturum) return (
    <div style={s.container}>
      <div style={s.loginWrapper}>
        <div style={{...s.card, maxWidth: '380px', textAlign: 'center'}}>
          <div style={{...s.logo, justifyContent:'center', marginBottom:'20px', fontSize:'24px'}}>
             <Lock size={28} color={colors.primary} style={{marginRight:5}} /> TEACHN<span>LOCK</span>
          </div>
          <p style={{color: colors.textMuted, marginBottom: '30px', fontSize: '14px'}}>Öğretmen Paneline Giriş Yap</p>
          <input style={s.input} type="text" placeholder="Kullanıcı Adı" value={kullaniciAdi} onChange={e => setKullaniciAdi(e.target.value)} />
          <input style={s.input} type="password" placeholder="Şifre" value={sifre} onChange={e => setSifre(e.target.value)} />
          <button style={s.btnPrimary} onClick={girisYap}>GİRİŞ YAP</button>
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
           {showBackBtn && <button onClick={geriDon} style={{background:'none', border:'none', cursor:'pointer', color: colors.textMain}}><ArrowLeft size={24}/></button>}
           <div style={s.logo}>TEACHN<span style={{color: colors.primary}}>LOCK</span></div>
        </div>
        <div style={{display:'flex', gap:'15px'}}>
           {isAdmin && !ayarlarAcik && <button onClick={() => setAyarlarAcik(true)} style={{background:'none', border:'none', cursor:'pointer', color: colors.textMain}}><Settings size={22}/></button>}
           <button onClick={cikisYap} style={{background:'none', border:'none', cursor:'pointer', color: colors.danger}}><LogOut size={22}/></button>
        </div>
      </header>

      <main style={s.main}>
        {isAdmin && adminPanelGoster ? (
            ayarlarAcik ? (
              <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                 
                 <div onClick={() => toggleAyarMenu('dersler')} style={s.settingMenuBtn}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{padding:8, background:'#e0e7ff', borderRadius:'8px', color:colors.primary}}><Clock size={20}/></div>
                        <span>Ders Saati Editörü</span>
                    </div>
                    {aktifAyarMenusu === 'dersler' ? <ChevronUp size={20} color={colors.textMuted}/> : <ChevronRight size={20} color={colors.textMuted}/>}
                 </div>
                 
                 {aktifAyarMenusu === 'dersler' && (
                     <div style={{...s.card, marginTop:0, animation:'fadeIn 0.2s'}}>
                        <div style={{display:'flex', background:'#f1f5f9', borderRadius:'8px', marginBottom:'15px', padding:'4px'}}>
                            <div onClick={() => setSeciliGun('haftaIci')} style={{...s.tabBtn, background: seciliGun === 'haftaIci' ? 'white' : 'transparent', color: seciliGun === 'haftaIci' ? colors.primary : colors.textMuted, boxShadow: seciliGun === 'haftaIci' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', borderRadius:'6px'}}>Hafta İçi</div>
                            <div onClick={() => setSeciliGun('cuma')} style={{...s.tabBtn, background: seciliGun === 'cuma' ? 'white' : 'transparent', color: seciliGun === 'cuma' ? colors.primary : colors.textMuted, boxShadow: seciliGun === 'cuma' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', borderRadius:'6px'}}>Cuma</div>
                        </div>

                        <div style={{display:'flex', flexDirection:'column'}}>
                            {dersProgrami.filter(d => seciliGun === 'cuma' ? d.is_friday : !d.is_friday).map(ders => (
                                <div key={ders.id} style={s.accordionItem}>
                                    <div onClick={() => toggleDersAccordion(ders.id)} style={s.accordionHeader}>
                                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                                            {ders.type === 'LESSON' && <BookOpen size={16} color={colors.primary}/>}
                                            {ders.type === 'BREAK' && <Coffee size={16} color={colors.warning}/>}
                                            {ders.type === 'LUNCH' && <Utensils size={16} color={colors.danger}/>}
                                            <span>{ders.name}</span>
                                        </div>
                                        <div style={{display:'flex', alignItems:'center'}}>
                                            <span style={{fontSize:'12px', color:colors.textMuted, marginRight:'10px', fontWeight:'normal'}}>{ders.start_time.slice(0,5)} - {ders.end_time.slice(0,5)}</span>
                                            {acikDersId === ders.id ? <ChevronUp size={16} color={colors.primary}/> : <ChevronDown size={16} color={colors.textMuted}/>}
                                        </div>
                                    </div>
                                    {acikDersId === ders.id && (
                                        <div style={s.accordionContent}>
                                            <input type="text" value={ders.name} onChange={(e) => dersGuncelle(ders.id, 'name', e.target.value)} style={{...s.input, marginBottom:10}} placeholder="Ders Adı" />
                                            
                                            <div style={{display:'flex', gap:5, marginBottom:15}}>
                                                <div onClick={() => dersGuncelle(ders.id, 'type', 'LESSON')} style={{...s.typeBtn, background: ders.type==='LESSON' ? '#e0e7ff' : '#f8fafc', color: ders.type==='LESSON' ? colors.primary : colors.textMuted, borderColor: ders.type==='LESSON' ? colors.primary : 'transparent'}}><BookOpen size={14}/> Ders</div>
                                                <div onClick={() => dersGuncelle(ders.id, 'type', 'BREAK')} style={{...s.typeBtn, background: ders.type==='BREAK' ? '#fef3c7' : '#f8fafc', color: ders.type==='BREAK' ? colors.warning : colors.textMuted, borderColor: ders.type==='BREAK' ? colors.warning : 'transparent'}}><Coffee size={14}/> Teneffüs</div>
                                                <div onClick={() => dersGuncelle(ders.id, 'type', 'LUNCH')} style={{...s.typeBtn, background: ders.type==='LUNCH' ? '#fee2e2' : '#f8fafc', color: ders.type==='LUNCH' ? colors.danger : colors.textMuted, borderColor: ders.type==='LUNCH' ? colors.danger : 'transparent'}}><Utensils size={14}/> Öğle</div>
                                            </div>

                                            <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'15px'}}>
                                                <div style={{flex:1}}><div style={{fontSize:'11px', color:colors.textMuted, marginBottom:'5px', textTransform:'uppercase', fontWeight:'bold'}}>Başlangıç</div><input type="text" placeholder="09:00" maxLength={5} value={ders.start_time.slice(0,5)} onChange={(e) => dersGuncelle(ders.id, 'start_time', e.target.value)} style={s.manualTimeInput} /></div>
                                                <div style={{flex:1}}><div style={{fontSize:'11px', color:colors.textMuted, marginBottom:'5px', textTransform:'uppercase', fontWeight:'bold'}}>Bitiş</div><input type="text" placeholder="09:40" maxLength={5} value={ders.end_time.slice(0,5)} onChange={(e) => dersGuncelle(ders.id, 'end_time', e.target.value)} style={s.manualTimeInput} /></div>
                                            </div>
                                            <div style={{display:'flex', gap:10}}>
                                                <button onClick={() => dersSil(ders.id)} style={{...s.btnGhost, width:'auto', padding:'10px', marginTop:0}}><Trash2 size={18}/></button>
                                                <button onClick={() => dersKaydet(ders)} style={{...s.btnPrimary, padding:'10px', marginTop:0}}><Save size={18}/> KAYDET</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button onClick={dersEkle} style={{...s.btnGhost, color:colors.primary, borderColor:colors.primary, borderStyle:'dashed', marginTop:10}}><Plus size={18}/> YENİ DERS EKLE</button>
                        </div>
                     </div>
                 )}

                 <div onClick={() => toggleAyarMenu('ogretmen')} style={s.settingMenuBtn}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{padding:8, background:'#dcfce7', borderRadius:'8px', color:colors.success}}><UserPlus size={20}/></div><span>Öğretmen Ekle</span></div>
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
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{padding:8, background:'#fee2e2', borderRadius:'8px', color:colors.danger}}><KeyRound size={20}/></div><span>Yeni Şifre Ver</span></div>
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
                        <div style={{...s.bigIconBtn, borderColor: colors.danger, color: colors.danger}} onClick={() => topluIslem('LOCK')}><div style={{padding:10, background:'#fee2e2', borderRadius:'50%'}}><Lock size={24}/></div> TÜMÜNÜ KİLİTLE</div>
                        <div style={{...s.bigIconBtn, borderColor: colors.success, color: colors.success}} onClick={() => topluIslem('UNLOCK')}><div style={{padding:10, background:'#dcfce7', borderRadius:'50%'}}><Unlock size={24}/></div> TÜMÜNÜ AÇ</div>
                    </div>
                    <button style={{...s.btnPrimary, background: '#fef2f2', color: colors.danger, border: `1px solid ${colors.danger}`, marginTop:'15px', boxShadow:'none'}} onClick={okuluKapat}><Zap size={18}/> OKULU KAPAT (KILL SWITCH)</button>
                </div>
                {/* 🔥 YENİ: DUYURU YÖNETİMİ (SİL BUTONLU) */}
                <div style={s.card}>
                    <h3 style={s.cardTitle}><Megaphone size={16} color={colors.primary}/> Duyuru Yönetimi</h3>
                    <textarea 
                        style={s.textarea} 
                        value={duyuruMetni} 
                        onChange={(e) => setDuyuruMetni(e.target.value)} 
                        placeholder="Duyuru mesajı..." 
                    />
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={duyuruGuncelle} style={{...s.btnPrimary, background: colors.textMain, flex: 2}}>
                            <RefreshCw size={16}/> YAYINLA
                        </button>
                        <button onClick={duyuruKaldir} style={{...s.btnPrimary, background: '#fee2e2', color: colors.danger, border:`1px solid ${colors.danger}`, flex: 1, boxShadow:'none'}}>
                            <Trash2 size={16}/> KALDIR
                        </button>
                    </div>
                </div>
                <div style={s.card}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                        <h3 style={{...s.cardTitle, marginBottom:0}}>Sınıf Listesi</h3>
                        <button style={{border:'none', background:'none', color:colors.primary, fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:4}} onClick={tahtalariGetir}><RefreshCcw size={14}/> Yenile</button>
                    </div>
                    {tahtalar.map(t => (
                        <div key={t.machine_id} style={{padding:'12px', background:'white', border:'1px solid #e2e8f0', borderRadius:'12px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{display:'flex', alignItems:'center', gap:10}}>
                                <div style={{width:10, height:10, borderRadius:'50%', background: t.is_locked ? colors.danger : colors.success}}></div>
                                <div><div style={{fontWeight:'700', fontSize:'15px', color: colors.textMain}}>{t.name || 'İsimsiz Sınıf'}</div><div style={{fontSize:'12px', color: colors.textMuted}}>{t.is_locked ? 'Kilitli' : 'Açık'}</div></div>
                            </div>
                            <button onClick={() => kilitIslem(t.machine_id, t.is_locked ? 'UNLOCK' : 'LOCK')} style={{padding:'8px 16px', borderRadius:'8px', border:'none', fontWeight:'600', cursor:'pointer', fontSize:'13px', background: t.is_locked ? '#dcfce7' : '#fee2e2', color: t.is_locked ? '#15803d' : '#b91c1c'}}>{t.is_locked ? 'AÇ' : 'KİLİTLE'}</button>
                        </div>
                    ))}
                </div>
                <button style={{...s.btnPrimary, background: 'white', color: colors.primary, border:`1px solid ${colors.primary}`, boxShadow:'none'}} onClick={() => setAdminPanelGoster(false)}>KAMERAYI AÇ</button>
            </>
            )
        ) : (
            /* --- ÖĞRETMEN / QR EKRANI --- */
            <>
                {!taramaAktif && !aktifSession && (
                    <div style={{...s.card, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'40px 20px'}}>
                        <div onClick={() => setTaramaAktif(true)} style={{width:'160px', height:'160px', borderRadius:'50%', background:'white', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 10px 30px rgba(99, 102, 241, 0.2)', cursor:'pointer', marginBottom:'30px', transition:'transform 0.2s'}}>
                            <Scan size={70} color={colors.primary} strokeWidth={1.5} />
                        </div>
                        <h2 style={{color: colors.textMain, marginBottom:'10px', fontSize:'22px'}}>Tahtayı Aç</h2>
                        <div style={{display:'flex', alignItems:'center', gap:'15px', background:'white', padding:'10px 20px', borderRadius:'100px', border:'1px solid #e2e8f0'}}>
                            <span style={{color:colors.textMuted, fontSize:'14px', fontWeight:'600'}}>SÜRE (DK):</span>
                            <input type="number" value={sure} onChange={e=>setSure(e.target.value)} style={{width:'50px', border:'none', borderBottom:`2px solid ${colors.primary}`, textAlign:'center', fontSize:'18px', outline:'none', fontWeight:'bold', color:colors.primary}} />
                        </div>
                    </div>
                )}
                {aktifSession && !paylasimModu && (
                    <div style={{...s.card, textAlign:'center'}}>
                        <div style={{marginBottom:'20px', display:'inline-flex', padding:'20px', borderRadius:'50%', background:'#dcfce7', boxShadow:'0 0 0 8px #f0fdf4'}}><Wifi size={40} color={colors.success}/></div>
                        <h2 style={{color: colors.textMain, marginBottom:'5px', fontSize:'20px'}}>Başarıyla Bağlandı</h2>
                        <p style={{color: colors.textMuted, marginBottom:'30px', fontSize:'14px'}}>Sistem şuan aktif</p>
                        <button style={s.btnPrimary} onClick={() => setPaylasimModu(true)}><FileUp size={20}/> İÇERİK PAYLAŞ</button>
                        <button style={s.btnGhost} onClick={() => setAktifSession(null)}>BAĞLANTIYI KES</button>
                    </div>
                )}
                {paylasimModu && (
                    <div style={s.card}>
                        <h3 style={s.cardTitle}><FileUp size={20} color={colors.primary}/> İçerik Seç</h3>
                        <div style={{display:'flex', flexDirection:'column', gap:15}}>
                            <label style={s.uploadBtn}>
                                <div style={{padding:12, background:'#e0e7ff', borderRadius:'50%'}}><ImageIcon size={24} color={colors.primary}/></div>
                                <div style={{textAlign:'center'}}><div style={{fontWeight:'700', fontSize:'15px', color:colors.textMain}}>Görsel / Ekran Görüntüsü</div><div style={{fontSize:'12px', color:colors.textMuted}}>Anında foto çek veya galeriden seç</div></div>
                                <input type="file" accept="image/*" onChange={e => {if(e.target.files[0]) dosyaYukle(e.target.files[0])}} style={{display:'none'}} />
                            </label>
                            <label style={s.uploadBtn}>
                                <div style={{padding:12, background:'#f1f5f9', borderRadius:'50%'}}><FileText size={24} color={colors.textMuted}/></div>
                                <div style={{textAlign:'center'}}><div style={{fontWeight:'700', fontSize:'15px', color:colors.textMain}}>Belge / Dosya</div><div style={{fontSize:'12px', color:colors.textMuted}}>PDF, Word, Excel vb.</div></div>
                                <input type="file" onChange={e => {if(e.target.files[0]) dosyaYukle(e.target.files[0])}} style={{display:'none'}} />
                            </label>
                            <div style={{width:'100%', height:1, background:'#e2e8f0', margin:'10px 0'}}></div>
                            <div style={{position:'relative'}}>
                                <Link size={18} style={{position:'absolute', left:'16px', top:'18px', color:colors.textMuted}}/>
                                <input type="text" value={linkInput} onChange={e=>setLinkInput(e.target.value)} placeholder="Link yapıştır (Youtube vb.)..." style={{...s.input, paddingLeft:'45px', marginBottom:'15px'}} />
                            </div>
                            <button style={{...s.btnPrimary, background: colors.textMain}} onClick={linkGonder}><Send size={18}/> LİNK GÖNDER</button>
                        </div>
                    </div>
                )}
            </>
        )}
      </main>
      
      {taramaAktif && (
          <div style={s.scannerContainer}>
               <div style={{position:'relative', width:'280px', height:'280px', border:`4px solid ${colors.primary}`, borderRadius:'24px', overflow:'hidden', boxShadow:`0 0 0 1000px rgba(0,0,0,0.7)`}}><div id="reader" style={{width:'100%', height:'100%'}}></div><div style={{position:'absolute', top:'50%', left:0, width:'100%', height:'2px', background:colors.primary, boxShadow:`0 0 20px ${colors.primary}`, animation:'scan 2s infinite'}}></div></div>
               <button onClick={durdurVeKapat} style={{marginTop:'30px', padding:'12px 30px', background:'white', border:'none', color:'black', borderRadius:'100px', fontSize:'15px', fontWeight:'700', cursor:'pointer'}}>İPTAL</button>
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
    <div style={{...s.toast, borderLeftColor: isError ? colors.danger : colors.success}}>
      {isError ? <AlertTriangle size={24} color={colors.danger}/> : <CheckCircle2 size={24} color={colors.success}/>}
      <div><div style={{fontSize:'14px', fontWeight:'700', color: colors.textMain}}>{isError ? 'HATA' : 'BAŞARILI'}</div><div style={{fontSize:'14px', color: colors.textMuted}}>{notification.msg}</div></div>
    </div>
  );
};
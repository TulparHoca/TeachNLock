import { useState, useEffect } from 'react';
import { useLock } from '../context/LockContext';
import QRCode from 'qrcode';
import { Lock, ScanFace, Cloud, Sun, CloudRain, Users, Timer, Power, X, RefreshCw, Delete, Coffee, BookOpen } from 'lucide-react';

// --- BİLEŞEN: NUMPAD ---
const Numpad = ({ onInput, onDelete, onConfirm }: { onInput: (n: number) => void, onDelete: () => void, onConfirm: () => void }) => {
  return (
    <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/10 w-full h-full flex flex-col justify-center">
      <div className="grid grid-cols-3 gap-4"> 
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button 
            key={num}
            onClick={() => onInput(num)}
            className="h-20 bg-slate-800 hover:bg-slate-700 hover:border-white/20 border border-transparent rounded-xl text-3xl font-bold text-white transition active:scale-95 shadow-lg"
          >
            {num}
          </button>
        ))}
        <button onClick={onDelete} className="h-20 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-center transition active:scale-95 shadow-lg">
            <Delete size={32}/>
        </button>
        
        <button onClick={() => onInput(0)} className="h-20 bg-slate-800 hover:bg-slate-700 border border-transparent hover:border-white/20 rounded-xl text-3xl font-bold text-white transition active:scale-95 shadow-lg">0</button>
        
        <button onClick={onConfirm} className="h-20 bg-green-600 hover:bg-green-500 border border-green-400/50 text-white rounded-xl font-bold text-xl transition active:scale-95 shadow-[0_0_15px_rgba(22,163,74,0.4)]">OK</button>
      </div>
    </div>
  );
};

// --- MODAL: SINAV MODU ---
const ExamModal = ({ onClose }: { onClose: () => void }) => {
  const [inputVal, setInputVal] = useState('40');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const handleInput = (n: number) => setInputVal(prev => (prev === '0' ? String(n) : prev + n).slice(0, 3));
  const handleDelete = () => setInputVal(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  const startExam = () => {
    const minutes = parseInt(inputVal);
    if (minutes > 0) setTimeLeft(minutes * 60);
  };

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(prev => (prev ? prev - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
      <div className="bg-slate-900 border border-yellow-500/30 p-10 rounded-3xl w-[1100px] flex gap-10 items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.2)]">
        
        {timeLeft === null ? (
          <>
            <div className="flex-1 flex flex-col items-center gap-8 border-r border-white/10 pr-10">
               <h2 className="text-4xl font-bold text-yellow-400 flex items-center gap-3"><Timer size={40}/> SINAV SÜRESİ</h2>
               
               <div className="flex flex-col items-center gap-2">
                 <span className="text-sm text-slate-400 uppercase tracking-widest font-bold">Dakika Giriniz</span>
                 <div className="text-8xl font-mono font-bold text-white bg-black/40 px-10 py-6 rounded-2xl border-2 border-white/10 min-w-[300px] text-center shadow-inner">
                   {inputVal}<span className="text-2xl text-slate-500 ml-2">dk</span>
                 </div>
               </div>

               <button onClick={startExam} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-5 rounded-2xl text-2xl shadow-[0_0_20px_rgba(202,138,4,0.4)] transition active:scale-95">
                 SINAVI BAŞLAT
               </button>
            </div>

            <div className="flex-1 h-full">
               <Numpad onInput={handleInput} onDelete={handleDelete} onConfirm={startExam} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center w-full py-10">
             <div className="text-[12rem] leading-none font-mono font-bold text-yellow-500 tabular-nums tracking-tighter mb-10 drop-shadow-[0_0_40px_rgba(234,179,8,0.4)]">
               {format(timeLeft)}
             </div>
             <p className="text-slate-400 animate-pulse mb-8 text-3xl uppercase tracking-widest font-light border-b border-slate-700 pb-2">Sınav Modu Aktif</p>
             <button onClick={() => setTimeLeft(null)} className="px-8 py-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition border border-red-500/30 font-bold text-lg">
               SAYACI DURDUR
             </button>
          </div>
        )}

        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition bg-slate-800 p-2 rounded-full hover:bg-slate-700"><X size={32}/></button>
      </div>
    </div>
  );
};

// --- MODAL: GRUP OLUŞTURMA ---
const GroupModal = ({ onClose }: { onClose: () => void }) => {
  const [activeInput, setActiveInput] = useState<'TOTAL' | 'SIZE'>('TOTAL');
  const [totalStudents, setTotalStudents] = useState('30');
  const [groupSize, setGroupSize] = useState('4');
  const [groups, setGroups] = useState<string[][]>([]);

  const handleInput = (n: number) => {
    if (activeInput === 'TOTAL') setTotalStudents(p => (p==='0'?String(n):p+n).slice(0,3));
    else setGroupSize(p => (p==='0'?String(n):p+n).slice(0,2));
  };
  const handleDelete = () => {
    if (activeInput === 'TOTAL') setTotalStudents(p => p.length>1?p.slice(0,-1):'0');
    else setGroupSize(p => p.length>1?p.slice(0,-1):'0');
  };

  const generate = () => {
    const total = parseInt(totalStudents) || 0;
    const size = parseInt(groupSize) || 1;
    if (total === 0 || size === 0) return;

    const students = Array.from({ length: total }, (_, i) => i + 1);
    const shuffled = students.sort(() => 0.5 - Math.random());
    const result = [];
    while (shuffled.length > 0) result.push(shuffled.splice(0, size).map(String));
    setGroups(result);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
      <div className="bg-slate-900 border border-purple-500/30 p-8 rounded-3xl w-[1200px] h-[700px] flex shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden">
        
        <div className="w-[450px] border-r border-white/10 pr-8 flex flex-col gap-6 shrink-0">
           <h2 className="text-3xl font-bold text-purple-400 flex items-center gap-3"><Users size={32} /> GRUP OLUŞTUR</h2>
           
           <div className="flex gap-4">
             <div onClick={()=>setActiveInput('TOTAL')} className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition ${activeInput==='TOTAL'?'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]':'bg-slate-800 border-transparent hover:bg-slate-700'}`}>
               <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Mevcut</span>
               <div className="text-4xl font-mono font-bold mt-1">{totalStudents}</div>
             </div>
             <div onClick={()=>setActiveInput('SIZE')} className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition ${activeInput==='SIZE'?'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]':'bg-slate-800 border-transparent hover:bg-slate-700'}`}>
               <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Kişi/Grup</span>
               <div className="text-4xl font-mono font-bold mt-1">{groupSize}</div>
             </div>
           </div>

           <div className="flex-1">
             <Numpad onInput={handleInput} onDelete={handleDelete} onConfirm={generate} />
           </div>
           
           <button onClick={generate} className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg shadow-purple-600/30 transition active:scale-95">
             <RefreshCw size={24}/> KARIŞTIR & OLUŞTUR
           </button>
        </div>

        <div className="flex-1 pl-8 overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-3 gap-4">
             {groups.map((grp, i) => (
               <div key={i} className="bg-slate-800/60 border border-purple-500/20 p-5 rounded-2xl relative group hover:border-purple-500/50 transition hover:bg-slate-800">
                 <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-500 to-transparent opacity-50"></div>
                 <div className="text-purple-300 font-bold text-xs uppercase tracking-wider bg-purple-500/10 px-2 py-1 rounded w-fit mb-3">Grup {i+1}</div>
                 <div className="text-xl font-mono text-white text-center leading-relaxed font-medium">
                    {grp.map((s, idx) => (
                      <span key={idx}>{s}{idx < grp.length-1 && <span className="text-purple-500/50 mx-2">|</span>}</span>
                    ))}
                 </div>
               </div>
             ))}
             {groups.length === 0 && (
                <div className="col-span-3 flex flex-col items-center justify-center h-full text-slate-600 opacity-50 mt-20">
                    <Users size={80} className="mb-4"/>
                    <p className="text-xl">Parametreleri girin ve Karıştır'a basın.</p>
                </div>
             )}
           </div>
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition bg-slate-800 p-2 rounded-full hover:bg-slate-700"><X size={32}/></button>
      </div>
    </div>
  );
};

// --- ANA BİLEŞEN ---
export default function LockScreen() {
  const { sessionId, machineId, unlock, scheduleStatus } = useLock();
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{temp: number, code: number} | null>(null);
  
  const [activeModal, setActiveModal] = useState<'NONE' | 'EXAM' | 'GROUP'>('NONE');
  const [emergencyInput, setEmergencyInput] = useState('');

  // QR
  useEffect(() => {
    if (sessionId) QRCode.toDataURL(sessionId, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } }).then(setQrCodeUrl);
  }, [sessionId]);

  // Saat
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hava Durumu
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current_weather=true');
        const data = await res.json();
        setWeather({ temp: Math.round(data.current_weather.temperature), code: data.current_weather.weathercode });
      } catch (e) { console.error("Hava durumu hatası"); }
    };
    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000); 
    return () => clearInterval(weatherTimer);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun size={40} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />;
    if (code <= 3) return <Cloud size={40} className="text-gray-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />;
    return <CloudRain size={40} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />;
  };

  // ACİL DURUM KODU (1453 + Tarih)
  const handleEmergency = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmergencyInput(val);

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');

    const dynamicCode = `${day}${month}34`;
    const MASTER_CODE = "1453"; 

    if (val === dynamicCode || val === MASTER_CODE) { 
        unlock(true); 
        setEmergencyInput(''); 
    }
  };

  // 🔥 GÜNCELLENDİ: ARTIK SORU SORMAZ, DİREKT KAPATIR
  const handleSystemShutdown = () => {
      window.electron?.shutdownPC();
  };

  // Tasarım: Ders Durumu Renkleri
  const isFreeTime = scheduleStatus.includes('Serbest') || scheduleStatus.includes('Teneffüs') || scheduleStatus.includes('Öğle');
  const statusColor = isFreeTime ? 'text-emerald-400' : 'text-amber-400';
  const statusBg = isFreeTime ? 'bg-emerald-950/40 border-emerald-500/20 shadow-emerald-500/10' : 'bg-amber-950/40 border-amber-500/20 shadow-amber-500/10';
  const statusIcon = isFreeTime ? <Coffee size={20} className={statusColor}/> : <BookOpen size={20} className={statusColor}/>;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[url('https://images.unsplash.com/photo-1510511459019-5dda7724fd87?q=80&w=1920')] bg-cover bg-center flex flex-col items-center justify-between py-10 text-white overflow-hidden font-sans select-none">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-0"></div>

      {/* ÜST */}
      <div className="relative z-10 w-full px-12 flex justify-between items-start animate-in fade-in slide-in-from-top duration-700">
        <div className="text-left">
          <h1 className="text-7xl font-extrabold tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] font-mono">
            {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-xl text-slate-400 font-medium tracking-wide uppercase ml-1">
            {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
           <div className="text-right">
             <div className="text-3xl font-bold">{weather ? `${weather.temp}°C` : '--'}</div>
             <div className="text-xs text-slate-400 uppercase tracking-wider">İstanbul</div>
           </div>
           {weather ? getWeatherIcon(weather.code) : <Cloud size={40} className="text-slate-500 opacity-50"/>}
        </div>
      </div>

      {/* ORTA */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_-10px_rgba(6,182,212,0.3)] flex flex-col items-center group transition-all duration-500 hover:shadow-[0_0_70px_-10px_rgba(6,182,212,0.5)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-cyan-500 blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* 🔥 QR ÜSTÜNDEKİ DURUM HAPI */}
          <div className={`
             absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-6 py-2.5 rounded-full border backdrop-blur-md shadow-lg flex items-center gap-3 animate-in zoom-in duration-500 z-20 
             ${statusBg}
          `}>
             <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isFreeTime ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'}`}></div>
             {statusIcon}
             <span className={`text-base font-bold tracking-widest uppercase font-mono ${statusColor}`}>
               {scheduleStatus}
             </span>
          </div>

          <div className="relative mb-4 flex justify-center -mt-10">
             <div className="absolute -inset-4 rounded-full bg-cyan-500/20 blur-xl animate-ping-slow"></div>
             <div className="relative z-10 animate-beat drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] bg-slate-900 rounded-full p-2 border border-cyan-500/50">
               <Lock size={40} className="text-cyan-400" />
             </div>
          </div>
          
          <h2 className="text-sm font-bold mb-4 text-center uppercase tracking-wider flex items-center gap-2 text-cyan-200">
            <ScanFace size={16} className="animate-pulse"/> Sistem Kilitli
          </h2>
          <div className="relative p-2 rounded-xl bg-white/5 border-2 border-cyan-500/50 shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)] overflow-hidden">
            <div className="absolute inset-0 w-full h-0.5 bg-cyan-400 blur-[2px] animate-scanline z-20 opacity-70"></div>
            {qrCodeUrl ? <img src={qrCodeUrl} alt="QR" className="w-48 h-48 rounded-lg relative z-10" /> : <div className="w-48 h-48 bg-slate-800 flex items-center justify-center text-xs text-slate-400">Yükleniyor...</div>}
          </div>
          <div className="mt-4 text-[10px] text-slate-500 font-mono bg-black/30 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> ID: {machineId}
          </div>
        </div>

        <div className="flex gap-4">
           <button onClick={() => setActiveModal('EXAM')} className="flex flex-col items-center justify-center w-24 h-24 bg-slate-800/80 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500 rounded-2xl transition group backdrop-blur-md active:scale-95">
             <Timer size={28} className="text-slate-400 group-hover:text-yellow-400 mb-2 transition-colors"/>
             <span className="text-[10px] font-bold text-slate-400 group-hover:text-white tracking-widest">SINAV</span>
           </button>
           <button onClick={() => setActiveModal('GROUP')} className="flex flex-col items-center justify-center w-24 h-24 bg-slate-800/80 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500 rounded-2xl transition group backdrop-blur-md active:scale-95">
             <Users size={28} className="text-slate-400 group-hover:text-purple-400 mb-2 transition-colors"/>
             <span className="text-[10px] font-bold text-slate-400 group-hover:text-white tracking-widest">GRUP</span>
           </button>
        </div>
      </div>

      {/* ALT */}
      <div className="relative z-10 w-full px-8 flex justify-between items-end">
        <button onClick={handleSystemShutdown} className="group flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/50 flex items-center justify-center group-hover:bg-red-500 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all">
            <Power size={18} className="text-red-500 group-hover:text-white" />
          </div>
          <span className="text-xs font-bold text-red-400 group-hover:text-red-300">SİSTEMİ KAPAT</span>
        </button>
        <div className="flex flex-col items-end opacity-10 hover:opacity-100 transition-opacity duration-500">
           <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">Acil Durum Kodu</span>
           <input 
             type="password" 
             placeholder="" 
             value={emergencyInput} 
             onChange={handleEmergency} 
             maxLength={6}
             className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-center w-32 text-white text-xl outline-none focus:border-red-500 focus:bg-black/80 transition-all font-mono tracking-[0.5em] placeholder:tracking-normal"
           />
        </div>
      </div>

      {activeModal === 'EXAM' && <ExamModal onClose={() => setActiveModal('NONE')} />}
      {activeModal === 'GROUP' && <GroupModal onClose={() => setActiveModal('NONE')} />}

      <style>{`
        @keyframes beat { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.9; } }
        .animate-beat { animation: beat 2.5s ease-in-out infinite; }
        @keyframes ping-slow { 75%, 100% { transform: scale(2); opacity: 0; } }
        .animate-ping-slow { animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes scanline { 0% { top: -10%; opacity: 0; } 50% { opacity: 1; } 100% { top: 110%; opacity: 0; } }
        .animate-scanline { animation: scanline 3s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; borderRadius: 10px; }
      `}</style>
    </div>
  );
}
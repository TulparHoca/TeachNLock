import { useState } from 'react';
import { useLock } from '../context/LockContext';
import { Monitor, Save, Cpu } from 'lucide-react';

export default function SetupScreen() {
  const { saveBoardName, machineId } = useLock();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    await saveBoardName(name);
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl text-white select-none">
      
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 w-[500px] text-center animate-in fade-in zoom-in duration-500">
        
        {/* İkon */}
        <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Monitor size={40} className="text-cyan-400" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Kurulum</h1>
        <p className="text-slate-400 mb-8">Lütfen bu akıllı tahta için bir isim belirleyin.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Input */}
          <div className="text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tahta Adı</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: 12-A Sınıfı"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition mt-1"
              autoFocus
            />
          </div>

          {/* Makine Bilgisi (Silik) */}
          <div className="flex items-center gap-2 justify-center text-xs text-slate-600 font-mono bg-black/20 p-2 rounded-lg">
             <Cpu size={12} /> ID: {machineId || 'Algılanıyor...'}
          </div>

          {/* Kaydet Butonu */}
          <button 
            type="submit" 
            disabled={loading || name.length < 3}
            className="mt-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {loading ? 'Kaydediliyor...' : <><Save size={20}/> KAYDET VE BAŞLAT</>}
          </button>

        </form>
      </div>
      
      <p className="fixed bottom-5 text-slate-600 text-xs">TeachNlock v1.0 • Secure System</p>
    </div>
  );
}
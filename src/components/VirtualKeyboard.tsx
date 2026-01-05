import { Delete, Check, X } from 'lucide-react';

interface VirtualKeyboardProps {
  value: string;             // Şifre verisi (Boşsa nokta yanmaz, doluysa yanar)
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  onClose: () => void;
}

export default function VirtualKeyboard({ value = "", onKeyPress, onBackspace, onEnter, onClose }: VirtualKeyboardProps) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const MAX_LENGTH = 6; // Şifre uzunluğu

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Klavye Kutusu */}
      <div className="bg-slate-900 border border-white/20 p-6 rounded-[2rem] shadow-2xl w-[360px] relative flex flex-col gap-6">
        
        {/* ÜST KISIM: BAŞLIK VE KAPATMA BUTONU */}
        <div className="flex justify-between items-center px-2">
            <h3 className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">ACİL DURUM KODU</h3>
            
            {/* 🛑 DÜZELTME: Kapatma butonu artık içeride ve daha büyük */}
            <button 
                onClick={onClose} 
                className="bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 p-2 rounded-full transition-colors active:scale-90"
            >
                <X size={24} />
            </button>
        </div>

        {/* 🔥 DÜZELTME: GÖRSEL GÖSTERGE (IPHONE TARZI NOKTALAR) */}
        <div className="flex justify-center gap-4 h-12 items-center bg-black/20 rounded-xl border border-white/5">
            {Array.from({ length: MAX_LENGTH }).map((_, i) => {
                const isFilled = i < value.length;
                return (
                    <div 
                        key={i} 
                        className={`
                            rounded-full transition-all duration-300 border-2
                            ${isFilled 
                            ? 'w-5 h-5 bg-cyan-400 border-cyan-400 shadow-[0_0_15px_#22d3ee] scale-110' // DOLU: Parlak Mavi + Büyük
                            : 'w-4 h-4 bg-slate-800 border-slate-600' // BOŞ: Koyu Gri + Küçük
                            }
                        `}
                    ></div>
                );
            })}
        </div>

        {/* TUŞ TAKIMI */}
        <div className="grid grid-cols-3 gap-3">
          {nums.map((num) => (
            <button
              key={num}
              onClick={() => { if (value.length < MAX_LENGTH) onKeyPress(String(num)); }}
              className="h-16 bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-black border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 rounded-2xl text-3xl font-bold text-white transition-all select-none"
            >
              {num}
            </button>
          ))}

          {/* SİLME */}
          <button
            onClick={onBackspace}
            className="h-16 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border-b-4 border-red-900/50 active:border-b-0 active:translate-y-1 rounded-2xl transition-all"
          >
            <Delete size={28} />
          </button>

          {/* 0 */}
          <button
            onClick={() => { if (value.length < MAX_LENGTH) onKeyPress('0'); }}
            className="h-16 bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-black border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 rounded-2xl text-3xl font-bold text-white transition-all select-none"
          >
            0
          </button>

          {/* GİRİŞ (OK) */}
          <button
            onClick={onEnter}
            className="h-16 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-b-4 border-emerald-900/50 active:border-b-0 active:translate-y-1 rounded-2xl transition-all"
          >
            <Check size={32} />
          </button>
        </div>
        
      </div>
    </div>
  );
}
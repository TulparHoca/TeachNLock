import React from 'react';
import { Delete, Check, Eraser } from 'lucide-react'; // İkonları da ekledim şık dursun

interface SetupKeyboardProps {
  value: string;
  onChange: (val: string) => void;
  onEnter: () => void;
}

export const SetupKeyboard = ({ value, onChange, onEnter }: SetupKeyboardProps) => {
  
  // Okul sınıfları ve şubeleri için özel dizilim
  const rows = [
    // 1. Satır: Sınıf Seviyeleri (Tıklayınca direkt yazar)
    ['9', '10', '11', '12', 'LAB', 'ÖĞRT'],
    
    // 2. Satır: Rakamlar
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    
    // 3. Satır: Şubeler
    ['/', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K'],
    
    // 4. Satır: Ekstra
    ['L', 'M', 'N', 'P', 'R', 'S', '-', '.', ':', 'TR']
  ];

  const handlePress = (key: string) => {
    onChange(value + key);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-900/95 rounded-[2rem] border border-white/20 shadow-2xl w-full max-w-4xl mx-auto mt-4 select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* TUŞ SATIRLARI */}
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 justify-center w-full">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handlePress(key)}
              className={`
                h-14 flex-1 min-w-[50px] 
                font-bold text-xl rounded-xl transition-all active:scale-95
                border-b-4 active:border-b-0 active:translate-y-1 shadow-lg
                ${/* Rakamlar */
                  !isNaN(Number(key)) 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-950' 
                    : /* Özel Tuşlar (LAB, 12 vs) */
                    key.length > 1 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-900'
                      : /* Harfler */
                      'bg-slate-700 hover:bg-slate-600 text-white border-slate-800'
                }
              `}
            >
              {key}
            </button>
          ))}
        </div>
      ))}

      {/* ALT KONTROL SATIRI */}
      <div className="flex gap-3 justify-center mt-3 pt-3 border-t border-white/10">
        
        {/* Temizle */}
        <button
          onClick={handleClear}
          className="h-16 flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-2xl border-b-4 border-red-900/40 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
        >
          <Eraser size={24} />
          TEMİZLE
        </button>

        {/* Sil */}
        <button
          onClick={handleBackspace}
          className="h-16 flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold rounded-2xl border-b-4 border-orange-900/40 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
        >
          <Delete size={24} />
          SİL
        </button>

        {/* Kaydet */}
        <button
          onClick={onEnter}
          className="h-16 flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-2xl rounded-2xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <Check size={32} />
          KAYDET
        </button>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { useLock } from '../context/LockContext';
import { SetupKeyboard } from './SetupKeyboard'; // Az önce oluşturduğun klavye dosyası

export default function SetupScreen() {
  const { saveBoardName, machineId } = useLock();
  const [boardNameInput, setBoardNameInput] = useState('');
  
  // Versiyonu burada sabit tutuyoruz (Gold Master)
  const currentVersion = '2.0.2'; 

  const handleSave = () => {
    // En az 2 karakter girilmezse kaydetmesin
    if (!boardNameInput || boardNameInput.length < 2) {
      return; 
    }
    saveBoardName(boardNameInput);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden relative select-none">
      
      {/* Arka Plan Efekti */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-0" />

      <div className="z-10 w-full max-w-4xl flex flex-col items-center p-4">
        
        {/* BAŞLIK */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tight drop-shadow-2xl">
          TeachN'Lock
        </h1>
        <p className="text-slate-400 mb-8 text-lg font-light tracking-wide">
          Akıllı Tahta Kurulum Sihirbazı
        </p>

        {/* GÖSTERGE EKRANI (Input) */}
        {/* Klavye çıkmasın diye readOnly yapıyoruz, bizim sanal klavye dolduracak */}
        <div className="relative w-full max-w-2xl mb-6 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <input
            type="text"
            value={boardNameInput}
            placeholder="Sınıf Adı (Örn: 12/A)"
            readOnly 
            className="relative w-full bg-slate-900 border-2 border-slate-700 text-center text-5xl md:text-6xl font-mono py-6 rounded-2xl text-white placeholder-slate-600 focus:border-cyan-500 outline-none shadow-2xl transition-all"
          />
        </div>

        {/* 🔥 SANAL KLAVYE BİLEŞENİ 🔥 */}
        <SetupKeyboard
          value={boardNameInput}
          onChange={setBoardNameInput}
          onEnter={handleSave}
        />

        {/* ALT BİLGİ */}
        <div className="mt-8 flex flex-col items-center gap-1 text-xs text-slate-600 font-mono">
          <span className="bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
            ID: {machineId || 'TANIMSIZ'}
          </span>
          <span className="opacity-50">v{currentVersion} • Secure Boot</span>
        </div>

      </div>
    </div>
  );
}
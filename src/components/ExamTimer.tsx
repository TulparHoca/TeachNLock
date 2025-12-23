import React, { useState, useEffect } from 'react';

interface ExamTimerProps {
  onClose: () => void;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ onClose }) => {
  const [kalanSaniye, setKalanSaniye] = useState<number>(0);
  const [aktif, setAktif] = useState<boolean>(false);
  const [dakikaGiris, setDakikaGiris] = useState<string>('40');

  // Geri Sayım Mantığı
  useEffect(() => {
    let interval: number | undefined;

    if (aktif && kalanSaniye > 0) {
      interval = window.setInterval(() => {
        setKalanSaniye((prev) => prev - 1);
      }, 1000);
    } else if (kalanSaniye === 0 && aktif) {
      setAktif(false);
      alert('SÜRE BİTTİ! 🔔');
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [aktif, kalanSaniye]);

  const baslat = () => {
    const dakika = parseInt(dakikaGiris, 10);
    if (isNaN(dakika) || dakika <= 0) {
      alert('Lütfen geçerli bir süre girin.');
      return;
    }
    setKalanSaniye(dakika * 60);
    setAktif(true);
  };

  const formatSure = (sn: number): string => {
    const dk = Math.floor(sn / 60);
    const s = sn % 60;
    return `${dk}:${s < 10 ? '0' : ''}${s}`;
  };

  // Eğer sayaç başlamadıysa ayar ekranını göster
  if (!aktif) {
    return (
      <div style={{ textAlign: 'center', color: '#333' }}>
        <h2 style={{ fontSize: '30px', marginBottom: '20px' }}>⏱️ Sınav Modu</h2>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <input
            type="number"
            value={dakikaGiris}
            onChange={(e) => setDakikaGiris(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '24px',
              width: '100px',
              borderRadius: '10px',
              border: '1px solid #ccc',
              textAlign: 'center',
            }}
          />
          <button
            onClick={baslat}
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '10px 30px',
              borderRadius: '10px',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            Başlat
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '10px',
            padding: '8px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Kapat
        </button>
      </div>
    );
  }

  // Sayaç çalışıyorsa dev ekranı göster
  return (
    <div style={{ textAlign: 'center', color: '#333' }}>
      <p style={{ fontSize: '24px', margin: '0', color: '#666' }}>Kalan Süre</p>
      <div
        style={{
          fontSize: '140px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: kalanSaniye < 60 ? '#ef4444' : '#2563eb',
          lineHeight: '1',
        }}
      >
        {formatSure(kalanSaniye)}
      </div>
      <button
        onClick={onClose}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        Sınavı Bitir
      </button>
    </div>
  );
};

export default ExamTimer;

import React, { useState } from 'react';

interface GroupGeneratorProps {
  onClose: () => void;
}

type Grup = number[];

const GroupGenerator: React.FC<GroupGeneratorProps> = ({ onClose }) => {
  const [ogrenciSayisi, setOgrenciSayisi] = useState<string>('24');
  const [grupBoyutu, setGrupBoyutu] = useState<string>('4');
  const [gruplar, setGruplar] = useState<Grup[]>([]);

  const dagit = () => {
    const toplam = parseInt(ogrenciSayisi, 10);
    const boyut = parseInt(grupBoyutu, 10);

    if (isNaN(toplam) || toplam <= 0) {
      alert('Geçerli bir öğrenci sayısı girin.');
      return;
    }
    if (isNaN(boyut) || boyut <= 0) {
      alert('Geçerli bir grup kişi sayısı girin.');
      return;
    }

    let ogrenciler: number[] = Array.from({ length: toplam }, (_, i) => i + 1);

    // Karıştır (Fisher–Yates)
    for (let i = ogrenciler.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ogrenciler[i], ogrenciler[j]] = [ogrenciler[j], ogrenciler[i]];
    }

    const yeniGruplar: Grup[] = [];
    for (let i = 0; i < ogrenciler.length; i += boyut) {
      yeniGruplar.push(ogrenciler.slice(i, i + boyut));
    }

    setGruplar(yeniGruplar);
  };

  const yenidenBasla = () => {
    setGruplar([]);
  };

  // Gruplar henüz oluşmadıysa ayar ekranı
  if (gruplar.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#333', minWidth: '300px' }}>
        <h2 style={{ fontSize: '30px', marginBottom: '20px' }}>🎲 Grup Oluştur</h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginBottom: '20px',
            alignItems: 'center',
          }}
        >
          <label>
            <strong>Öğrenci Sayısı:</strong>{' '}
            <input
              type="number"
              value={ogrenciSayisi}
              onChange={(e) => setOgrenciSayisi(e.target.value)}
              style={{ padding: '5px', width: '80px', textAlign: 'center' }}
            />
          </label>

          <label>
            <strong>Grup Kişi Sayısı:</strong>{' '}
            <input
              type="number"
              value={grupBoyutu}
              onChange={(e) => setGrupBoyutu(e.target.value)}
              style={{ padding: '5px', width: '80px', textAlign: 'center' }}
            />
          </label>
        </div>

        <button
          onClick={dagit}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '15px 40px',
            borderRadius: '10px',
            fontSize: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Dağıt
        </button>

        <div style={{ marginTop: '15px' }}>
          <button
            onClick={onClose}
            style={{
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
      </div>
    );
  }

  // Gruplar oluştuysa liste ekranı
  return (
    <div
      style={{
        width: '100%',
        maxHeight: '60vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
      }}
    >
      <h2 style={{ fontSize: '26px', marginBottom: '10px', color: '#111827' }}>
        📋 Oluşturulan Gruplar
      </h2>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
          padding: '10px',
        }}
      >
        {gruplar.map((g, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#f3f4f6',
              border: '2px solid #e5e7eb',
              borderRadius: '15px',
              padding: '15px',
              width: '180px',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                margin: '0 0 10px 0',
                color: '#7c3aed',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              {i + 1}. GRUP
            </h3>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#374151',
              }}
            >
              {g.join(', ')}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={yenidenBasla}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Yeniden Dağıt
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Kapat
        </button>
      </div>
    </div>
  );
};

export default GroupGenerator;

import React, { useState, useEffect } from 'react';

export default function Clock() {
  const [zaman, setZaman] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setZaman(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'absolute', top: '40px', right: '40px', textAlign: 'right', textShadow: '2px 2px 5px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: '50px', fontWeight: 'bold', lineHeight: '1' }}>
        {zaman.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div style={{ fontSize: '24px', opacity: 0.9 }}>
        {zaman.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}
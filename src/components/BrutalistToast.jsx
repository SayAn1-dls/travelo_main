import React, { useState, useEffect } from 'react';

export default function BrutalistToast({ message, type = 'success', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { border: '#FF4D00', bg: 'rgba(255,77,0,0.15)', icon: '✓' },
    error: { border: '#FF0000', bg: 'rgba(255,0,0,0.15)', icon: '✗' },
    info: { border: '#00BFFF', bg: 'rgba(0,191,255,0.1)', icon: 'ℹ' },
  };

  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      background: c.bg,
      backdropFilter: 'blur(60px)',
      WebkitBackdropFilter: 'blur(60px)',
      border: `3px solid ${c.border}`,
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 300ms ease',
      maxWidth: '400px',
    }}>
      <span style={{ color: c.border, fontFamily: "'Bebas Neue'", fontSize: '1.5rem' }}>{c.icon}</span>
      <span style={{ color: '#fff', fontFamily: "'Plus Jakarta Sans'" }}>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1rem' }}
      >✕</button>
    </div>
  );
}

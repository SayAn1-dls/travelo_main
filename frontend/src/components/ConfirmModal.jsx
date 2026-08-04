import React from 'react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'CONFIRM', cancelLabel = 'CANCEL' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }} onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0A0A0A',
          border: '3px solid #FF4D00',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
          animation: 'slide-in-up 200ms ease',
        }}
      >
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: '2rem', color: '#FF4D00', letterSpacing: '0.05em', margin: '0 0 16px' }}>
          {title}
        </h2>
        <p style={{ fontFamily: "'Plus Jakarta Sans'", color: '#ccc', margin: '0 0 32px', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'transparent', border: '2px solid rgba(255,255,255,0.2)',
            color: '#888', fontFamily: "'Bebas Neue'", fontSize: '1rem',
            letterSpacing: '0.1em', padding: '10px 24px', cursor: 'pointer',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{
            background: '#FF4D00', border: '2px solid #FF4D00',
            color: '#000', fontFamily: "'Bebas Neue'", fontSize: '1rem',
            letterSpacing: '0.1em', padding: '10px 24px', cursor: 'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

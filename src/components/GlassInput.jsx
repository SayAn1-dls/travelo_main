import React from 'react';

export default function GlassInput({ label, type = 'text', value, onChange, placeholder, required = false, name }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <label style={{
          fontFamily: "'Bebas Neue', sans-serif",
          color: '#FF4D00',
          fontSize: '1rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          border: '2px solid rgba(255,255,255,0.15)',
          borderRadius: 0,
          color: '#FFFFFF',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '1rem',
          padding: '14px 18px',
          outline: 'none',
          transition: 'border-color 200ms ease',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = '#FF4D00'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
      />
    </div>
  );
}

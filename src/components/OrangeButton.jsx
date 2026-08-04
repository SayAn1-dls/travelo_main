import React from 'react';

export default function OrangeButton({ children, onClick, type = 'button', disabled = false, variant = 'primary', fullWidth = false }) {
  const styles = {
    primary: {
      background: '#FF4D00',
      color: '#000000',
      border: '3px solid #FF4D00',
    },
    outline: {
      background: 'transparent',
      color: '#FF4D00',
      border: '3px solid #FF4D00',
    },
    ghost: {
      background: 'transparent',
      color: '#FFFFFF',
      border: '2px solid rgba(255,255,255,0.2)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.2rem',
        letterSpacing: '0.1em',
        padding: '12px 32px',
        borderRadius: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'transform 100ms ease, box-shadow 100ms ease',
        textTransform: 'uppercase',
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'translate(2px, 2px)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
    >
      {children}
    </button>
  );
}

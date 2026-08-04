import React from 'react';

export default function BrutalistCard({ children, className = '', onClick, highlight = false }) {
  return (
    <div
      onClick={onClick}
      className={`brutalist-card ${highlight ? 'brutalist-card--highlight' : ''} ${className}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(60px)',
        WebkitBackdropFilter: 'blur(60px)',
        border: highlight ? '3px solid #FF4D00' : '2px solid rgba(255,255,255,0.12)',
        borderRadius: 0,
        padding: '24px',
        position: 'relative',
        transition: 'border-color 250ms ease, transform 250ms ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
}

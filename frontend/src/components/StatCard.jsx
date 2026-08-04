import React from 'react';

export default function StatCard({ label, value, icon, trend }) {
  return (
    <div style={{
      background: 'rgba(255,77,0,0.08)',
      backdropFilter: 'blur(60px)',
      WebkitBackdropFilter: 'blur(60px)',
      border: '2px solid rgba(255,77,0,0.3)',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        {trend !== undefined && (
          <span style={{
            fontFamily: "'Plus Jakarta Sans'",
            fontSize: '0.75rem',
            color: trend >= 0 ? '#00FF88' : '#FF4444',
            background: trend >= 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
            padding: '2px 8px',
          }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p style={{
        fontFamily: "'Bebas Neue'",
        fontSize: '2.5rem',
        color: '#FF4D00',
        margin: 0,
        letterSpacing: '0.05em',
        lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: "'Plus Jakarta Sans'",
        fontSize: '0.85rem',
        color: '#888',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        {label}
      </p>
    </div>
  );
}

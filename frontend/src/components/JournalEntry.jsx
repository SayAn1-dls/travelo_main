import React from 'react';

export default function JournalEntry({ entry, onDelete }) {
  const date = new Date(entry.createdAt).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const MOOD_ICONS = { happy: '😊', sad: '😢', excited: '🤩', adventurous: '🧗', tired: '😴', love: '❤️' };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(60px)',
      WebkitBackdropFilter: 'blur(60px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderLeft: '4px solid #FF4D00',
      padding: '24px',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <p style={{ fontFamily: "'Bebas Neue'", fontSize: '0.85rem', color: '#FF4D00', letterSpacing: '0.1em', margin: 0 }}>
            {entry.location || 'SOMEWHERE AMAZING'}
          </p>
          <p style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '0.75rem', color: '#666', margin: '4px 0 0' }}>
            {date}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {entry.mood && <span style={{ fontSize: '1.5rem' }}>{MOOD_ICONS[entry.mood] || '✏️'}</span>}
          {onDelete && (
            <button onClick={() => onDelete(entry.id)}
              style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1.1rem' }}
            >✕</button>
          )}
        </div>
      </div>
      {entry.title && (
        <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: '1.4rem', color: '#fff', letterSpacing: '0.05em', margin: '0 0 12px' }}>
          {entry.title}
        </h3>
      )}
      <p style={{
        fontFamily: "'Permanent Marker', cursive",
        color: 'rgba(255,255,255,0.75)',
        fontSize: '1rem',
        lineHeight: 1.7,
        margin: 0,
        whiteSpace: 'pre-wrap',
      }}>
        {entry.content}
      </p>
    </div>
  );
}

import React from 'react';

const STATUS_CONFIG = {
  planned: { label: 'PLANNED', color: '#00BFFF' },
  ongoing: { label: 'ONGOING', color: '#FF4D00' },
  completed: { label: 'COMPLETED', color: '#00FF88' },
  cancelled: { label: 'CANCELLED', color: '#888' },
};

export default function TripCard({ trip, onClick, onDelete }) {
  const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planned;
  const startDate = trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'TBD';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(60px)',
        WebkitBackdropFilter: 'blur(60px)',
        border: '2px solid rgba(255,255,255,0.12)',
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'border-color 200ms ease, transform 200ms ease',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF4D00'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{
          fontFamily: "'Bebas Neue'", fontSize: '0.85rem',
          color: status.color,
          border: `1px solid ${status.color}`,
          padding: '2px 8px',
          letterSpacing: '0.1em',
        }}>{status.label}</span>
        {onDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete(trip.id); }}
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
          >✕</button>
        )}
      </div>
      <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: '1.6rem', color: '#fff', margin: '0 0 8px', letterSpacing: '0.05em' }}>
        {trip.destination || 'Unknown Destination'}
      </h3>
      <p style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '0.85rem', color: '#888', margin: '0 0 4px' }}>
        {startDate} {trip.duration ? `· ${trip.duration} days` : ''}
      </p>
      {trip.notes && (
        <p style={{ fontFamily: "'Permanent Marker'", fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontStyle: 'italic' }}>
          "{trip.notes.slice(0, 80)}{trip.notes.length > 80 ? '...' : ''}"
        </p>
      )}
    </div>
  );
}

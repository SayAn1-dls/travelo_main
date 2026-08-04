import React, { useState } from 'react';

const STATUSES = ['planned', 'ongoing', 'completed', 'cancelled'];

export default function AddTripModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    destination: '', startDate: '', endDate: '', duration: '', status: 'planned', notes: '', budget: '',
  });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.destination.trim()) return;
    onSubmit(form);
    onClose();
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(60px)',
    border: '2px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontFamily: "'Plus Jakarta Sans'",
    fontSize: '1rem',
    padding: '12px 16px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    borderRadius: 0,
  };

  const labelStyle = {
    fontFamily: "'Bebas Neue'",
    color: '#FF4D00',
    fontSize: '0.9rem',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: '6px',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }} onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()} style={{
        background: '#0A0A0A',
        border: '3px solid #FF4D00',
        padding: '32px',
        width: '100%', maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: '2.5rem', color: '#FF4D00', letterSpacing: '0.05em', margin: '0 0 24px' }}>
          NEW ADVENTURE
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>DESTINATION *</label>
            <input name="destination" value={form.destination} onChange={handleChange} placeholder="Tokyo, Goa, Patagonia..." style={inputStyle} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>START DATE</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={labelStyle}>END DATE</label>
              <input name="endDate" type="date" value={form.endDate} onChange={handleChange} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>STATUS</label>
            <select name="status" value={form.status} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
              {STATUSES.map(s => <option key={s} value={s} style={{ background: '#111' }}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>BUDGET (₹)</label>
            <input name="budget" type="number" value={form.budget} onChange={handleChange} placeholder="50000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>NOTES</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Quick notes about this trip..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{
            background: 'transparent', border: '2px solid rgba(255,255,255,0.2)',
            color: '#888', fontFamily: "'Bebas Neue'", fontSize: '1rem', letterSpacing: '0.1em',
            padding: '12px 32px', cursor: 'pointer',
          }}>CANCEL</button>
          <button type="submit" style={{
            background: '#FF4D00', border: '2px solid #FF4D00',
            color: '#000', fontFamily: "'Bebas Neue'", fontSize: '1rem', letterSpacing: '0.1em',
            padding: '12px 32px', cursor: 'pointer',
          }}>ADD TRIP</button>
        </div>
      </form>
    </div>
  );
}

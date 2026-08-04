import React, { useState } from 'react';

const MOODS = ['happy', 'sad', 'excited', 'adventurous', 'tired', 'love'];
const MOOD_ICONS = { happy: '😊', sad: '😢', excited: '🤩', adventurous: '🧗', tired: '😴', love: '❤️' };

export default function AddJournalModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', content: '', location: '', mood: 'happy' });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.content.trim()) return;
    onSubmit(form);
    onClose();
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(60px)',
    border: '2px solid rgba(255,255,255,0.15)', color: '#fff',
    fontFamily: "'Plus Jakarta Sans'", fontSize: '1rem',
    padding: '12px 16px', width: '100%', boxSizing: 'border-box',
    outline: 'none', borderRadius: 0,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }} onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()} style={{
        background: '#0A0A0A', border: '3px solid #FF4D00',
        padding: '32px', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: '2.5rem', color: '#FF4D00', letterSpacing: '0.05em', margin: '0 0 8px' }}>
          NEW JOURNAL ENTRY
        </h2>
        <p style={{ fontFamily: "'Permanent Marker'", color: '#666', margin: '0 0 24px', fontSize: '1rem' }}>
          Write your adventure story...
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontFamily: "'Bebas Neue'", color: '#FF4D00', fontSize: '0.9rem', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>ENTRY TITLE</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="My wildest day yet..." style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: "'Bebas Neue'", color: '#FF4D00', fontSize: '0.9rem', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>LOCATION</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="Manali, Himachal Pradesh" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: "'Bebas Neue'", color: '#FF4D00', fontSize: '0.9rem', letterSpacing: '0.1em', display: 'block', marginBottom: '10px' }}>MOOD</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {MOODS.map(mood => (
                <button key={mood} type="button" onClick={() => setForm(prev => ({ ...prev, mood }))}
                  style={{
                    background: form.mood === mood ? 'rgba(255,77,0,0.2)' : 'rgba(255,255,255,0.05)',
                    border: form.mood === mood ? '2px solid #FF4D00' : '2px solid rgba(255,255,255,0.1)',
                    padding: '8px 16px', cursor: 'pointer', fontSize: '1rem',
                    color: '#fff', fontFamily: "'Plus Jakarta Sans'",
                  }}
                >{MOOD_ICONS[mood]} {mood}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "'Bebas Neue'", color: '#FF4D00', fontSize: '0.9rem', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>YOUR STORY *</label>
            <textarea name="content" value={form.content} onChange={handleChange} rows={6}
              placeholder="Pour your heart out. No one's judging..." required
              style={{ ...inputStyle, fontFamily: "'Permanent Marker', cursive", resize: 'vertical', lineHeight: 1.8 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{
            background: 'transparent', border: '2px solid rgba(255,255,255,0.2)',
            color: '#888', fontFamily: "'Bebas Neue'", fontSize: '1rem',
            letterSpacing: '0.1em', padding: '12px 32px', cursor: 'pointer',
          }}>CANCEL</button>
          <button type="submit" style={{
            background: '#FF4D00', border: '2px solid #FF4D00',
            color: '#000', fontFamily: "'Bebas Neue'", fontSize: '1rem',
            letterSpacing: '0.1em', padding: '12px 32px', cursor: 'pointer',
          }}>SAVE ENTRY</button>
        </div>
      </form>
    </div>
  );
}

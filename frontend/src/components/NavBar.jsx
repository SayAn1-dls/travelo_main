import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { path: '/', label: 'DASHBOARD', icon: '◉' },
  { path: '/trips', label: 'TRIPS', icon: '✈' },
  { path: '/journal', label: 'JOURNAL', icon: '✏' },
  { path: '/map', label: 'MAP', icon: '◎' },
];

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 100,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '2px solid rgba(255,77,0,0.3)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
    }}>
      <h1
        onClick={() => navigate('/')}
        style={{
          fontFamily: "'Bebas Neue'",
          fontSize: '2rem',
          color: '#FF4D00',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          margin: 0,
        }}
      >TRAVELO</h1>

      <div style={{ display: 'flex', gap: '4px' }}>
        {NAV_LINKS.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              background: location.pathname === link.path ? 'rgba(255,77,0,0.15)' : 'transparent',
              border: location.pathname === link.path ? '1px solid rgba(255,77,0,0.5)' : '1px solid transparent',
              color: location.pathname === link.path ? '#FF4D00' : '#888',
              fontFamily: "'Bebas Neue'",
              fontSize: '0.9rem',
              letterSpacing: '0.1em',
              padding: '6px 16px',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {link.icon} {link.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: '0.8rem', color: '#666' }}>
          {user?.displayName || user?.email?.split('@')[0] || 'OPERATIVE'}
        </span>
        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,77,0,0.4)',
            color: '#FF4D00',
            fontFamily: "'Bebas Neue'",
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            padding: '4px 16px',
            cursor: 'pointer',
          }}
        >
          EXIT
        </button>
      </div>
    </nav>
  );
}

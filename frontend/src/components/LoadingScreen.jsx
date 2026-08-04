import React, { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <h1 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(4rem, 16vw, 12rem)',
        color: '#FF4D00',
        letterSpacing: '0.05em',
        lineHeight: 1,
        margin: 0,
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        TRAVELO
      </h1>
      <p style={{
        fontFamily: "'Permanent Marker', cursive",
        color: 'rgba(255,255,255,0.6)',
        fontSize: '1.2rem',
        marginTop: '16px',
        letterSpacing: '0.2em',
      }}>
        Loading{dots}
      </p>
      <div style={{
        marginTop: '32px',
        width: '200px',
        height: '3px',
        background: 'rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          left: 0, top: 0,
          height: '100%',
          width: '40%',
          background: '#FF4D00',
          animation: 'loading-bar 1.5s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes loading-bar { 0%{left:-40%} 100%{left:100%} }
      `}</style>
    </div>
  );
}

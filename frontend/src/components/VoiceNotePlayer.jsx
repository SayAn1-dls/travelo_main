import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

const BARS = 44;
const SPEEDS = [1, 1.5, 2];

// deterministic pseudo-random bars so a note always looks the same until real peaks decode
function seededBars(seed, n) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const out = [];
  for (let i = 0; i < n; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const r = ((h >>> 0) % 1000) / 1000;
    const envelope = 0.55 + 0.45 * Math.sin((i / n) * Math.PI);
    out.push(Math.max(0.14, Math.min(1, (0.25 + r * 0.75) * envelope)));
  }
  return out;
}

async function decodePeaks(url, n) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) throw new Error('no audio ctx');
  const ctx = new Ctx();
  try {
    const audio = await new Promise((resolve, reject) => ctx.decodeAudioData(buf, resolve, reject));
    const data = audio.getChannelData(0);
    const size = Math.floor(data.length / n) || 1;
    const peaks = [];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = i * size; j < Math.min((i + 1) * size, data.length); j += 8) sum += data[j] * data[j];
      peaks.push(Math.sqrt(sum / (size / 8)));
    }
    const max = Math.max(...peaks, 0.0001);
    return { peaks: peaks.map((p) => Math.max(0.12, Math.min(1, p / max))), duration: audio.duration };
  } finally {
    try { ctx.close(); } catch (e) { /* noop */ }
  }
}

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};

/**
 * WhatsApp-style voice note: play/pause, real waveform, tap-to-seek, speed toggle.
 * `mine` flips the colour scheme for the orange (sent) vs dark (received) bubble.
 */
export default function VoiceNotePlayer({ src, id, mine }) {
  const audioRef = useRef(null);
  const wrapRef = useRef(null);
  const [bars, setBars] = useState(() => seededBars(String(id || src), BARS));
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    decodePeaks(src, BARS)
      .then(({ peaks, duration: d }) => {
        if (!alive) return;
        setBars(peaks);
        if (Number.isFinite(d) && d > 0) setDuration(d);
      })
      .catch(() => { /* keep the generated waveform */ });
    return () => { alive = false; };
  }, [src]);

  const onLoadedMetadata = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (Number.isFinite(a.duration) && a.duration > 0) { setDuration(a.duration); return; }
    // MediaRecorder webm has no duration header — force the browser to compute it
    const fix = () => {
      a.removeEventListener('timeupdate', fix);
      if (Number.isFinite(a.duration)) setDuration(a.duration);
      a.currentTime = 0;
    };
    a.addEventListener('timeupdate', fix);
    a.currentTime = 1e101;
  }, []);

  useEffect(() => () => { try { audioRef.current?.pause(); } catch (e) { /* noop */ } }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || failed) return;
    if (a.paused) {
      // stop any other voice note that is playing
      document.querySelectorAll('audio[data-voice-note]').forEach((el) => { if (el !== a) el.pause(); });
      a.playbackRate = SPEEDS[speedIdx];
      a.play().catch(() => setFailed(true));
    } else {
      a.pause();
    }
  };

  const seekFromEvent = (e) => {
    const a = audioRef.current;
    const wrap = wrapRef.current;
    if (!a || !wrap || !duration) return;
    const rect = wrap.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    a.currentTime = ratio * duration;
    setProgress(ratio);
    setCurrent(a.currentTime);
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const playedColor = mine ? 'bg-black' : 'bg-acid';
  const idleColor = mine ? 'bg-black/30' : 'bg-white/25';
  const activeIdx = Math.floor(progress * BARS);
  const shown = playing || current > 0 ? current : duration;

  const peaks = useMemo(() => bars, [bars]);

  return (
    <div className="flex w-full min-w-[230px] items-center gap-2.5 sm:min-w-[300px]" data-testid="voice-note-bubble">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        data-voice-note
        onLoadedMetadata={onLoadedMetadata}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0); }}
        onError={() => setFailed(true)}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (!duration) return;
          setCurrent(a.currentTime);
          setProgress(Math.min(1, a.currentTime / duration));
        }}
      />

      <button
        type="button"
        onClick={toggle}
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center transition active:scale-90 ${
          mine ? 'bg-black text-blaze hover:bg-zinc-900' : 'bg-blaze text-black hover:bg-blaze-hover'
        }`}
        title={playing ? 'Pause' : 'Play voice note'}
        data-testid="voice-note-play"
      >
        {playing && <span className={`absolute inset-0 animate-ping opacity-30 ${mine ? 'bg-black' : 'bg-blaze'}`} />}
        {playing ? <Pause className="relative h-5 w-5 fill-current" /> : <Play className="relative h-5 w-5 translate-x-px fill-current" />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          ref={wrapRef}
          className="flex h-9 cursor-pointer touch-none items-center gap-[2px]"
          onClick={seekFromEvent}
          onTouchMove={seekFromEvent}
          role="slider"
          aria-label="Seek voice note"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          {peaks.map((p, i) => {
            const played = i <= activeIdx && (playing || progress > 0);
            const isHead = playing && i === activeIdx;
            return (
              <span
                key={i}
                className={`w-[3px] shrink-0 rounded-[1px] transition-[background-color,transform] duration-150 ${played ? playedColor : idleColor}`}
                style={{
                  height: `${Math.round(p * 100)}%`,
                  transform: isHead ? 'scaleY(1.25)' : 'scaleY(1)',
                  animation: playing && played ? `voicePulse 0.9s ease-in-out ${(i % 7) * 0.08}s infinite alternate` : undefined,
                }}
              />
            );
          })}
        </div>
        <div className={`flex items-center justify-between font-mono text-[10px] ${mine ? 'text-black/70' : 'text-white/50'}`}>
          <span className="flex items-center gap-1">
            <Mic className="h-3 w-3" /> {failed ? 'cannot play' : fmt(shown)}
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${mine ? 'bg-black/15 text-black' : 'bg-white/10 text-acid'}`}
            title="Playback speed"
          >
            {SPEEDS[speedIdx]}x
          </button>
        </div>
      </div>

      <style>{`@keyframes voicePulse { from { transform: scaleY(0.78); } to { transform: scaleY(1.18); } }`}</style>
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Mic, Square, Loader2 } from 'lucide-react';
import { getToken } from '@/lib/api';
import { stopSpeaking } from '@/lib/voice';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAX_SECONDS = 30;

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

/**
 * Push-to-talk mic: records real audio (MediaRecorder — works in Chrome, Edge,
 * Firefox, Safari), sends it to the backend, Whisper transcribes, onFinal(text)
 * auto-sends. onInterim gets status text for the input placeholder.
 */
export default function MicButton({ disabled, onInterim, onFinal, size = 'md', language = 'en' }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | transcribing
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    try { recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop(); } catch (e) { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    clearInterval(timerRef.current);
    setElapsed(0);
  };

  const transcribe = async (blob, mime) => {
    setPhase('transcribing');
    if (onInterim) onInterim('… transcribing your voice');
    try {
      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm';
      const fd = new FormData();
      fd.append('file', new File([blob], `voice.${ext}`, { type: mime || 'audio/webm' }));
      if (language) fd.append('language', language);
      const res = await fetch(`${API_BASE}/voice/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Transcription failed');
      const text = (data.text || '').trim();
      if (onInterim) onInterim('');
      if (!text) {
        toast.info('Didn\u2019t catch any words — try again, a bit louder.');
        return;
      }
      onFinal(text);
    } catch (err) {
      if (onInterim) onInterim('');
      toast.error(err.message || 'Could not transcribe');
    } finally {
      setPhase('idle');
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Microphone not supported in this browser.');
      return;
    }
    stopSpeaking();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        if (window.self !== window.top) {
          toast.error('This preview frame blocks the microphone. Open the app in its own tab and the mic will work.', {
            duration: 10000,
            action: { label: 'Open in new tab', onClick: () => window.open(window.location.href, '_blank') },
          });
        } else {
          toast.error('Mic blocked — click the lock icon in the address bar and allow the microphone, then try again.');
        }
      } else if (err.name === 'NotFoundError') {
        toast.error('No microphone found on this device.');
      } else {
        toast.error(`Mic error: ${err.message || err.name}`);
      }
      return;
    }
    const mime = pickMimeType();
    if (mime === null) {
      stream.getTracks().forEach((t) => t.stop());
      toast.error('Recording not supported in this browser.');
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    cancelledRef.current = false;
    let recorder;
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (e) {
      recorder = new MediaRecorder(stream);
    }
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const type = recorder.mimeType || mime || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type });
      cleanupStream();
      if (cancelledRef.current) { setPhase('idle'); if (onInterim) onInterim(''); return; }
      if (blob.size < 1000) {
        setPhase('idle');
        if (onInterim) onInterim('');
        toast.info('That was too quick — hold it and speak.');
        return;
      }
      transcribe(blob, type);
    };
    recorder.start(250);
    setPhase('recording');
    setElapsed(0);
    if (onInterim) onInterim('\u{1F399} recording… tap the mic again to send');
    timerRef.current = setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= MAX_SECONDS) {
          try { recorder.stop(); } catch (e) { /* noop */ }
        }
        return s + 1;
      });
    }, 1000);
  };

  const toggle = () => {
    if (phase === 'transcribing') return;
    if (phase === 'recording') {
      try { recorderRef.current?.stop(); } catch (e) { /* noop */ }
      return;
    }
    startRecording();
  };

  const sizeCls = size === 'sm' ? 'h-9 min-w-9 px-0 w-auto' : 'h-11 min-w-11 px-0 w-auto';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || phase === 'transcribing'}
      title={phase === 'recording' ? 'Stop & send' : 'Talk to NOMAD'}
      className={`flex ${sizeCls} shrink-0 items-center justify-center gap-1.5 transition disabled:opacity-40 ${
        phase === 'recording'
          ? 'animate-pulse bg-blaze px-3 text-black'
          : phase === 'transcribing'
            ? 'border border-acid px-2 text-acid'
            : 'border border-white/20 px-2.5 text-white/70 hover:border-acid hover:text-acid'
      }`}
      data-testid="nomad-mic-btn"
    >
      {phase === 'recording' ? (
        <>
          <Square className="h-4 w-4" />
          <span className="font-mono text-[10px] font-bold">{elapsed}s</span>
        </>
      ) : phase === 'transcribing' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}

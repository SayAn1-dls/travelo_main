import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Mic, Square } from 'lucide-react';
import { createRecognizer, voiceInputSupported, stopSpeaking } from '@/lib/voice';

/**
 * Push-to-talk mic button. Live transcript -> onInterim; final -> onFinal (auto-send).
 */
export default function MicButton({ disabled, onInterim, onFinal, size = 'md' }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => () => { try { recRef.current?.abort?.(); } catch (e) { /* noop */ } }, []);

  const toggle = () => {
    if (listening) {
      try { recRef.current?.stop(); } catch (e) { /* noop */ }
      return;
    }
    if (!voiceInputSupported()) {
      toast.error('Voice input isn\u2019t supported in this browser. Try Chrome or Edge.');
      return;
    }
    stopSpeaking();
    const rec = createRecognizer({
      onInterim,
      onFinal: (text) => { if (text) onFinal(text); },
      onEnd: () => setListening(false),
      onError: (err) => {
        setListening(false);
        if (err === 'not-allowed') toast.error('Mic access blocked — allow the microphone permission.');
        else if (err !== 'aborted' && err !== 'no-speech') toast.error(`Mic error: ${err}`);
        else if (err === 'no-speech') toast.info('Didn\u2019t catch that — try again closer to the mic.');
      },
    });
    if (!rec) return;
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch (e) { setListening(false); }
  };

  const sizeCls = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Stop listening' : 'Talk to NOMAD'}
      className={`flex ${sizeCls} shrink-0 items-center justify-center transition disabled:opacity-40 ${
        listening
          ? 'animate-pulse bg-blaze text-black'
          : 'border border-white/20 text-white/70 hover:border-acid hover:text-acid'
      }`}
      data-testid="nomad-mic-btn"
    >
      {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}

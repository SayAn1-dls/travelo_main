import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Compass, Send, Loader2, Plus, MapPin, X, Volume2, VolumeX } from 'lucide-react';
import useNomadChat from '@/hooks/useNomadChat';
import { renderMessage } from '@/components/NomadChat';
import { speak, stopSpeaking } from '@/lib/voice';
import MicButton from '@/components/MicButton';

const PHASES = [
  { id: 'before', label: 'Before' },
  { id: 'during', label: 'On road' },
  { id: 'after', label: 'After' },
];

export default function NomadWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [voiceReplies, setVoiceReplies] = useState(false);
  const voiceRepliesRef = useRef(voiceReplies);
  voiceRepliesRef.current = voiceReplies;
  const scrollRef = useRef(null);

  const chat = useNomadChat({
    onReply: (full, { spoken, language: lang }) => {
      if (spoken || voiceRepliesRef.current) speak(full, { lang });
    },
  });
  const { phase, setPhase, place, setPlace, language, setLanguage, messages, streaming, streamText, send, newChat } = chat;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamText, open]);

  const submitDraft = async (textArg, opts = {}) => {
    const text = (textArg || draft).trim();
    if (!text) return;
    setDraft('');
    try {
      await send(text, opts);
    } catch (err) {
      toast.error(err.message || 'Chat failed');
    }
  };

  return (
    <>
      {/* floating bubble */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 18 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[65] flex h-14 w-14 items-center justify-center bg-blaze text-black shadow-[0_0_30px_rgba(255,69,0,0.45)] transition hover:bg-blaze-hover"
        title="Chat with NOMAD"
        data-testid="nomad-widget-bubble"
      >
        {open ? <X className="h-6 w-6" /> : <Compass className="h-6 w-6" />}
        {!open && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-pulse rounded-full bg-acid" />}
      </motion.button>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-5 z-[65] flex h-[540px] max-h-[calc(100vh-8rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col border border-white/15 bg-ink shadow-2xl"
            data-testid="nomad-widget-panel"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center bg-blaze text-black">
                  <Compass className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg uppercase leading-none">Nomad</p>
                  <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" /> always on
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
                  title="Toggle Hindi mode"
                  className={`flex h-8 min-w-8 items-center justify-center border px-1.5 font-mono text-[9px] font-bold transition ${
                    language === 'hi' ? 'border-blaze bg-blaze text-black' : 'border-white/20 text-white/60 hover:border-blaze hover:text-blaze'
                  }`}
                  data-testid="widget-lang-toggle"
                >
                  {language === 'hi' ? 'हिं' : 'EN'}
                </button>
                <button
                  onClick={() => {
                    const next = !voiceReplies;
                    setVoiceReplies(next);
                    if (!next) stopSpeaking();
                  }}
                  title={voiceReplies ? 'Voice replies on' : 'Voice replies off'}
                  className={`flex h-8 w-8 items-center justify-center border transition ${
                    voiceReplies ? 'border-acid bg-acid text-black' : 'border-white/20 text-white/60 hover:border-acid hover:text-acid'
                  }`}
                  data-testid="widget-voice-toggle"
                >
                  {voiceReplies ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => { stopSpeaking(); newChat(); toast.success('Fresh chat.'); }}
                  title="New chat"
                  className="flex h-8 w-8 items-center justify-center border border-white/20 text-white/60 transition hover:border-blaze hover:text-blaze"
                  data-testid="widget-new-chat"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* phase + place */}
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
              {PHASES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPhase(p.id)}
                  className={`border px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition ${
                    phase === p.id ? 'border-blaze bg-blaze text-black' : 'border-white/15 text-white/60 hover:border-white/40'
                  }`}
                  data-testid={`widget-phase-${p.id}`}
                >
                  {p.label}
                </button>
              ))}
              <div className="relative ml-auto min-w-0 flex-1">
                <MapPin className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40" />
                <input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="WHERE?"
                  className="w-full border border-white/15 bg-zinc-950 py-1.5 pl-7 pr-2 font-mono text-[10px] uppercase tracking-widest text-white placeholder:text-white/30 outline-none focus:border-acid"
                  data-testid="widget-place-input"
                />
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" data-testid="widget-messages">
              {messages.length === 0 && !streaming && (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <p className="font-display text-2xl uppercase text-outline">Need travel help?</p>
                  <p className="mt-2 font-marker text-sm text-acid">type it — or tap the mic and just talk.</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] px-3 py-2.5 text-[13px] leading-relaxed ${
                      m.role === 'user' ? 'bg-blaze font-medium text-black' : 'border border-white/10 bg-zinc-950 text-white/85'
                    }`}
                  >
                    {m.role === 'assistant' ? renderMessage(m.text) : m.text}
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="flex justify-start">
                  <div className="max-w-[88%] border border-white/10 bg-zinc-950 px-3 py-2.5 text-[13px] leading-relaxed text-white/85">
                    {streamText ? renderMessage(streamText) : (
                      <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                        <Loader2 className="h-3 w-3 animate-spin text-blaze" /> thinking…
                      </span>
                    )}
                    {streamText && <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-acid align-middle" />}
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => { e.preventDefault(); submitDraft(); }}
              className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
            >
              <MicButton
                size="sm"
                disabled={streaming}
                language={language}
                onInterim={(t) => setDraft(t)}
                onFinal={(t) => { setDraft(''); submitDraft(t, { spoken: true }); }}
              />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="MESSAGE NOMAD…"
                className="min-w-0 flex-1 border border-white/15 bg-zinc-950 px-3 py-2 font-mono text-[13px] text-white placeholder:text-white/30 outline-none focus:border-blaze"
                data-testid="widget-input"
              />
              <button
                type="submit"
                disabled={streaming || !draft.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center bg-blaze text-black transition hover:bg-blaze-hover disabled:opacity-40"
                data-testid="widget-send-btn"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

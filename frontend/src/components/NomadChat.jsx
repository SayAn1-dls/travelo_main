import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Compass, Send, Loader2, Plus, MapPin, Volume2, VolumeX } from 'lucide-react';
import useNomadChat from '@/hooks/useNomadChat';
import { speak, stopSpeaking } from '@/lib/voice';
import MicButton from '@/components/MicButton';

const PHASES = [
  { id: 'before', label: 'Before the trip' },
  { id: 'during', label: 'On the road' },
  { id: 'after', label: 'After the trip' },
];

const SUGGESTIONS = {
  before: ['Build me a 5-day plan', 'What should I pack?', 'Budget hacks for this trip'],
  during: ['What must I eat near me?', 'Rainy day — save my plans', 'Local etiquette in 5 rules'],
  after: ['Write me a savage story caption', 'Cure my post-trip blues', 'Where should I go next?'],
};

// minimal markdown: **bold** + "- " bullets
export function renderMessage(text) {
  return text.split('\n').map((line, li) => {
    const parts = line.split(/\*\*(.*?)\*\*/g).map((seg, i) =>
      i % 2 === 1 ? <strong key={i} className="font-bold text-white">{seg}</strong> : seg
    );
    const isBullet = /^\s*[-•]\s+/.test(line);
    return (
      <span key={li} className={`block ${isBullet ? 'pl-4' : ''} ${line.trim() === '' ? 'h-2' : ''}`}>
        {isBullet ? <span className="mr-2 text-blaze">▸</span> : null}
        {isBullet ? parts.map((p) => (typeof p === 'string' ? p.replace(/^\s*[-•]\s+/, '') : p)) : parts}
      </span>
    );
  });
}

export default function NomadChat({ vibe }) {
  const [draft, setDraft] = useState('');
  const [voiceReplies, setVoiceReplies] = useState(false);
  const voiceRepliesRef = useRef(voiceReplies);
  voiceRepliesRef.current = voiceReplies;
  const scrollRef = useRef(null);

  const chat = useNomadChat({
    vibe,
    onReply: (full, { spoken, language: lang }) => {
      if (spoken || voiceRepliesRef.current) speak(full, { lang });
    },
  });
  const { phase, setPhase, place, setPlace, language, setLanguage, messages, streaming, streamText, send, newChat } = chat;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamText]);

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

  const handleNewChat = () => {
    stopSpeaking();
    newChat();
    toast.success('Fresh chat. NOMAD is listening.');
  };

  return (
    <section className="mt-20" data-testid="nomad-chat-section">
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-blaze">// The USP — your trip talks back</p>
      <h2 className="mt-3 font-display uppercase leading-[0.85]">
        <span className="text-[clamp(2.5rem,7vw,6rem)] text-white">Chat with </span>
        <span className="text-[clamp(2.5rem,7vw,6rem)] text-outline-acid">NOMAD.</span>
      </h2>
      <p className="mt-3 max-w-2xl font-marker text-lg text-acid">
        your AI travel companion — before the trip, on the road, and long after you're back. now with voice.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 border border-white/15"
      >
        {/* top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center bg-blaze text-black">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl uppercase leading-none">Nomad</p>
              <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" /> travel co-pilot · always on
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vibe && (
              <span className="hidden border border-acid/40 bg-acid/5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-acid sm:block">
                knows your vibe: {vibe.vibe_title}
              </span>
            )}
            <button
              onClick={() => {
                const next = language === 'hi' ? 'en' : 'hi';
                setLanguage(next);
                toast.success(next === 'hi' ? 'NOMAD ab Hindi mein baat karega 🇮🇳' : 'NOMAD back to English.');
              }}
              title="Toggle Hindi mode"
              className={`border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition ${
                language === 'hi' ? 'border-blaze bg-blaze text-black' : 'border-white/20 text-white/60 hover:border-blaze hover:text-blaze'
              }`}
              data-testid="nomad-lang-toggle"
            >
              {language === 'hi' ? 'हिंदी' : 'EN'}
            </button>
            <button
              onClick={() => {
                const next = !voiceReplies;
                setVoiceReplies(next);
                if (!next) stopSpeaking();
                toast.success(next ? 'NOMAD will speak replies out loud.' : 'Voice replies off.');
              }}
              title={voiceReplies ? 'Voice replies on' : 'Voice replies off'}
              className={`flex items-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                voiceReplies ? 'border-acid bg-acid text-black' : 'border-white/20 text-white/60 hover:border-acid hover:text-acid'
              }`}
              data-testid="nomad-voice-toggle"
            >
              {voiceReplies ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />} Voice
            </button>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:border-blaze hover:text-blaze"
              data-testid="nomad-new-chat"
            >
              <Plus className="h-3.5 w-3.5" /> New chat
            </button>
          </div>
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-5 py-3">
          {PHASES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPhase(p.id)}
              className={`border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition ${
                phase === p.id ? 'border-blaze bg-blaze text-black' : 'border-white/15 text-white/60 hover:border-white/40'
              }`}
              data-testid={`nomad-phase-${p.id}`}
            >
              {p.label}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-60">
            <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="DESTINATION (E.G. LADAKH)"
              className="w-full border border-white/15 bg-zinc-950 py-2 pl-9 pr-3 font-mono text-[11px] uppercase tracking-widest text-white placeholder:text-white/30 outline-none focus:border-acid"
              data-testid="nomad-place-input"
            />
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="h-[420px] space-y-4 overflow-y-auto px-5 py-6" data-testid="nomad-messages">
          {messages.length === 0 && !streaming && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-3xl uppercase text-outline">Ask me anything about your trip.</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">try one of these — or tap the mic and just talk:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS[phase].map((s) => (
                  <button
                    key={s}
                    onClick={() => submitDraft(s)}
                    className="border border-white/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/70 transition hover:border-acid hover:text-acid"
                    data-testid="nomad-suggestion"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                  m.role === 'user'
                    ? 'bg-blaze font-medium text-black'
                    : 'border border-white/10 bg-zinc-950 text-white/85'
                }`}
              >
                {m.role === 'assistant' ? renderMessage(m.text) : m.text}
              </div>
            </div>
          ))}

          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] border border-white/10 bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-white/85 sm:max-w-[70%]">
                {streamText ? renderMessage(streamText) : (
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blaze" /> Nomad is thinking…
                  </span>
                )}
                {streamText && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-acid align-middle" />}
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <form
          onSubmit={(e) => { e.preventDefault(); submitDraft(); }}
          className="flex items-center gap-3 border-t border-white/10 px-5 py-4"
        >
          <MicButton
            disabled={streaming}
            language={language}
            onInterim={(t) => setDraft(t)}
            onFinal={(t) => { setDraft(''); submitDraft(t, { spoken: true }); }}
          />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`MESSAGE NOMAD (${PHASES.find((p) => p.id === phase).label.toUpperCase()})…`}
            className="flex-1 border border-white/15 bg-zinc-950 px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 outline-none focus:border-blaze"
            data-testid="nomad-input"
          />
          <button
            type="submit"
            disabled={streaming || !draft.trim()}
            className="flex items-center gap-2 bg-blaze px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-blaze-hover disabled:opacity-40"
            data-testid="nomad-send-btn"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
      </motion.div>
    </section>
  );
}

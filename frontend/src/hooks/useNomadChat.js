import { useState, useEffect, useRef, useCallback } from 'react';
import { getToken } from '@/lib/api';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Shared NOMAD chat engine — session restore, SSE streaming, multi-turn memory.
 * Used by the Vibe Lab chat section AND the floating widget.
 */
export default function useNomadChat({ vibe = null, onReply } = {}) {
  const [phase, setPhase] = useState('before');
  const [place, setPlace] = useState('');
  const [language, setLanguage] = useState('en'); // en | hi
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const onReplyRef = useRef(onReply);
  onReplyRef.current = onReply;
  const vibeRef = useRef(vibe);
  vibeRef.current = vibe;
  const languageRef = useRef(language);
  languageRef.current = language;

  // restore latest session once
  useEffect(() => {
    let mounted = true;
    async function restore() {
      try {
        const res = await fetch(`${API_BASE}/chat/sessions`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const sessions = await res.json();
        if (!mounted || !Array.isArray(sessions) || !sessions.length) return;
        const latest = sessions[0];
        setSessionId(latest.id);
        setPlace(latest.place || '');
        if (latest.phase) setPhase(latest.phase);
        const mr = await fetch(`${API_BASE}/chat/sessions/${latest.id}/messages`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const msgs = await mr.json();
        if (mounted && Array.isArray(msgs)) setMessages(msgs);
      } catch (e) { /* fresh chat */ }
    }
    restore();
    return () => { mounted = false; };
  }, []);

  const newChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setStreamText('');
  }, []);

  const send = useCallback(async (rawText, { spoken = false } = {}) => {
    const text = (rawText || '').trim();
    if (!text || streaming) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text }]);
    setStreaming(true);
    setStreamText('');
    try {
      const v = vibeRef.current;
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          session_id: sessionId,
          place,
          phase,
          text,
          language: languageRef.current,
          vibe_context: v ? { vibe_title: v.vibe_title, mood: v.mood, photo_type: v.photo_type } : null,
        }),
      });
      if (!res.ok || !res.body) throw new Error('NOMAD is unreachable right now.');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'session') setSessionId(evt.session_id);
            else if (evt.type === 'delta') {
              full += evt.content;
              setStreamText(full);
            }
          } catch (e) { /* partial json */ }
        }
      }
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', text: full }]);
      if (onReplyRef.current) onReplyRef.current(full, { spoken, language: languageRef.current });
      return full;
    } finally {
      setStreaming(false);
      setStreamText('');
    }
  }, [streaming, sessionId, place, phase]);

  return {
    phase, setPhase,
    place, setPlace,
    language, setLanguage,
    sessionId, messages,
    streaming, streamText,
    send, newChat,
  };
}

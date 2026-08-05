import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, Plus, LogIn, Send, Loader2, Copy, Paperclip, ArrowLeft,
  MessagesSquare, Ticket, Mic, Square,
} from 'lucide-react';
import api, { getToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MEDIA_BASE = process.env.REACT_APP_BACKEND_URL;
const POLL_MS = 2500;
const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

const timeOf = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

export default function SquadChatPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [rooms, setRooms] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState(null); // null | 'create' | 'join'
  const [panelValue, setPanelValue] = useState(params.get('create') || '');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [reads, setReads] = useState({});
  const lastTsRef = useRef(null);
  const pollRef = useRef(null);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  const loadRooms = useCallback(async () => {
    try {
      const r = await api.rooms();
      setRooms(r);
      return r;
    } catch (e) {
      setRooms([]);
      return [];
    }
  }, []);

  // initial load (+ ?create= prefill)
  useEffect(() => {
    loadRooms().then((r) => {
      if (params.get('create')) {
        setPanel('create');
        setPanelValue(params.get('create'));
      } else if (r.length) {
        openRoom(r[0]);
      }
    });
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const startPolling = (roomId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await api.roomMessages(roomId, lastTsRef.current);
        api.roomReads(roomId).then(setReads).catch(() => {});
        if (fresh.length) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const add = fresh.filter((m) => !known.has(m.id));
            if (!add.length) return prev;
            lastTsRef.current = add[add.length - 1].created_at;
            return [...prev, ...add];
          });
          api.markRoomRead(roomId).catch(() => {});
          loadRooms();
        }
      } catch (e) { /* transient */ }
    }, POLL_MS);
  };

  const openRoom = async (room) => {
    setActiveRoom(room);
    setMobileChatOpen(true);
    setMessages([]);
    setReads({});
    lastTsRef.current = null;
    try {
      const msgs = await api.roomMessages(room.id);
      setMessages(msgs);
      if (msgs.length) lastTsRef.current = msgs[msgs.length - 1].created_at;
      api.markRoomRead(room.id).catch(() => {});
      api.roomReads(room.id).then(setReads).catch(() => {});
    } catch (e) {
      toast.error('Could not load messages');
    }
    startPolling(room.id);
  };

  const submitPanel = async (e) => {
    e.preventDefault();
    const value = panelValue.trim();
    if (!value) return;
    try {
      let room;
      if (panel === 'create') {
        room = await api.createRoom({ name: value });
        toast.success(`Room created. Invite code: ${room.invite_code}`);
      } else {
        room = await api.joinRoom({ code: value.toUpperCase() });
        toast.success(`Joined "${room.name}". Say hi!`);
      }
      setPanel(null);
      setPanelValue('');
      await loadRooms();
      openRoom(room);
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  const sendText = async (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !activeRoom || sending) return;
    setDraft('');
    setSending(true);
    try {
      const msg = await api.sendRoomMessage(activeRoom.id, { text });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      lastTsRef.current = msg.created_at;
      loadRooms();
    } catch (err) {
      toast.error(err.message || 'Message failed');
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const sendMedia = async (file) => {
    if (!file || !activeRoom) return;
    if (!/^(image|video|audio)\//.test(file.type)) return toast.error('Images, videos and audio only.');
    if (file.size > MAX_MEDIA_BYTES) return toast.error('Max 20MB per file.');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/rooms/${activeRoom.id}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const msg = await res.json();
      if (!res.ok) throw new Error(msg.detail || 'Upload failed');
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      lastTsRef.current = msg.created_at;
      loadRooms();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(activeRoom.invite_code);
    toast.success(`Invite code ${activeRoom.invite_code} copied — send it to the squad.`);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-ink pt-0 text-white" style={{ marginTop: '4rem' }}>
      {/* ============ SIDEBAR ============ */}
      <aside className={`w-full flex-col border-r border-white/10 md:flex md:w-80 lg:w-96 ${mobileChatOpen ? 'hidden' : 'flex'}`}>
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-acid">// One place. All the gossip.</p>
          <h1 className="mt-1 font-display text-4xl uppercase leading-none" data-testid="squad-title">
            Squad chat<span className="text-blaze">.</span>
          </h1>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => { setPanel(panel === 'create' ? null : 'create'); setPanelValue(''); }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition ${
                panel === 'create' ? 'bg-acid text-black' : 'bg-blaze text-black hover:bg-blaze-hover'
              }`}
              data-testid="new-room-btn"
            >
              <Plus className="h-3.5 w-3.5" /> New room
            </button>
            <button
              onClick={() => { setPanel(panel === 'join' ? null : 'join'); setPanelValue(''); }}
              className={`flex items-center justify-center gap-1.5 border px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition ${
                panel === 'join' ? 'border-acid text-acid' : 'border-white/20 text-white hover:border-acid hover:text-acid'
              }`}
              data-testid="join-room-btn"
            >
              <LogIn className="h-3.5 w-3.5" /> Join via code
            </button>
          </div>

          {panel && (
            <form onSubmit={submitPanel} className="mt-3 flex gap-2">
              <input
                autoFocus
                value={panelValue}
                onChange={(e) => setPanelValue(e.target.value)}
                placeholder={panel === 'create' ? 'ROOM NAME (E.G. GOA GANG)' : 'INVITE CODE'}
                className="min-w-0 flex-1 border border-white/15 bg-zinc-950 px-3 py-2.5 font-mono text-xs uppercase tracking-widest text-white placeholder:text-white/30 outline-none focus:border-blaze"
                data-testid="room-panel-input"
              />
              <button
                type="submit"
                className="bg-acid px-4 font-mono text-[10px] font-bold uppercase tracking-widest text-black"
                data-testid="room-panel-submit"
              >
                Go
              </button>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {rooms === null && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blaze" /></div>}
          {rooms && rooms.length === 0 && (
            <div className="px-6 py-16 text-center">
              <MessagesSquare className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-4 font-display text-2xl uppercase text-outline">No rooms yet.</p>
              <p className="mt-2 font-marker text-sm text-acid">create one and drag your squad in.</p>
            </div>
          )}
          {rooms && rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => openRoom(r)}
              className={`flex w-full items-center gap-3 border-b border-white/5 px-5 py-4 text-left transition hover:bg-white/[0.04] ${
                activeRoom?.id === r.id ? 'bg-white/[0.06]' : ''
              }`}
              data-testid={`room-item-${r.id}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-blaze/15 font-display text-xl uppercase text-blaze">
                {r.name.slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold">{r.name}</span>
                  {r.last_message && (
                    <span className="shrink-0 font-mono text-[9px] uppercase text-white/30">{timeOf(r.last_message.created_at)}</span>
                  )}
                </span>
                <span className="block truncate font-mono text-[11px] text-white/45">
                  {r.last_message ? `${r.last_message.user_name.split(' ')[0]}: ${r.last_message.preview}` : `invite code ${r.invite_code}`}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* ============ CHAT PANE ============ */}
      <main className={`flex-1 flex-col md:flex ${mobileChatOpen ? 'flex' : 'hidden'}`}>
        {!activeRoom ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <Users className="h-10 w-10 text-white/15" />
            <p className="mt-6 font-display text-4xl uppercase text-outline md:text-5xl">Pick a room. Start the chaos.</p>
            <p className="mt-3 font-marker text-acid">chats, pics, videos — the whole trip in one place.</p>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
              <button className="md:hidden" onClick={() => setMobileChatOpen(false)} data-testid="chat-back-btn">
                <ArrowLeft className="h-5 w-5 text-white/60" />
              </button>
              <span className="flex h-10 w-10 items-center justify-center bg-blaze/15 font-display text-lg uppercase text-blaze">
                {activeRoom.name.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-2xl uppercase leading-none" data-testid="active-room-name">{activeRoom.name}</p>
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                  {(activeRoom.members || []).map((m) => m.name.split(' ')[0]).join(' · ')}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="flex shrink-0 items-center gap-2 border border-acid/40 bg-acid/5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-acid transition hover:bg-acid hover:text-black"
                title="Copy invite code"
                data-testid="copy-invite-code"
              >
                <Ticket className="h-3.5 w-3.5" /> {activeRoom.invite_code} <Copy className="h-3 w-3" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 md:px-6" data-testid="squad-messages">
              {messages.map((m) => {
                if (m.type === 'system') {
                  return (
                    <div key={m.id} className="flex justify-center">
                      <span className="border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                        {m.text}
                      </span>
                    </div>
                  );
                }
                const mine = m.user_id === user?.id;
                const others = (activeRoom.members || []).filter((mm) => mm.id !== user?.id);
                const seenByAll = mine && others.length > 0 && others.every((mm) => reads[mm.id] && reads[mm.id] >= m.created_at);
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[65%] ${mine ? 'bg-blaze text-black' : 'border border-white/10 bg-zinc-950 text-white/90'} px-3.5 py-2.5`}>
                      {!mine && (
                        <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-acid">{m.user_name}</p>
                      )}
                      {m.type === 'media' && m.media_type === 'image' && (
                        <a href={`${MEDIA_BASE}${m.media_url}`} target="_blank" rel="noreferrer">
                          <img
                            src={`${MEDIA_BASE}${m.media_url}`}
                            alt="shared"
                            className="max-h-72 w-auto max-w-full border border-black/10"
                            loading="lazy"
                          />
                        </a>
                      )}
                      {m.type === 'media' && m.media_type === 'video' && (
                        <video controls preload="metadata" className="max-h-72 w-auto max-w-full">
                          <source src={`${MEDIA_BASE}${m.media_url}`} />
                        </video>
                      )}
                      {m.type === 'media' && m.media_type === 'audio' && (
                        <div className="flex items-center gap-2" data-testid="voice-note-bubble">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center ${mine ? 'bg-black/15' : 'bg-blaze/15'}`}>
                            <Mic className={`h-4 w-4 ${mine ? 'text-black' : 'text-blaze'}`} />
                          </span>
                          <audio controls preload="metadata" className="h-10 w-52 max-w-full sm:w-64">
                            <source src={`${MEDIA_BASE}${m.media_url}`} />
                          </audio>
                        </div>
                      )}
                      {m.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>}
                      <p className={`mt-1 text-right font-mono text-[9px] ${mine ? 'text-black/50' : 'text-white/30'}`}>
                        {timeOf(m.created_at)}
                        {mine && (
                          <span
                            className={`ml-1.5 font-bold ${seenByAll ? 'text-black' : 'text-black/40'}`}
                            title={seenByAll ? 'Seen by everyone' : 'Sent'}
                            data-testid={`ticks-${m.id}`}
                          >
                            {seenByAll ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {uploading && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 bg-blaze/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-black">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> uploading media…
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <form onSubmit={sendText} className="flex items-center gap-2 border-t border-white/10 px-3 py-3 md:px-5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => { sendMedia(e.target.files?.[0]); e.target.value = ''; }}
                data-testid="media-file-input"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Share photo or video"
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/20 text-white/70 transition hover:border-acid hover:text-acid disabled:opacity-40"
                data-testid="attach-media-btn"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <VoiceNoteButton disabled={uploading} onBlob={(file) => sendMedia(file)} />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="MESSAGE THE SQUAD…"
                className="min-w-0 flex-1 border border-white/15 bg-zinc-950 px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/30 outline-none focus:border-blaze"
                data-testid="squad-input"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="flex h-10 w-12 shrink-0 items-center justify-center bg-blaze text-black transition hover:bg-blaze-hover disabled:opacity-40"
                data-testid="squad-send-btn"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * WhatsApp-style voice note recorder — tap to record, tap again to send.
 * Records real audio (MediaRecorder) and hands the file to onBlob for upload.
 */
function VoiceNoteButton({ disabled, onBlob }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    try { recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop(); } catch (e) { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error('Microphone not supported in this browser.');
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
      } else if (err.name === 'NotFoundError') toast.error('No microphone found.');
      else toast.error(`Mic error: ${err.message || err.name}`);
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    const mime = candidates.find((c) => window.MediaRecorder?.isTypeSupported?.(c)) || '';
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
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      clearInterval(timerRef.current);
      setElapsed(0);
      setRecording(false);
      if (blob.size < 1000) return toast.info('That was too quick — hold it and speak.');
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      onBlob(new File([blob], `voice-note.${ext}`, { type }));
    };
    recorder.start(250);
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= 60) { try { recorder.stop(); } catch (e) { /* noop */ } }
        return s + 1;
      });
    }, 1000);
  };

  const toggle = () => {
    if (recording) { try { recorderRef.current?.stop(); } catch (e) { /* noop */ } return; }
    start();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={recording ? 'Stop & send voice note' : 'Record a voice note'}
      className={`flex h-10 shrink-0 items-center justify-center gap-1.5 transition disabled:opacity-40 ${
        recording ? 'animate-pulse bg-blaze px-3 text-black' : 'w-10 border border-white/20 text-white/70 hover:border-blaze hover:text-blaze'
      }`}
      data-testid="voice-note-btn"
    >
      {recording ? (
        <>
          <Square className="h-4 w-4" />
          <span className="font-mono text-[10px] font-bold">{elapsed}s</span>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}

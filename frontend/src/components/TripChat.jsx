import { useCallback, useEffect, useRef, useState } from "react";
import api, { formatApiError, money } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PaperPlaneRight, ChatsCircle, FilmSlate } from "@phosphor-icons/react";
import { toast } from "sonner";

const fmtTime = (iso) => {
  const d = new Date(iso);
  const isToday = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return isToday ? time : `${d.toLocaleDateString([], { day: "numeric", month: "short" })} ${time}`;
};

const REACTIONS = ["❤️", "👍", "😂", "🎉", "😮"];

export default function TripChat({ tripId, myUserId }) {
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pickerFor, setPickerFor] = useState(null);
  const scrollRef = useRef(null);
  const countRef = useRef(-1);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/trips/${tripId}/messages`);
      setMessages(r.data);
      api.post(`/trips/${tripId}/messages/read`).catch(() => {});
    } catch {}
  }, [tripId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!messages) return;
    if (messages.length !== countRef.current) {
      countRef.current = messages.length;
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/trips/${tripId}/messages`, { text: t });
      setText("");
      setMessages((m) => [...(m || []), data]);
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setSending(false);
  };

  const react = async (m, emoji) => {
    setPickerFor(null);
    try {
      const { data } = await api.post(`/trips/${tripId}/messages/${m.id}/react`, { emoji });
      setMessages((msgs) => (msgs || []).map((x) => (x.id === m.id ? { ...x, reactions: data.reactions } : x)));
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div className="bg-white border border-[#E5E4E0] rounded-2xl overflow-hidden flex flex-col" style={{ height: "min(560px, 65vh)" }} data-testid="trip-chat">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#F9F8F6]">
        {messages === null ? (
          <p className="text-sm text-muted-foreground text-center py-10">Loading chat…</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-12" data-testid="trip-chat-empty">
            <ChatsCircle size={34} weight="duotone" className="text-[#FF5A36] mx-auto" />
            <p className="font-semibold mt-3">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Kick off the planning — everyone in this trip can chat here.</p>
          </div>
        ) : (
          messages.map((m) => {
            if (m.system) {
              return (
                <div key={m.id} data-testid="trip-chat-system-message" className="flex justify-center">
                  <div className="bg-[#0A2540] text-white rounded-2xl px-6 py-4 text-center max-w-[85%]">
                    <FilmSlate size={22} weight="duotone" className="text-[#FFB49B] mx-auto" />
                    <p className="text-sm mt-2">{m.text}</p>
                    {m.data?.recap_token && (
                      <a
                        data-testid="chat-recap-link"
                        href={`/recap/${m.data.recap_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-3 bg-[#FF5A36] hover:bg-[#E64322] text-white text-xs font-bold rounded-full px-4 py-2 transition-colors"
                      >
                        Watch the recap
                      </a>
                    )}
                    {m.kind === "settle" && m.data?.suggestions?.length > 0 && (
                      <div className="mt-3 space-y-2 text-left" data-testid="settle-nudge-list">
                        {m.data.suggestions.map((s, i) => (
                          <div key={i} data-testid="settle-nudge-row" className="bg-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
                            <p className="text-xs flex-1">
                              <b>{s.from_name}</b> owes <b>{s.to_name}</b> · <span className="font-bold text-[#FFB49B]">{money(s.amount, m.data.currency)}</span>
                            </p>
                            {s.upi_link && (
                              <a data-testid="settle-nudge-pay-link" href={s.upi_link} className="bg-[#FF5A36] hover:bg-[#E64322] text-white text-[11px] font-bold rounded-full px-3 py-1.5 transition-colors shrink-0">
                                Pay via UPI
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-white/60 mt-2">{fmtTime(m.created_at)}</p>
                  </div>
                </div>
              );
            }
            const mine = m.user_id === myUserId;
            const reactions = m.reactions && Object.keys(m.reactions).length > 0 ? m.reactions : null;
            return (
              <div key={m.id} data-testid="trip-chat-message" className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="group/msg relative max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-2.5 cursor-pointer ${mine ? "bg-[#FF5A36] text-white rounded-br-md" : "bg-white border border-[#E5E4E0] rounded-bl-md"}`}
                    onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                  >
                    {!mine && <p className="text-[11px] font-bold text-[#0A2540] mb-0.5">{m.name}</p>}
                    <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>{fmtTime(m.created_at)}</p>
                  </div>
                  <div className={`absolute -top-4 ${mine ? "right-1" : "left-1"} ${pickerFor === m.id ? "flex" : "hidden group-hover/msg:flex"} bg-white border border-[#E5E4E0] rounded-full shadow-md px-1.5 py-0.5 gap-0.5 z-10`} data-testid="reaction-picker">
                    {REACTIONS.map((e) => (
                      <button key={e} data-testid={`react-btn-${e}`} onClick={() => react(m, e)} className="text-sm leading-none px-0.5 py-0.5 hover:scale-125 transition-transform" aria-label={`React ${e}`}>{e}</button>
                    ))}
                  </div>
                  {reactions && (
                    <div className={`flex gap-1 mt-1 flex-wrap ${mine ? "justify-end" : ""}`}>
                      {Object.entries(reactions).map(([e, uids]) => (
                        <button
                          key={e}
                          data-testid="reaction-chip"
                          onClick={() => react(m, e)}
                          className={`text-xs rounded-full border px-1.5 py-0.5 transition-colors ${uids.includes(myUserId) ? "border-[#FF5A36] bg-[#FFF1EC]" : "border-[#E5E4E0] bg-white hover:bg-[#F9F8F6]"}`}
                          aria-label={`${e} ${uids.length}`}
                        >
                          {e} {uids.length}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t border-[#E5E4E0] p-3 flex gap-2 bg-white">
        <Input
          data-testid="trip-chat-input"
          placeholder="Message your crew…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          className="rounded-full"
        />
        <Button data-testid="trip-chat-send-btn" onClick={send} disabled={sending || !text.trim()} className="rounded-full bg-[#FF5A36] hover:bg-[#E64322] shrink-0 h-10 w-10 p-0" aria-label="Send message">
          <PaperPlaneRight size={17} weight="fill" />
        </Button>
      </div>
    </div>
  );
}

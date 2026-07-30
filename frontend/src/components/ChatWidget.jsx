import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatCircleDots, X, PaperPlaneTilt, MapPin, Compass } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [geoState, setGeoState] = useState(localStorage.getItem("travelo_geo") || "unset");
  const [coords, setCoords] = useState(null);
  const [city, setCity] = useState(null);
  const bottomRef = useRef(null);
  const location = useLocation();
  const destination = location.pathname.startsWith("/destinations/") ? location.pathname.split("/")[2] : null;
  const tripMatch = location.pathname.match(/^\/trips\/([a-f0-9]{24})$/i);
  const tripId = tripMatch ? tripMatch[1] : null;
  const sessionId = tripId ? `trip-${tripId}` : destination ? `dest-${destination}` : "general";

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("travelo-open-chat", handler);
    return () => window.removeEventListener("travelo-open-chat", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetch(`${API}/chat/history/${sessionId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMessages(d.map((m) => ({ role: m.role, content: m.content }))))
      .catch(() => {});
  }, [open, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const requestGeo = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("granted");
        localStorage.setItem("travelo_geo", "granted");
      },
      () => {
        setGeoState("denied");
        localStorage.setItem("travelo_geo", "denied");
      }
    );
  };

  useEffect(() => {
    if (open && geoState === "granted" && !coords) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [open, geoState, coords]);

  const send = async (text) => {
    const message = (text || input).trim();
    if (!message || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          lat: coords?.lat,
          lng: coords?.lng,
          destination: destination || undefined,
          trip_id: tripId || undefined,
        }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.delta) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + data.delta };
              return copy;
            });
          }
          if (data.city) setCity(data.city);
          if (data.error) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: data.error };
              return copy;
            });
          }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Connection lost — try again." };
        return copy;
      });
    }
    setStreaming(false);
  };

  return (
    <>
      <button
        data-testid="chat-widget-toggle"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#0A2540] text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="AI Travel Assistant"
      >
        {open ? <X size={24} /> : <ChatCircleDots size={26} weight="duotone" />}
      </button>

      {open && (
        <div data-testid="chat-widget-panel" className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[400px] h-[540px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
          <div className="bg-[#0A2540] text-white px-5 py-4">
            <p className="font-display text-lg font-bold flex items-center gap-2"><Compass size={20} weight="duotone" /> Tara — your travel assistant</p>
            <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {tripId ? "Watching your trip budget" : city ? `Near ${city}` : destination ? `Exploring ${destination}` : geoState === "granted" ? "Locating you…" : "Location off"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9F8F6]">
            {geoState === "unset" && (
              <div data-testid="chat-geo-consent" className="bg-white border rounded-xl p-4 text-sm space-y-3">
                <p className="font-semibold">Can Tara use your location?</p>
                <p className="text-muted-foreground text-xs">We use it only to recommend places to roam, eat and explore near you. Nothing is shared or stored beyond your chat.</p>
                <div className="flex gap-2">
                  <Button data-testid="chat-geo-allow" size="sm" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322]" onClick={requestGeo}>Allow location</Button>
                  <Button data-testid="chat-geo-deny" size="sm" variant="outline" className="rounded-full" onClick={() => { setGeoState("denied"); localStorage.setItem("travelo_geo", "denied"); }}>
                    Not now
                  </Button>
                </div>
              </div>
            )}
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ask me anything about your trip:</p>
                {(tripId
                  ? ["How are we doing on budget?", "Who owes whom right now?", "What's worth doing next on this trip?"]
                  : ["Best places to roam near me", "Hidden local spots worth visiting", "Where should I eat tonight?"]
                ).map((q) => (
                  <button key={q} data-testid="chat-suggestion" onClick={() => send(q)} className="block w-full text-left text-sm bg-white border rounded-xl px-4 py-2.5 hover:border-[#FF5A36] transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={`${i}-${m.role}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div data-testid={`chat-message-${m.role}`} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-[#FF5A36] text-white rounded-br-sm" : "bg-white border rounded-bl-sm"}`}>
                  {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t bg-white flex gap-2">
            <Input
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask Tara…"
              className="rounded-full"
            />
            <Button data-testid="chat-send-btn" onClick={() => send()} disabled={streaming} size="icon" className="rounded-full bg-[#0A2540] hover:bg-[#123B66] shrink-0">
              <PaperPlaneTilt size={18} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

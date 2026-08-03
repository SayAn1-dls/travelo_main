import { useEffect, useState } from "react";
import { Envelope, PaperPlaneTilt, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function SquadMailPage() {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('travelo_squad_mail') || '[]'); }
    catch { return []; }
  });

  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    localStorage.setItem('travelo_squad_mail', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!form.to || !form.subject || !form.body) return toast.error("FILL EVERYTHING. THE SQUAD DESERVES CONTEXT.");
    // Simulated 1.2s delivery — in production: connect to email API
    setSending(true);
    setTimeout(() => {
      const msg = {
        id: Date.now().toString(),
        to: form.to.toUpperCase(),
        subject: form.subject.toUpperCase(),
        body: form.body,
        sentAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        status: 'DELIVERED',
      };
      setMessages([msg, ...messages]);
      setForm({ to: '', subject: '', body: '' });
      setSending(false);
      toast.success("📨 MESSAGE DROPPED. SQUAD NOTIFIED.");
    }, 1200);
  };

  const deleteMessage = (id) => {
    setMessages(messages.filter(m => m.id !== id));
    toast.error("MESSAGE DELETED.");
  };

  return (
    <div className="min-h-screen bg-[#030303] pt-36 pb-20 px-6 md:px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_0%_50%,rgba(255,77,0,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">

        <header className="mb-20">
          <p className="text-[11px] font-black tracking-[0.5em] uppercase text-orange-500/60 mb-6 italic">Internal Comms</p>
          <h1 className="text-[12vw] md:text-[8vw] font-[900] leading-[0.78] uppercase font-bebas text-white">
            SQUAD <span className="text-orange-500 italic">MAIL.</span>
          </h1>
          <p className="text-white/30 font-bold text-2xl mt-8 italic uppercase tracking-widest">
            \"MESSAGE THE CREW. NO EXCUSES AFTER THIS.\"
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="silicon-glass border-orange-500/15">
            <h2 className="text-5xl font-[900] font-bebas text-white uppercase italic mb-10">
              COMPOSE <span className="text-orange-500">MESSAGE</span>
            </h2>
            <form onSubmit={sendMessage} className="space-y-8">
              <div className="space-y-3">
                <label className="silicon-label">To (Name or Email) *</label>
                <input
                  required
                  value={form.to}
                  onChange={e => setForm({...form, to: e.target.value})}
                  placeholder="HARSH / harsh@squad.com"
                  className="silicon-input"
                />
              </div>
              <div className="space-y-3">
                <label className="silicon-label">Subject *</label>
                <input
                  required
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                  placeholder="GOA TRIP UPDATE — FINAL PLAN"
                  className="silicon-input"
                />
              </div>
              <div className="space-y-3">
                <label className="silicon-label">Message *</label>
                <textarea
                  required
                  value={form.body}
                  onChange={e => setForm({...form, body: e.target.value})}
                  placeholder="Yo! Flight confirmed for Dec 15. Everyone pack light — we're hitting the beach day 1..."
                  className="silicon-input min-h-[180px] resize-none normal-case"
                  style={{ textTransform: 'none' }}
                  rows={6}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full btn-launch py-10 text-3xl rounded-[2rem] disabled:opacity-50"
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-4">
                    <span className="w-7 h-7 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    SENDING...
                  </span>
                ) : (
                  <><PaperPlaneTilt size={36} weight="fill" /> SEND TO SQUAD</>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <h2 className="text-5xl font-[900] font-bebas text-white uppercase italic">
              SENT <span className="text-white/20">({messages.length})</span>
            </h2>

            {messages.length === 0 ? (
              <div className="silicon-glass flex flex-col items-center justify-center min-h-[400px] gap-6">
                <Envelope size={80} className="text-white/10" weight="duotone" />
                <p className="font-[900] font-bebas text-white/20 uppercase text-4xl italic">INBOX EMPTY</p>
                <p className="text-white/10 font-bold uppercase tracking-widest text-sm text-center">
                  Compose your first squad message.<br/>\"The trip starts with a single text. This is that text.\"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map(msg => (
                  <div key={msg.id} className="silicon-glass group relative hover:border-white/15 transition-all p-10">
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-500 transition-all"
                    >
                      <Trash size={32} />
                    </button>
                    <div className="flex items-start gap-6 mb-6">
                      <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                        <Envelope size={28} className="text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-[900] text-3xl font-bebas text-white uppercase italic leading-none">{msg.subject}</p>
                        <p className="font-black text-sm uppercase tracking-widest text-white/30 mt-2">
                          To: <span className="text-orange-500">{msg.to}</span> · {msg.sentAt}
                        </p>
                      </div>
                      <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl">
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-white/40 font-medium leading-relaxed pl-20 line-clamp-3">{msg.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
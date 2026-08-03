import { useState, useEffect } from "react";
import { ChatCircleDots, PaperPlaneRight, Inbox, Trash, ArrowRight, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

const SQUAD_MEMBERS = ["HARSH", "MILI", "ARJUN", "RHEA", "KAVYA", "OPERATIVE_7"];
const QUOTES = [
  "SQUAD MAIL: WHERE PLANS BECOME REALITY.",
  "SEND IT. NO CAP.",
  "YOUR CREW NEEDS TO KNOW THE PLAN.",
  "COMMUNICATE LIKE A COMMANDER.",
];

const INITIAL_INBOX = [
  { id: "msg_1", from: "HARSH", subject: "GOA TRIP DATES LOCKED?", body: "Bro confirm karr date. Need to book leaves. Also pack extra sunscreen this time lmao.", time: "10:32 AM", date: "TODAY", read: false },
  { id: "msg_2", from: "MILI", subject: "BUDGET UPDATE 🔥", body: "Checked the expense sheet. We're within budget if we skip one expensive restaurant.", time: "Yesterday", date: "YESTERDAY", read: true },
  { id: "msg_3", from: "OPERATIVE_7", subject: "HOTEL CONFIRMED", body: "Villa confirmed. 4 nights, sea view, private pool. You absolute legends.", time: "2 days ago", date: "MON", read: true },
];

export default function SquadMailPage() {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [view, setView] = useState("inbox");
  const [selected, setSelected] = useState(null);

  const [inbox, setInbox] = useState(() => {
    const saved = localStorage.getItem("travelo_squad_inbox");
    return saved ? JSON.parse(saved) : INITIAL_INBOX;
  });

  const [sent, setSent] = useState(() => {
    const saved = localStorage.getItem("travelo_squad_sent");
    return saved ? JSON.parse(saved) : [];
  });

  const [compose, setCompose] = useState({ to: SQUAD_MEMBERS[0], subject: "", body: "" });

  useEffect(() => { localStorage.setItem("travelo_squad_inbox", JSON.stringify(inbox)); }, [inbox]);
  useEffect(() => { localStorage.setItem("travelo_squad_sent", JSON.stringify(sent)); }, [sent]);

  const markRead = (id) => setInbox(inbox.map(m => m.id === id ? { ...m, read: true } : m));

  const deleteMsg = (id) => {
    setInbox(inbox.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.error("MESSAGE DELETED");
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!compose.subject || !compose.body) return;
    const msg = { id: `sent_${Date.now()}`, to: compose.to, subject: compose.subject.toUpperCase(), body: compose.body, from: "SAYAN (ADMIN)", time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), date: "TODAY", sentAt: new Date().toISOString() };
    setSent([msg, ...sent]);
    const fakeReply = { id: `inbox_${Date.now()}`, from: compose.to, subject: `RE: ${compose.subject.toUpperCase()}`, body: `Got your message about "${compose.subject}". On it! 🔥`, time: "Just now", date: "TODAY", read: false };
    setInbox([fakeReply, ...inbox]);
    setCompose({ to: SQUAD_MEMBERS[0], subject: "", body: "" });
    setView("inbox");
    toast.success(`📨 MESSAGE FIRED TO ${compose.to}. AUTO-REPLY INCOMING.`);
  };

  const unread = inbox.filter(m => !m.read).length;

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-32 px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_100%_100%,rgba(0,240,255,0.04)_0%,transparent_50%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-20">
          <div className="flex items-center gap-6 mb-8">
            <ChatCircleDots weight="fill" size={40} className="text-orange-500" />
            <span className="text-4xl font-[900] tracking-[0.3em] text-white/30 font-bebas uppercase">SQUAD COMMS</span>
          </div>
          <h1 className="text-[13vw] font-[900] leading-[0.75] uppercase font-bebas text-white">SQUAD<br/><span className="text-orange-500 italic">MAIL.</span></h1>
          <p className="text-white/30 font-bold text-3xl mt-10 italic uppercase tracking-widest">"{quote}"</p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-3 space-y-4">
            <button onClick={() => { setView("inbox"); setSelected(null); }} className={`w-full flex items-center justify-between p-8 rounded-[2rem] font-black uppercase tracking-widest text-xl transition-all font-bebas ${view==="inbox" ? "bg-orange-500 text-white" : "silicon-glass text-white/40 hover:text-white"}`}>
              <div className="flex items-center gap-4"><Inbox size={28} /> INBOX</div>
              {unread > 0 && <span className="bg-white text-orange-500 rounded-full px-4 py-1 text-lg font-black">{unread}</span>}
            </button>
            <button onClick={() => { setView("compose"); setSelected(null); }} className={`w-full flex items-center gap-4 p-8 rounded-[2rem] font-black uppercase tracking-widest text-xl transition-all font-bebas ${view==="compose" ? "bg-cyan-500 text-black" : "silicon-glass text-white/40 hover:text-white"}`}>
              <PaperPlaneRight size={28} /> COMPOSE
            </button>
            <button onClick={() => { setView("sent"); setSelected(null); }} className={`w-full flex items-center gap-4 p-8 rounded-[2rem] font-black uppercase tracking-widest text-xl transition-all font-bebas ${view==="sent" ? "bg-white/10 text-white" : "silicon-glass text-white/40 hover:text-white"}`}>
              <ArrowRight size={28} /> SENT <span className="ml-auto text-white/30">{sent.length}</span>
            </button>
          </div>
          <div className="lg:col-span-9">
            {view === "inbox" && !selected && (
              <div className="silicon-glass p-8 space-y-4">
                <h2 className="text-4xl font-[900] font-bebas text-white uppercase italic mb-8">INBOX — {inbox.length} MESSAGES</h2>
                {inbox.length === 0 ? (
                  <p className="text-white/20 font-black uppercase text-2xl italic text-center py-20">ALL CLEAR.</p>
                ) : inbox.map(msg => (
                  <div key={msg.id} onClick={() => { setSelected(msg); markRead(msg.id); }} className={`flex items-center justify-between p-8 rounded-[1.5rem] cursor-pointer transition-all group ${!msg.read ? "bg-orange-500/5 border border-orange-500/20" : "bg-white/[0.02] border border-white/5 hover:border-white/10"}`}>
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl text-white/30 uppercase font-bebas flex-shrink-0">{msg.from[0]}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-4 mb-1">
                          <span className="font-black text-white uppercase font-bebas text-2xl">{msg.from}</span>
                          {!msg.read && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
                        </div>
                        <div className="text-white/60 font-bold uppercase text-lg truncate">{msg.subject}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 ml-8 flex-shrink-0">
                      <span className="text-white/20 font-bold text-sm uppercase">{msg.time}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id); }} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash size={24} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {view === "inbox" && selected && (
              <div className="silicon-glass p-16">
                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white font-black uppercase tracking-widest text-lg mb-12 transition-all italic font-bebas">← BACK TO INBOX</button>
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-5xl font-[900] font-bebas text-white uppercase italic">{selected.subject}</h2>
                    <button onClick={() => deleteMsg(selected.id)} className="text-red-500 hover:text-red-400"><Trash size={32} /></button>
                  </div>
                  <div className="flex items-center gap-4 text-white/30">
                    <span className="font-black uppercase font-bebas text-xl text-white/50">FROM: {selected.from}</span>
                    <span>·</span>
                    <span className="font-bold text-sm uppercase">{selected.time}, {selected.date}</span>
                  </div>
                </div>
                <div className="silicon-glass bg-white/[0.02] p-12 rounded-[2rem]">
                  <p className="text-white/70 text-2xl font-bold leading-relaxed">{selected.body}</p>
                </div>
                <button onClick={() => { setCompose({ to: selected.from, subject: `RE: ${selected.subject}`, body: "" }); setView("compose"); setSelected(null); }} className="btn-launch mt-12 py-8 text-2xl">REPLY <ArrowRight size={28} weight="bold" /></button>
              </div>
            )}
            {view === "compose" && (
              <div className="silicon-glass p-16">
                <h2 className="text-5xl font-[900] font-bebas text-white uppercase italic mb-12"><Sparkle weight="fill" className="text-orange-500 inline mr-4" size={40} />NEW MESSAGE</h2>
                <form onSubmit={sendMessage} className="space-y-8">
                  <div><label className="text-white/30 font-black text-sm uppercase tracking-[0.3em] mb-4 block">TO</label><select value={compose.to} onChange={e => setCompose({...compose,to:e.target.value})} className="silicon-input">{SQUAD_MEMBERS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                  <input value={compose.subject} onChange={e => setCompose({...compose,subject:e.target.value})} placeholder="SUBJECT LINE" className="silicon-input" required />
                  <textarea value={compose.body} onChange={e => setCompose({...compose,body:e.target.value})} placeholder="TYPE YOUR MESSAGE..." className="silicon-input min-h-[200px] resize-none" required />
                  <button type="submit" className="btn-launch w-full py-10 text-4xl rounded-[3rem]"><PaperPlaneRight weight="fill" size={40} /> FIRE MESSAGE</button>
                </form>
              </div>
            )}
            {view === "sent" && (
              <div className="silicon-glass p-8 space-y-4">
                <h2 className="text-4xl font-[900] font-bebas text-white uppercase italic mb-8">SENT — {sent.length} MESSAGES</h2>
                {sent.length === 0 ? (
                  <p className="text-white/20 font-black uppercase text-2xl italic text-center py-20">NO MESSAGES SENT YET.</p>
                ) : sent.map(msg => (
                  <div key={msg.id} className="flex items-center justify-between p-8 rounded-[1.5rem] bg-white/[0.02] border border-white/5">
                    <div><div className="font-black text-white/50 uppercase font-bebas text-xl mb-1">TO: {msg.to}</div><div className="text-white/40 font-bold uppercase">{msg.subject}</div></div>
                    <span className="text-white/20 font-bold text-sm uppercase">{msg.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

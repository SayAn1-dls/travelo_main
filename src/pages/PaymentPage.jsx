import { useState, useEffect } from "react";
import { AirplaneTilt, Barcode, CheckCircle, ArrowRight, Sparkle, CurrencyInr } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AIRPORTS = ["DEL", "BOM", "BLR", "CCU", "GOI", "HYD", "MAA", "AMD", "PNQ", "COK"];
const CLASSES = ["ECONOMY", "BUSINESS", "SQUAD CLASS", "ELITE"];
const QUOTES = [
  "YOUR BOARDING PASS IS YOUR PERMISSION SLIP TO LIVE.",
  "FIRST CLASS IS A MINDSET, NOT A TICKET.",
  "THE BEST SEAT IS THE ONE THAT TAKES YOU SOMEWHERE NEW.",
  "ONBOARD. UNLEASHED. UNSTOPPABLE.",
];

function BoardingPassCard({ pass }) {
  return (
    <div className="relative bg-gradient-to-br from-[#0f0f0f] to-[#1a0a00] border border-orange-500/30 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(255,77,0,0.15)] p-12">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500" />
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
            <AirplaneTilt size={28} weight="fill" className="text-white" />
          </div>
          <div>
            <div className="text-4xl font-[900] font-bebas text-white uppercase tracking-widest">travelo.</div>
            <div className="text-white/30 text-xs font-black uppercase tracking-[0.4em]">BOARDING PASS</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/30 text-xs font-black uppercase tracking-[0.4em] mb-1">CLASS</div>
          <div className="text-3xl font-[900] font-bebas text-orange-500 uppercase">{pass.seatClass}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-10 mb-16">
        <div>
          <div className="text-white/20 text-xs font-black uppercase tracking-[0.4em] mb-3">FROM</div>
          <div className="text-[5vw] font-[900] font-bebas text-white leading-none">{pass.from}</div>
          <div className="text-white/40 font-bold text-sm uppercase mt-2">{pass.fromCity}</div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <AirplaneTilt size={48} className="text-orange-500" weight="fill" />
          <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mt-4" />
        </div>
        <div className="text-right">
          <div className="text-white/20 text-xs font-black uppercase tracking-[0.4em] mb-3">TO</div>
          <div className="text-[5vw] font-[900] font-bebas text-white leading-none">{pass.to}</div>
          <div className="text-white/40 font-bold text-sm uppercase mt-2">{pass.toCity}</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-8 mb-16">
        {[{label:"PASSENGER",val:pass.name},{label:"FLIGHT",val:pass.flight},{label:"DATE",val:pass.date},{label:"SEAT",val:pass.seat}].map(({label,val}) => (
          <div key={label}>
            <div className="text-white/20 text-xs font-black uppercase tracking-[0.3em] mb-2">{label}</div>
            <div className="text-2xl font-[900] font-bebas text-white uppercase">{val}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 pt-12 flex items-center justify-between">
        <div>
          <div className="text-white/20 text-xs font-black uppercase tracking-[0.4em] mb-2">BOOKING REF</div>
          <div className="text-4xl font-[900] font-bebas text-cyan-500 tracking-[0.3em]">{pass.ref}</div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="grid grid-cols-8 gap-1">{Array.from({length:64}).map((_,i)=>(<div key={i} className={`w-2 h-2 rounded-sm ${(i*17+i*3)%5>2?'bg-orange-500':'bg-white/5'}`}/>))}</div>
          <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">SCAN AT GATE</div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [step, setStep] = useState("form");
  const [pass, setPass] = useState(null);
  const [form, setForm] = useState({ name: "SAYAN (ADMIN)", from: "DEL", fromCity: "NEW DELHI", to: "GOI", toCity: "GOA", date: new Date().toISOString().split("T")[0], seat: "14A", seatClass: "ECONOMY", amount: "8500" });

  useEffect(() => {
    const saved = localStorage.getItem("travelo_last_pass");
    if (saved) { const p = JSON.parse(saved); setPass(p); setStep("pass"); }
  }, []);

  const generatePass = (e) => {
    e.preventDefault();
    const newPass = { ...form, flight: `TV${Math.floor(Math.random()*9000)+1000}`, ref: Math.random().toString(36).substring(2,8).toUpperCase(), status: "CONFIRMED", paidAt: new Date().toISOString() };
    localStorage.setItem("travelo_last_pass", JSON.stringify(newPass));
    const history = JSON.parse(localStorage.getItem("travelo_pass_history") || "[]");
    localStorage.setItem("travelo_pass_history", JSON.stringify([newPass, ...history]));
    setPass(newPass); setStep("pass");
    toast.success("🛫 BOARDING PASS ISSUED. YOU'RE CLEARED FOR TAKEOFF!");
  };

  if (step === "pass" && pass) {
    return (
      <div className="min-h-screen bg-[#030303] pt-40 pb-32 px-10">
        <div className="max-w-4xl mx-auto">
          <header className="mb-20 text-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              <CheckCircle weight="fill" size={56} className="text-green-400" />
              <h1 className="text-[10vw] font-[900] leading-none uppercase font-bebas text-white">CLEARED.<br/><span className="text-orange-500 italic">TAKEOFF.</span></h1>
            </div>
            <p className="text-white/30 font-bold text-2xl italic uppercase tracking-widest">"{quote}"</p>
          </header>
          <BoardingPassCard pass={pass} />
          <div className="mt-12 grid grid-cols-2 gap-8">
            <button onClick={() => { setStep("form"); setPass(null); localStorage.removeItem("travelo_last_pass"); }} className="silicon-glass border-white/10 py-8 font-black uppercase tracking-widest text-xl text-white/60 hover:text-white transition-all font-bebas">NEW BOOKING</button>
            <button onClick={() => navigate("/dashboard")} className="btn-launch py-8 text-2xl">RETURN TO HQ <ArrowRight size={28} weight="bold" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-32 px-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-20">
          <div className="flex items-center gap-6 mb-8">
            <Barcode size={40} className="text-orange-500" weight="bold" />
            <span className="text-4xl font-[900] tracking-[0.3em] text-white/30 font-bebas uppercase">PAYMENT DECK</span>
          </div>
          <h1 className="text-[13vw] font-[900] leading-[0.75] uppercase font-bebas text-white">BOARDING<br/><span className="text-orange-500 italic">PASS.</span></h1>
          <p className="text-white/30 font-bold text-3xl mt-10 italic uppercase tracking-widest">"{quote}"</p>
        </header>
        <form onSubmit={generatePass} className="silicon-glass p-16 space-y-10">
          <h2 className="text-5xl font-[900] font-bebas text-white uppercase italic mb-12">FLIGHT DETAILS</h2>
          <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="PASSENGER NAME" className="silicon-input" />
          <div className="grid grid-cols-2 gap-8">
            <div><label className="text-white/30 font-black text-sm uppercase tracking-[0.3em] mb-4 block">FROM</label><select value={form.from} onChange={e => setForm({...form,from:e.target.value})} className="silicon-input">{AIRPORTS.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
            <div><label className="text-white/30 font-black text-sm uppercase tracking-[0.3em] mb-4 block">TO</label><select value={form.to} onChange={e => setForm({...form,to:e.target.value})} className="silicon-input">{AIRPORTS.filter(a=>a!==form.from).map(a=><option key={a} value={a}>{a}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div><label className="text-white/30 font-black text-sm uppercase tracking-[0.3em] mb-4 block">DATE</label><input type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})} className="silicon-input" /></div>
            <div><label className="text-white/30 font-black text-sm uppercase tracking-[0.3em] mb-4 block">SEAT</label><input value={form.seat} onChange={e => setForm({...form,seat:e.target.value})} placeholder="14A" className="silicon-input" /></div>
            <div><label className="text-white/30 font-black text-sm uppercase tracking-[0.3em] mb-4 block">CLASS</label><select value={form.seatClass} onChange={e => setForm({...form,seatClass:e.target.value})} className="silicon-input">{CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="silicon-glass bg-orange-500/5 border-orange-500/20 p-12 flex items-center justify-between">
            <div className="flex items-center gap-6"><CurrencyInr size={48} className="text-orange-500" weight="bold" /><div><div className="text-white/30 text-sm font-black uppercase tracking-[0.3em]">TOTAL FARE</div><input value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} className="text-6xl font-[900] font-bebas text-orange-500 bg-transparent outline-none w-48" type="number" /></div></div>
            <div className="text-right"><div className="text-white/20 text-xs font-black uppercase tracking-[0.3em] mb-2">STATUS</div><div className="text-3xl font-[900] font-bebas text-green-400 uppercase">READY TO PAY</div></div>
          </div>
          <button type="submit" className="btn-launch w-full py-10 text-4xl rounded-[3rem]"><Sparkle weight="fill" size={40} /> ISSUE BOARDING PASS</button>
        </form>
      </div>
    </div>
  );
}

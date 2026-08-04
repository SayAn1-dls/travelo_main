import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Sparkle, AirplaneTilt, CurrencyInr, Image, Envelope, ChartBar, MapPin, ArrowRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const GREETINGS = [
  "READY TO BREAK THE INTERNET?",
  "YOUR PASSPORT IS BORED. FIX IT.",
  "THE GROUP CHAT IS WAITING. MOVE.",
  "SQUAD LOGISTICS: ONLINE.",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("");
  const name = (user?.name || "OPERATIVE").split(' ')[0].toUpperCase();

  useEffect(() => {
    setGreeting(GREETINGS[new Date().getHours() % GREETINGS.length]);
  }, []);

  const trips = JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]');
  const expenses = trips.reduce((total, t) => {
    const exp = JSON.parse(localStorage.getItem(`travelo_exp_${t.id}`) || '[]');
    return total + exp.reduce((a, e) => a + e.amount, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-6 md:px-10 relative overflow-hidden">
      <div className="fixed top-0 right-0 p-12 pointer-events-none opacity-[0.03]">
        <ChartBar size={400} weight="thin" className="animate-pulse" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <Sparkle weight="fill" size={32} className="text-orange-500 animate-spin-slow" />
              <span className="text-2xl font-[900] tracking-[0.5em] text-white/20 font-bebas">COMMAND HQ</span>
            </div>
            <h1 className="header-massive text-white">YO, <span className="text-orange-500 italic">{name}!</span></h1>
            <p className="text-white/40 font-marker text-4xl md:text-5xl mt-12 uppercase tracking-tight">"{greeting}"</p>
          </div>
          <div className="silicon-glass border-white/5 p-8 flex flex-col items-end">
            <p className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase mb-2">NETWORK STATUS</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
              <span className="font-black text-sm text-green-500 uppercase">LOCAL CORE ACTIVE</span>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
          <div className="lg:col-span-8 silicon-glass border-orange-500/10 hover:border-orange-500/30 transition-all flex flex-col justify-between min-h-[450px]">
            <div>
              <p className="text-orange-500 font-black text-[11px] tracking-[0.5em] uppercase mb-8 italic">MISSION BOARD</p>
              <h2 className="text-[8vw] md:text-[5vw] font-[900] font-bebas text-white leading-none uppercase mb-8">INITIATE NEW <br/><span className="text-cyan-500 italic">EXPEDITION.</span></h2>
              <p className="text-xl text-white/30 font-bold uppercase tracking-tight max-w-sm">NO DRAMA. NO DEBT. JUST PURE LOGISTICS AND SQUAD SYNC.</p>
            </div>
            <Link to="/trips"><button className="btn-launch group">START MISSION <ArrowRight size={32} weight="bold" className="group-hover:translate-x-3 transition-transform" /></button></Link>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-10">
            <div className="silicon-glass border-white/5 flex-1 flex flex-col">
              <p className="text-white/20 font-black text-[10px] tracking-[0.4em] uppercase mb-6 italic">SQUAD CAPITAL</p>
              <div className="text-6xl md:text-5xl font-[900] font-bebas text-orange-500 italic mb-2 tracking-tighter">₹{expenses.toLocaleString()}</div>
              <p className="text-white/20 font-bold text-xs uppercase tracking-widest mb-auto">LOGGED ACROSS MISSIONS</p>
              <Link to="/bookings" className="mt-8"><button className="w-full bg-white/5 border border-white/10 py-5 rounded-2xl font-black text-[10px] tracking-[0.4em] uppercase hover:bg-white/10 transition-all">VIEW LEDGER</button></Link>
            </div>
            <div className="silicon-glass bg-cyan-500/5 border-cyan-500/10 flex-1">
              <p className="text-cyan-500 font-black text-[10px] tracking-[0.4em] uppercase mb-4 italic">ACTIVE MISSIONS</p>
              <div className="text-6xl md:text-5xl font-[900] font-bebas text-white italic leading-none">{trips.length}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[{ label: 'LOGISTICS', path: '/book', icon: AirplaneTilt, color: 'text-orange-500' }, { label: 'LEDGER', path: '/bookings', icon: CurrencyInr, color: 'text-cyan-500' }, { label: 'VAULT', path: '/explore', icon: Image, color: 'text-yellow-400' }, { label: 'MAIL', path: '/squad-mail', icon: Envelope, color: 'text-white/60' }].map((item, i) => (
            <Link key={i} to={item.path} className="silicon-glass hover:border-white/20 group p-10 flex flex-col justify-between min-h-[220px] transition-all">
              <item.icon size={48} weight="duotone" className={`${item.color} group-hover:scale-110 transition-transform`} />
              <div><p className="text-3xl font-[900] font-bebas text-white uppercase italic">{item.label}</p><p className="text-[10px] font-black text-white/20 tracking-widest mt-2 uppercase">DEPLOY SYSTEM</p></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
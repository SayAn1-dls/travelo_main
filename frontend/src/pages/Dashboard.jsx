import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Sparkle, AirplaneTilt, CurrencyInr, ChatTeardropDots, Image, Envelope } from "@phosphor-icons/react";
import { getRandomTip } from "@/lib/travelTips";

// 5 dynamic greetings — rotates by hour for freshness
const GREETINGS = [
  "READY TO BREAK THE INTERNET WITH ANOTHER TRIP?",
  "YOUR PASSPORT IS BORED. FIX THAT.",
  "THE GROUP CHAT IS WAITING. MOVE.",
  "PLAN IT. PACK IT. NEVER LOOK BACK.",
  "SOMEONE'S GOTTA BE THE ONE WHO BOOKS IT. BE THAT.",
];

export default function Dashboard() {
  const { user } = useAuth();
  const name = (user?.name || "OPERATIVE").split(' ')[0].toUpperCase();
  const greeting = GREETINGS[new Date().getHours() % GREETINGS.length];

  const trips = (() => {
    try { return JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]'); }
    catch { return []; }
  })();

  const totalMembers = (() => {
    try {
      const allMembers = new Set();
      trips.forEach(t => t.members?.forEach(m => allMembers.add(m)));
      return allMembers.size;
    } catch { return 0; }
  })();

  const expenses = (() => {
    try {
      let total = 0;
      trips.forEach(t => {
        const exp = JSON.parse(localStorage.getItem(`travelo_exp_${t.id}`) || '[]');
        total += exp.reduce((a, e) => a + e.amount, 0);
      });
      return total;
    } catch { return 0; }
  })();

  return (
    <div className="min-h-screen bg-[#030303] pt-36 pb-20 px-6 md:px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_100%_0%,rgba(0,240,255,0.04)_0%,transparent_50%),radial-gradient(at_0%_100%,rgba(255,77,0,0.04)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <Sparkle weight="fill" size={32} className="text-orange-500 animate-pulse" />
            <span className="text-2xl font-[900] tracking-[0.4em] text-white/20 font-bebas uppercase">COMMAND HQ</span>
          </div>
          <h1 className="text-[12vw] font-[900] leading-[0.78] uppercase font-bebas">
            YO,{' '}<span className="text-orange-500 italic">{name}!</span>
          </h1>
          <p className="text-white/40 font-marker text-3xl md:text-4xl mt-10 uppercase tracking-widest max-w-3xl">
            "{greeting}"
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
          <div className="lg:col-span-8 silicon-glass border-orange-500/10 group min-h-[420px] flex flex-col justify-between hover:border-orange-500/25 transition-all">
            <div>
              <p className="text-[11px] font-black tracking-[0.5em] uppercase text-white/20 mb-8 italic">Primary Operation</p>
              <h2 className="text-[7vw] font-[900] mb-6 leading-none uppercase font-bebas">
                Launch New <br/><span className="text-cyan-500 italic text-[8vw]">Expedition.</span>
              </h2>
              <p className="text-xl text-white/30 font-bold uppercase tracking-tight max-w-sm">
                Itineraries, group capital, and secret spots. All handled. Zero drama.
              </p>
            </div>
            <Link to="/trips" className="no-underline">
              <button className="btn-launch py-8 px-16 text-3xl rounded-[2rem] mt-10">INITIATE MISSION</button>
            </Link>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-10">
            <div className="silicon-glass border-white/5 flex-1 flex flex-col">
              <p className="text-[11px] font-black tracking-[0.5em] uppercase text-white/20 mb-6 italic">Squad Capital</p>
              <div className="text-[7vw] md:text-[4vw] font-[900] text-orange-500 italic tracking-tighter font-bebas leading-none mb-2">
                ₹{expenses.toLocaleString()}
              </div>
              <p className="text-white/20 font-bold text-sm uppercase tracking-widest mb-auto">Logged across all missions</p>
              <Link to="/bookings" className="no-underline mt-8">
                <button className="w-full bg-white/5 hover:bg-white/10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all italic border border-white/10 text-white/60">
                  RECAP DAMAGE
                </button>
              </Link>
            </div>

            <div className="silicon-glass bg-orange-500/5 border-orange-500/20 flex-1">
              <p className="text-[11px] font-black tracking-[0.5em] uppercase text-orange-500/60 mb-4 italic">Active Missions</p>
              <div className="text-[7vw] md:text-[4vw] font-[900] text-white italic tracking-tighter font-bebas leading-none">
                {trips.length}
              </div>
              <p className="text-white/20 font-bold text-sm uppercase tracking-widest mt-2">Operations running</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: AirplaneTilt, label: 'LOGISTICS', sub: 'Book flights & stays', path: '/book', color: 'text-orange-500' },
            { icon: CurrencyInr, label: 'LEDGER', sub: 'Capital & settlements', path: '/bookings', color: 'text-cyan-500' },
            { icon: Image, label: 'MEMORIES', sub: 'Photo vault', path: '/explore', color: 'text-yellow-400' },
            { icon: Envelope, label: 'SQUAD MAIL', sub: 'Message the crew', path: '/squad-mail', color: 'text-white/60' },
          ].map((item) => (
            <Link to={item.path} key={item.label} className="no-underline">
              <div className="silicon-glass group hover:border-white/20 transition-all cursor-pointer min-h-[180px] flex flex-col justify-between p-10">
                <item.icon size={40} className={`${item.color} group-hover:scale-110 transition-transform`} weight="duotone" />
                <div>
                  <p className="font-[900] text-2xl font-bebas text-white uppercase italic">{item.label}</p>
                  <p className="text-white/20 font-bold text-xs uppercase tracking-widest mt-1">{item.sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
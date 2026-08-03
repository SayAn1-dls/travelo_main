import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Sparkle, AirplaneTilt, CurrencyInr, ChatTeardropDots, Image, Envelope } from "@phosphor-icons/react";
const GREETINGS = ["READY TO BREAK THE INTERNET WITH ANOTHER TRIP?","YOUR PASSPORT IS BORED. FIX THAT.","THE GROUP CHAT IS WAITING. MOVE.","PLAN IT. PACK IT. NEVER LOOK ACKK.","SOMEONE'S GOTTA BE THE ONE WHO BOOKS IT. BE THAT."];
export default function Dashboard() {
  const { user } = useAuth();
  const name = (user?.name || "OPERATIVE").split(' ')[0].toUpperCase();
  const greeting = GREETINGS[new Date().getHours() % GREETINGS.length];
  const trips = (() => { try { return JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]'); } catch { return []; } })();
  const expenses = (() => { try { let total = 0; trips.forEach(t => { const exp = JSON.parse(localStorage.getItem(`travelo_exp_${t.id}`) || '[]'); total += exp.reduce((a, e) => a + e.amount, 0); }); return total; } catch { return 0; } })();
  return (
    <div className="min-h-screen bg-[#030303] pt-36 pb-20 px-6 md:px-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-24">
          <h1 className="text-[12vw] font-[900] leading-[0.78] uppercase font-bebas">ZO{' '}<span className="text-orange-500 italic">{name}!</span></h1>
          <p className="text-white/40 font-marker text-3xl mt-10 uppercase tracking-widest max-w-3xl">"{greeting}"</p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
          <div className="lg:col-span-8 silicon-glass border-orange-500/10 min-h-[420px] flex flex-col justify-between">
            <h2 className="text-[7vw] font-[900] mb-6 leading-none uppercase font-bebas">Launch New<br/><span className="text-cyan-500 italic">Expedition.</span></h2>
            <Link to="/trips" className="no-underline"><button className="btn-launch py-8 px-16 text-3xl rounded-[2rem]">INITIATE MISSION</button></Link>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-10">
            <div className="silicon-glass flex-1 flex flex-col">
              <div className="text-[7vw] md:text-[4vw] font-[900] text-orange-500 italic font-bebas leading-none mb-2">₹ {expenses.toLocaleString()}</div>
              <p className="text-white/20 font-bold text-sm uppercase tracking-widest">Squad Capital</p>
            </div>
            <div className="silicon-glass bg-orange-500/5 border-orange-500/20 flex-1">
              <div className="text-[7vw] md:text-[4vw] font-[900] text-white italic font-bebas leading-none">{trips.length}</div>
              <p className="text-white/20 font-bold text-sm uppercase tracking-widest mt-2">Active Missions</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[{ icon: AirplaneTilt, label: 'LOGISTICS', path: '/book', color: 'text-orange-500' },{ icon: CurrencyInr, label: 'LEDGER', path: '/bookings', color: 'text-cyan-500' },{ icon: Image, label: 'MEMORIES', path: '/explore', color: 'text-yellow-400' },{ icon: Envelope, label: 'SQUAD", path: '/squad-mail', color: 'text-white/60' }].map((item) => (
            <Link to={item.path} key={item.label} className="no-underline">
              <div className="silicon-glass group hover:border-white/20 transition-all cursor-pointer min-h-[180px] flex flex-col justify-between p-10">
                <item.icon size={40} className={item.color} weight="duotone" />
                <p className="font-[900] text-2xl font-bebas text-white uppercase italic">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

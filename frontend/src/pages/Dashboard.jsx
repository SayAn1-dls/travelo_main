import { useAuth } from "@/context/AuthContext";
import { Sparkle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const name = (user?.name || "OPERATIVE").split(' ')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_100%_0%,rgba(0,240,255,0.05)_0%,transparent_50%),radial-gradient(at_0%_100%,rgba(255,77,0,0.03)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-32">
          <div className="flex items-center gap-6 mb-8">
            <Sparkle weight="fill" size={40} className="text-orange-500 animate-pulse" />
            <span className="text-4xl font-[900] tracking-[0.3em] text-white/30 font-bebas uppercase">COMMAND HQ</span>
          </div>
          <h1 className="text-[14vw] font-[900] leading-[0.75] uppercase font-bebas">YO, <span className="text-orange-500 italic">{name}!</span></h1>
          <p className="text-white/40 font-bold text-4xl mt-12 italic uppercase tracking-tighter">"READY TO BREAK THE INTERNET WITH ANOTHER TRIP?"</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 silicon-glass border-orange-500/20 group min-h-[500px] flex flex-col justify-center">
            <h2 className="text-[8vw] font-[900] mb-8 leading-none uppercase font-bebas">Launch New <br/><span className="text-cyan-500 italic text-[9vw]">Expedition.</span></h2>
            <p className="text-2xl text-white/40 mb-16 font-bold uppercase tracking-tight max-w-md">Itineraries, group capital, and secret spots. All handled.</p>
            <Link to="/trips">
              <button className="btn-launch py-10 px-20 text-4xl">INITIATE MISSION</button>
            </Link>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-12">
            <div className="silicon-glass border-white/5 flex-1 flex flex-col">
              <h3 className="text-6xl font-[900] mb-4 font-bebas text-white uppercase italic">The Pool</h3>
              <div className="text-8xl font-[900] text-orange-500 italic tracking-tighter font-bebas">₹12,450</div>
              <Link to="/bookings" className="mt-auto">
                <button className="w-full bg-white/5 hover:bg-white/10 py-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] transition-all italic border border-white/10">RECAP DAMAGE</button>
              </Link>
            </div>
            <div className="silicon-glass bg-orange-500/5 border-orange-500/30 flex-1">
              <h3 className="text-6xl font-[900] mb-6 font-bebas text-orange-500 italic uppercase">TARA</h3>
              <p className="text-sm font-bold text-white/40 mb-10 italic uppercase tracking-widest leading-relaxed">"Analyzing party patterns in Goa. Standby for the drop."</p>
              <Link to="/book">
                <button className="w-full btn-launch py-6 text-xl">OPEN COMMS</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

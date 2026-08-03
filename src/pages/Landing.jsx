import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AirplaneTilt, ArrowRight, Sparkle, MapPin, CurrencyInr, Users } from "@phosphor-icons/react";

const STATS = [
  { num: "50K+", label: "Operatives active" },
  { num: "₹2.4Cr", label: "Settled this month" },
  { num: "1,200+", label: "Trips planned" },
];

const FEATURES = [
  { icon: MapPin, title: "MISSION CONTROL", desc: "Create a trip, add the squad, log every expense. Itineraries synced live.", color: "text-orange-500" },
  { icon: CurrencyInr, title: "ZERO-DEBT ENGINE", desc: "Min-cash-flow algo. Minimum transactions. Maximum peace.", color: "text-cyan-500" },
  { icon: Users, title: "SQUAD INTEL", desc: "Message the crew, share memories, plan in real-time.", color: "text-yellow-400" },
];

const QUOTES = [
  { text: "BAGS BY THE DOOR. BRAIN SET TO VIBE.", author: "— every traveler ever" },
  { text: "THE ITINERARY IS A SUGGESTION. GO ROGUE.", author: "— Travelo philosophy" },
  { text: "SLEEP IS OPTIONAL. MEMORIES ARE NOT.", author: "— your future self" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-orange-500 overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_0%_0%,rgba(255,77,0,0.12)_0%,transparent_50%),radial-gradient(at_100%_100%,rgba(0,240,255,0.06)_0%,transparent_50%)] pointer-events-none" />
      
      <nav className="fixed top-0 inset-x-0 z-[100] p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <AirplaneTilt size={24} weight="fill" className="text-white" />
          </div>
          <span className="text-4xl font-[900] tracking-tighter font-bebas uppercase">travelo.</span>
        </div>
        <Link to="/auth">
          <button className="bg-white/5 border border-white/10 backdrop-blur-md px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-xs">
            Enter HQ
          </button>
        </Link>
      </nav>
      <main className="relative pt-44 pb-24 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-[14vw] font-[900] leading-[0.8] mb-10 tracking-tighter font-bebas text-white uppercase">PLAN. PACK.<br/><span className="text-orange-500 italic">EXPLORE.</span></motion.h1>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-6 justify-center mb-24">
            <Link to="/auth"><button className="btn-launch text-4xl px-16 py-10 rounded-[2.5rem]">START EXPEDITION <ArrowRight size={48} weight="bold" /></button></Link>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-24">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="silicon-glass group">
                <f.icon size={48} className={`${f.color} mb-8`} weight="duotone" />
                <h3 className="text-4xl font-[900] mb-4 font-bebas text-white uppercase italic">{f.title}</h3>
                <p className="text-white/30 text-lg font-bold uppercase tracking-tight">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {QUOTES,map((q, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 + i * 0.1 }} className="silicon-glass-sm p-10 border border-white/5 flex flex-col justify-center min-h-[240px]">
                <p className="text-3xl font-marker text-orange-500 mb-4 uppercase leading-tight italic">"{q.text}"</p>
                <p className="text-white/20 font-bold text-xs uppercase tracking-[0.4em]">{q.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

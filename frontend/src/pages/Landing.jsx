import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AirplaneTilt, ArrowRight, Sparkle } from "@phosphor-icons/react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-orange-500 overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_0%_0%,rgba(255,77,0,0.1)_0%,transparent_50%),radial-gradient(at_100%_100%,rgba(0,240,255,0.05)_0%,transparent_50%)] pointer-events-none" />
      
      <nav className="fixed top-0 inset-x-0 z-[100] p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <AirplaneTilt size={24} weight="fill" className="text-white" />
          </div>
          <span className="text-4xl font-[900] tracking-tighter font-bebas uppercase">travelo.</span>
        </div>
        <Link to="/auth">
          <button className="bg-white/5 border border-white/10 backdrop-blur-md px-10 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-xs">Enter HQ</button>
        </Link>
      </nav>

      <main className="relative pt-48 pb-20 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-8 py-2 rounded-full mb-12 backdrop-blur-3xl">
            <Sparkle weight="fill" className="text-orange-500" />
            <span className="font-black text-[10px] tracking-[0.4em] uppercase text-orange-500">MASTERPIECE v29.2 — FINAL MARKET BUILD</span>
          </motion.div>

          <h1 className="text-[14vw] font-[900] leading-[0.8] mb-12 tracking-tighter font-bebas text-white uppercase drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
            PLAN. PACK. <br/><span className="text-orange-500 italic">EXPLORE.</span>
          </h1>
          
          <p className="text-2xl md:text-4xl text-white/40 max-w-3xl mx-auto mb-20 font-bold uppercase tracking-tight italic">
            "The sexiest travel workspace for elite squads.<br/>No drama, just logistics and vibes."
          </p>

          <div className="flex justify-center mb-40">
            <Link to="/auth">
              <button className="btn-launch text-5xl px-20 py-10 rounded-[3rem] group">
                START EXPEDITION <ArrowRight size={56} weight="bold" className="group-hover:translate-x-4 transition-transform" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            <div className="silicon-glass group hover:bg-white/[0.05] transition-all">
              <h3 className="text-5xl font-[900] mb-6 font-bebas text-orange-500">MISSION CONTROL</h3>
              <p className="text-white/40 text-xl font-bold uppercase tracking-tight">Itineraries synced live for the whole squad.</p>
            </div>
            <div className="silicon-glass group hover:bg-white/[0.05] transition-all">
              <h3 className="text-5xl font-[900] mb-6 font-bebas text-orange-500">MONEY FLOW</h3>
              <p className="text-white/40 text-xl font-bold uppercase tracking-tight">Zero-debt logic. Minimum math, maximum fun.</p>
            </div>
            <div className="silicon-glass group hover:bg-white/[0.05] transition-all">
              <h3 className="text-5xl font-[900] mb-6 font-bebas text-orange-500">AI GUIDANCE</h3>
              <p className="text-white/40 text-xl font-bold uppercase tracking-tight">Tara knows the hidden gems in every sector.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

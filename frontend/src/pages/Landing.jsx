import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AirplaneTilt, MapPin, Wallet, Sparkle, ArrowRight } from "@phosphor-icons/react";

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-sexy-black overflow-hidden selection:bg-sexy-orange selection:text-white">
      {/* BACKGROUND VIBES */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sexy-orange/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sexy-cyan/10 blur-[120px] rounded-full" />

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-10 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sexy-orange rounded-2xl flex items-center justify-center rotate-[-10deg] shadow-sexy-orange">
              <AirplaneTilt size={32} weight="fill" className="text-white" />
            </div>
            <span className="goated-heading text-4xl uppercase">travelo<span className="text-sexy-orange">.</span></span>
          </div>
          <Link to="/auth">
            <button className="btn-sexy text-sm">LAUNCH MISSION</button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <main className="relative z-10 pt-52 pb-40 px-10 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-12"
        >
          <Sparkle weight="fill" className="text-sexy-yellow" />
          <span className="font-black text-[10px] tracking-[0.3em] uppercase opacity-70">v24.1 | Sexiest UI Active</span>
        </motion.div>

        <h1 className="goated-heading text-[12vw] leading-[0.8] mb-12">
          STOP <span className="text-sexy-orange">SCROLLING.</span><br />
          START <span className="text-gradient-sexy">EXPLORING.</span>
        </h1>

        <p className="crazy-text text-3xl mb-16 rotate-[-2deg]">
          Your squad called. They said stop being broke and book the trip already.
        </p>

        <div className="max-w-4xl mx-auto bg-sexy-dark p-4 rounded-full border-2 border-white/10 shadow-2xl flex items-center gap-4">
          <input 
            className="flex-1 bg-transparent px-10 py-6 text-2xl font-bold outline-none placeholder:text-white/20"
            placeholder="WHERE'S THE SQUAD GOING NEXT?"
          />
          <Link to="/auth">
            <button className="w-24 h-24 bg-sexy-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-sexy-orange group">
              <ArrowRight size={40} weight="bold" className="group-hover:translate-x-2 transition-transform" />
            </button>
          </Link>
        </div>
      </main>

      {/* FEATURE CARDS */}
      <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-12 pb-40">
        <div className="sexy-card">
          <h3 className="goated-heading text-5xl mb-4">CAPITAL LEDGER</h3>
          <p className="crystal-clear text-lg mb-6">Min-Cash-Flow engine. Fewer transactions, more money for chai and chaos.</p>
          <span className="crazy-text text-xl italic">"Money comes, money goes. Mostly to Goa."</span>
        </div>
        <div className="sexy-card">
          <h3 className="goated-heading text-5xl mb-4">TACTICAL PLANNER</h3>
          <p className="crystal-clear text-lg mb-6">Military-grade itineraries. Because winging it costs 3x more at the airport.</p>
          <span className="crazy-text text-xl italic">"We plan. You pretend you planned all along."</span>
        </div>
        <div className="sexy-card">
          <h3 className="goated-heading text-5xl mb-4">TARA AI GUIDE</h3>
          <p className="crystal-clear text-lg mb-6">Your AI co-pilot who's been everywhere, judged nothing, and remembers everything.</p>
          <span className="crazy-text text-xl italic">"She's smarter than your GPS and less annoying."</span>
        </div>
      </div>

      {/* FOOTER LINE */}
      <div className="border-t border-white/5 py-10 text-center">
        <p className="font-black text-[10px] tracking-[0.4em] uppercase opacity-20">Travelo v24.1 — Built for the bold. Optimized for chaos.</p>
      </div>
    </div>
  );
}

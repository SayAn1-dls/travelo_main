import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AirplaneTilt, ArrowRight, Sparkle } from "@phosphor-icons/react";

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden selection:bg-brutal-acid selection:text-black">
      {/* OVERLAPPING STICKERS */}
      <div className="absolute top-40 left-[10%] w-32 h-32 bg-brutal-orange border-4 border-white flex items-center justify-center rotate-[-12deg] z-20 shadow-xl hidden lg:flex animate-bounce">
         <span className="font-bebas text-4xl text-white">GO!</span>
      </div>
      <div className="absolute top-[60%] right-[5%] w-48 h-48 bg-brutal-acid border-4 border-black flex items-center justify-center rotate-[8deg] z-20 shadow-2xl hidden lg:flex">
         <span className="font-marker text-3xl text-black text-center leading-tight">Boarding<br/>Pass<br/>READY</span>
      </div>

      <nav className="fixed top-0 inset-x-0 z-[100] p-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="w-14 h-14 bg-brutal-orange border-4 border-white flex items-center justify-center rotate-[-10deg]">
            <AirplaneTilt size={32} weight="fill" className="text-white" />
          </div>
          <span className="header-massive text-5xl text-white">TRAVELO.</span>
        </div>
        <Link to="/auth" className="pointer-events-auto">
            <button className="btn-brutal bg-white text-black">LOGIN</button>
        </Link>
      </nav>

      <main className="relative z-10 pt-60 pb-40 px-10">
        <div className="max-w-7xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, x: -50 }} 
                animate={{ opacity: 1, x: 0 }}
                className="inline-block bg-white text-black px-6 py-2 border-4 border-brutal-orange mb-12 rotate-[-1deg]"
            >
                <span className="font-bebas text-2xl tracking-widest">MISSION LEVEL 27 — UNLOCKED</span>
            </motion.div>

            <h1 className="header-massive text-[15vw] mb-12 leading-[0.75]">
                STOP <span className="text-brutal-orange underline decoration-white decoration-8">SCROLLING.</span><br />
                START <span className="text-brutal-acid">EXPLORING.</span>
            </h1>

            <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-32">
                <div className="max-w-xl">
                    <p className="clear-body text-3xl font-black mb-12">The world's most aggressive travel engine for people who move fast and split smart.</p>
                    <Link to="/auth">
                        <button className="btn-brutal px-16 py-8 text-4xl group">
                            LAUNCH EXPEDITION <ArrowRight size={44} weight="bold" className="inline ml-4 group-hover:translate-x-4 transition-transform" />
                        </button>
                    </Link>
                </div>
                <div className="relative pt-12">
                    <div className="marker-note text-5xl rotate-[-4deg] max-w-[300px] leading-none">
                        "Your group chat is lying. This is the only plan that's actually happening."
                    </div>
                </div>
            </div>
        </div>
      </main>

      <div className="marquee-container">
        {[1, 2, 3].map(i => (
            <div key={i} className="marquee-text">
                GOA &#x2022; BALI &#x2022; TOKYO &#x2022; LADAKH &#x2022; PARIS &#x2022; DUBAI &#x2022; ISTANBUL &#x2022; ZURICH &#x2022;&nbsp;
            </div>
        ))}
      </div>

      <section className="max-w-7xl mx-auto px-10 py-40 grid grid-cols-1 md:grid-cols-3 gap-16">
        <div className="brutal-card">
            <h3 className="header-massive text-5xl mb-6">CAPITAL LEDGER</h3>
            <p className="clear-body mb-8">Zero debt-drama logic. We solve the math, you buy the round.</p>
            <span className="marker-note text-2xl">"Raj owes &#x20b9;400 for the Kingfisher. Pay up."</span>
        </div>
        <div className="brutal-card border-brutal-acid shadow-brutal-acid">
            <h3 className="header-massive text-5xl mb-6 text-brutal-acid">TACTICAL PLAN</h3>
            <p className="clear-body mb-8">Military-grade itineraries. Paradise, optimized for launch.</p>
            <span className="marker-note text-2xl text-white">"Day 3: Wake up at 2 PM. Standard."</span>
        </div>
        <div className="brutal-card">
            <h3 className="header-massive text-5xl mb-6">TARA AI</h3>
            <p className="clear-body mb-8">Your travel co-pilot. She knows the spots you'll actually like.</p>
            <span className="marker-note text-2xl">"She's smart. You're... on vacation."</span>
        </div>
      </section>

      <footer className="p-20 border-t-8 border-white text-center">
        <h2 className="header-massive text-[10vw]">SEE YOU AT THE GATE.</h2>
        <p className="marker-note text-3xl mt-12 opacity-50 italic">"Built with spite and a cancelled Goa trip."</p>
      </footer>
    </div>
  );
}

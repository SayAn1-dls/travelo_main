import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AirplaneTilt, Train, Buildings, UsersThree, ChatCircleDots, MapTrifold, ArrowRight, Receipt, GlobeHemisphereWest, Sparkle } from "@phosphor-icons/react";

const HERO = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80";

const features = [
  { icon: GlobeHemisphereWest, title: "Explore Everywhere", desc: "Flights, trains & hotels in one snap. No boring tabs, just travel vibes.", span: "md:col-span-5", color: "bg-blue-50 text-blue-500" },
  { icon: UsersThree, title: "Squad Goals Only", desc: "Settle bills without the drama. One-tap UPI for your group funds.", span: "md:col-span-7", color: "bg-orange-50 text-[#FF5A36]" },
  { icon: MapTrifold, title: "Secret Spots", desc: "Ditch the tourists. Discover hidden gems and local rides instantly.", span: "md:col-span-7", color: "bg-teal-50 text-teal-500" },
  { icon: ChatCircleDots, title: "Tara: Your AI BFF", desc: "A smart travel buddy that knows exactly where the party is.", span: "md:col-span-5", color: "bg-purple-50 text-purple-500" },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  useEffect(() => {
    api.get("/destinations").then((r) => setDestinations(r.data)).catch(() => {});
  }, []);

  const cta = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="bg-[#F9F8F6] min-h-screen selection:bg-[#FF5A36] selection:text-white">
      {/* Dynamic Navbar */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-2xl border border-white/40 px-6 py-3 rounded-[2rem] shadow-xl shadow-black/5">
          <Link to="/" className="flex items-center gap-2 group no-underline">
            <div className="w-10 h-10 bg-[#FF5A36] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:rotate-12 transition-transform">
              <AirplaneTilt size={24} weight="fill" className="text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-[#0A2540]">travelo<span className="text-[#FF5A36]">.</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Button onClick={cta} className="rounded-full bg-[#0A2540] text-white hover:bg-black px-8 font-bold transition-all hover:scale-105 active:scale-95 shadow-lg">
              {user ? "Go to Dashboard" : "Get Started"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Explosive Hero */}
      <section ref={heroRef} className="relative h-[95vh] min-h-[600px] flex items-center justify-center text-center px-6 overflow-hidden">
        <motion.img src={HERO} alt="Adventure awaits" style={{ y }} className="absolute inset-0 w-full h-[120%] object-cover brightness-90 grayscale-[0.1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A2540]/60 via-transparent to-[#F9F8F6]" />
        
        <div className="relative z-10 max-w-4xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-6 py-2 rounded-full text-white text-xs font-black uppercase tracking-[0.2em] mb-8">
            <Sparkle weight="fill" className="text-yellow-400" /> V2.0 is Here!
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-7xl md:text-9xl font-black text-white leading-[0.85] tracking-tight mb-8">
            STOP DREAMING,<br />
            <span className="text-[#FF5A36] drop-shadow-2xl">START PACKING.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/90 text-xl md:text-2xl font-semibold max-w-2xl mx-auto mb-12 leading-relaxed">
            The world's most exciting travel engine for elite squads. 
            Logistics, budgets, and vibes — all in one snap.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button onClick={cta} className="bg-[#FF5A36] hover:bg-[#FF451A] text-white text-xl font-black px-12 py-6 rounded-[2.5rem] shadow-2xl shadow-orange-500/40 transition-all hover:scale-110 active:scale-95 group">
              PLAN YOUR NEXT TRIP <ArrowRight className="inline-block ml-2 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid - Non-Dull version */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black text-[#0A2540] mb-6">Why Travelo?</h2>
          <p className="text-slate-500 text-xl font-bold uppercase tracking-widest">Built for the next generation of explorers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -10 }}
              className={`${f.span} group relative bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-black/[0.03] border border-slate-100 overflow-hidden`}
            >
              <div className={`${f.color} w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <f.icon size={40} weight="duotone" />
              </div>
              <h3 className="text-3xl font-black text-[#0A2540] mb-4">{f.title}</h3>
              <p className="text-slate-500 text-lg font-semibold leading-relaxed">{f.desc}</p>
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={24} className="text-slate-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A2540] text-white py-20 px-6 rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <span className="font-black text-4xl tracking-tighter">travelo<span className="text-[#FF5A36]">.</span></span>
            <p className="mt-4 text-white/50 font-bold tracking-widest uppercase text-xs">A Sayan DLS Project • Emergent AI 2026</p>
          </div>
          <div className="flex gap-12 text-sm font-black uppercase tracking-widest">
            <a href="#" className="hover:text-[#FF5A36] no-underline transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#FF5A36] no-underline transition-colors">Terms</a>
            <a href="#" className="hover:text-[#FF5A36] no-underline transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

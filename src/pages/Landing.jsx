import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { AirplaneTilt, MapPin, Users, Lightning, Star, ArrowRight, Globe, Shield, Rocket } from "@phosphor-icons/react";

const STATS = [
  { label: "Missions Launched", value: "1M+", icon: Rocket },
  { label: "Destinations", value: "190+", icon: Globe },
  { label: "Active Squads", value: "50K+", icon: Users },
  { label: "Zero Network Errors", value: "100%", icon: Shield },
];

const TESTIMONIALS = [
  { name: "ARJUN K.", city: "BANGALORE", text: "Bro this UI is INSANE. Nothing like this exists.", rating: 5 },
  { name: "PRIYA S.", city: "MUMBAI", text: "Booked Bali in 3 minutes. The boarding pass feature is chef's kiss.", rating: 5 },
  { name: "RAHUL D.", city: "DELHI", text: "Travelo is genuinely the goated travel app. Period.", rating: 5 },
];

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const num = parseInt(target.replace(/[^0-9]/g, ""));
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.ceil(num / 60);
        const timer = setInterval(() => {
          start += step;
          if (start >= num) { setCount(num); clearInterval(timer); }
          else setCount(start);
        }, 25);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count >= parseInt(target.replace(/[^0-9]/g, "")) ? target : count}</span>;
}

export default function Landing() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const yHero = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1000] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,77,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,77,0,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,77,0,0.06),transparent)]" />
        
        <nav className="fixed top-0 inset-x-0 z-[100] p-6 md:p-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(255,77,0,0.4)]">
              <AirplaneTilt size={28} weight="fill" className="text-white" />
            </div>
            <span className="text-4xl font-[900] font-bebas uppercase text-white tracking-tighter">TRAVELO<span className="text-orange-500">.</span></span>
          </div>
          <Link to="/auth" className="pointer-events-auto">
            <button className="bg-white/5 border border-white/10 backdrop-blur-3xl px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white hover:bg-orange-500 hover:border-orange-500 transition-all">ENTER HQ</button>
          </Link>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-3 bg-white/[0.03] border border-white/10 px-6 py-3 rounded-full mb-12 backdrop-blur-xl">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
            <span className="font-black text-[10px] tracking-[0.4em] uppercase text-white/60">v4.0 ELITE — INSTITUTIONAL GRADE</span>
          </motion.div>

          <motion.h1 style={{ y: yHero }} className="header-massive text-white mb-12 select-none">
            PLAN. PACK.<br/>
            <span className="text-orange-500 italic drop-shadow-[0_0_80px_rgba(255,77,0,0.3)]">EXPLORE.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-2xl md:text-3xl text-white/30 max-w-2xl mx-auto mb-16 font-bold uppercase tracking-tight italic">
            \"THE WORLD IS YOUR LEDGER. TRAVELO IS YOUR PEN.\"<br/>
            <span className="text-white/10 text-xl">— BUILT FOR THOSE WHO ACTUALLY GO.</span>
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/auth">
              <button className="btn-launch text-3xl px-16 py-10 rounded-[2.5rem] group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-4">START EXPEDITION <ArrowRight size={48} weight="bold" className="group-hover:translate-x-3 transition-transform" /></span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-32 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12">
          {STATS.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-orange-500">
                <s.icon size={32} weight="duotone" />
              </div>
              <h3 className="text-6xl font-[900] font-bebas text-white italic mb-2"><AnimatedCounter target={s.value} /></h3>
              <p className="text-white/20 font-black text-xs uppercase tracking-[0.3em]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-44 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/20 font-black text-xs tracking-[0.5em] uppercase mb-20">VOICES FROM THE SECTOR</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="silicon-glass border-white/5 p-12 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity"><AirplaneTilt size={120} weight="fill" /></div>
                <div className="flex gap-1 mb-8 text-orange-500">{[...Array(t.rating)].map((_, i) => <Star key={i} weight="fill" size={20} />)}</div>
                <p className="text-3xl font-marker text-white/80 mb-10 leading-relaxed italic">\"{t.text}\"</p>
                <div><h5 className="text-2xl font-[900] font-bebas text-white uppercase italic tracking-wider">{t.name}</h5><p className="text-white/20 font-black text-[10px] uppercase tracking-widest">{t.city} • OPERATIVE</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.8em]">© 2026 TRAVELO COMMAND • ALL RIGHTS RESERVED</p>
      </footer>
    </div>
  );
}
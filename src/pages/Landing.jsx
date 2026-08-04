import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { AirplaneTilt, Globe, Shield, Rocket, ArrowRight, Star } from "@phosphor-icons/react";

function AnimatedCounter({ target }) {
  const [count, setCount] = useState(0); const ref = useRef(null);
  useEffect(() => {
    const num = parseInt(target.replace(/[^0-9]/g, ""));
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0; const timer = setInterval(() => { start += Math.ceil(num / 50);
          if (start >= num) { setCount(num); clearInterval(timer); } else setCount(start); }, 20);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current); return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count >= parseInt(target.replace(/[^0-9]/g, "")) ? target : count.toLocaleString()}</span>;
}

export default function Landing() {
  const containerRef = useRef(null); const { scrollYProgress } = useScroll({ target: containerRef });
  const yHero = useTransform(scrollYProgress, [0, 1], [0, -300]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] overflow-x-hidden text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-[1000] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,77,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,77,0,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,77,0,0.08),transparent_70%)]" />
        <nav className="fixed top-0 inset-x-0 z-[100] p-6 md:p-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto"><div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(255,77,0,0.4)]"><AirplaneTilt size={32} weight="fill" /></div><span className="text-5xl font-[900] font-bebas uppercase tracking-tighter">TRAVELO<span className="text-orange-500">.</span></span></div>
          <Link to="/auth" className="pointer-events-auto"><button className="bg-white/5 border border-white/10 backdrop-blur-3xl px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 hover:border-orange-500 transition-all duration-500">ENTER HQ</button></Link>
        </nav>
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 bg-white/[0.03] border border-white/10 px-8 py-4 rounded-full mb-16 backdrop-blur-2xl"><div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" /><span className="font-black text-[10px] tracking-[0.4em] uppercase text-white/60">v4.2 BESTEST MASTERPIECE — INSTITUTIONAL</span></motion.div>
          <motion.h1 style={{ y: yHero }} className="text-[15vw] font-[900] leading-[0.75] mb-12 tracking-tighter font-bebas uppercase drop-shadow-[0_0_100px_rgba(255,77,0,0.2)]">PLAN. PACK.<br/><span className="text-orange-500 italic">EXPLORE.</span></motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl md:text-4xl text-white/40 max-w-4xl mx-auto mb-20 font-bold uppercase tracking-tight italic">\"THE WORLD IS YOUR LEDGER. TRAVELO IS YOUR PEN.\"</motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}><Link to="/auth"><button className="btn-launch text-4xl px-20 py-12 rounded-[3rem] group overflow-hidden"><span className="relative z-10 flex items-center gap-6">START EXPEDITION <ArrowRight size={56} weight="bold" className="group-hover:translate-x-4 transition-transform duration-500" /></span></button></Link></motion.div>
        </div>
      </section>
      <footer className="py-20 text-center opacity-20"><p className="text-[10px] font-black uppercase tracking-[1em]">© 2026 TRAVELO COMMAND SYSTEM</p></footer>
    </div>
  );
}
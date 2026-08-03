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
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,77,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,77,0,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,77,0,0.06),transparent)]" />
        <motion.div style={{ y: yHero }} className="relative z-10 max-w-7xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-5 py-2 mb-12">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-500">v4.0 - THE FINAL MASTERPIECE - MARKET READY</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="header-massive text-white w-full">
            PLAN. <span className="text-gradient">PACK.</span><br />EXPLORE.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="font-marker text-orange-400/80 text-2xl md:text-3xl italic mt-6 mb-16">
            "your whole squad. one mission."
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth"><button className="btn-launch w-full sm:w-auto text-3xl px-14 py-7 gap-4">LAUNCH MISSION <AirplaneTilt size={28} weight="fill" /></button></Link>
            <Link to="/explore"><button className="flex items-center gap-3 text-white/40 hover:text-white transition-colors font-black uppercase tracking-widest text-sm px-8 py-6">EXPLORE DESTINATIONS <ArrowRight size={20} weight="bold" /></button></Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24 max-w-4xl mx-auto">
            {STATS.map(({ label, value, icon: Icon }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 + i * 0.1 }} className="silicon-glass-sm flex flex-col items-center py-6">
                <Icon size={24} weight="fill" className="text-orange-500 mb-3" />
                <span className="font-bebas text-4xl md:text-5xl text-white"><AnimatedCounter target={value} /></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mt-1 text-center">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
      <section className="px-6 py-32 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
          <h2 className="font-bebas text-[clamp(3rem,10vw,8rem)] text-white uppercase leading-none">BUILT FOR THE <span className="text-gradient">BOLD.</span></h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: MapPin, title: "MISSION PLANNING", desc: "Build your itinerary offline. All saved locally.", color: "orange" },
            { icon: Users, title: "SQUAD COORDINATION", desc: "SquadMail keeps your whole crew in sync. One mission HQ.", color: "yellow" },
            { icon: Lightning, title: "INSTANT BOARDING", desc: "Digital boarding passes in seconds. Zero network required.", color: "orange" },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="silicon-glass group hover:border-orange-500/20 transition-all">
              <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-8">
                <Icon size={28} weight="fill" className="text-orange-500" />
              </div>
              <h3 className="font-bebas text-3xl text-white mb-4">{title}</h3>
              <p className="text-white/40 font-medium leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="px-6 py-40 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="silicon-glass">
            <h2 className="font-bebas text-[clamp(3rem,12vw,9rem)] text-white uppercase leading-none mb-6">YOUR MISSION<br /><span className="text-gradient">AWAITS.</span></h2>
            <p className="font-marker text-orange-400/70 text-2xl italic mb-16">"1,000,000+ operatives can't be wrong."</p>
            <Link to="/auth"><button className="btn-launch text-3xl px-16 py-8 mx-auto">JOIN THE MISSION <AirplaneTilt size={28} weight="fill" /></button></Link>
          </motion.div>
        </div>
      </section>
      <footer className="border-t border-white/5 px-6 py-10 text-center">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
          <span className="font-bebas text-2xl text-white/20">TRAVELO.</span>
          <span className="text-white/10 font-bold uppercase tracking-widest text-xs">v4.0 THE FINAL MASTERPIECE</span>
          <span className="font-marker text-orange-500/20 text-sm italic">built for the bold.</span>
        </div>
      </footer>
    </div>
  );
}

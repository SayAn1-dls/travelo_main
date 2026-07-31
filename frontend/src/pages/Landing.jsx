import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  AirplaneTilt, Train, Buildings, UsersThree,
  ChatCircleDots, MapTrifold, ArrowRight,
  Receipt, GlobeHemisphereWest, Sparkle, Lightning
} from "@phosphor-icons/react";

const HERO = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=90";
const HERO2 = "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=80";

const stickers = [
  { emoji: "\u2708\uFE0F", top: "12%", left: "8%",   size: "w-16 h-16", bg: "bg-orange-500", delay: "0s",   anim: "animate-float" },
  { emoji: "\uD83C\uDFDD\uFE0F", top: "20%", right: "6%",  size: "w-20 h-20", bg: "bg-cyan-500",   delay: "0.8s", anim: "animate-float-slow" },
  { emoji: "\uD83C\uDFD4\uFE0F", top: "65%", left: "5%",   size: "w-14 h-14", bg: "bg-purple-600", delay: "0.4s", anim: "animate-float-delay" },
  { emoji: "\uD83C\uDF0D", top: "70%", right: "7%",  size: "w-16 h-16", bg: "bg-emerald-500", delay: "1.2s", anim: "animate-float-delay2" },
  { emoji: "\uD83C\uDF92", top: "40%", left: "3%",   size: "w-12 h-12", bg: "bg-yellow-500", delay: "0.2s", anim: "animate-float-delay3" },
  { emoji: "\uD83D\uDDFA\uFE0F", top: "35%", right: "3%",  size: "w-12 h-12", bg: "bg-rose-500",   delay: "1.5s", anim: "animate-float" },
];

const features = [
  { icon: GlobeHemisphereWest, title: "Book Everything",    desc: "Flights, trains & hotels in one snap. No boring tabs — just pure travel vibes.", span: "md:col-span-5", accent: "#FF4500", bg: "from-orange-500/20 to-red-500/5",    label: "BOOKING" },
  { icon: UsersThree,          title: "Squad Budget",        desc: "Settle group bills without the drama. One-tap UPI for the whole crew.",          span: "md:col-span-7", accent: "#00F5D4", bg: "from-cyan-500/20 to-teal-500/5",    label: "FINANCE" },
  { icon: MapTrifold,          title: "Hidden Gems",         desc: "Ditch the tourists. AI-powered local spots, rides & secret sunset spots.",       span: "md:col-span-7", accent: "#8338EC", bg: "from-purple-500/20 to-indigo-500/5", label: "EXPLORE" },
  { icon: ChatCircleDots,      title: "Tara: Your AI BFF",   desc: "A smart travel buddy who knows exactly where the party is tonight.",             span: "md:col-span-5", accent: "#FFE600", bg: "from-yellow-500/20 to-amber-500/5",  label: "AI" },
];

const stats = [
  { num: "50K+", label: "Trips Planned" },
  { num: "120+", label: "Destinations" },
  { num: "4.9\u2605", label: "App Rating" },
  { num: "24/7", label: "AI Support" },
];

const marqueeDestinations = [
  { name: "Bali", flag: "\uD83C\uDDEE\uD83C\uDDE9" }, { name: "Paris", flag: "\uD83C\uDDEB\uD83C\uDDF7" }, { name: "Tokyo", flag: "\uD83C\uDDEF\uD83C\uDDF5" },
  { name: "New York", flag: "\uD83C\uDDFA\uD83C\uDDF8" }, { name: "Santorini", flag: "\uD83C\uDDEC\uD83C\uDDF7" }, { name: "Maldives", flag: "\uD83C\uDDF2\uD83C\uDDFB" },
  { name: "Dubai", flag: "\uD83C\uDDE6\uD83C\uDDEA" }, { name: "Goa", flag: "\uD83C\uDDEE\uD83C\uDDF3" }, { name: "Iceland", flag: "\uD83C\uDDEE\uD83C\uDDF8" },
  { name: "Thailand", flag: "\uD83C\uDDF9\uD83C\uDDED" }, { name: "Morocco", flag: "\uD83C\uDDF2\uD83C\uDDE6" }, { name: "Amalfi", flag: "\uD83C\uDDEE\uD83C\uDDF9" },
];

const doubled = [...marqueeDestinations, ...marqueeDestinations];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    api.get("/destinations").then((r) => setDestinations(r.data)).catch(() => {});
  }, []);

  const cta = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="bg-[#0A0A0A] min-h-screen overflow-x-hidden">
      <nav className="fixed top-0 inset-x-0 z-[100] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass px-6 py-3 rounded-2xl">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center shadow-flame-sm group-hover:scale-110 transition-transform">
              <AirplaneTilt size={20} weight="fill" className="text-white" />
            </div>
            <span className="font-bebas text-2xl tracking-widest text-white">TRAVELO<span className="text-[#FF4500]">.</span></span>
          </Link>
          <button onClick={cta} className="btn-flame text-sm py-2.5 px-7">
            {user ? "Dashboard \u2192" : "Get Started \u2192"}
          </button>
        </div>
      </nav>

      <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-center justify-center text-center overflow-hidden">
        <motion.img src={HERO} alt="Adventure awaits" style={{ y }} className="absolute inset-0 w-full h-[120%] object-cover brightness-50 saturate-125" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 via-transparent to-[#0A0A0A]" />
        {stickers.map((s, i) => (
          <div key={i} className={`sticker ${s.size} ${s.bg} ${s.anim}`} style={{ top: s.top, left: s.left, right: s.right, animationDelay: s.delay }}>{s.emoji}</div>
        ))}
        <motion.div style={{ opacity }} className="relative z-10 max-w-5xl px-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 glass-light px-5 py-2 rounded-full text-[#FFE600] text-xs font-bold uppercase tracking-[0.25em] mb-8">
            <Lightning weight="fill" size={14} /> The Adventure Engine is Live
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-bebas text-[5rem] sm:text-[8rem] md:text-[10rem] leading-[0.85] tracking-wider mb-6">
            <span className="text-white block">EXPLORE</span>
            <span className="text-gradient-flame block">THE WORLD</span>
            <span className="text-white block text-[3.5rem] sm:text-[5rem] md:text-[6rem]">LIKE NEVER BEFORE</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white/80 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            The world's most exciting travel engine for elite squads. Flights, budgets, AI, and pure adventure — all in one place.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={cta} className="btn-flame text-lg py-4 px-12 rounded-full group">
              START YOUR JOURNEY <ArrowRight className="inline-block ml-2 group-hover:translate-x-2 transition-transform" size={20} />
            </button>
            <button onClick={cta} className="glass-light text-white font-bold text-lg py-4 px-10 rounded-full hover:bg-white/10 transition-all">
              Watch Demo
            </button>
          </motion.div>
        </motion.div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2">
          <span>Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </section>

      <div className="py-6 border-y border-white/5 overflow-hidden bg-[#0F0F0F]">
        <div className="marquee-track">
          {doubled.map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-8 shrink-0">
              <span className="text-2xl">{d.flag}</span>
              <span className="font-bebas text-2xl text-white/60 tracking-widest">{d.name}</span>
              <span className="text-[#FF4500] text-xl mx-2">❖</span>
            </div>
          ))}
        </div>
      </div>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="stat-num">{s.num}</div>
              <div className="text-white/50 font-semibold text-sm uppercase tracking-widest mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <p className="text-[#FF4500] font-bold uppercase tracking-[0.3em] text-sm mb-4">Built Different</p>
          <h2 className="font-bebas text-[4rem] sm:text-[6rem] text-white tracking-wider leading-none">WHY TRAVELO<span className="text-gradient-flame">?</span></h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -8, scale: 1.01 }} className={`${f.span} travel-card p-8 group relative overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${f.bg} opacity-60`} />
              <div className="relative z-10">
                <span className="inline-block text-[10px] font-black px-3 py-1 rounded-full mb-6 uppercase tracking-[0.2em]" style={{ background: `${f.accent}22`, color: f.accent, border: `1px solid ${f.accent}44` }}>{f.label}</span>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ background: `${f.accent}18`, boxShadow: `0 0 20px ${f.accent}22` }}>
                  <f.icon size={32} weight="duotone" style={{ color: f.accent }} />
                </div>
                <h3 className="font-bebas text-[2rem] text-white tracking-wider mb-3">{f.title}</h3>
                <p className="text-white/60 text-base leading-relaxed">{f.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-bold" style={{ color: f.accent }}>Learn more <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" /></div>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: f.accent }} />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative h-[70vh] overflow-hidden">
        <img src={HERO2} alt="Travel" className="w-full h-full object-cover brightness-40 saturate-150" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-12 md:px-24">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-xl">
            <p className="text-[#FF4500] font-bold uppercase tracking-[0.3em] text-sm mb-4">Travel Together</p>
            <h2 className="font-bebas text-[3.5rem] sm:text-[5.5rem] text-white leading-none tracking-wider mb-6">PLAN WITH YOUR<br /><span className="text-gradient-flame">WHOLE SQUAD</span></h2>
            <p className="text-white/70 text-lg font-medium mb-8 leading-relaxed">Create group trips, split budgets automatically, and settle with one-tap UPI. Zero awkward conversations about money.</p>
            <button onClick={cta} className="btn-flame">Plan a Group Trip \u2192</button>
          </motion.div>
        </div>
      </section>

      {destinations.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#FF4500] font-bold uppercase tracking-[0.3em] text-sm mb-3">Popular Now</p>
              <h2 className="font-bebas text-[3rem] sm:text-[4.5rem] text-white tracking-wider leading-none">HOT DESTINATIONS</h2>
            </div>
            <button onClick={cta} className="text-white/50 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors">View All \u2192</button>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {destinations.slice(0, 8).map((d, i) => (
              <motion.div key={d.slug} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.03 }} className="relative rounded-[1.5rem] overflow-hidden h-48 cursor-pointer group" onClick={cta}>
                <img src={d.image} alt={d.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 saturate-125" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-bebas text-xl text-white tracking-wider">{d.name}</p>
                  <p className="text-white/60 text-xs font-medium mt-0.5">{d.country || "Explore \u2192"}</p>
                </div>
                <div className="absolute inset-0 border-2 border-[#FF4500] rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="px-6 py-8 mb-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-7xl mx-auto relative overflow-hidden rounded-[2rem] p-16 text-center" style={{ background: "linear-gradient(135deg, #FF4500 0%, #FF8C00 40%, #FFE600 100%)" }}>
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/10" />
          <div className="relative z-10">
            <h2 className="font-bebas text-[3rem] sm:text-[5rem] text-white tracking-wider leading-none mb-4">YOUR NEXT ADVENTURE<br />IS ONE TAP AWAY</h2>
            <p className="text-white/80 text-lg font-semibold mb-10 max-w-xl mx-auto">Join 50,000+ travellers who've ditched boring booking sites.</p>
            <button onClick={cta} className="bg-[#0A0A0A] text-white font-black text-lg py-5 px-14 rounded-full hover:bg-[#1A1A1A] transition-all hover:scale-105 active:scale-95 shadow-2xl">
              {user ? "Go to Dashboard \u2192" : "JOIN FOR FREE \u2192"}
            </button>
          </div>
        </motion.div>
      </section>

      <footer className="bg-[#0F0F0F] border-t border-white/5 py-16 px-6 mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center">
                  <AirplaneTilt size={22} weight="fill" className="text-white" />
                </div>
                <span className="font-bebas text-3xl text-white tracking-widest">TRAVELO<span className="text-[#FF4500]">.</span></span>
              </div>
              <p className="text-white/30 text-sm font-medium">A Sayan DLS Project \u00b7 Emergent AI 2026</p>
            </div>
            <div className="flex gap-8 text-sm font-bold uppercase tracking-[0.15em] text-white/40">
              <a href="#" className="hover:text-[#FF4500] transition-colors no-underline">Privacy</a>
              <a href="#" className="hover:text-[#FF4500] transition-colors no-underline">Terms</a>
              <a href="#" className="hover:text-[#FF4500] transition-colors no-underline">Instagram</a>
              <a href="#" className="hover:text-[#FF4500] transition-colors no-underline">Contact</a>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center">
            <p className="text-white/20 text-xs font-medium">\u00a9 2026 Travelo. Built with passion for explorers everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

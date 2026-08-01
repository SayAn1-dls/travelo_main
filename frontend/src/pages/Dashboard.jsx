import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { AirplaneTilt, Wallet, MapPin, Sparkle, ChatCircleDots, ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Explorer';

  const greetings = [
    `WELCOME BACK, ${firstName.toUpperCase()}!`,
    `OH LOOK WHO'S BACK!`,
    `${firstName.toUpperCase()}, THE LEGEND!`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    <div className="min-h-screen pt-40 px-10 pb-20 bg-sexy-black">
      <div className="max-w-7xl mx-auto">

        <header className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <Sparkle weight="fill" className="text-sexy-orange animate-pulse" size={28} />
            <p className="font-black text-[10px] tracking-[0.4em] uppercase text-white/40">COMMAND CENTER ACTIVE</p>
          </div>
          <h1 className="goated-heading text-[8vw] leading-none">
            <span className="text-sexy-orange">{greeting}</span>
          </h1>
          <p className="crazy-text text-3xl mt-6 opacity-80">
            Your next trip is not going to plan itself. Let's fix that.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* BIG CARD — START EXPEDITION */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <div className="sexy-card bg-gradient-to-br from-sexy-dark to-sexy-orange/10 border-sexy-orange/20 relative overflow-hidden min-h-[420px] flex flex-col justify-between">
              <div className="relative z-10">
                <p className="font-black text-[10px] tracking-[0.4em] uppercase text-sexy-orange/60 mb-6">NEW MISSION</p>
                <h2 className="goated-heading text-7xl mb-6">START AN EXPEDITION</h2>
                <p className="crystal-clear text-xl max-w-md mb-12">
                  Logistics sorted. Money math handled. High-energy itinerary ready. You just show up and look cool.
                </p>
                <Link to="/trips">
                  <button className="btn-sexy text-lg px-14 py-6">BUILD THE VIBE</button>
                </Link>
              </div>
              <AirplaneTilt size={300} weight="thin" className="absolute -bottom-20 -right-20 text-white/5 rotate-[15deg]" />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 flex flex-col gap-10">

            {/* MONEY STATUS */}
            <div className="sexy-card border-sexy-cyan/20 flex flex-col">
              <p className="font-black text-[10px] tracking-[0.4em] uppercase text-sexy-cyan/60 mb-2">POOL STATUS</p>
              <h3 className="goated-heading text-4xl text-sexy-cyan mb-1">MONEY STATUS</h3>
              <p className="crazy-text text-lg mb-6">"Keep the pool healthy, keep the squad happy."</p>
              <div className="text-6xl font-black mb-8">₹12,450</div>
              <Link to="/bookings-history" className="mt-auto">
                <button className="w-full py-5 rounded-2xl bg-white/5 border-2 border-white/10 font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">VIEW CAPITAL LEDGER</button>
              </Link>
            </div>

            {/* AI CARD */}
            <div className="sexy-card border-sexy-pink/20 flex flex-col">
              <p className="font-black text-[10px] tracking-[0.4em] uppercase text-sexy-pink/60 mb-2">AI INTELLIGENCE</p>
              <h3 className="goated-heading text-4xl mb-4" style={{color: '#FF007A'}}>TALK TO TARA</h3>
              <p className="crystal-clear mb-8 opacity-60 italic text-sm">
                "Currently analyzing Goa's sunset timings vs. your budget. The math isn't looking great."
              </p>
              <button className="w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105" style={{background: 'linear-gradient(90deg, #FF007A, #FF4D00)', boxShadow: '0 10px 30px rgba(255,0,122,0.3)'}}>
                OPEN TARA AI
              </button>
            </div>

          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-20">
          <p className="font-black text-[10px] tracking-[0.4em] uppercase opacity-30 mb-8">QUICK ACTIONS</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'EXPLORE', sub: 'Find destinations', path: '/explore', color: 'text-sexy-yellow' },
              { label: 'BOOK', sub: 'Flights & Hotels', path: '/bookings', color: 'text-sexy-orange' },
              { label: 'EXPENSES', sub: 'Track the damage', path: '/bookings-history', color: 'text-sexy-cyan' },
              { label: 'TRIPS', sub: 'My missions', path: '/trips', color: 'text-sexy-pink' },
            ].map((item) => (
              <Link key={item.path} to={item.path}>
                <div className="sexy-card p-6 flex flex-col gap-2 cursor-pointer">
                  <h4 className={`goated-heading text-3xl ${item.color}`}>{item.label}</h4>
                  <p className="font-semibold text-white/40 text-sm uppercase tracking-widest">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

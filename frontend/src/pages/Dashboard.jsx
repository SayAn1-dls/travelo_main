import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Plus, AirplaneTilt, ArrowRight, Wallet, MapTrifold, Clock, Sparkle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pt-32 px-6 pb-20 bg-[#F9F8F6]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Sparkle weight="fill" className="text-[#FF5A36] animate-pulse" size={24} />
            </div>
            <p className="text-[#FF5A36] font-black uppercase tracking-[0.2em] text-xs">Operational Portal active</p>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-7xl font-black text-[#0A2540] tracking-tight">
            Hey, <span className="text-[#FF5A36]">{user?.name?.split(' ')[0]}!</span>
          </motion.h1>
          <p className="text-slate-400 text-xl font-semibold mt-4">Where's the squad heading next?</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main Action Card */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="md:col-span-8 bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-black/[0.03] border border-slate-100 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5A36] blur-[120px] opacity-10 group-hover:opacity-20 transition-opacity" />
            <h2 className="text-4xl font-black text-[#0A2540] mb-6">Start a new expedition</h2>
            <p className="text-slate-500 text-lg font-semibold max-w-md mb-10 leading-relaxed">
              Logistics, split-bills, and itinerary — all handled by AI while you focus on the vibes.
            </p>
            <Link to="/trips" className="no-underline">
              <button className="bg-[#FF5A36] hover:bg-[#FF451A] text-white px-10 py-5 rounded-3xl font-black text-lg shadow-xl shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-3">
                <Plus size={24} weight="bold" /> NEW TRAVEL PLAN
              </button>
            </Link>
          </motion.div>

          {/* Side Stats */}
          <div className="md:col-span-4 flex flex-col gap-8">
            <div className="bg-[#0A2540] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-white/50 font-black uppercase tracking-widest text-[10px] mb-2">Group Balance</p>
                <h3 className="text-4xl font-black mb-6">₹12,450.00</h3>
                <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest border border-white/10 transition-colors">
                  View Ledger
                </button>
              </div>
              <Wallet size={120} weight="duotone" className="absolute -bottom-10 -right-10 text-white/5" />
            </div>

            <div className="bg-emerald-500 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-white/30 font-black uppercase tracking-widest text-[10px] mb-2">Next Destination</p>
                <h3 className="text-4xl font-black mb-6">Goa, IN</h3>
                <div className="flex items-center gap-2 text-white/70 font-bold text-sm">
                  <Clock size={18} weight="bold" /> 14 Days to launch
                </div>
              </div>
              <AirplaneTilt size={120} weight="duotone" className="absolute -bottom-10 -right-10 text-black/5" />
            </div>
          </div>
        </div>

        {/* Explore Preview */}
        <section className="mt-24">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl font-black text-[#0A2540]">Trending Gems</h2>
            <Link to="/explore" className="text-[#FF5A36] font-black no-underline hover:underline flex items-center gap-2 uppercase tracking-widest text-xs">
              Explore All <ArrowRight weight="bold" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Bali', 'Tokyo', 'London'].map((city) => (
              <motion.div key={city} whileHover={{ y: -10 }} className="aspect-[4/5] bg-white rounded-[3rem] shadow-xl border border-slate-100 p-4 group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img 
                  src={`https://images.unsplash.com/photo-1506929199175-60903ee8b5a8?auto=format&fit=crop&w=800&q=80`} 
                  alt={city} 
                  className="w-full h-full object-cover rounded-[2.5rem] group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute bottom-8 left-8 z-20 text-white">
                  <h4 className="text-3xl font-black">{city}</h4>
                  <p className="text-white/70 font-bold">Starting from ₹35,000</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

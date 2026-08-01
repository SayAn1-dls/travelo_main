import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { AirplaneTilt, Wallet, MapPin, ChatsCircle, Lightning, Star } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = (user?.name?.split(' ')[0] || "TRAVELER").toUpperCase();

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-10 selection:bg-brutal-acid selection:text-black">
      <div className="max-w-7xl mx-auto">
        {/* COMMAND HEADER */}
        <header className="mb-24 flex flex-col md:flex-row items-end justify-between gap-12">
          <div>
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-brutal-acid border-4 border-black flex items-center justify-center rotate-[-15deg] shadow-xl">
                    <Star weight="fill" size={32} className="text-black" />
                </div>
                <span className="font-bebas text-3xl tracking-[0.3em] text-white/40 uppercase">HQ OVERVIEW &middot; v27</span>
            </div>
            <h1 className="header-massive text-[12vw]">YO, <span className="text-brutal-orange">{firstName}!</span></h1>
            <p className="font-marker text-5xl text-brutal-orange mt-4 rotate-[-1deg]">"Your bags are by the door. Your brain is in vacation mode."</p>
          </div>
          <div className="font-marker text-3xl text-white/30 text-right italic hidden lg:block">
            Last seen: mission active
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          {/* ACTION CARD */}
          <div className="md:col-span-8 brutal-card border-brutal-orange shadow-brutal relative overflow-hidden flex flex-col justify-center min-h-[450px]">
            <div className="absolute top-[-50px] right-[-50px] opacity-10 rotate-[20deg] pointer-events-none">
                <AirplaneTilt size={400} weight="thin" className="text-white" />
            </div>
            <div className="relative z-10">
                <h2 className="header-massive text-8xl mb-8">START AN<br/><span className="text-brutal-acid">EXPEDITION</span></h2>
                <p className="clear-body text-2xl max-w-md mb-12 font-black uppercase tracking-tight">Itineraries, money splits, AI concierge. The boring stuff is handled. You just need to show up.</p>
                <Link to="/trips">
                    <button className="btn-brutal px-14 py-8 text-4xl">BUILD THE VIBE</button>
                </Link>
            </div>
          </div>

          {/* STATS */}
          <div className="md:col-span-4 flex flex-col gap-12">
            <div className="brutal-card border-white shadow-brutal relative flex flex-col items-center text-center py-12">
                <div className="font-marker text-3xl text-brutal-orange mb-4">"THE DAMAGE"</div>
                <div className="header-massive text-9xl text-brutal-orange">&#x20b9;0</div>
                <p className="font-bebas text-2xl tracking-widest text-white/40 uppercase">TOTAL EXPENSES LOGGED</p>
            </div>
            <div className="brutal-card border-brutal-acid shadow-brutal-acid relative flex flex-col items-center text-center py-12">
                <div className="font-marker text-3xl text-black mb-4">"THE SQUAD"</div>
                <div className="header-massive text-9xl text-black bg-brutal-acid px-6">0</div>
                <p className="font-bebas text-2xl tracking-widest text-black/60 uppercase mt-4">ACTIVE MISSIONS</p>
            </div>
          </div>
        </div>

        {/* EXTRA DIALOGUE */}
        <div className="flex justify-center py-20">
            <div className="font-marker text-5xl text-brutal-orange text-center max-w-3xl rotate-[1deg]">
                "Goa is calling, but your bank account is hanging up. Use the ledger to fix that."
            </div>
        </div>
      </div>
    </div>
  );
}

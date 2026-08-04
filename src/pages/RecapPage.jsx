import { useState } from "react";
import { CurrencyInr, ChartPieSlice, ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export default function RecapPage() {
  const navigate = useNavigate();
  const trips = JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]');
  const total = trips.reduce((sum, t) => {
    const exp = JSON.parse(localStorage.getItem(`travelo_exp_${t.id}`) || '[]');
    return sum + exp.reduce((a, e) => a + e.amount, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-6 md:px-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-20 flex items-center justify-between">
           <div><h1 className="header-massive text-white leading-none">SQUAD <br/><span className="text-cyan-500 italic">LEDGER.</span></h1></div>
           <button onClick={() => navigate('/dashboard')} className="btn-launch px-12 py-6 text-xl">BACK TO HQ</button>
        </header>
        <div className="silicon-glass border-white/5 mb-12 flex items-center justify-between p-16">
           <div><p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">GLOBAL DAMAGE</p><div className="text-7xl font-[900] font-bebas text-orange-500 italic">₹{total.toLocaleString()}</div></div>
           <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center"><ChartPieSlice size={64} className="text-cyan-500" weight="duotone" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           {trips.map(t => (
             <div key={t.id} className="silicon-glass border-white/5 hover:border-white/10 transition-all cursor-pointer">
                <h3 className="text-3xl font-[900] font-bebas text-white uppercase mb-4">{t.name}</h3>
                <p className="text-white/30 font-black text-xs uppercase tracking-widest">SETTLED IN {t.destination}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash, CurrencyInr } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function TripMissionPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [trips] = useState(() => JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]'));
  const trip = trips.find(t => t.id === id);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem(`travelo_exp_${id}`) || '[]'));
  useEffect(() => { localStorage.setItem(`travelo_exp_${id}`, JSON.stringify(expenses)); }, [expenses, id]);

  const addExpense = (e) => { e.preventDefault(); const exp = { id: Date.now().toString(), desc: "MEAL", amount: 500, date: "04 AUG" }; setExpenses([exp, ...expenses]); toast.success("LOGGED."); };

  if (!trip) return <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center"><h2 className="header-massive text-white/20">NOT FOUND</h2></div>;

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-8 mb-16"><button onClick={() => navigate('/trips')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center"><ArrowLeft size={32} weight="bold" /></button><div><h1 className="text-6xl md:text-7xl font-[900] font-bebas text-white uppercase">{trip.name}</h1><p className="text-cyan-500 font-black italic uppercase tracking-widest text-2xl">{trip.destination}</p></div></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"><div className="silicon-glass border-orange-500/20"><p className="text-[10px] font-black text-white/20 uppercase mb-4">TOTAL DAMAGE</p><div className="text-6xl font-[900] font-bebas text-orange-500 italic leading-none">₹0</div></div></div>
        <div className="silicon-glass"><div className="py-40 text-center opacity-20"><CurrencyInr size={80} className="mx-auto mb-8" /><p className="text-4xl font-[900] font-bebas uppercase italic">LOGBOOK EMPTY</p></div></div>
        <button onClick={() => navigate('/dashboard')} className="w-full mt-10 bg-white/5 py-10 rounded-[3rem] font-[900] font-bebas text-3xl uppercase text-white/30">RETURN TO HQ</button>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash, ArrowRight, Users, MapPin } from "@phosphor-icons/react";
import { toast } from "sonner";

const CRISPY = ["BAGS BY THE DOOR. BRAIN SET TO VIBE.", "THE ITINERARY IS A SUGGESTION.", "YOUR GROUP CHAT IS LYING."];

export default function TripsPage() {
  const [trips, setTrips] = useState(() => { const saved = localStorage.getItem("travelo_trips_v3"); return saved ? JSON.parse(saved) : [{ id: '1', name: 'PROJECT GOA', destination: 'GOA, INDIA', members: ['SAYAN', 'HARSH'], budget: 45000, emoji: '🏝️' }]; });
  const [showForm, setShowForm] = useState(false); const [form, setForm] = useState({ name: '', destination: '', budget: '', members: '' });
  useEffect(() => { localStorage.setItem("travelo_trips_v3", JSON.stringify(trips)); }, [trips]);
  const addTrip = (e) => { e.preventDefault(); const trip = { id: Date.now().toString(), name: form.name.toUpperCase(), destination: form.destination.toUpperCase(), members: form.members.split(','), budget: parseFloat(form.budget) || 0, emoji: '✈️' }; setTrips([trip, ...trips]); setShowForm(false); toast.success("MISSION INITIATED."); };

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-20 flex flex-col md:flex-row items-end justify-between gap-12">
          <div><p className="text-[11px] font-black tracking-[0.5em] uppercase text-orange-500/60 mb-6 italic">Active Operations</p><h1 className="header-massive text-white">THE TRIP<br/><span className="text-orange-500 italic">BOARD.</span></h1></div>
          <button onClick={() => setShowForm(!showForm)} className="btn-launch px-14 py-8 rounded-[2.5rem]"><Plus weight="bold" size={36} /> NEW MISSION</button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {trips.map((t) => (<Link to={`/trips/${t.id}`} key={t.id} className="silicon-glass relative flex flex-col min-h-[380px] hover:border-orange-500/30 transition-all cursor-pointer"><div className="text-7xl mb-8">{t.emoji}</div><h3 className="text-4xl md:text-5xl font-[900] uppercase font-bebas">{t.name}</h3><p className="text-2xl font-black text-cyan-500 italic mb-4 uppercase">{t.destination}</p><div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between"><div className="flex items-center gap-2 text-white/30"><Users size={24} /><span className="font-black text-sm uppercase">{t.members.length} OPS</span></div><div className="flex items-center gap-3 font-black text-sm text-white/20">ENGAGE <ArrowRight size={24} weight="bold" /></div></div></Link>))}
        </div>
      </div>
    </div>
  );
}
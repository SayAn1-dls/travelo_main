import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AirplaneTilt, Plus, Trash, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function TripsPage() {
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem("travelo_trips_v29");
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'PROJECT ALPHA', destination: 'GOA, IN', members: ['SAYAN', 'HARSH'] },
      { id: '2', name: 'SQUAD ZERMATT', destination: 'VALAIS, CH', members: ['SAYAN', 'HARSH', 'OPERATIVE'] }
    ];
  });

  useEffect(() => {
    localStorage.setItem("travelo_trips_v29", JSON.stringify(trips));
  }, [trips]);

  const addTrip = () => {
    const name = prompt("MISSION CODE NAME:");
    const dest = prompt("DESTINATION SECTOR:");
    if (!name || !dest) return;
    setTrips([{ id: Date.now().toString(), name: name.toUpperCase(), destination: dest.toUpperCase(), members: ['SAYAN'] }, ...trips]);
    toast.success("EXPEDITION LOGGED");
  };

  const deleteTrip = (id) => {
    setTrips(trips.filter(t => t.id !== id));
    toast.error("MISSION DELETED");
  };

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-32 flex flex-col md:flex-row items-end justify-between gap-12">
          <div>
            <h1 className="text-[15vw] font-[900] leading-[0.75] uppercase font-bebas text-white">THE TRIP <br/><span className="text-orange-500 italic">BOARD.</span></h1>
            <p className="text-white/40 font-bold text-3xl mt-12 italic uppercase tracking-widest">"Active missions ready for takeoff."</p>
          </div>
          <button onClick={addTrip} className="btn-launch text-4xl px-20 py-10 rounded-[3rem]">
            <Plus weight="bold" size={40} /> NEW MISSION
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {trips.map((t) => (
            <div key={t.id} className="silicon-glass group relative p-16">
               <button onClick={() => deleteTrip(t.id)} className="absolute top-10 right-10 text-white/10 hover:text-red-500 transition-colors">
                  <Trash size={48} />
               </button>
               <h3 className="text-[7vw] font-[900] mb-4 uppercase font-bebas group-hover:text-orange-500 transition-colors leading-none">{t.name}</h3>
               <p className="text-4xl font-black text-cyan-500 italic mb-16 tracking-widest uppercase">{t.destination}</p>
               <div className="flex items-center justify-between pt-12 border-t border-white/5">
                  <div className="flex -space-x-4">
                     {t.members.map((m, i) => (
                       <div key={i} className="w-16 h-16 bg-white/5 border-4 border-white/10 rounded-2xl flex items-center justify-center font-black text-2xl text-white/20 uppercase font-bebas">{m[0]}</div>
                     ))}
                  </div>
                  <Link to={`/trips/${t.id}`} className="no-underline text-white/40 hover:text-white font-black uppercase text-lg tracking-[0.3em] flex items-center gap-4 italic transition-all font-bebas">
                     ENGAGE <ArrowRight size={32} weight="bold" />
                  </Link>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

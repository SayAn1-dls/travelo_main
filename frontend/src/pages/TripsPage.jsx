import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AirplaneTilt, Plus, Trash, ArrowRight, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function TripsPage() {
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem("travelo_trips");
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'PROJECT ALPHA', destination: 'GOA, IN', members: ['SAYAN', 'HARSH'] },
      { id: '2', name: 'SQUAD ZERMATT', destination: 'VALAIS, CH', members: ['SAYAN', 'HARSH', 'OPERATIVE'] }
    ];
  });

  useEffect(() => {
    localStorage.setItem("travelo_trips", JSON.stringify(trips));
  }, [trips]);

  const addTrip = () => {
    const name = prompt("MISSION CODE NAME:");
    const dest = prompt("DESTINATION SECTOR:");
    if (!name || !dest) return;
    setTrips([{ id: Date.now().toString(), name: name.toUpperCase(), destination: dest.toUpperCase(), members: ['SAYAN (ADMIN)'] }, ...trips]);
    toast.success("EXPEDITION LOGGED");
  };

  const deleteTrip = (id) => {
    setTrips(trips.filter(t => t.id !== id));
    toast.error("MISSION DELETED");
  };

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-24 flex flex-col md:flex-row items-end justify-between gap-12 text-left">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <AirplaneTilt weight="fill" size={32} className="text-orange-500" />
              <span className="text-3xl font-extrabold tracking-[0.3em] text-white/30 uppercase">OPERATIONS</span>
            </div>
            <h1 className="text-[12vw] font-[900] leading-[0.75] uppercase">THE TRIP <br/><span className="text-orange-500 italic">BOARD.</span></h1>
            <p className="text-white/40 font-bold text-2xl mt-12 italic uppercase tracking-widest leading-none">"Active missions ready for takeoff."</p>
          </div>
          <button onClick={addTrip} className="btn-launch text-2xl px-16 py-8 flex items-center gap-4">
            <Plus weight="bold" /> NEW MISSION
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {trips.map((t) => (
            <div key={t.id} className="silicon-glass group hover:border-orange-500/40 relative overflow-hidden transition-all duration-500">
               <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => deleteTrip(t.id)} className="text-white/20 hover:text-red-500 transition-colors">
                    <Trash size={32} />
                  </button>
               </div>
               
               <div className="relative z-10">
                  <h3 className="text-7xl font-[900] mb-4 uppercase group-hover:text-orange-500 transition-colors">{t.name}</h3>
                  <p className="text-3xl font-black text-cyan-500 italic mb-10 tracking-widest">{t.destination}</p>
                  
                  <div className="flex items-center justify-between pt-10 border-t border-white/5">
                     <div className="flex -space-x-3">
                        {t.members.map((m, i) => (
                          <div key={i} className="w-14 h-14 bg-white/5 border-2 border-white/10 rounded-2xl flex items-center justify-center font-bold text-xl text-white/30">
                            {m[0]}
                          </div>
                        ))}
                     </div>
                     <Link to="/dashboard" className="no-underline">
                        <button className="flex items-center gap-3 text-white/40 hover:text-white font-black uppercase text-sm tracking-[0.4em] transition-all italic">
                          Engage <ArrowRight weight="bold" />
                        </button>
                     </Link>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

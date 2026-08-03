import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash, ArrowRight, Users, MapPin } from "@phosphor-icons/react";
import { toast } from "sonner";

// v3.1 — 8 crispy quotes for maximum vibe rotation
const CRISPY = [
  "BAGS BY THE DOOR. BRAIN SET TO VIBE.",
  "THE ITINERARY IS A SUGGESTION. GO ROGUE.",
  "EVERY TRIP IS A CHAPTER. WRITE A BANGER.",
  "YOUR GROUP CHAT IS LYING. THE TRIP IS ON.",
  "SLEEP IS OPTIONAL. MEMORIES ARE NOT.",
];

export default function TripsPage() {
  const [trips, setTrips] = useState(() => {
    try {
      const saved = localStorage.getItem("travelo_trips_v3") // v3 schema: id, name, destination, members[], budget, emoji;
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'PROJECT GOA', destination: 'GOA, INDIA', members: ['SAYAN', 'HARSH', 'PRIYA'], budget: 45000, emoji: '🏝️' },
        { id: '2', name: 'SQUAD ZERMATT', destination: 'VALAIS, SWITZERLAND', members: ['SAYAN', 'HARSH', 'RIYA'], budget: 180000, emoji: '🏔️' },
        { id: '3', name: 'BALI CHAOS', destination: 'BALI, INDONESIA', members: ['SAYAN', 'DEV'], budget: 95000, emoji: '🌴' },
      ];
    } catch { return []; }
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', destination: '', budget: '', members: '' });
  const [quote] = useState(() => CRISPY[Math.floor(Math.random() * CRISPY.length)]);

  useEffect(() => {
    localStorage.setItem("travelo_trips_v3", JSON.stringify(trips));
  }, [trips]);

  const addTrip = (e) => {
    e.preventDefault();
    if (!form.name || !form.destination) return toast.error("MISSION CODE + DESTINATION REQUIRED");
    const memberList = form.members ? form.members.split(',').map(m => m.trim().toUpperCase()).filter(Boolean) : ['SAYAN'];
    if (!memberList.includes('SAYAN')) memberList.unshift('SAYAN');
    const trip = {
      id: Date.now().toString(),
      name: form.name.toUpperCase(),
      destination: form.destination.toUpperCase(),
      members: memberList,
      budget: parseFloat(form.budget) || 0,
      emoji: ['🏝️','🏔️','🌴','🌆','🗺️','✈️'][Math.floor(Math.random()*6)],
      expenses: [],
    };
    setTrips([trip, ...trips]);
    setForm({ name: '', destination: '', budget: '', members: '' });
    setShowForm(false);
    toast.success("🔥 MISSION INITIATED. TIME TO GO WILD.");
  };

  const deleteTrip = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setTrips(trips.filter(t => t.id !== id));
    toast.error("MISSION SCRUBBED.");
  };

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-6 md:px-10">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(at_80%_20%,rgba(255,77,0,0.06)_0%,transparent_60%)]" />
      <div className="max-w-7xl mx-auto relative z-10">

        <header className="mb-20 flex flex-col md:flex-row items-end justify-between gap-12">
          <div>
            <p className="text-[11px] font-black tracking-[0.5em] uppercase text-orange-500/60 mb-6 italic">
              Active Operations
            </p>
            <h1 className="text-[14vw] font-[900] leading-[0.75] uppercase font-bebas text-white">
              THE TRIP<br/>
              <span className="text-orange-500 italic">BOARD.</span>
            </h1>
            <p className="text-white/30 font-bold text-xl mt-10 italic uppercase tracking-widest max-w-lg">
              \"{quote}\"
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-launch text-3xl px-14 py-8 rounded-[2.5rem] shrink-0"
          >
            <Plus weight="bold" size={36} />
            NEW MISSION
          </button>
        </header>

        {showForm && (
          <div className="silicon-glass border-orange-500/20 mb-20 max-w-4xl">
            <h2 className="text-6xl font-[900] mb-12 font-bebas text-white uppercase italic">
              LOG NEW <span className="text-orange-500">MISSION</span>
            </h2>
            <form onSubmit={addTrip} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="silicon-label">Mission Code Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="PROJECT GOA 2.0"
                    className="silicon-input"
                  />
                </div>
                <div className="space-y-3">
                  <label className="silicon-label">Destination Sector *</label>
                  <input
                    required
                    value={form.destination}
                    onChange={e => setForm({...form, destination: e.target.value})}
                    placeholder="GOA, INDIA"
                    className="silicon-input"
                  />
                </div>
                <div className="space-y-3">
                  <label className="silicon-label">Squad Budget (₹)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={e => setForm({...form, budget: e.target.value})}
                    placeholder="50000"
                    className="silicon-input"
                  />
                </div>
                <div className="space-y-3">
                  <label className="silicon-label">Squad Members (comma-separated)</label>
                  <input
                    value={form.members}
                    onChange={e => setForm({...form, members: e.target.value})}
                    placeholder="HARSH, PRIYA, DEV"
                    className="silicon-input"
                  />
                </div>
              </div>
              <div className="flex gap-6 pt-4">
                <button type="submit" className="btn-launch px-16 py-8 text-2xl rounded-[2rem]">
                  INITIATE MISSION
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white/5 border border-white/10 px-10 py-8 rounded-[2rem] font-black uppercase text-sm tracking-widest hover:bg-white/10 transition-all text-white/40"
                >
                  ABORT
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {trips.map((t) => (
            <Link to={`/trips/${t.id}`} key={t.id} className="no-underline group">
              <div className="silicon-glass relative flex flex-col min-h-[380px] hover:border-orange-500/30 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer">
                <button
                  onClick={(e) => deleteTrip(t.id, e)}
                  className="absolute top-8 right-8 text-white/10 hover:text-red-500 transition-colors z-10 p-2"
                >
                  <Trash size={36} />
                </button>

                <div className="text-7xl mb-8 leading-none">{t.emoji}</div>

                <h3 className="text-[5vw] md:text-[3.5vw] font-[900] mb-2 uppercase font-bebas group-hover:text-orange-500 transition-colors leading-none">
                  {t.name}
                </h3>

                <p className="text-2xl font-black text-cyan-500 italic mb-4 tracking-wider uppercase flex items-center gap-2">
                  <MapPin size={20} weight="fill" />{t.destination}
                </p>

                {t.budget > 0 && (
                  <p className="text-white/30 font-bold text-lg uppercase tracking-widest mb-6">
                    BUDGET: ₹{t.budget.toLocaleString()}
                  </p>
                )}

                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/30">
                    <Users size={24} />
                    <span className="font-black text-sm uppercase tracking-widest">{t.members.length} OPERATIVES</span>
                  </div>
                  <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-white/20 group-hover:text-orange-500 transition-all">
                    ENGAGE <ArrowRight size={24} weight="bold" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  {t.members.slice(0, 4).map((m, i) => (
                    <div key={i} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-black text-lg text-white/40 uppercase font-bebas">
                      {m[0]}
                    </div>
                  ))}
                  {t.members.length > 4 && (
                    <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center font-black text-sm text-orange-500 font-bebas">
                      +{t.members.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {trips.length === 0 && (
            <div className="col-span-full silicon-glass flex flex-col items-center justify-center min-h-[400px] border-dashed border-white/10">
              <p className="text-8xl mb-8">✈️</p>
              <h3 className="text-5xl font-[900] font-bebas text-white/20 uppercase italic">NO MISSIONS YET</h3>
              <p className="text-white/20 font-bold uppercase tracking-widest mt-4">Click \"NEW MISSION\" to start the adventure.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
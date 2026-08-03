import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash, CheckCircle, CurrencyInr, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

const CRISPY_QUOTES = [
  "ADJUST THE BUDGET. UPGRADE THE VIBE.",
  "EVERY RUPEE SPENT IS A MEMORY EARNED.",
  "SPLIT IT FAIR. GO EVERYWHERE.",
  "THE REAL FLEX? KNOWING EXACTLY WHERE YOUR MONEY WENT.",
  "MISSION CONTROL: WHERE CHAOS BECOMES A PLAN.",
];

export default function TripMissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote] = useState(() => CRISPY_QUOTES[Math.floor(Math.random() * CRISPY_QUOTES.length)]);

  const [trips] = useState(() => {
    const saved = localStorage.getItem("travelo_trips_v29");
    return saved ? JSON.parse(saved) : [];
  });

  const trip = trips.find(t => t.id === id) || {
    id, name: "UNNAMED MISSION", destination: "UNKNOWN SECTOR", members: ["SAYAN"]
  };

  const expenseKey = `travelo_mission_expenses_${id}`;
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(expenseKey);
    return saved ? JSON.parse(saved) : [
      { id: 1, desc: "ADVANCE BOOKING", amount: 12000, category: "TRAVEL" },
      { id: 2, desc: "SQUAD SUPPLIES", amount: 3500, category: "MISC" },
    ];
  });

  const [form, setForm] = useState({ desc: "", amount: "", category: "TRAVEL" });
  const CATEGORIES = ["TRAVEL", "HOTEL", "FOOD", "ACTIVITIES", "MISC"];

  useEffect(() => {
    localStorage.setItem(expenseKey, JSON.stringify(expenses));
  }, [expenses, expenseKey]);

  const addExpense = (e) => {
    e.preventDefault();
    if (!form.desc || !form.amount) return;
    setExpenses([{ id: Date.now(), desc: form.desc.toUpperCase(), amount: parseFloat(form.amount), category: form.category }, ...expenses]);
    setForm({ desc: "", amount: "", category: "TRAVEL" });
    toast.success("💰 EXPENSE LOGGED TO MISSION");
  };

  const removeExpense = (expId) => {
    setExpenses(expenses.filter(e => e.id !== expId));
    toast.error("ENTRY PURGED");
  };

  const total = expenses.reduce((acc, cur) => acc + cur.amount, 0);

  const handleFinalize = () => {
    localStorage.setItem(expenseKey, JSON.stringify(expenses));
    localStorage.setItem("travelo_expenses_v29", JSON.stringify(
      expenses.map(e => ({ ...e, tripId: id, tripName: trip.name }))
    ));
    toast.success("✅ MISSION EXPENSES LOCKED. REDIRECTING TO HQ...");
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-32 px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_50%_0%,rgba(255,77,0,0.07)_0%,transparent_60%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <button onClick={() => navigate("/trips")} className="flex items-center gap-4 text-white/30 hover:text-white font-black uppercase tracking-widest text-lg mb-20 transition-all italic font-bebas">
          <ArrowLeft size={32} weight="bold" /> BACK TO TRIP BOARD
        </button>
        <header className="mb-24">
          <div className="flex items-center gap-6 mb-8">
            <Sparkle weight="fill" size={40} className="text-orange-500 animate-pulse" />
            <span className="text-4xl font-[900] tracking-[0.3em] text-white/30 font-bebas uppercase">MISSION CONTROL</span>
          </div>
          <h1 className="text-[12vw] font-[900] leading-[0.75] uppercase font-bebas text-white">
            {trip.name.split(" ")[0]}<br/>
            <span className="text-orange-500 italic">{trip.name.split(" ").slice(1).join(" ") || "OPS."}</span>
          </h1>
          <p className="text-white/30 font-bold text-3xl mt-10 italic uppercase tracking-widest">"{quote}"</p>
          <div className="flex items-center gap-8 mt-10">
            <span className="silicon-glass px-8 py-4 text-xl font-black text-cyan-500 tracking-widest uppercase font-bebas">{trip.destination}</span>
            <span className="silicon-glass px-8 py-4 text-xl font-black text-white/40 tracking-widest uppercase font-bebas">{trip.members?.length || 1} OPERATIVES</span>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          <div className="silicon-glass border-orange-500/20 p-16 col-span-2">
            <h2 className="text-6xl font-[900] font-bebas mb-16 text-white uppercase italic">ADD EXPENSE</h2>
            <form onSubmit={addExpense} className="space-y-8">
              <input value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="EXPENSE NAME" className="silicon-input" />
              <div className="grid grid-cols-2 gap-8">
                <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="AMOUNT (₹)" type="number" className="silicon-input" />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="silicon-input">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-launch w-full py-8 text-3xl">
                <Plus weight="bold" size={32} /> LOG EXPENSE
              </button>
            </form>
          </div>
          <div className="silicon-glass border-orange-500/40 p-16 flex flex-col items-center justify-center">
            <CurrencyInr size={80} className="text-orange-500 mb-6" weight="bold" />
            <div className="text-[8vw] font-[900] font-bebas text-orange-500 italic leading-none">{total.toLocaleString("en-IN")}</div>
            <p className="text-white/30 font-black uppercase text-xl tracking-[0.3em] mt-6">TOTAL BURN</p>
            <p className="text-white/10 font-bold text-lg mt-3 italic">{expenses.length} ENTRIES</p>
          </div>
        </div>
        <div className="silicon-glass p-16 mb-20">
          <h2 className="text-5xl font-[900] font-bebas mb-12 text-white uppercase italic">EXPENSE LOG</h2>
          {expenses.length === 0 ? (
            <p className="text-white/20 font-black uppercase text-2xl italic text-center py-20">NO EXPENSES YET.</p>
          ) : expenses.map(exp => (
            <div key={exp.id} className="flex items-center justify-between py-8 border-b border-white/5 group">
              <div className="flex items-center gap-8">
                <span className="bg-orange-500/10 border border-orange-500/20 px-6 py-2 rounded-xl text-orange-500 font-black text-sm uppercase tracking-widest">{exp.category}</span>
                <span className="text-3xl font-black text-white uppercase font-bebas italic">{exp.desc}</span>
              </div>
              <div className="flex items-center gap-10">
                <span className="text-4xl font-[900] text-cyan-500 font-bebas">₹{exp.amount.toLocaleString("en-IN")}</span>
                <button onClick={() => removeExpense(exp.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500">
                  <Trash size={32} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleFinalize} className="btn-launch w-full py-12 text-5xl rounded-[3rem]">
          <CheckCircle weight="fill" size={56} /> FINALIZE MISSION & RETURN TO HQ
        </button>
      </div>
    </div>
  );
}

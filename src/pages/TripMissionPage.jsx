import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash, CurrencyInr, Calculator, CheckCircle, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function TripMissionPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [trips] = useState(() => JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]'));
  const trip = trips.find(t => t.id === id);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem(`travelo_exp_${id}`) || '[]'));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ desc: '', amount: '', paidBy: '', category: 'FOOD' });

  useEffect(() => {
    localStorage.setItem(`travelo_exp_${id}`, JSON.stringify(expenses));
  }, [expenses, id]);

  const addExpense = (e) => {
    e.preventDefault();
    if (!form.desc || !form.amount) return toast.error("FILL ALL FIELDS.");
    const exp = { id: Date.now().toString(), desc: form.desc.toUpperCase(), amount: parseFloat(form.amount), date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) };
    setExpenses([exp, ...expenses]);
    toast.success("DATA LOGGED. REDIRECTING...");
    setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
  };

  if (!trip) return <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-center"><Warning size={120} className="text-orange-500 mb-8" /><h2 className="header-massive text-white/20">NOT FOUND</h2></div>;

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex items-center gap-8 mb-16"><button onClick={() => navigate('/trips')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white"><ArrowLeft size={32} weight="bold" /></button><div><h1 className="text-6xl md:text-7xl font-[900] font-bebas text-white uppercase">{trip.name}</h1><p className="text-cyan-500 font-black italic uppercase tracking-widest text-2xl">{trip.destination}</p></div></header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"><div className="silicon-glass border-orange-500/20"><p className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase mb-4">TOTAL DAMAGE</p><div className="text-6xl font-[900] font-bebas text-orange-500 italic">₹{expenses.reduce((a,e)=>a+e.amount,0).toLocaleString()}</div></div></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-launch py-8 px-16 text-3xl mb-20"><Plus weight="bold" size={32} /> LOG EXPENSE</button>
        {showForm && (
          <div className="silicon-glass border-orange-500/20 mb-20">
             <h3 className="text-5xl font-[900] font-bebas text-white uppercase italic mb-12">NEW <span className="text-orange-500">EXPENDITURE</span></h3>
             <form onSubmit={addExpense} className="space-y-12">
                <input required value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="WHAT WAS BOUGHT?" className="silicon-input" />
                <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="AMOUNT (₹)" className="silicon-input" />
                <button type="submit" className="btn-launch w-full py-10 text-4xl">LOG DATA</button>
             </form>
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash, CurrencyInr, Users, Calculator, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

function minCashFlow(members, expenses) {
  const balance = {};
  members.forEach(m => balance[m] = 0);
  expenses.forEach(exp => {
    const perHead = exp.amount / exp.splitWith.length;
    exp.splitWith.forEach(m => {
      balance[m] = (balance[m] || 0) - perHead;
    });
    balance[exp.paidBy] = (balance[exp.paidBy] || 0) + exp.amount;
  });
  const creditors = [], debtors = [];
  Object.entries(balance).forEach(([name, amt]) => {
    if (amt > 0.01) creditors.push({ name, amt });
    else if (amt < -0.01) debtors.push({ name, amt: -amt });
  });
  const transactions = []; let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const pay = Math.min(creditors[i].amt, debtors[j].amt);
    transactions.push({ from: debtors[j].name, to: creditors[i].name, amount: Math.round(pay) });
    creditors[i].amt -= pay; debtors[j].amt -= pay;
    if (creditors[i].amt < 0.01) i++; if (debtors[j].amt < 0.01) j++;
  }
  return transactions;
}

const CATEGORIES = ['FOOD', 'STAY', 'TRANSPORT', 'ACTIVITIES', 'SHOPPING', 'OTHER'];
const CAT_EMOJI = { FOOD: '🍔', STAY: '🏨', TRANSPORT: '✈️', ACTIVITIES: '🏄', SHOPPING: '🛍️', OTHER: '💸' };

export default function TripMissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trips] = useState(() => JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]'));
  const trip = trips.find(t => t.id === id);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem(`travelo_exp_${id}`) || '[]'));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ desc: '', amount: '', paidBy: '', category: 'FOOD', splitWith: [] });

  useEffect(() => {
    if (trip && form.splitWith.length === 0) {
      setForm(f => ({ ...f, paidBy: trip.members[0] || '', splitWith: [...(trip.members || [])] }));
    }
  }, [trip]);

  useEffect(() => {
    localStorage.setItem(`travelo_exp_${id}`, JSON.stringify(expenses));
  }, [expenses, id]);

  const addExpense = (e) => {
    e.preventDefault();
    if (!form.desc || !form.amount || !form.paidBy) return toast.error("FILL ALL FIELDS, OPERATIVE.");
    const exp = { id: Date.now().toString(), desc: form.desc.toUpperCase(), amount: parseFloat(form.amount), paidBy: form.paidBy, category: form.category, splitWith: [...form.splitWith], date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) };
    setExpenses([exp, ...expenses]);
    toast.success(`💸 ₹${exp.amount.toLocaleString()} LOGGED. REDIRECTING TO HQ...`);
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  if (!trip) return <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-10"><p className="text-8xl">💀</p><h2 className="text-6xl font-bebas text-white/30 uppercase">MISSION NOT FOUND</h2><button onClick={() => navigate('/trips')} className="btn-launch px-12 py-6 text-2xl">BACK TO BOARD</button></div>;

  const total = expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="min-h-screen bg-[#030303] pt-36 pb-20 px-6 md:px-10">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(at_100%_0%,rgba(255,77,0,0.06)_0%,transparent_60%)]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex items-center gap-6 mb-16"><button onClick={() => navigate('/trips')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all"><ArrowLeft size={32} weight="bold" className="text-white/60" /></button><div><h1 className="text-[8vw] md:text-[5vw] font-[900] leading-none uppercase font-bebas text-white">{trip.name}</h1><p className="text-cyan-500 font-black italic uppercase tracking-widest text-xl">{trip.destination}</p></div></header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"><div className="silicon-glass border-orange-500/20 flex flex-col gap-4"><p className="text-[11px] font-black tracking-[0.5em] uppercase text-white/30 italic">Total Damage</p><div className="text-[5vw] md:text-[3vw] font-[900] text-orange-500 italic tracking-tighter font-bebas leading-none">₹{total.toLocaleString()}</div></div></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-launch px-10 py-5 text-xl rounded-2xl mb-12"><Plus weight="bold" size={28} /> LOG EXPENSE</button>
        {showForm && (
          <div className="silicon-glass border-orange-500/20 mb-12">
            <h3 className="text-5xl font-[900] font-bebas text-white uppercase italic mb-10">ADD <span className="text-orange-500">EXPENSE</span></h3>
            <form onSubmit={addExpense} className="space-y-8">
               <input required value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="GOA VILLA NIGHT 1" className="silicon-input" />
               <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="5000" className="silicon-input" />
               <button type="submit" className="btn-launch w-full py-8 text-2xl">LOG DATA</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
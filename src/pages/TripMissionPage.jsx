import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash, CurrencyInr, Calculator, CheckCircle, Warning } from "@phosphor-icons/react";
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
const CAT_EMOJI = { FOOD: '🍔', STAY: '🏨', TRANSPORT: '✈️', ACTIVITIES: '🏄', SHOPPING: '💻', OTHER: '💸' };

export default function TripMissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trips] = useState(() => JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]'));
  const trip = trips.find(t => t.id === id);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem(`travelo_exp_${id}`) || '[]'));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ desc: '', amount: '', paidBy: '', category: 'FOOD', splitWith: [] });
  const [activeTab, setActiveTab] = useState('expenses');

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
    if (!form.desc || !form.amount || !form.paidBy) return toast.error("FILL ALL FIELDS.");
    const exp = {
      id: Date.now().toString(),
      desc: form.desc.toUpperCase(),
      amount: parseFloat(form.amount),
      paidBy: form.paidBy,
      category: form.category,
      splitWith: [...form.splitWith],
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    };
    const updated = [exp, ...expenses];
    setExpenses(updated);
    toast.success("LOGGED. REDIRECTING TO HQ...");
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  if (!trip) return <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center"><Warning size={80} className="text-orange-500" /><h2 className="header-massive text-white/20">NOT FOUND</h2></div>;

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const settlements = minCashFlow(trip.members, expenses);

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex items-center gap-8 mb-16"><button onClick={() => navigate('/trips')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all"><ArrowLeft size={32} weight="bold" /></button><div><h1 className="text-6xl md:text-7xl font-[900] font-bebas text-white uppercase leading-none">{trip.name}</h1><p className="text-cyan-500 font-black italic uppercase tracking-widest text-2xl">{trip.destination}</p></div></header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"><div className="silicon-glass border-orange-500/20"><p className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase mb-4 italic">TOTAL DAMAGE</p><div className="text-6xl font-[900] font-bebas text-orange-500 italic leading-none">₹{total.toLocaleString()}</div></div></div>
        <div className="flex gap-4 mb-12">
          {['expenses', 'settle'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-10 py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-white/5 border border-white/10 text-white/40'}`}>{tab === 'expenses' ? '💸 LOGBOOK' : '⚖️ SETTLEMENT'}</button>))}
          <button onClick={() => setShowForm(!showForm)} className="ml-auto btn-launch py-6 px-10 text-xl"><Plus weight="bold" size={24} /> LOG EXPENSE</button>
        </div>
        {showForm && (
          <div className="silicon-glass border-orange-500/20 mb-20">
             <h3 className="text-5xl font-[900] font-bebas text-white uppercase italic mb-12">NEW <span className="text-orange-500">EXPENDITURE</span></h3>
             <form onSubmit={addExpense} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10"><div className="space-y-4"><label className="silicon-label">WHAT WAS BOUGHT?</label><input required value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="VILLA RENTAL" className="silicon-input" /></div><div className="space-y-4"><label className="silicon-label">AMOUNT (₹)</label><input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="5000" className="silicon-input" /></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10"><div className="space-y-4"><label className="silicon-label">PAID BY</label><select value={form.paidBy} onChange={e => setForm({...form, paidBy: e.target.value})} className="silicon-input bg-[#0a0a0a]">{trip.members.map(m => <option key={m} value={m}>{m}</option>)}</select></div><div className="space-y-4"><label className="silicon-label">CATEGORY</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="silicon-input bg-[#0a0a0a]">{CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}</select></div></div>
                <div className="flex gap-6"><button type="submit" className="btn-launch px-16 py-8 text-2xl">LOG DATA</button><button type="button" onClick={() => setShowForm(false)} className="bg-white/5 px-16 py-8 rounded-[2rem] font-black uppercase tracking-widest text-white/30">ABORT</button></div>
             </form>
          </div>
        )}
      </div>
    </div>
  );
}
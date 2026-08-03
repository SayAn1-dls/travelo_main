import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash, CurrencyInr, Users, Calculator, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

/**
 * Min-Cash-Flow Algorithm: O(n log n) debt simplification
 * Reduces N payments to minimum transactions using greedy creditor/debtor matching
 */
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

  const transactions = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const pay = Math.min(creditors[i].amt, debtors[j].amt);
    transactions.push({ from: debtors[j].name, to: creditors[i].name, amount: Math.round(pay) });
    creditors[i].amt -= pay;
    debtors[j].amt -= pay;
    if (creditors[i].amt < 0.01) i++;
    if (debtors[j].amt < 0.01) j++;
  }
  return transactions;
}

// 6 expense categories covering all squad scenarios
const CATEGORIES = ['FOOD', 'STAY', 'TRANSPORT', 'ACTIVITIES', 'SHOPPING', 'OTHER'];
const CAT_EMOJI = { FOOD: '🍔', STAY: '🏨', TRANSPORT: '✈️', ACTIVITIES: '🏄', SHOPPING: '💻', OTHER: '💸' };

export default function TripMissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trips, setTrips] = useState(() => {
    try { return JSON.parse(localStorage.getItem("travelo_trips_v3") || '[]'); }
    catch { return []; }
  });

  const trip = trips.find(t => t.id === id);

  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`travelo_exp_${id}`) || '[]'); }
    catch { return []; }
  });

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
    if (!form.desc || !form.amount || !form.paidBy) return toast.error("FILL ALL FIELDS, OPERATIVE.");
    if (form.splitWith.length === 0) return toast.error("SELECT WHO'S SPLITTING THIS.");
    const exp = {
      id: Date.now().toString(),
      desc: form.desc.toUpperCase(),
      amount: parseFloat(form.amount),
      paidBy: form.paidBy,
      category: form.category,
      splitWith: [...form.splitWith],
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    };
    setExpenses([exp, ...expenses]);
    setForm(f => ({ ...f, desc: '', amount: '', category: 'FOOD' }));
    setShowForm(false);
    toast.success(`💸 ₹${exp.amount.toLocaleString()} LOGGED. SETTLING LATER.`);
  };

  const deleteExpense = (eid) => {
    setExpenses(expenses.filter(e => e.id !== eid));
    toast.error("EXPENSE DELETED.");
  };

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const settlements = trip ? minCashFlow(trip.members, expenses) : [];
  const budgetPercent = trip?.budget > 0 ? Math.min((total / trip.budget) * 100, 100) : 0;

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-10">
        <p className="text-8xl">💀</p>
        <h2 className="text-6xl font-bebas text-white/30 uppercase">MISSION NOT FOUND</h2>
        <button onClick={() => navigate('/trips')} className="btn-launch px-12 py-6 text-2xl">BACK TO BOARD</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] pt-36 pb-20 px-6 md:px-10">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(at_100%_0%,rgba(255,77,0,0.06)_0%,transparent_60%)]" />
      <div className="max-w-7xl mx-auto relative z-10">

        <div className="flex items-center gap-6 mb-16">
          <button onClick={() => navigate('/trips')} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
            <ArrowLeft size={32} weight="bold" className="text-white/60" />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{trip.emoji || '✈️'}</span>
            <div>
              <h1 className="text-[8vw] md:text-[5vw] font-[900] leading-none uppercase font-bebas text-white">
                {trip.name}
              </h1>
              <p className="text-cyan-500 font-black italic uppercase tracking-widest text-xl">{trip.destination}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="silicon-glass border-orange-500/20 flex flex-col gap-4">
            <p className="text-[11px] font-black tracking-[0.5em] uppercase text-white/30 italic">Total Damage</p>
            <div className="text-[5vw] md:text-[3vw] font-[900] text-orange-500 italic tracking-tighter font-bebas leading-none">
              ₹{total.toLocaleString()}
            </div>
          </div>
          <div className="silicon-glass border-cyan-500/10 flex flex-col gap-4">
            <p className="text-[11px] font-black tracking-[0.5em] uppercase text-white/30 italic">Expenses Logged</p>
            <div className="text-[5vw] md:text-[3vw] font-[900] text-cyan-500 italic tracking-tighter font-bebas leading-none">
              {expenses.length}
            </div>
          </div>
          <div className="silicon-glass flex flex-col gap-4">
            <p className="text-[11px] font-black tracking-[0.5em] uppercase text-white/30 italic">Squad Size</p>
            <div className="text-[5vw] md:text-[3vw] font-[900] text-white italic tracking-tighter font-bebas leading-none">
              {trip.members.length} <span className="text-white/20 text-[2vw]">OPS</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-12">
          {['expenses', 'settle'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all ${
                activeTab === tab
                  ? 'bg-orange-500 text-white shadow-[0_0_30px_rgba(255,77,0,0.4)]'
                  : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
              }`}
            >
              {tab === 'expenses' ? '💸 EXPENSES' : '⚖️ SETTLE UP'}
            </button>
          ))}
          <button
            onClick={() => { setShowForm(!showForm); setActiveTab('expenses'); }}
            className="ml-auto btn-launch px-10 py-5 text-xl rounded-2xl"
          >
            <Plus weight="bold" size={28} /> LOG EXPENSE
          </button>
        </div>

        {showForm && (
          <div className="silicon-glass border-orange-500/20 mb-12">
            <h3 className="text-5xl font-[900] font-bebas text-white uppercase italic mb-10">
              ADD <span className="text-orange-500">EXPENSE</span>
            </h3>
            <form onSubmit={addExpense} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="silicon-label">What was spent on? *</label>
                  <input
                    required
                    value={form.desc}
                    onChange={e => setForm({...form, desc: e.target.value})}
                    placeholder="GOA VILLA NIGHT 1"
                    className="silicon-input"
                  />
                </div>
                <div className="space-y-3">
                  <label className="silicon-label">Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({...form, amount: e.target.value})}
                    placeholder="5000"
                    className="silicon-input"
                  />
                </div>
                <div className="space-y-3">
                  <label className="silicon-label">Who Paid? *</label>
                  <select
                    value={form.paidBy}
                    onChange={e => setForm({...form, paidBy: e.target.value})}
                    className="silicon-input bg-[#0a0a0a] cursor-pointer"
                  >
                    {trip.members.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="silicon-label">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="silicon-input bg-[#0a0a0a] cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="silicon-label">Split Between *</label>
                <div className="flex flex-wrap gap-4">
                  {trip.members.map(m => (
                    <label key={m} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.splitWith.includes(m)}
                        onChange={e => {
                          if (e.target.checked) setForm(f => ({...f, splitWith: [...f.splitWith, m]}));
                          else setForm(f => ({...f, splitWith: f.splitWith.filter(x => x !== m)}));
                        }}
                        className="hidden"
                      />
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black font-bebas text-2xl border-2 transition-all ${
                        form.splitWith.includes(m)
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/30 hover:border-orange-500/40'
                      }`}>{m[0]}</div>
                      <span className={`font-black text-sm uppercase transition-all ${form.splitWith.includes(m) ? 'text-orange-500' : 'text-white/30'}`}>{m}</span>
                    </label>
                  ))}
                </div>
                {form.splitWith.length > 0 && form.amount && (
                  <p className="text-white/30 font-bold text-sm uppercase italic tracking-widest">
                    ₹{(parseFloat(form.amount || 0) / form.splitWith.length).toFixed(0)} per person
                  </p>
                )}
              </div>
              <div className="flex gap-6 pt-4">
                <button type="submit" className="btn-launch px-16 py-8 text-2xl rounded-[2rem]">
                  LOG IT
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white/5 border border-white/10 px-10 py-8 rounded-[2rem] font-black uppercase text-sm tracking-widest hover:bg-white/10 transition-all text-white/40"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-white/[0.02] backdrop-blur-[60px] border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center">
              <span className="font-black text-[11px] tracking-[0.5em] uppercase text-white/20 italic">Expense Trace</span>
              <span className="font-black text-[11px] tracking-[0.5em] uppercase text-white/20 italic">Amount</span>
            </div>
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <p className="text-7xl">👙</p>
                <p className="font-black text-white/20 uppercase tracking-widest text-xl">EMPTY. START SPENDING.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {expenses.map(exp => (
                  <div key={exp.id} className="px-10 py-10 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-4xl">
                        {CAT_EMOJI[exp.category] || '💸'}
                      </div>
                      <div>
                        <p className="font-[900] text-3xl md:text-4xl uppercase font-bebas text-white italic leading-none">{exp.desc}</p>
                        <p className="font-black text-sm uppercase tracking-widest text-white/30 mt-2">
                          Paid by <span className="text-orange-500">{exp.paidBy}</span>
                          {' · '}{exp.splitWith.length} splitting
                          {' · '}<span className="text-white/20">{exp.date}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="font-[900] text-3xl md:text-4xl font-bebas text-white italic">₹{exp.amount.toLocaleString()}</span>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-500 transition-all"
                      >
                        <Trash size={36} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settle' && (
          <div className="space-y-8">
            <div className="silicon-glass border-cyan-500/10">
              <div className="flex items-center gap-6 mb-12">
                <Calculator size={48} className="text-cyan-500" />
                <div>
                  <h3 className="text-5xl font-[900] font-bebas text-white uppercase italic">MIN-CASH-FLOW</h3>
                  <p className="text-white/30 font-bold uppercase tracking-widest text-sm">Minimum transactions to settle all debts</p>
                </div>
              </div>
              {settlements.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle size={80} className="text-cyan-500 mx-auto mb-6" />
                  <p className="text-5xl font-[900] font-bebas text-white uppercase italic">ALL SQUARED UP!</p>
                  <p className="text-white/30 font-bold uppercase tracking-widest mt-4">No debts. Clean squad.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {settlements.map((s, i) => (
                    <div key={i} className="flex items-center gap-8 p-8 bg-white/[0.03] border border-white/5 rounded-[2rem]">
                      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center font-black text-2xl font-bebas text-red-400">{s.from[0]}</div>
                      <div className="flex-1">
                        <p className="font-[900] text-3xl font-bebas text-white uppercase italic">
                          <span className="text-red-400">{s.from}</span>
                          {' '}pays{' '}
                          <span className="text-cyan-500">{s.to}</span>
                        </p>
                      </div>
                      <div className="text-4xl font-[900] font-bebas text-orange-500 italic">₹{s.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="silicon-glass">
                <h4 className="text-4xl font-[900] font-bebas text-white uppercase italic mb-8">SQUAD BALANCES</h4>
                {trip.members.map(member => {
                  const paid = expenses.filter(e => e.paidBy === member).reduce((a, e) => a + e.amount, 0);
                  const owed = expenses.filter(e => e.splitWith.includes(member)).reduce((a, e) => a + e.amount / e.splitWith.length, 0);
                  const net = paid - owed;
                  return (
                    <div key={member} className="flex items-center justify-between py-6 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-black text-xl font-bebas text-white/40">{member[0]}</div>
                        <span className="font-black text-xl uppercase text-white/60">{member}</span>
                      </div>
                      <span className={`font-[900] text-2xl font-bebas italic ${net > 0 ? 'text-cyan-500' : net < 0 ? 'text-red-400' : 'text-white/20'}`}>
                        {net > 0 ? '+' : ''}₹{Math.round(net).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="silicon-glass flex flex-col justify-between">
                <div>
                  <h4 className="text-4xl font-[900] font-bebas text-white uppercase italic mb-8">CATEGORY BREAKDOWN</h4>
                  {CATEGORIES.map(cat => {
                    const catTotal = expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0);
                    if (!catTotal) return null;
                    return (
                      <div key={cat} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                        <span className="flex items-center gap-3 font-black text-lg uppercase text-white/40">{CAT_EMOJI[cat]} {cat}</span>
                        <span className="font-[900] text-2xl font-bebas italic text-white">₹{catTotal.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-8 w-full bg-orange-500/10 border border-orange-500/20 py-8 rounded-[2rem] font-black uppercase text-sm tracking-widest hover:bg-orange-500 hover:text-white transition-all text-orange-500"
                >
                  ← BACK TO COMMAND HQ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
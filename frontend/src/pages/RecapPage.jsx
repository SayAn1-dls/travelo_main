import { useEffect, useState } from "react";
import { ArrowRight, Plus, Download, ShieldCheck, Trash, CurrencyInr } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function RecapPage() {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("travelo_expenses");
    return saved ? JSON.parse(saved) : [
      { id: 1, desc: 'GOA VILLA DEPOSIT', amount: 15000, paidBy: 'SAYAN', to: 'POOL' },
      { id: 2, desc: 'SQUAD DINNER', amount: 4500, paidBy: 'HARSH', to: 'SAYAN' }
    ];
  });

  const [newExp, setNewExp] = useState({ desc: '', amount: '' });

  useEffect(() => {
    localStorage.setItem("travelo_expenses", JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (e) => {
    e.preventDefault();
    if (!newExp.desc || !newExp.amount) return;
    const item = { id: Date.now(), desc: newExp.desc.toUpperCase(), amount: parseFloat(newExp.amount), paidBy: 'SAYAN (ADMIN)', to: 'POOL' };
    setExpenses([item, ...expenses]);
    setNewExp({ desc: '', amount: '' });
    toast.success("CAPITAL LOGGED");
  };

  const removeExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
    toast.error("RECORD DELETED");
  };

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
          <div>
            <h1 className="text-[12vw] font-[900] leading-[0.75] uppercase">CAPITAL <br/><span className="text-orange-500">LEDGER.</span></h1>
            <p className="text-white/40 font-bold text-2xl mt-12 italic uppercase tracking-widest leading-none">"SETTLE THE DAMAGE. NO DRAMA."</p>
          </div>
          <button className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all">
            <Download size={40} className="text-orange-500" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          <div className="silicon-glass border-orange-500/20">
            <p className="font-black text-[10px] tracking-[0.4em] uppercase text-white/30 mb-6 italic">Total Squad Damage</p>
            <div className="text-8xl font-[900] text-orange-500 italic tracking-tighter font-bebas">\u20b9{total.toLocaleString()}</div>
          </div>
          <div className="silicon-glass">
            <p className="font-black text-[10px] tracking-[0.4em] uppercase text-white/30 mb-6 italic">Settle Status</p>
            <div className="text-8xl font-[900] flex items-center gap-6 italic tracking-tighter font-bebas">STABLE <ShieldCheck weight="fill" className="text-cyan-500" /></div>
          </div>
          <div className="silicon-glass border-white/5">
             <form onSubmit={addExpense} className="space-y-6">
                <input value={newExp.desc} onChange={e => setNewExp({...newExp, desc: e.target.value})} placeholder="DESC (E.G. BEER)" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:border-orange-500" />
                <div className="flex gap-4">
                   <input type="number" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} placeholder="AMT" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-orange-500" />
                   <button type="submit" className="bg-orange-500 px-10 rounded-2xl font-black text-white hover:scale-95 transition-transform"><Plus weight="bold" size={24} /></button>
                </div>
             </form>
          </div>
        </div>

        <div className="silicon-glass p-0 overflow-hidden border-white/5">
          <div className="bg-white/5 px-12 py-8 border-b border-white/10 flex justify-between font-black text-[11px] tracking-[0.5em] uppercase opacity-20 italic">
            <span>Entity / Trace</span>
            <span>Magnitude</span>
          </div>
          <div className="divide-y divide-white/5">
            {expenses.map((exp) => (
              <div key={exp.id} className="px-12 py-14 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-12">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-center text-orange-500 shadow-xl">
                    <CurrencyInr size={48} weight="bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-8 text-6xl font-[900] tracking-tighter uppercase italic">
                      <span>{exp.paidBy}</span>
                      <ArrowRight className="opacity-10" />
                      <span className="text-white/20">{exp.to}</span>
                    </div>
                    <p className="font-black text-orange-500 text-sm tracking-[0.4em] uppercase mt-4 italic">{exp.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-7xl font-[900] italic tracking-tighter font-bebas">\u20b9{exp.amount.toLocaleString()}</span>
                  <button onClick={() => removeExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-500 transition-all p-4">
                    <Trash weight="bold" size={32} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

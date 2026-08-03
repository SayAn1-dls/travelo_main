import { useEffect, useState } from "react";
import { ArrowRight, Plus, Download, Trash, CurrencyInr } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function RecapPage() {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("travelo_expenses_v29");
    return saved ? JSON.parse(saved) : [
      { id: 1, desc: 'GOA VILLA DEPOSIT', amount: 15000, paidBy: 'SAYAN', to: 'POOL' },
      { id: 2, desc: 'SQUAD DINNER', amount: 4500, paidBy: 'HARSH', to: 'SAYAN' }
    ];
  });

  const [newExp, setNewExp] = useState({ desc: '', amount: '' });

  useEffect(() => {
    localStorage.setItem("travelo_expenses_v29", JSON.stringify(expenses));
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
        <header className="flex flex-col md:flex-row justify-between items-end mb-32 gap-12">
          <div>
            <h1 className="text-[15vw] font-[900] leading-[0.75] uppercase font-bebas text-white">CAPITAL <br/><span className="text-orange-500 italic">LEDGER.</span></h1>
            <p className="text-white/40 font-bold text-3xl mt-12 italic uppercase tracking-widest">"SETTLE THE DAMAGE. NO DRAMA."</p>
          </div>
          <button className="bg-white/5 border border-white/10 p-10 rounded-[3rem] hover:bg-white/10 transition-all">
            <Download size={56} className="text-orange-500" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-32">
          <div className="silicon-glass border-orange-500/20 p-16">
            <CurrencyInr size={80} className="text-orange-500 mb-6" weight="bold" />
            <div className="text-[6vw] font-[900] font-bebas text-orange-500 italic leading-none">{total.toLocaleString('en-IN')}</div>
            <p className="text-white/30 font-black uppercase text-xl tracking-[0.3em] mt-4">TOTAL BURN</p>
          </div>
          <div className="silicon-glass col-span-2 p-16">
            <h2 className="text-5xl font-[900] font-bebas mb-12 text-white uppercase italic">LOG NEW EXPENSE</h2>
            <form onSubmit={addExpense} className="flex gap-6">
              <input value={newExp.desc} onChange={e => setNewExp({...newExp, desc: e.target.value})} placeholder="EXPENSE NAME" className="silicon-input flex-1" />
              <input value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} placeholder="AMOUNT" type="number" className="silicon-input w-48" />
              <button type="submit" className="btn-launch px-10">
                <Plus weight="bold" size={32} />
              </button>
            </form>
          </div>
        </div>

        <div className="silicon-glass p-16">
          <h2 className="text-5xl font-[900] font-bebas mb-12 text-white uppercase italic">EXPENSE LOG</h2>
          {expenses.map(exp => (
            <div key={exp.id} className="flex items-center justify-between py-8 border-b border-white/5 group">
              <div>
                <div className="text-3xl font-black text-white uppercase font-bebas italic">{exp.desc}</div>
                <div className="text-white/30 font-bold text-sm uppercase mt-2">{exp.paidBy} → {exp.to}</div>
              </div>
              <div className="flex items-center gap-10">
                <span className="text-4xl font-[900] text-cyan-500 font-bebas">₹{exp.amount.toLocaleString('en-IN')}</span>
                <button onClick={() => removeExpense(exp.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500">
                  <Trash size={32} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { ArrowRight, Plus, Download, Trash, CurrencyInr } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function RecapPage() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem("travelo_expenses_v29");
      return saved ? JSON.parse(saved) : [
        { id: 1, desc: 'GOA VILLA DEPOSIT', amount: 15000, paidBy: 'SAYAN', to: 'POOL' },
        { id: 2, desc: 'SQUAD DINNER', amount: 4500, paidBy: 'HARSH', to: 'SAYAN' }
      ];
    } catch { return []; }
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
          <div className="silicon-glass border-orange-500/20">
            <p className="font-black text-[14px] tracking-[0.4em] uppercase text-white/30 mb-8 italic">Total Squad Damage</p>
            <div className="text-[6vw] font-[900] text-orange-500 italic tracking-tighter font-bebas leading-none">₹{total.toLocaleString()}</div>
          </div>
          <div className="silicon-glass border-cyan-500/20">
            <p className="font-black text-[14px] tracking-[0.4em] uppercase text-white/30 mb-8 italic">Settle Status</p>
            <div className="text-[6vw] font-[900] italic tracking-tighter font-bebas text-cyan-500 leading-none uppercase">STABLE</div>
          </div>
          <div className="silicon-glass">
             <form onSubmit={addExpense} className="space-y-8">
                <input value={newExp.desc} onChange={e => setNewExp({...newExp, desc: e.target.value})} placeholder="EXPENSE DESCRIPTION" className="silicon-input" />
                <div className="flex gap-6">
                   <input type="number" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} placeholder="AMT" className="silicon-input" />
                   <button type="submit" className="bg-orange-500 px-12 rounded-[2rem] font-black text-white hover:scale-95 transition-transform"><Plus weight="bold" size={32} /></button>
                </div>
             </form>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-[60px] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="bg-white/5 px-16 py-10 border-b border-white/10 flex justify-between font-black text-[14px] tracking-[0.5em] uppercase opacity-20 italic">
            <span>Entity Trace</span>
            <span>Magnitude</span>
          </div>
          <div className="divide-y divide-white/5">
            {expenses.map((exp) => (
              <div key={exp.id} className="px-16 py-16 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-12">
                  <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-orange-500">
                    <CurrencyInr size={48} weight="bold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-8 text-[5vw] font-[900] tracking-tighter uppercase italic font-bebas leading-none">
                      <span>{exp.paidBy}</span>
                      <ArrowRight className="opacity-10" />
                      <span className="text-white/20">{exp.to}</span>
                    </div>
                    <p className="font-black text-orange-500 text-lg tracking-[0.4em] uppercase mt-4 italic">{exp.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-[5vw] font-[900] italic tracking-tighter font-bebas text-white">₹{exp.amount.toLocaleString()}</span>
                  <button onClick={() => removeExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-500 transition-all p-4">
                    <Trash weight="bold" size={48} />
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

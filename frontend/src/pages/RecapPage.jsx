import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, CurrencyInr, ArrowRight } from "@phosphor-icons/react";

export default function RecapPage() {
  const { user } = useAuth();
  
  const transactions = [
    { from: 'Harsh', to: 'Sayan', amount: '5,000', msg: 'The legendary "Trust Me Bro" loan.' },
    { from: 'Sayan', to: 'Pool', amount: '12,500', msg: 'Expedition foundation money.' },
    { from: 'Rahul', to: 'Harsh', amount: '2,200', msg: 'For the cab no one remembers booking.' },
  ];

  return (
    <div className="min-h-screen pt-40 px-10 pb-20 bg-sexy-black">
      <div className="max-w-6xl mx-auto">

        <header className="text-center mb-24">
          <p className="font-black text-[10px] tracking-[0.4em] uppercase text-sexy-orange/60 mb-6">MIN-CASH-FLOW ENGINE ACTIVE</p>
          <h1 className="goated-heading text-[10vw] leading-none mb-6 uppercase">
            CAPITAL <span className="text-sexy-orange">LEDGER</span>
          </h1>
          <div className="crazy-text text-3xl mb-4 italic">
            "The Damage Report — No Cap Edition"
          </div>
          <p className="crystal-clear opacity-40 uppercase tracking-[0.2em] font-black text-xs">
            Fewer transactions. More money for drinks.
          </p>
        </header>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="sexy-card border-sexy-orange/30">
            <p className="font-black text-[10px] tracking-[0.3em] uppercase text-sexy-orange/60 mb-4">OWED TO YOU</p>
            <div className="text-7xl font-black">₹5,000</div>
            <p className="crazy-text text-lg mt-4">"Go collect it. We'll wait."</p>
          </div>
          <div className="sexy-card">
            <p className="font-black text-[10px] tracking-[0.3em] uppercase opacity-40 mb-4">TOTAL POOL</p>
            <div className="text-7xl font-black">₹22,500</div>
            <p className="crazy-text text-lg mt-4 opacity-60">"Looks big. Won't last the weekend."</p>
          </div>
          <div className="sexy-card border-sexy-yellow/30">
            <p className="font-black text-[10px] tracking-[0.3em] uppercase opacity-40 mb-4">BALANCE STATUS</p>
            <div className="text-5xl font-black text-sexy-yellow flex items-center gap-3">
              STABLE <ShieldCheck weight="fill" size={48} />
            </div>
            <p className="crazy-text text-lg mt-4 text-sexy-yellow">"Bankruptcy averted. For now."</p>
          </div>
        </div>

        {/* TRANSACTION TABLE */}
        <div className="sexy-card p-0 overflow-hidden border-white/10">
          <div className="bg-white/5 px-12 py-8 border-b border-white/10 flex justify-between items-center">
            <span className="goated-heading text-3xl">THE MONEY TRAIL</span>
            <span className="font-black text-[10px] tracking-widest uppercase opacity-40">Optimized by Travelo</span>
          </div>
          <div className="divide-y divide-white/5">
            {transactions.map((t, i) => (
              <div key={i} className="px-12 py-10 flex items-center justify-between hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-8">
                  <div className="w-14 h-14 bg-sexy-orange/10 rounded-2xl flex items-center justify-center text-sexy-orange flex-shrink-0">
                    <CurrencyInr size={28} weight="bold" />
                  </div>
                  <div>
                    <div className="goated-heading text-3xl flex items-center gap-3">
                      <span>{t.from}</span>
                      <ArrowRight className="opacity-30" size={20} />
                      <span className="text-sexy-orange">{t.to}</span>
                    </div>
                    <p className="crazy-text text-lg opacity-70 mt-1">{t.msg}</p>
                  </div>
                </div>
                <div className="text-4xl font-black">₹{t.amount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER CTA */}
        <div className="mt-20 text-center">
          <p className="crazy-text text-2xl mb-8 opacity-60">"Another day, another expense that was 'totally necessary'."</p>
          <button className="btn-sexy px-16 py-7 text-xl">ADD NEW EXPENSE</button>
        </div>

      </div>
    </div>
  );
}

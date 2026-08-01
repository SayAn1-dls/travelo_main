import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, CurrencyInr, ArrowRight, Lightning } from "@phosphor-icons/react";

const MOCK_TRANSACTIONS = [
  { from: "Harsh", to: "Sayan", amount: "5,000", msg: "The legendary 'Trust Me Bro' loan." },
  { from: "Sayan", to: "Pool", amount: "12,500", msg: "Expedition foundation money." },
  { from: "Rahul", to: "Harsh", amount: "2,200", msg: "For the cab no one remembers booking." },
];

export default function RecapPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-10 selection:bg-brutal-acid selection:text-black">
      <div className="max-w-6xl mx-auto">

        {/* PAGE HEADER */}
        <header className="mb-24">
          <div className="inline-block bg-brutal-orange text-white px-6 py-2 border-4 border-white mb-10 rotate-[-1deg]">
            <span className="font-bebas text-2xl tracking-widest">MIN-CASH-FLOW ENGINE &#x26a1; ACTIVE</span>
          </div>
          <h1 className="header-massive text-[11vw] leading-none mb-6">
            CAPITAL <span className="text-brutal-orange">LEDGER</span>
          </h1>
          <p className="font-marker text-4xl text-brutal-acid rotate-[-1deg]">
            "The Damage Report &#x2014; No Cap Edition"
          </p>
          <p className="font-bebas text-2xl tracking-[0.25em] text-white/30 mt-4 uppercase">
            Fewer transactions. More money for drinks.
          </p>
        </header>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="brutal-card border-brutal-orange shadow-brutal">
            <p className="font-bebas text-xl tracking-[0.3em] uppercase text-brutal-orange/70 mb-4">OWED TO YOU</p>
            <div className="header-massive text-8xl text-white">&#x20b9;5,000</div>
            <p className="font-marker text-xl mt-4 text-brutal-orange">"Go collect it. We'll wait."</p>
          </div>
          <div className="brutal-card border-white shadow-[8px_8px_0px_white]">
            <p className="font-bebas text-xl tracking-[0.3em] uppercase text-white/40 mb-4">TOTAL POOL</p>
            <div className="header-massive text-8xl text-white">&#x20b9;22,500</div>
            <p className="font-marker text-xl mt-4 text-white/50">"Looks big. Won't last the weekend."</p>
          </div>
          <div className="brutal-card border-brutal-acid shadow-brutal-acid">
            <p className="font-bebas text-xl tracking-[0.3em] uppercase text-white/40 mb-4">BALANCE STATUS</p>
            <div className="header-massive text-5xl text-brutal-acid flex items-center gap-4">
              STABLE <ShieldCheck weight="fill" size={48} />
            </div>
            <p className="font-marker text-xl mt-4 text-brutal-acid">"Bankruptcy averted. For now."</p>
          </div>
        </div>

        {/* TRANSACTION TABLE */}
        <div className="border-4 border-white overflow-hidden shadow-brutal">
          <div className="bg-white px-10 py-6 flex justify-between items-center">
            <span className="header-massive text-4xl text-black">THE MONEY TRAIL</span>
            <span className="font-bebas text-xl tracking-widest text-black/40 uppercase">Optimized by Travelo AI</span>
          </div>
          <div className="divide-y-4 divide-white/10">
            {MOCK_TRANSACTIONS.map((t, i) => (
              <div key={i} className="px-10 py-8 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-brutal-orange border-4 border-white flex items-center justify-center flex-shrink-0">
                    <CurrencyInr size={32} weight="bold" className="text-white" />
                  </div>
                  <div>
                    <div className="header-massive text-4xl flex items-center gap-4">
                      <span className="text-white">{t.from}</span>
                      <ArrowRight className="text-white/30" size={24} />
                      <span className="text-brutal-orange">{t.to}</span>
                    </div>
                    <p className="font-marker text-xl text-white/60 mt-1">{t.msg}</p>
                  </div>
                </div>
                <div className="header-massive text-5xl text-brutal-acid">&#x20b9;{t.amount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER CTA */}
        <div className="mt-20 flex flex-col items-center gap-8">
          <p className="font-marker text-3xl text-white/40 rotate-[1deg]">
            "Another day, another expense that was 'totally necessary'."
          </p>
          <button className="btn-brutal px-16 py-7 text-3xl flex items-center gap-4 group">
            <Lightning size={32} weight="fill" className="text-white" />
            ADD NEW EXPENSE
          </button>
        </div>

      </div>
    </div>
  );
}

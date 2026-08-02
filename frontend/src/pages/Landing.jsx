import { Link } from "react-router-dom";
import { AirplaneTilt, ArrowRight, Globe, ShieldCheck, ChartPie, Sparkle } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  const features = [
    { icon: AirplaneTilt, label: "MISSION BOARD", desc: "Plan every trip. Log every move. Zero friction.", color: "text-orange-500" },
    { icon: ChartPie, label: "CAPITAL LEDGER", desc: "Split bills, settle debts. Squad finance = sorted.", color: "text-cyan-500" },
    { icon: Globe, label: "LOGISTICS HUB", desc: "Book flights, hotels. All providers in one place.", color: "text-orange-400" },
    { icon: ShieldCheck, label: "MEMORIES VAULT", desc: "Store the chaos. Relive the best trips ever.", color: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-[#030303] overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[900px] h-[900px] rounded-full bg-orange-500/[0.07] blur-[200px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-cyan-500/[0.06] blur-[200px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-10 pt-10 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center rotate-[-8deg]">
            <AirplaneTilt size={26} weight="fill" className="text-white" />
          </div>
          <span className="text-5xl font-[900] font-bebas tracking-tighter text-white">TRAVELO.</span>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <Link to="/dashboard" className="no-underline bg-orange-500 hover:bg-orange-400 text-white font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-sm transition-all">
              ENTER →
            </Link>
          ) : (
            <>
              <Link to="/auth" className="no-underline text-white/40 hover:text-white font-black text-sm tracking-widest uppercase transition-colors">LOGIN</Link>
              <Link to="/auth" className="no-underline bg-orange-500 hover:bg-orange-400 text-white font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-sm transition-all shadow-[0_0_40px_rgba(249,115,22,0.25)]">
                JOIN FREE →
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-10 pt-20 pb-32 max-w-[1600px] mx-auto">
        <div className="flex items-start gap-8 mb-8">
          <Sparkle size={48} className="text-orange-500 mt-6 flex-shrink-0" weight="fill" />
          <span className="text-3xl font-black tracking-[0.4em] uppercase text-white/30 italic">The Only Travel App You Need</span>
        </div>

        <h1 className="text-[17vw] font-[900] leading-[0.75] uppercase tracking-tighter mb-10">
          <span className="text-white block">TRAVEL.</span>
          <span className="text-orange-500 block italic">TOGETHER.</span>
        </h1>

        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-16 mt-16">
          <p className="text-white/40 font-bold text-3xl leading-tight max-w-xl italic uppercase tracking-wide">
            "Plan trips. Split bills.<br />Book flights. Save memories.<br />One app. Zero drama."
          </p>
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="no-underline bg-orange-500 hover:bg-orange-400 text-white font-black px-16 py-8 rounded-3xl uppercase tracking-widest text-2xl transition-all active:scale-95 shadow-[0_0_80px_rgba(249,115,22,0.35)] flex items-center gap-6 flex-shrink-0"
          >
            LAUNCH <ArrowRight weight="bold" size={32} />
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 px-10 pb-32 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f) => (
            <div key={f.label} className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 hover:border-orange-500/30 transition-all group">
              <f.icon size={56} className={`${f.color} mb-8 group-hover:scale-110 transition-transform`} weight="duotone" />
              <h3 className="text-3xl font-[900] uppercase tracking-tight mb-4 font-bebas">{f.label}</h3>
              <p className="text-white/30 font-bold text-lg leading-snug italic">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 px-10 pb-32 max-w-[1600px] mx-auto">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-[3rem] p-16 flex flex-col md:flex-row items-center justify-between gap-12 backdrop-blur-3xl">
          <div>
            <h2 className="text-[8vw] font-[900] uppercase leading-[0.8] font-bebas">
              READY<br />TO <span className="text-orange-500 italic">LAUNCH?</span>
            </h2>
            <p className="text-white/40 font-bold text-xl mt-6 italic">Free forever. No credit card. Just vibes.</p>
          </div>
          <Link
            to="/auth"
            className="no-underline bg-white text-black font-black px-16 py-8 rounded-3xl uppercase tracking-widest text-2xl transition-all hover:bg-orange-500 hover:text-white active:scale-95 flex-shrink-0"
          >
            GET STARTED →
          </Link>
        </div>
      </section>
    </div>
  );
}

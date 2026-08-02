import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt, ChartPie, Globe, ShieldCheck, ArrowRight, Sparkle, MapPin } from "@phosphor-icons/react";

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    { label: "Active Missions", value: "3", sub: "TRIPS PLANNED", color: "text-orange-500" },
    { label: "Capital Tracked", value: "₹42,500", sub: "TOTAL LOGGED", color: "text-cyan-500" },
    { label: "Destinations Hit", value: "7", sub: "LOCATIONS DONE", color: "text-orange-400" },
  ];

  const modules = [
    {
      icon: AirplaneTilt,
      label: "MISSION BOARD",
      desc: "View and manage all your active trips.",
      link: "/trips",
      color: "text-orange-500",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      icon: Globe,
      label: "BOOK LOGISTICS",
      desc: "Flights, hotels, everything in one shot.",
      link: "/book",
      color: "text-cyan-500",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: ChartPie,
      label: "CAPITAL LEDGER",
      desc: "Track squad expenses and settle fast.",
      link: "/bookings",
      color: "text-orange-400",
      bg: "bg-orange-400/10 border-orange-400/20",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-10">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-orange-500/[0.06] blur-[180px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.05] blur-[180px]" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Header */}
        <header className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <Sparkle size={32} weight="fill" className="text-orange-500" />
            <span className="font-black text-[11px] tracking-[0.5em] uppercase text-white/30 italic">COMMAND CENTER</span>
          </div>
          <h1 className="text-[13vw] font-[900] leading-[0.75] uppercase tracking-tighter">
            <span className="text-white block">HEY,</span>
            <span className="text-orange-500 italic block">{user?.name?.split(" ")[0] || "TRAVELER"}.</span>
          </h1>
          <p className="text-white/30 font-bold text-3xl mt-12 uppercase tracking-widest italic">
            "Where are we going next?"
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10">
              <p className="font-black text-[10px] tracking-[0.5em] uppercase text-white/20 mb-6 italic">{s.sub}</p>
              <div className={`text-[10vw] font-[900] leading-none font-bebas italic ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          {modules.map((m) => (
            <Link key={m.label} to={m.link} className="no-underline group">
              <div className={`border backdrop-blur-3xl rounded-[2.5rem] p-12 h-full transition-all hover:scale-[1.02] ${m.bg}`}>
                <m.icon size={64} className={`${m.color} mb-10 group-hover:rotate-[-10deg] transition-transform`} weight="duotone" />
                <h3 className="text-5xl font-[900] uppercase mb-6 font-bebas tracking-wide">{m.label}</h3>
                <p className="text-white/40 font-bold text-xl italic mb-10 leading-snug">{m.desc}</p>
                <div className={`flex items-center gap-3 font-black text-sm tracking-[0.4em] uppercase ${m.color} italic`}>
                  OPEN <ArrowRight weight="bold" size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-12 backdrop-blur-3xl">
          <div className="flex items-center gap-4 mb-10">
            <MapPin weight="fill" size={28} className="text-orange-500" />
            <span className="font-black text-sm tracking-[0.4em] uppercase text-white/40 italic">QUICK LAUNCH</span>
          </div>
          <div className="flex flex-wrap gap-6">
            {[
              { label: "New Trip →", link: "/trips" },
              { label: "Log Expense →", link: "/bookings" },
              { label: "Book Tickets →", link: "/book" },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.link}
                className="no-underline bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 px-10 py-6 rounded-2xl font-black uppercase text-sm tracking-[0.3em] text-white/60 hover:text-white transition-all italic"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

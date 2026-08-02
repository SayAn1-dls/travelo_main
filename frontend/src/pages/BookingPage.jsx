import { useState } from "react";
import { AirplaneTilt, Buildings, Globe, MagnifyingGlass, ArrowSquareOut, MapPin } from "@phosphor-icons/react";

export default function BookingPage() {
  const [dest, setDest] = useState("");

  const providers = [
    { name: 'INDIGO', url: 'https://www.goindigo.in', icon: AirplaneTilt, color: 'text-white' },
    { name: 'BOOKING.COM', url: 'https://www.booking.com', icon: Buildings, color: 'text-orange-500' },
    { name: 'MAKEMYTRIP', url: 'https://www.makemytrip.com', icon: Globe, color: 'text-cyan-500' },
  ];

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_0%_100%,rgba(0,240,255,0.03)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-32">
          <div className="flex items-center gap-6 mb-8">
            <MapPin weight="fill" size={40} className="text-orange-500" />
            <span className="text-4xl font-[900] tracking-[0.3em] text-white/30 font-bebas uppercase">LOGISTICS COMMAND</span>
          </div>
          <h1 className="text-[15vw] font-[900] leading-[0.75] uppercase font-bebas text-white">MISSION <br/><span className="text-gradient italic">LOGS.</span></h1>
          <p className="text-white/40 font-bold text-4xl mt-12 italic uppercase tracking-widest leading-none">"SECURE THE SEAT. SECURE THE VIBE."</p>
        </header>

        <div className="max-w-5xl bg-white/[0.03] border border-white/10 rounded-[5rem] p-8 flex items-center gap-10 mb-40 shadow-2xl backdrop-blur-3xl">
          <div className="p-12 bg-orange-500 rounded-[3rem] shadow-2xl shadow-orange-500/50">
            <MagnifyingGlass size={64} weight="bold" className="text-white" />
          </div>
          <input
            value={dest}
            onChange={e => setDest(e.target.value)}
            className="flex-1 bg-transparent py-10 text-[8vw] font-[900] tracking-widest outline-none placeholder:text-white/5 uppercase font-bebas text-white"
            placeholder="DESTINATION"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {providers.map((p) => (
            <div key={p.name} className="silicon-glass group hover:border-orange-500/40 transition-all cursor-pointer relative flex flex-col items-center">
              <div className="absolute top-8 right-8 opacity-5 group-hover:opacity-100 transition-opacity">
                <ArrowSquareOut size={40} />
              </div>
              <p.icon size={120} className={`${p.color} mb-12 group-hover:scale-110 transition-all`} weight="duotone" />
              <h3 className="text-6xl font-[900] tracking-widest font-bebas italic text-white uppercase mb-12">{p.name}</h3>
              <button
                onClick={() => window.open(`${p.url}`, '_blank', 'noopener,noreferrer')}
                className="w-full bg-white/5 hover:bg-white text-white hover:text-black py-8 rounded-[2.5rem] font-[900] uppercase text-lg tracking-[0.4em] transition-all border border-white/5 italic font-bebas"
              >
                Launch Portal
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-24 flex flex-col md:flex-row items-end justify-between gap-12">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <MapPin weight="fill" className="text-orange-500" size={32} />
              <span className="text-3xl font-extrabold tracking-[0.3em] text-white/30 uppercase italic">LOGISTICS</span>
            </div>
            <h1 className="text-[12vw] font-[900] leading-[0.75] uppercase">MISSION <br/><span className="text-gradient italic font-bebas">LOGS.</span></h1>
            <p className="text-white/40 font-bold text-2xl mt-12 italic uppercase tracking-widest leading-none">"SECURE THE SEAT. SECURE THE VIBE."</p>
          </div>
        </header>

        <div className="max-w-5xl bg-white/[0.03] border border-white/10 rounded-[4rem] p-6 flex items-center gap-8 mb-32 shadow-2xl backdrop-blur-3xl">
          <div className="p-10 bg-orange-500 rounded-[2.5rem] shadow-2xl shadow-orange-500/40">
            <MagnifyingGlass size={48} weight="bold" className="text-white" />
          </div>
          <input 
            value={dest}
            onChange={e => setDest(e.target.value)}
            className="flex-1 bg-transparent py-10 text-[6vw] font-[900] tracking-widest outline-none placeholder:text-white/5 uppercase"
            placeholder="DESTINATION"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {providers.map((p) => (
            <div key={p.name} className="silicon-glass flex flex-col items-center py-24 group hover:border-orange-500/40 cursor-pointer">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-100 transition-opacity">
                <ArrowSquareOut size={48} />
              </div>
              <p.icon size={120} className={`${p.color} mb-12 group-hover:scale-110 transition-all`} weight="duotone" />
              <h3 className="text-6xl font-[900] tracking-widest font-bebas italic">{p.name}</h3>
              <button 
                onClick={() => window.open(`${p.url}/search?q=${dest}`, '_blank')}
                className="w-full mt-16 bg-white/5 hover:bg-white text-white hover:text-black py-7 rounded-3xl font-black uppercase text-sm tracking-[0.4em] transition-all border border-white/5 italic"
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

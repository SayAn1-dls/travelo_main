import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";

const DESTINATIONS = [
  { id: "1", name: "GOA", country: "INDIA", region: "India", tagline: "Sun, sand & no sleep.", emoji: "🏖️", color: "text-orange-500", bg: "from-orange-500/10 to-transparent" },
  { id: "2", name: "BALI", country: "INDONESIA", region: "Asia", tagline: "Temples, terraces & vibes.", emoji: "🌺", color: "text-cyan-500", bg: "from-cyan-500/10 to-transparent" },
  { id: "3", name: "PARIS", country: "FRANCE", region: "Europe", tagline: "Cliché? Yes. Worth it? Absolutely.", emoji: "🗼", color: "text-white", bg: "from-white/5 to-transparent" },
  { id: "4", name: "TOKYO", country: "JAPAN", region: "Asia", tagline: "Fast trains, slow ramen.", emoji: "⛩️", color: "text-orange-500", bg: "from-orange-500/10 to-transparent" },
  { id: "5", name: "MALDIVES", country: "MALDIVES", region: "Asia", tagline: "Overwater luxury on a budget? Wishful.", emoji: "🐠", color: "text-cyan-500", bg: "from-cyan-500/10 to-transparent" },
  { id: "6", name: "SANTORINI", country: "GREECE", region: "Europe", tagline: "Blue domes, white walls, Instagram gold.", emoji: "🏛️", color: "text-white", bg: "from-white/5 to-transparent" },
  { id: "7", name: "DUBAI", country: "UAE", region: "Middle East", tagline: "Skyscrapers and desert drama.", emoji: "🏙️", color: "text-orange-500", bg: "from-orange-500/10 to-transparent" },
  { id: "8", name: "SPITI", country: "INDIA", region: "India", tagline: "Cold desert, hot adventure.", emoji: "🏔️", color: "text-cyan-500", bg: "from-cyan-500/10 to-transparent" },
  { id: "9", name: "SINGAPORE", country: "SINGAPORE", region: "Asia", tagline: "Clean. Efficient. Delicious.", emoji: "🦁", color: "text-white", bg: "from-white/5 to-transparent" },
  { id: "10", name: "ISTANBUL", country: "TÜRKIYE", region: "Europe", tagline: "Where two continents shake hands.", emoji: "🕌", color: "text-orange-500", bg: "from-orange-500/10 to-transparent" },
  { id: "11", name: "MANALI", country: "INDIA", region: "India", tagline: "Peaks, chai & no signal (peace).", emoji: "⛷️", color: "text-cyan-500", bg: "from-cyan-500/10 to-transparent" },
  { id: "12", name: "ROME", country: "ITALY", region: "Europe", tagline: "All roads lead here. All pasta stays.", emoji: "🍕", color: "text-white", bg: "from-white/5 to-transparent" },
];

const REGIONS = ["ALL", "India", "Asia", "Europe", "Middle East"];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("ALL");

  const filtered = DESTINATIONS.filter(d => {
    const matchRegion = region === "ALL" || d.region === region;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.country.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-32 px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_0%_0%,rgba(0,240,255,0.04)_0%,transparent_50%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-20">
          <div className="flex items-center gap-6 mb-8">
            <Globe weight="fill" size={40} className="text-orange-500" />
            <span className="text-4xl font-[900] tracking-[0.3em] text-white/30 font-bebas uppercase">DESTINATION HQ</span>
          </div>
          <h1 className="text-[13vw] font-[900] leading-[0.75] uppercase font-bebas text-white">EXPLORE<br/><span className="text-orange-500 italic">THE WORLD.</span></h1>
          <p className="text-white/30 font-bold text-3xl mt-10 italic uppercase tracking-widest">"YOUR PASSPORT AIN'T GONNA STAMP ITSELF."</p>
        </header>
        <div className="flex flex-col md:flex-row items-center gap-8 mb-20">
          <div className="flex-1 silicon-glass flex items-center gap-6 px-10 py-6">
            <MagnifyingGlass size={32} className="text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH DESTINATIONS..." className="bg-transparent flex-1 outline-none text-2xl font-black uppercase placeholder:text-white/10 text-white" />
          </div>
          <div className="flex gap-4 flex-wrap">
            {REGIONS.map(r => (
              <button key={r} onClick={() => setRegion(r)} className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm font-bebas transition-all ${region === r ? "bg-orange-500 text-white" : "silicon-glass text-white/40 hover:text-white"}`}>{r}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((dest) => (
            <div key={dest.id} className="silicon-glass group relative overflow-hidden p-12 hover:border-white/20 transition-all cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-br ${dest.bg} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
              <div className="relative z-10">
                <div className="text-7xl mb-8">{dest.emoji}</div>
                <h2 className={`text-[7vw] font-[900] font-bebas leading-none ${dest.color} italic mb-2`}>{dest.name}</h2>
                <p className="text-white/40 font-bold text-xl uppercase tracking-widest mb-6 font-bebas">{dest.country}</p>
                <p className="text-white/50 font-bold text-lg italic mb-12 leading-relaxed">"{dest.tagline}"</p>
                <Link to="/trips"><button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-6 rounded-2xl font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-4 font-bebas text-white/60 hover:text-white">PLAN MISSION <ArrowRight size={24} weight="bold" /></button></Link>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-40"><p className="text-white/20 font-black uppercase text-3xl italic">NO DESTINATIONS FOUND.</p></div>
        )}
      </div>
    </div>
  );
}

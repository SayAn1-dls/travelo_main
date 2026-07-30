import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { MagnifyingGlass, MapPin, CalendarBlank, ArrowUpRight, AirplaneTilt } from "@phosphor-icons/react";

const REGIONS = ["All", "India", "Asia", "Europe", "Middle East"];
const regionOf = (country) => {
  if (country === "India") return "India";
  if (["Indonesia", "Japan", "Thailand", "Singapore"].includes(country)) return "Asia";
  if (["France", "Greece", "Italy", "Türkiye"].includes(country)) return "Europe";
  if (country === "UAE") return "Middle East";
  return "Asia";
};

function DestinationCard({ d, i, featured, wide }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.05, 0.5), duration: 0.5, ease: "easeOut" }}
      className={`${featured ? "sm:col-span-2 sm:row-span-2" : wide ? "sm:col-span-2" : ""}`}
    >
      <Link
        to={`/destinations/${d.slug}`}
        data-testid={`explore-destination-${d.slug}`}
        className={`group block relative rounded-3xl overflow-hidden ${featured ? "h-[26rem] sm:h-full sm:min-h-[38rem]" : "h-72"}`}
      >
        <img src={d.image} alt={d.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <CalendarBlank size={12} /> {d.best_time}
          </span>
        </div>
        <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowUpRight size={18} weight="bold" />
        </div>
        <div className="absolute bottom-0 p-6 text-white w-full">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 flex items-center gap-1.5">
            <MapPin size={12} weight="fill" className="text-[#FFB49B]" /> {d.country}
          </p>
          <h3 className={`font-display font-bold mt-1 ${featured ? "text-4xl sm:text-6xl" : "text-3xl"}`}>{d.name}</h3>
          <p className={`text-white/85 mt-1 ${featured ? "text-base max-w-md" : "text-sm"}`}>{d.tagline}</p>
          {featured && (
            <span className="inline-flex items-center gap-2 mt-5 bg-[#FF5A36] group-hover:bg-[#E64322] text-white text-sm font-bold rounded-full px-5 py-2.5 transition-colors">
              Explore {d.name} <ArrowUpRight size={15} weight="bold" />
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function ExplorePage() {
  const [destinations, setDestinations] = useState([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All");

  useEffect(() => {
    api.get("/destinations").then((r) => setDestinations(r.data)).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((d) => {
      if (region !== "All" && regionOf(d.country) !== region) return false;
      if (q && !`${d.name} ${d.country} ${d.tagline}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [destinations, query, region]);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#FF5A36] mb-3">Destination hubs</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold">Where to next?</h1>
          <p className="text-muted-foreground mt-3 max-w-xl">Every hub shows the local buses, cab apps, scooter rentals and hidden gems — so you land knowing exactly how to move.</p>
        </div>
        <div className="relative w-full lg:w-80">
          <MagnifyingGlass size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="explore-search-input"
            placeholder="Search a city or country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full h-12 pl-11 bg-white"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-8 flex-wrap">
        {REGIONS.map((r) => (
          <button
            key={r}
            data-testid={`explore-filter-${r.toLowerCase().replace(" ", "-")}`}
            onClick={() => setRegion(r)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${region === r ? "bg-[#0A2540] text-white" : "bg-[#F0EFEB] hover:bg-[#E5E4E0] text-[#1A1A1A]"}`}
          >
            {r}
          </button>
        ))}
        <span className="ml-auto self-center text-sm text-muted-foreground" data-testid="explore-count">
          {filtered.length} destination{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 bg-[#0A2540] text-white rounded-3xl p-14 text-center relative overflow-hidden grain" data-testid="explore-empty">
          <AirplaneTilt size={36} weight="duotone" className="text-[#FFB49B] mx-auto" />
          <p className="font-display text-2xl font-bold mt-4">Nowhere matches "{query}" yet</p>
          <p className="text-white/70 text-sm mt-2">Try another city, or clear the search to browse everything.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8" data-testid="explore-grid">
          {filtered.map((d, i) => (
            <DestinationCard key={d.slug} d={d} i={i} featured={i === 0} wide={i !== 0 && (i - 1) % 7 === 4} />
          ))}
        </div>
      )}

      <div className="mt-16 bg-[#0A2540] text-white rounded-3xl p-10 sm:p-14 relative overflow-hidden grain flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#FFB49B]">Found the one?</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">Turn it into a group trip.</h2>
          <p className="text-white/70 text-sm mt-2 max-w-md">Invite the crew, set a budget in any currency and let Travelo handle the money math.</p>
        </div>
        <Link to="/trips" data-testid="explore-plan-trip-cta" className="bg-[#FF5A36] hover:bg-[#E64322] text-white font-bold rounded-full px-7 py-3.5 transition-colors shrink-0">
          Plan a group trip
        </Link>
      </div>
    </div>
  );
}

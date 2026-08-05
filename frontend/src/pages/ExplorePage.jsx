import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import DestinationCard from '@/components/DestinationCard';
import Marquee from '@/components/Marquee';

const REGIONS = ['All', 'India', 'Asia', 'Europe', 'Africa', 'South America', 'Middle East', 'Oceania'];

export default function ExplorePage() {
  const [destinations, setDestinations] = useState([]);
  const [region, setRegion] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.destinations()
      .then(setDestinations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = destinations;
    if (region !== 'All') r = r.filter((d) => d.region === region);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((d) => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q));
    }
    return r;
  }, [destinations, region, query]);

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-14 md:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">// The menu</p>
          <h1 className="mt-3 font-display uppercase leading-[0.85]">
            <span className="block text-[clamp(3.5rem,10vw,9rem)] text-white">30 ways</span>
            <span className="block text-[clamp(3.5rem,10vw,9rem)] text-outline-blaze">to disappear.</span>
          </h1>
        </motion.div>

        {/* Filters */}
        <div className="mt-12 flex flex-wrap items-center gap-3">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`border px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition ${
                region === r
                  ? 'border-blaze bg-blaze text-black'
                  : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
              }`}
              data-testid={`region-filter-${r.toLowerCase().replace(' ', '-')}`}
            >
              {r}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH…"
              className="w-full border border-white/15 bg-zinc-950 py-2.5 pl-10 pr-4 font-mono text-xs uppercase tracking-widest text-white placeholder:text-white/30 outline-none focus:border-acid"
              data-testid="explore-search-input"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse border border-white/10 bg-zinc-900" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-1 gap-6 pt-12 sm:grid-cols-2 lg:grid-cols-3" data-testid="destinations-grid">
            {filtered.map((d, i) => (
              <DestinationCard key={d.id} dest={d} index={i} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="font-display text-5xl uppercase text-outline">Nothing here.</p>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-white/40">Try a different filter, adventurer.</p>
          </div>
        )}
      </div>

      <Marquee items={['Book it', 'Pack it', 'Live it', 'Repeat', 'Travelo']} variant="acid" slow />
    </div>
  );
}

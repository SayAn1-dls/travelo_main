import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Star, Clock, MapPin, Check } from 'lucide-react';
import api from '@/lib/api';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const TIER_META = {
  explorer: {
    label: 'Explorer',
    color: 'white',
    blurb: 'The essentials, done right.',
    perks: ['4-star handpicked stays', 'Guided highlight experiences', 'Airport transfers included', 'Local SIM + city passes'],
  },
  elite: {
    label: 'Elite',
    color: 'blaze',
    blurb: 'Skip lines. Skip compromises.',
    perks: ['5-star boutique stays', 'Private guides all days', 'Premium experiences unlocked', 'Priority everything'],
  },
  legend: {
    label: 'Legend',
    color: 'acid',
    blurb: 'The trip people think you made up.',
    perks: ['Ultra-luxury signature stays', 'Helicopters & private charters', '24/7 personal concierge', 'Once-in-a-lifetime access'],
  },
};

export default function DestinationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dest, setDest] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.destination(id).then(setDest).catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink pt-16">
        <p className="font-display text-6xl uppercase text-outline">Lost?</p>
        <Link to="/explore" className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-acid">← Back to explore</Link>
      </div>
    );
  }

  if (!dest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink pt-16">
        <span className="font-display text-4xl uppercase text-white/30 animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      {/* HERO */}
      <section className="relative flex min-h-[70vh] items-end overflow-hidden">
        <img src={`${dest.image}?auto=format&fit=crop&w=2000&q=75`} alt={dest.name} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-14 md:px-8">
          <Link to="/explore" className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60 hover:text-acid">
            <ArrowLeft className="h-4 w-4" /> All destinations
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-[clamp(4rem,14vw,13rem)] uppercase leading-[0.8] text-white"
            data-testid="destination-title"
          >
            {dest.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 font-marker text-xl text-acid md:text-2xl"
          >
            {dest.tagline}
          </motion.p>
          <div className="mt-6 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-[0.25em] text-white/70">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blaze" /> {dest.country} · {dest.region}</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-blaze" /> {dest.duration_days} days</span>
            <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-acid text-acid" /> {dest.rating} rated</span>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="mx-auto grid max-w-7xl gap-16 px-5 py-20 md:px-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-blaze">// The pitch</p>
          <p className="mt-6 text-lg leading-relaxed text-white/80">{dest.description}</p>

          <p className="mt-12 font-mono text-xs uppercase tracking-[0.4em] text-blaze">// What you'll actually do</p>
          <ul className="mt-6 space-y-4">
            {dest.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-white/80">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-blaze" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* TIERS */}
        <div className="lg:col-span-3">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-blaze">// Choose your intensity</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Object.entries(TIER_META).map(([key, meta]) => (
              <div
                key={key}
                className={`flex flex-col border p-6 transition hover:-translate-y-1 ${
                  key === 'legend' ? 'border-acid' : key === 'elite' ? 'border-blaze' : 'border-white/20'
                }`}
                data-testid={`tier-card-${key}`}
              >
                <span className={`font-display text-3xl uppercase ${key === 'legend' ? 'text-acid' : key === 'elite' ? 'text-blaze' : 'text-white'}`}>
                  {meta.label}
                </span>
                <p className="mt-1 text-sm text-white/50">{meta.blurb}</p>
                <div className="my-5 dashed-divider" />
                <div className="font-display text-4xl text-white">{fmt(dest.tiers[key])}</div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">per person</span>
                <ul className="mt-5 space-y-2.5">
                  {meta.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-white/70">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-acid" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(`/book/${dest.id}`)}
            className="group mt-8 flex w-full items-center justify-center gap-3 bg-blaze px-8 py-5 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black shadow-brutal-acid transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            data-testid="book-this-trip-btn"
          >
            Book this trip <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
}

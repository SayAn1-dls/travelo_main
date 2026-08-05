import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown, Globe2, CalendarCheck, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import Marquee from '@/components/Marquee';
import QuoteRotator from '@/components/QuoteRotator';
import DestinationCard from '@/components/DestinationCard';

const HERO_IMG = 'https://images.unsplash.com/photo-1608570004513-472c257f2149?auto=format&fit=crop&w=2000&q=75';
const CTA_IMG = 'https://images.pexels.com/photos/14482714/pexels-photo-14482714.jpeg?auto=compress&w=2000&q=75';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7 },
};

export default function Landing() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    api.destinations().then(setDestinations).catch(() => {});
  }, []);

  const marqueeItems = destinations.length
    ? destinations.map((d) => d.name)
    : ['Santorini', 'Kyoto', 'Iceland', 'Bali', 'Patagonia', 'Maldives', 'Tokyo', 'Dubai'];

  return (
    <div className="bg-ink text-white">
      {/* ============ HERO ============ */}
      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Adventure" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 pt-32 md:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-acid"
          >
            Est. 2026 — Planet Earth · 30 destinations · 3 tiers · zero excuses
          </motion.p>

          <h1 className="font-display uppercase leading-[0.82]" data-testid="hero-headline">
            <motion.span initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="block text-[clamp(4.5rem,13vw,13rem)] text-white">
              Stop
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.7 }} className="block text-[clamp(4.5rem,13vw,13rem)] text-outline">
              Dreaming.
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }} className="block text-[clamp(4.5rem,13vw,13rem)]">
              Start <span className="italic text-blaze">Packing.</span>
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/explore"
              className="group flex items-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:bg-blaze-hover"
              data-testid="hero-explore-btn"
            >
              Explore the world
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#quotes"
              className="flex items-center gap-3 border border-white/30 px-8 py-4 font-mono text-sm uppercase tracking-[0.2em] text-white transition hover:border-acid hover:text-acid"
            >
              I need convincing
              <ArrowDown className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        <div className="relative z-10 mt-10">
          <Marquee items={marqueeItems} variant="blaze" />
        </div>
      </section>

      {/* ============ FEATURED DESTINATIONS ============ */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <motion.div {...fadeUp} className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display uppercase leading-[0.85]">
            <span className="block text-[clamp(3rem,8vw,7rem)] text-white">Pick your</span>
            <span className="block text-[clamp(3rem,8vw,7rem)] text-outline-blaze">poison.</span>
          </h2>
          <Link
            to="/explore"
            className="group flex items-center gap-2 font-mono text-sm uppercase tracking-[0.25em] text-acid hover:text-white"
            data-testid="see-all-destinations"
          >
            All 30 destinations <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.slice(0, 6).map((d, i) => (
            <DestinationCard key={d.id} dest={d} index={i} />
          ))}
        </div>
      </section>

      {/* ============ QUOTES ============ */}
      <section id="quotes" className="border-y border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
          <p className="mb-10 font-mono text-xs uppercase tracking-[0.4em] text-blaze">// Words to quit your couch by</p>
          <QuoteRotator />
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
          {[
            ['30', 'Destinations'],
            ['6', 'Continents'],
            ['3', 'Savage tiers'],
            ['∞', 'Bragging rights'],
          ].map(([num, label]) => (
            <motion.div key={label} {...fadeUp} className="bg-ink p-8 text-center md:p-12">
              <div className="font-display text-6xl text-acid md:text-8xl">{num}</div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <motion.h2 {...fadeUp} className="mb-14 font-display text-[clamp(2.5rem,6vw,5rem)] uppercase leading-none">
          Three steps. <span className="text-outline">That's it.</span>
        </motion.h2>
        <div className="space-y-px bg-white/10">
          {[
            { n: '01', icon: Globe2, title: 'Pick a place', desc: '30 hand-picked destinations from Ladakh to Bora Bora. Every single one worth crossing the planet for.' },
            { n: '02', icon: CalendarCheck, title: 'Lock your dates', desc: 'Choose dates, squad size and your tier — Explorer, Elite, or full Legend mode.' },
            { n: '03', icon: CreditCard, title: 'Pay and pack', desc: 'Secure Stripe checkout. Instant confirmation. Your only job left is the suitcase.' },
          ].map((step) => (
            <motion.div key={step.n} {...fadeUp} className="group flex flex-col gap-4 bg-ink px-6 py-10 transition hover:bg-zinc-950 md:flex-row md:items-center md:gap-12 md:px-10">
              <span className="font-display text-6xl text-outline-blaze md:text-8xl">{step.n}</span>
              <step.icon className="h-8 w-8 text-acid" />
              <div>
                <h3 className="font-display text-3xl uppercase text-white md:text-4xl">{step.title}</h3>
                <p className="mt-1 max-w-xl text-white/50">{step.desc}</p>
              </div>
              <ArrowRight className="ml-auto hidden h-6 w-6 text-white/20 transition group-hover:translate-x-2 group-hover:text-blaze md:block" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden">
        <img src={CTA_IMG} alt="Airplane wing" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 py-32 text-center md:py-44">
          <motion.h2 {...fadeUp} className="font-display uppercase leading-[0.85]">
            <span className="block text-[clamp(3.5rem,10vw,9rem)] text-white">The world</span>
            <span className="block text-[clamp(3.5rem,10vw,9rem)] text-outline">won't wait.</span>
          </motion.h2>
          <motion.p {...fadeUp} className="mt-6 font-marker text-xl text-acid md:text-2xl">your excuses expired yesterday.</motion.p>
          <motion.div {...fadeUp} className="mt-10">
            <Link
              to="/explore"
              className="group inline-flex items-center gap-3 bg-acid px-10 py-5 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black shadow-brutal transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              data-testid="cta-book-now"
            >
              Book your escape <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/10">
        <Marquee items={['Stop scrolling', 'Start packing', 'Travelo', 'See the world', 'Zero excuses']} variant="ghost" slow />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 md:flex-row md:px-8">
          <span className="font-display text-3xl text-white">TRAVELO<span className="text-blaze">.</span></span>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            © 2026 Travelo — Built for people who actually go.
          </p>
        </div>
      </footer>
    </div>
  );
}

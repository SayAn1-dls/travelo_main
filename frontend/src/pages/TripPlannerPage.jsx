import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Loader2, ArrowRight, Wallet } from 'lucide-react';
import api from '@/lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function TripPlannerPage() {
  const [trips, setTrips] = useState(null);

  useEffect(() => {
    api.trips().then(setTrips).catch(() => setTrips([]));
  }, []);

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">// Squad logistics HQ</p>
            <h1 className="mt-3 font-display uppercase leading-[0.85]">
              <span className="block text-[clamp(3rem,9vw,8rem)] text-white">Plan the</span>
              <span className="block text-[clamp(3rem,9vw,8rem)] text-outline-blaze">madness.</span>
            </h1>
            <p className="mt-4 font-marker text-lg text-acid">squad. pool. budget. zero awkward money talk later.</p>
          </div>
          <Link
            to="/planner/new"
            className="group flex items-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black shadow-brutal-acid transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            data-testid="new-trip-plan-btn"
          >
            <Plus className="h-4 w-4" /> New trip plan
          </Link>
        </motion.div>

        <div className="mt-14 space-y-5">
          {trips === null && (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blaze" /></div>
          )}

          {trips && trips.length === 0 && (
            <div className="border border-white/10 py-24 text-center" data-testid="planner-empty">
              <p className="font-display text-5xl uppercase text-outline md:text-7xl">No plans yet.</p>
              <p className="mt-4 font-marker text-xl text-acid">great trips don't plan themselves.</p>
              <Link
                to="/planner/new"
                className="mt-8 inline-flex items-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-blaze-hover"
              >
                Start planning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {trips && trips.map((t, i) => {
            const pct = Math.min(100, t.finances.budget_used_pct || 0);
            const over = t.finances.budget_status === 'over';
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Link
                  to={`/planner/${t.id}`}
                  className="group block border border-white/15 p-6 transition hover:border-blaze md:p-8"
                  data-testid={`trip-card-${t.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                      <h3 className="font-display text-4xl uppercase leading-none md:text-5xl">{t.place}</h3>
                      <p className="mt-2 flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                        <span>{t.start_date} → {t.end_date}</span>
                        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-blaze" /> squad of {t.members.length}</span>
                        <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-blaze" /> pool {fmt(t.finances.pool)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className={`px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${over ? 'bg-blaze text-black' : 'bg-acid text-black'}`}>
                          {over ? 'Over budget' : 'Under budget'}
                        </span>
                        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                          spent {fmt(t.finances.spent)} / {fmt(t.finances.budget)}
                        </p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-white/20 transition group-hover:translate-x-1 group-hover:text-blaze" />
                    </div>
                  </div>
                  <div className="mt-5 h-1.5 w-full bg-white/10">
                    <div className={`h-full ${over ? 'bg-blaze' : 'bg-acid'}`} style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

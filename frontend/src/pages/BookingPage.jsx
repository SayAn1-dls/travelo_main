import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Minus, Plus, Loader2, Lock } from 'lucide-react';
import api from '@/lib/api';
import { TIER_META } from '@/pages/DestinationPage';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const toISO = (d) => d.toISOString().slice(0, 10);

const STEPS = ['Dates', 'Squad', 'Tier', 'Review'];

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dest, setDest] = useState(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }, []);

  const [startDate, setStartDate] = useState(toISO(defaultStart));
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [tier, setTier] = useState('elite');

  useEffect(() => {
    window.scrollTo(0, 0);
    api.destination(id)
      .then((d) => {
        setDest(d);
        const end = new Date(defaultStart);
        end.setDate(end.getDate() + d.duration_days);
        setEndDate(toISO(end));
      })
      .catch(() => toast.error('Destination not found'));
  }, [id, defaultStart]);

  const total = dest ? dest.tiers[tier] * travelers : 0;

  const validStep = () => {
    if (step === 0) {
      if (!startDate || !endDate) return 'Pick both dates.';
      if (new Date(endDate) <= new Date(startDate)) return 'Return date must be after departure.';
      if (new Date(startDate) < new Date(new Date().toDateString())) return 'Departure can\u2019t be in the past.';
    }
    return null;
  };

  const nextStep = () => {
    const err = validStep();
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, 3));
  };

  const lockItIn = async () => {
    setBusy(true);
    try {
      const booking = await api.createBooking({
        destination_id: dest.id,
        tier,
        travelers,
        start_date: startDate,
        end_date: endDate,
      });
      const { checkout_url } = await api.checkout({
        booking_id: booking.id,
        origin_url: window.location.origin,
      });
      window.location.href = checkout_url;
    } catch (err) {
      toast.error(err.message || 'Booking failed');
      setBusy(false);
    }
  };

  if (!dest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink pt-16">
        <span className="font-display text-4xl uppercase text-white/30 animate-pulse">Loading…</span>
      </div>
    );
  }

  const inputCls =
    'w-full border border-white/15 bg-zinc-950 px-4 py-4 font-mono text-sm text-white outline-none transition focus:border-blaze';

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      <div className="mx-auto max-w-5xl px-5 py-14 md:px-8">
        <Link to={`/destinations/${dest.id}`} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60 hover:text-acid">
          <ArrowLeft className="h-4 w-4" /> {dest.name}
        </Link>

        <h1 className="mt-6 font-display text-[clamp(3rem,8vw,7rem)] uppercase leading-[0.85]">
          Lock in <span className="text-outline-blaze">{dest.name}.</span>
        </h1>

        {/* Progress */}
        <div className="mt-10 grid grid-cols-4 gap-2" data-testid="booking-progress">
          {STEPS.map((s, i) => (
            <div key={s}>
              <div className={`h-1.5 ${i <= step ? 'bg-blaze' : 'bg-white/10'}`} />
              <span className={`mt-2 block font-mono text-[10px] uppercase tracking-[0.2em] ${i <= step ? 'text-blaze' : 'text-white/30'}`}>
                {String(i + 1).padStart(2, '0')} {s}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="mt-12 min-h-[320px]"
          >
            {step === 0 && (
              <div className="max-w-2xl space-y-8">
                <h2 className="font-display text-4xl uppercase">When do you vanish?</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Departure</label>
                    <input type="date" value={startDate} min={toISO(new Date())} onChange={(e) => setStartDate(e.target.value)} className={inputCls} data-testid="booking-start-date" />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Return</label>
                    <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} data-testid="booking-end-date" />
                  </div>
                </div>
                <p className="font-marker text-acid">recommended trip length: {dest.duration_days} days</p>
              </div>
            )}

            {step === 1 && (
              <div className="max-w-2xl space-y-8">
                <h2 className="font-display text-4xl uppercase">How big is the squad?</h2>
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                    className="flex h-16 w-16 items-center justify-center border border-white/20 text-white transition hover:border-blaze hover:text-blaze"
                    data-testid="travelers-minus"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <span className="w-32 text-center font-display text-8xl text-acid" data-testid="travelers-count">{travelers}</span>
                  <button
                    onClick={() => setTravelers((t) => Math.min(12, t + 1))}
                    className="flex h-16 w-16 items-center justify-center border border-white/20 text-white transition hover:border-blaze hover:text-blaze"
                    data-testid="travelers-plus"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">{travelers === 1 ? 'Solo mission. Respect.' : `${travelers} travelers · max 12`}</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <h2 className="font-display text-4xl uppercase">Pick your intensity.</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(TIER_META).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setTier(key)}
                      className={`border p-6 text-left transition ${
                        tier === key ? 'border-blaze bg-blaze/10' : 'border-white/15 hover:border-white/40'
                      }`}
                      data-testid={`tier-select-${key}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-display text-3xl uppercase ${key === 'legend' ? 'text-acid' : key === 'elite' ? 'text-blaze' : 'text-white'}`}>{meta.label}</span>
                        <span className={`h-4 w-4 border ${tier === key ? 'border-blaze bg-blaze' : 'border-white/30'}`} />
                      </div>
                      <p className="mt-1 text-sm text-white/50">{meta.blurb}</p>
                      <div className="mt-4 font-display text-3xl">{fmt(dest.tiers[key])}<span className="ml-1 font-mono text-[10px] uppercase text-white/40">/person</span></div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-10 lg:grid-cols-2">
                <div>
                  <h2 className="font-display text-4xl uppercase">The damage.</h2>
                  <div className="mt-8 border border-white/15">
                    <div className="relative h-40 overflow-hidden">
                      <img src={`${dest.image}?auto=format&fit=crop&w=1000&q=70`} alt={dest.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-3 left-4 font-display text-4xl uppercase">{dest.name}, {dest.country}</div>
                    </div>
                    <div className="space-y-4 p-6 font-mono text-sm">
                      <div className="flex justify-between"><span className="text-white/50">DATES</span><span data-testid="review-dates">{startDate} → {endDate}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">TRAVELERS</span><span data-testid="review-travelers">×{travelers}</span></div>
                      <div className="flex justify-between"><span className="text-white/50">TIER</span><span className="uppercase text-blaze" data-testid="review-tier">{TIER_META[tier].label}</span></div>
                      <div className="dashed-divider" />
                      <div className="flex justify-between"><span className="text-white/50">PER PERSON</span><span>{fmt(dest.tiers[tier])}</span></div>
                      <div className="flex items-end justify-between">
                        <span className="text-white/50">TOTAL</span>
                        <span className="font-display text-5xl text-acid" data-testid="review-total">{fmt(total)}</span>
                      </div>
                      <p className="text-right text-[10px] uppercase text-white/30">+ applicable taxes at checkout</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <p className="mb-6 font-marker text-xl text-acid">last chance to chicken out…</p>
                  <button
                    onClick={lockItIn}
                    disabled={busy}
                    className="group flex w-full items-center justify-center gap-3 bg-acid px-8 py-6 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black shadow-brutal transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-60"
                    data-testid="lock-it-in-btn"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <>
                        <Lock className="h-4 w-4" /> Lock it in — pay now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                    Secure Stripe checkout · test mode · card 4242 4242 4242 4242
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-8">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] text-white transition hover:border-white/50 disabled:opacity-30"
            data-testid="booking-back-btn"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < 3 && (
            <button
              onClick={nextStep}
              className="group flex items-center gap-2 bg-blaze px-8 py-3 font-mono text-xs font-bold uppercase tracking-[0.25em] text-black transition hover:bg-blaze-hover"
              data-testid="booking-next-btn"
            >
              Next <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

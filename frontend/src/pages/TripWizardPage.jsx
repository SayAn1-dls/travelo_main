import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Loader2, MapPin, Users, Wallet } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const toISO = (d) => d.toISOString().slice(0, 10);
const STEPS = ['Where', 'Squad', 'Dates', 'Budget', 'Review'];

const inputCls =
  'w-full border border-white/15 bg-zinc-950 px-4 py-4 font-mono text-sm text-white placeholder:text-white/30 outline-none transition focus:border-blaze';

export default function TripWizardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [place, setPlace] = useState('');
  const [count, setCount] = useState(2);
  const [myContribution, setMyContribution] = useState('');
  const [myHandle, setMyHandle] = useState('');
  const [companions, setCompanions] = useState([
    { name: '', contribution: '', payment_handle: '' },
    { name: '', contribution: '', payment_handle: '' },
  ]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');

  const setCompanionCount = (nRaw) => {
    const n = Math.max(0, Math.min(19, parseInt(nRaw || '0', 10) || 0));
    setCount(n);
    setCompanions((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ name: '', contribution: '', payment_handle: '' });
      return next.slice(0, n);
    });
  };

  const setComp = (i, key) => (e) => {
    const v = e.target.value;
    setCompanions((prev) => prev.map((c, idx) => (idx === i ? { ...c, [key]: v } : c)));
  };

  const pool = useMemo(
    () => (parseFloat(myContribution) || 0) + companions.reduce((s, c) => s + (parseFloat(c.contribution) || 0), 0),
    [myContribution, companions]
  );

  const validate = () => {
    if (step === 0 && place.trim().length < 2) return 'Tell us where you\u2019re going.';
    if (step === 1) {
      if (companions.some((c) => !c.name.trim())) return 'Every traveler needs a name.';
      if ((parseFloat(myContribution) || 0) < 0) return 'Contribution can\u2019t be negative.';
    }
    if (step === 2) {
      if (!startDate || !endDate) return 'Pick both dates.';
      if (new Date(endDate) <= new Date(startDate)) return 'Return must be after departure.';
    }
    if (step === 3 && !(parseFloat(budget) > 0)) return 'Set a real budget.';
    return null;
  };

  const nextStep = () => {
    const err = validate();
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, 4));
  };

  const create = async () => {
    setBusy(true);
    try {
      const members = [
        { name: `${user.name} (You)`, contribution: parseFloat(myContribution) || 0, payment_handle: myHandle.trim() },
        ...companions.map((c) => ({ name: c.name.trim(), contribution: parseFloat(c.contribution) || 0, payment_handle: c.payment_handle.trim() })),
      ];
      const trip = await api.createTrip({ place: place.trim(), start_date: startDate, end_date: endDate, budget: parseFloat(budget), members });
      toast.success('Trip plan locked in. Time to spend wisely.');
      navigate(`/planner/${trip.id}`);
    } catch (err) {
      toast.error(err.message || 'Could not create trip');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      <div className="mx-auto max-w-4xl px-5 py-14 md:px-8">
        <Link to="/planner" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60 hover:text-acid">
          <ArrowLeft className="h-4 w-4" /> All plans
        </Link>
        <h1 className="mt-6 font-display text-[clamp(3rem,8vw,6.5rem)] uppercase leading-[0.85]">
          New <span className="text-outline-blaze">expedition.</span>
        </h1>

        {/* Progress */}
        <div className="mt-10 grid grid-cols-5 gap-2" data-testid="wizard-progress">
          {STEPS.map((s, i) => (
            <div key={s}>
              <div className={`h-1.5 ${i <= step ? 'bg-blaze' : 'bg-white/10'}`} />
              <span className={`mt-2 block font-mono text-[10px] uppercase tracking-[0.15em] ${i <= step ? 'text-blaze' : 'text-white/30'}`}>
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
            className="mt-12 min-h-[340px]"
          >
            {step === 0 && (
              <div className="max-w-2xl space-y-8">
                <h2 className="flex items-center gap-3 font-display text-4xl uppercase"><MapPin className="h-8 w-8 text-blaze" /> Where are you escaping to?</h2>
                <input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="E.G. GOA, PARIS, ANYWHERE BUT YOUR DESK…"
                  className={`${inputCls} py-6 text-lg`}
                  data-testid="wizard-place-input"
                  autoFocus
                />
                <p className="font-marker text-acid">type any place on the planet. we don't judge.</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <h2 className="flex items-center gap-3 font-display text-4xl uppercase"><Users className="h-8 w-8 text-blaze" /> Who's coming with you?</h2>
                <div className="max-w-xs">
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">How many people are going with you?</label>
                  <input
                    type="number"
                    min="0"
                    max="19"
                    value={count}
                    onChange={(e) => setCompanionCount(e.target.value)}
                    className={inputCls}
                    data-testid="wizard-count-input"
                  />
                </div>

                <div className="space-y-4">
                  {/* Owner row */}
                  <div className="border border-blaze/50 bg-blaze/5 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-display text-2xl uppercase">{user?.name} <span className="text-blaze">(You)</span></span>
                      <span className="bg-blaze px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-black">Trip captain</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        min="0"
                        value={myContribution}
                        onChange={(e) => setMyContribution(e.target.value)}
                        placeholder="MONEY YOU BRING (₹)"
                        className={inputCls}
                        data-testid="wizard-my-contribution"
                      />
                      <input
                        value={myHandle}
                        onChange={(e) => setMyHandle(e.target.value)}
                        placeholder="UPI ID / PAYPAL.ME (OPTIONAL)"
                        className={inputCls}
                        data-testid="wizard-my-handle"
                      />
                    </div>
                  </div>

                  {/* Companion rows */}
                  {companions.map((c, i) => (
                    <div key={i} className="border border-white/15 p-5" data-testid={`wizard-member-row-${i}`}>
                      <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Traveler {String(i + 2).padStart(2, '0')}</span>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          value={c.name}
                          onChange={setComp(i, 'name')}
                          placeholder="FULL NAME"
                          className={inputCls}
                          data-testid={`wizard-member-name-${i}`}
                        />
                        <input
                          type="number"
                          min="0"
                          value={c.contribution}
                          onChange={setComp(i, 'contribution')}
                          placeholder="MONEY THEY BRING (₹)"
                          className={inputCls}
                          data-testid={`wizard-member-contribution-${i}`}
                        />
                        <input
                          value={c.payment_handle}
                          onChange={setComp(i, 'payment_handle')}
                          placeholder="UPI / PAYPAL (OPTIONAL)"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 border border-acid/40 bg-acid/5 px-5 py-4">
                  <Wallet className="h-6 w-6 text-acid" />
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-white/60">Total squad pool</span>
                  <span className="ml-auto font-display text-4xl text-acid" data-testid="wizard-pool-total">{fmt(pool)}</span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="max-w-2xl space-y-8">
                <h2 className="font-display text-4xl uppercase">When does it happen?</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Departure</label>
                    <input type="date" value={startDate} min={toISO(new Date())} onChange={(e) => setStartDate(e.target.value)} className={inputCls} data-testid="wizard-start-date" />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Return</label>
                    <input type="date" value={endDate} min={startDate || toISO(new Date())} onChange={(e) => setEndDate(e.target.value)} className={inputCls} data-testid="wizard-end-date" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-2xl space-y-8">
                <h2 className="font-display text-4xl uppercase">What's the damage limit?</h2>
                <input
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="TRIP BUDGET (₹)"
                  className={`${inputCls} py-6 text-lg`}
                  data-testid="wizard-budget-input"
                />
                <div className="space-y-2 font-mono text-xs uppercase tracking-[0.25em]">
                  <p className="text-white/50">Squad pool: <span className="text-acid">{fmt(pool)}</span></p>
                  {parseFloat(budget) > 0 && (
                    pool >= parseFloat(budget) ? (
                      <p className="text-acid">✓ Pool covers the budget. Financially elite.</p>
                    ) : (
                      <p className="text-blaze">⚠ Pool is {fmt(parseFloat(budget) - pool)} short of budget. Someone's card is getting swiped.</p>
                    )
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-10 lg:grid-cols-2">
                <div className="border border-white/15 p-6">
                  <h2 className="font-display text-4xl uppercase">The plan.</h2>
                  <div className="mt-6 space-y-4 font-mono text-sm">
                    <div className="flex justify-between"><span className="text-white/50">DESTINATION</span><span className="uppercase text-white" data-testid="review-place">{place}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">DATES</span><span>{startDate} → {endDate}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">SQUAD</span><span>×{companions.length + 1}</span></div>
                    <div className="dashed-divider" />
                    <div className="flex justify-between"><span className="text-white/50">BUDGET</span><span className="text-blaze">{fmt(parseFloat(budget))}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">SQUAD POOL</span><span className="font-display text-3xl text-acid">{fmt(pool)}</span></div>
                  </div>
                  <div className="mt-6 space-y-2">
                    {[{ name: `${user?.name} (You)`, contribution: myContribution }, ...companions].map((m, i) => (
                      <div key={i} className="flex justify-between border-t border-white/10 py-2 font-mono text-xs uppercase tracking-widest text-white/60">
                        <span>{m.name}</span><span>brings {fmt(parseFloat(m.contribution) || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <p className="mb-6 font-marker text-xl text-acid">money talk done. now the fun part.</p>
                  <button
                    onClick={create}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-3 bg-acid px-8 py-6 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black shadow-brutal transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-60"
                    data-testid="wizard-create-btn"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create the plan <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-8">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] text-white transition hover:border-white/50 disabled:opacity-30"
            data-testid="wizard-back-btn"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < 4 && (
            <button
              onClick={nextStep}
              className="group flex items-center gap-2 bg-blaze px-8 py-3 font-mono text-xs font-bold uppercase tracking-[0.25em] text-black transition hover:bg-blaze-hover"
              data-testid="wizard-next-btn"
            >
              Next <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

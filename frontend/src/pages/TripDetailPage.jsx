import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Loader2, Trash2, Users, Bell, BellRing, Wallet,
  UtensilsCrossed, BedDouble, Plane, Car, Sparkles, Package, ExternalLink, X, Send, CheckCircle2,
  MessagesSquare,
} from 'lucide-react';
import api from '@/lib/api';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0);
const fmt0 = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const CATEGORIES = [
  { id: 'general', label: 'General', icon: Package },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'hotel', label: 'Hotel', icon: BedDouble },
  { id: 'flight', label: 'Flight', icon: Plane },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'activity', label: 'Activity', icon: Sparkles },
];

const catIcon = (id) => {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.icon : Package;
};

function openPayApp(handle, amount) {
  if (!handle) return false;
  let url;
  if (handle.startsWith('http')) url = handle;
  else if (handle.includes('@')) url = `upi://pay?pa=${encodeURIComponent(handle)}&am=${amount}&cu=INR`;
  else url = `https://paypal.me/${encodeURIComponent(handle)}/${amount}`;
  window.open(url, '_blank');
  return true;
}

const inputCls =
  'w-full border border-white/15 bg-zinc-950 px-4 py-3.5 font-mono text-sm text-white placeholder:text-white/30 outline-none transition focus:border-blaze';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showExpense, setShowExpense] = useState(false);
  const [busyAction, setBusyAction] = useState('');

  const loadNotifications = useCallback(() => {
    api.tripNotifications(id).then(setNotifications).catch(() => {});
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.trip(id)
      .then(setTrip)
      .catch(() => {
        toast.error('Trip plan not found');
        navigate('/planner');
      });
    loadNotifications();
  }, [id, navigate, loadNotifications]);

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-blaze" />
      </div>
    );
  }

  const fin = trip.finances;
  const over = fin.budget_status === 'over';
  const pct = Math.min(100, fin.budget_used_pct || 0);
  const memberName = (mid) => (trip.members.find((m) => m.id === mid) || {}).name || '?';

  const addExpense = async (payload) => {
    try {
      const updated = await api.addExpense(trip.id, payload);
      setTrip(updated);
      setShowExpense(false);
      loadNotifications();
      toast.success('Expense logged. Pool updated.');
    } catch (err) {
      toast.error(err.message || 'Could not add expense');
    }
  };

  const removeExpense = async (expenseId) => {
    try {
      const updated = await api.deleteExpense(trip.id, expenseId);
      setTrip(updated);
      loadNotifications();
      toast.success('Expense removed.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const settle = async (s) => {
    setBusyAction(`settle-${s.from_member}-${s.to_member}`);
    try {
      const updated = await api.settle(trip.id, s);
      setTrip(updated);
      loadNotifications();
      toast.success(`${memberName(s.from_member)} paid back ${fmt(s.amount)}. Respect.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyAction('');
    }
  };

  const payAndSettle = (s) => {
    const creditor = trip.members.find((m) => m.id === s.to_member);
    const opened = openPayApp(creditor?.payment_handle, s.amount);
    if (opened) {
      toast.info(`Payment app opened for ${creditor.name}. Hit "Mark paid" once the transfer is done.`);
    } else {
      toast.info(`${creditor?.name} has no payment handle saved. Pay them directly, then hit "Mark paid".`);
    }
  };

  const remind = async () => {
    setBusyAction('remind');
    try {
      const res = await api.remind(trip.id);
      loadNotifications();
      if (res.count > 0) toast.success(`Reminders fired at ${res.reminded.join(', ')}. No mercy.`);
      else toast.success('Everyone is settled. Elite squad.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyAction('');
    }
  };

  const deleteTrip = async () => {
    if (!window.confirm('Delete this trip plan and all its expenses?')) return;
    try {
      await api.deleteTrip(trip.id);
      toast.success('Trip plan deleted.');
      navigate('/planner');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const bookingLinks = [
    { label: 'Book hotels', icon: BedDouble, url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(trip.place)}` },
    { label: 'Book flights', icon: Plane, url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights to ${trip.place}`)}` },
    { label: 'Rent a car', icon: Car, url: `https://www.google.com/search?q=${encodeURIComponent(`rent a car in ${trip.place}`)}` },
  ];

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Link to="/planner" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60 hover:text-acid">
              <ArrowLeft className="h-4 w-4" /> All plans
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 font-display text-[clamp(3rem,9vw,8rem)] uppercase leading-[0.85]"
              data-testid="trip-detail-title"
            >
              {trip.place}<span className="text-blaze">.</span>
            </motion.h1>
            <p className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
              <span>{trip.start_date} → {trip.end_date}</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-blaze" /> squad of {trip.members.length}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/squad?create=${encodeURIComponent(trip.place)}`}
              className="flex items-center gap-2 border border-acid/40 bg-acid/5 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-acid transition hover:bg-acid hover:text-black"
              data-testid="open-squad-chat-btn"
            >
              <MessagesSquare className="h-3.5 w-3.5" /> Squad chat
            </Link>
            <button
              onClick={deleteTrip}
              className="flex items-center gap-2 border border-white/15 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 transition hover:border-blaze hover:text-blaze"
              data-testid="delete-trip-btn"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete plan
            </button>
          </div>
        </div>

        {/* Finance strip */}
        <div className="mt-10 grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
          {[
            [fmt0(fin.pool), 'Squad pool'],
            [fmt0(fin.spent), 'Spent so far'],
            [fmt0(fin.remaining), 'Left in pool'],
            [fmt0(Math.abs(fin.budget_left)), over ? 'Over budget by' : 'Budget left'],
          ].map(([num, label], i) => (
            <div key={label} className="bg-ink p-6 text-center md:p-8">
              <div className={`font-display text-3xl md:text-5xl ${i === 3 ? (over ? 'text-blaze' : 'text-acid') : 'text-white'}`}>{num}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">{label}</div>
            </div>
          ))}
        </div>

        {/* Budget bar */}
        <div className="mt-6 border border-white/15 p-6" data-testid="budget-analysis">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">
              Budget burn: {fmt0(fin.spent)} of {fmt0(fin.budget)} ({fin.budget_used_pct}%)
            </span>
            <span className={`px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${over ? 'bg-blaze text-black' : 'bg-acid text-black'}`} data-testid="budget-status-badge">
              {over ? '⚠ Over budget' : '✓ Under budget'}
            </span>
          </div>
          <div className="mt-4 h-3 w-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${over ? 'bg-blaze' : 'bg-acid'}`}
            />
          </div>
          {over && <p className="mt-3 font-marker text-blaze">the budget is a memory now. proceed with style.</p>}
        </div>

        {/* Main grid */}
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {/* LEFT 2/3 — expenses + bookings */}
          <div className="space-y-10 lg:col-span-2">
            {/* Expenses */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-4xl uppercase">The spending<span className="text-blaze">.</span></h2>
                <button
                  onClick={() => setShowExpense(true)}
                  className="flex items-center gap-2 bg-blaze px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-blaze-hover"
                  data-testid="add-expense-btn"
                >
                  <Plus className="h-4 w-4" /> Add expense
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {trip.expenses.length === 0 && (
                  <div className="border border-white/10 py-14 text-center">
                    <p className="font-display text-3xl uppercase text-outline">Nothing spent yet.</p>
                    <p className="mt-2 font-marker text-acid">the pool is intact. for now.</p>
                  </div>
                )}
                {trip.expenses.map((e) => {
                  const Icon = catIcon(e.category);
                  return (
                    <div key={e.id} className="flex items-center gap-4 border border-white/15 p-4" data-testid={`expense-row-${e.id}`}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-white/5 text-acid">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-white">{e.description}</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                          paid by <span className="text-blaze">{e.paid_by_name}</span> · {e.category} · {new Date(e.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-display text-2xl text-white">{fmt(e.amount)}</span>
                      <button onClick={() => removeExpense(e.id)} className="text-white/25 transition hover:text-blaze" data-testid={`delete-expense-${e.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Booking essentials */}
            <div>
              <h2 className="font-display text-4xl uppercase">Book the essentials<span className="text-blaze">.</span></h2>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Hotels, flights, wheels — sorted for {trip.place}.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {bookingLinks.map((b) => (
                  <a
                    key={b.label}
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group border border-white/15 p-6 transition hover:border-acid"
                    data-testid={`booking-link-${b.label.toLowerCase().replace(/ /g, '-')}`}
                  >
                    <b.icon className="h-7 w-7 text-blaze transition group-hover:text-acid" />
                    <p className="mt-4 font-display text-2xl uppercase">{b.label}</p>
                    <p className="mt-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Opens partner site <ExternalLink className="h-3 w-3" />
                    </p>
                  </a>
                ))}
              </div>
              <Link
                to="/explore"
                className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-acid hover:text-white"
              >
                or book a full TRAVELO package →
              </Link>
            </div>
          </div>

          {/* RIGHT 1/3 — ledger, settle, notifications */}
          <div className="space-y-10">
            {/* Squad ledger */}
            <div>
              <h2 className="flex items-center gap-2 font-display text-3xl uppercase"><Wallet className="h-6 w-6 text-blaze" /> Squad ledger</h2>
              <div className="mt-5 space-y-3">
                {fin.members.map((m) => (
                  <div key={m.id} className="border border-white/15 p-4" data-testid={`member-card-${m.id}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{m.name}</span>
                      {Math.abs(m.balance) < 0.01 ? (
                        <span className="bg-white/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/60">Even ✓</span>
                      ) : m.balance > 0 ? (
                        <span className="bg-acid px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-black">Gets back {fmt(m.balance)}</span>
                      ) : (
                        <span className="bg-blaze px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-black">Owes {fmt(Math.abs(m.balance))}</span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
                      <div>Brought<br /><span className="text-white">{fmt0(m.contribution)}</span></div>
                      <div>Spent<br /><span className="text-white">{fmt0(m.paid)}</span></div>
                      <div>Share<br /><span className="text-white">{fmt0(m.share)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settle up */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl uppercase">Settle up</h2>
                <button
                  onClick={remind}
                  disabled={busyAction === 'remind'}
                  className="flex items-center gap-2 border border-blaze px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blaze transition hover:bg-blaze hover:text-black disabled:opacity-50"
                  data-testid="remind-btn"
                >
                  {busyAction === 'remind' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
                  Remind debtors
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {fin.all_settled ? (
                  <div className="flex items-center gap-3 border border-acid/40 bg-acid/5 p-4" data-testid="all-settled">
                    <CheckCircle2 className="h-5 w-5 text-acid" />
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-acid">Everyone is squared up.</span>
                  </div>
                ) : (
                  fin.settle_suggestions.map((s, i) => (
                    <div key={i} className="border border-white/15 p-4" data-testid={`settle-suggestion-${i}`}>
                      <p className="font-mono text-xs uppercase tracking-wider">
                        <span className="text-blaze">{memberName(s.from_member)}</span>
                        <span className="text-white/40"> pays </span>
                        <span className="text-acid">{memberName(s.to_member)}</span>
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-display text-3xl">{fmt(s.amount)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => payAndSettle(s)}
                            className="flex items-center gap-1.5 bg-blaze px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-black transition hover:bg-blaze-hover"
                            data-testid={`pay-btn-${i}`}
                          >
                            <Send className="h-3 w-3" /> Pay
                          </button>
                          <button
                            onClick={() => settle(s)}
                            disabled={busyAction === `settle-${s.from_member}-${s.to_member}`}
                            className="border border-white/25 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition hover:border-acid hover:text-acid disabled:opacity-50"
                            data-testid={`mark-paid-btn-${i}`}
                          >
                            {busyAction === `settle-${s.from_member}-${s.to_member}` ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark paid'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h2 className="flex items-center gap-2 font-display text-3xl uppercase"><Bell className="h-6 w-6 text-acid" /> Squad feed</h2>
              <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1" data-testid="notifications-feed">
                {notifications.length === 0 && (
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">No activity yet.</p>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`border-l-2 p-3 text-sm ${
                      n.type === 'reminder' ? 'border-blaze bg-blaze/5' : n.type === 'settlement' ? 'border-acid bg-acid/5' : 'border-white/20 bg-white/[0.03]'
                    }`}
                  >
                    <p className="text-white/80">{n.message}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white/30">
                      {n.type} · {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showExpense && (
        <ExpenseModal trip={trip} onClose={() => setShowExpense(false)} onSubmit={addExpense} />
      )}
    </div>
  );
}

function ExpenseModal({ trip, onClose, onSubmit }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [paidBy, setPaidBy] = useState(trip.members[0]?.id || '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!(parseFloat(amount) > 0)) return toast.error('Enter a real amount.');
    setBusy(true);
    await onSubmit({ description: description.trim(), amount: parseFloat(amount), paid_by: paidBy, category });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm" data-testid="expense-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg border border-white/15 bg-ink p-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-3xl uppercase">Log an expense<span className="text-blaze">.</span></h3>
          <button onClick={onClose} className="text-white/40 hover:text-white" data-testid="expense-modal-close"><X className="h-6 w-6" /></button>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="WHAT WAS IT? (E.G. BEACH SHACK DINNER)"
            className={inputCls}
            data-testid="expense-description-input"
          />
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="AMOUNT ($)"
            className={inputCls}
            data-testid="expense-amount-input"
          />

          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
                    category === c.id ? 'border-blaze bg-blaze text-black' : 'border-white/15 text-white/60 hover:border-white/40'
                  }`}
                  data-testid={`expense-category-${c.id}`}
                >
                  <c.icon className="h-3.5 w-3.5" /> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Who paid?</label>
            <div className="flex flex-wrap gap-2">
              {trip.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaidBy(m.id)}
                  className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
                    paidBy === m.id ? 'border-acid bg-acid text-black' : 'border-white/15 text-white/60 hover:border-white/40'
                  }`}
                  data-testid={`expense-paidby-${m.id}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-blaze-hover disabled:opacity-60"
            data-testid="expense-submit-btn"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record it'}
          </button>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            Splits equally across the squad · deducted from the pool
          </p>
        </form>
      </motion.div>
    </div>
  );
}

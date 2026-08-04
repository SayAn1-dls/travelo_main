import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Loader2, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const STATUS_STYLES = {
  confirmed: 'bg-acid text-black',
  pending_payment: 'bg-blaze text-black',
  cancelled: 'bg-white/10 text-white/50',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    api.bookings().then(setBookings).catch(() => setBookings([]));
  }, []);

  const payNow = async (bookingId) => {
    setPayingId(bookingId);
    try {
      const { checkout_url } = await api.checkout({ booking_id: bookingId, origin_url: window.location.origin });
      window.location.href = checkout_url;
    } catch (err) {
      toast.error(err.message || 'Checkout failed');
      setPayingId(null);
    }
  };

  const confirmed = (bookings || []).filter((b) => b.status === 'confirmed');
  const totalSpent = confirmed.reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">// Mission control</p>
          <h1 className="mt-3 font-display text-[clamp(3rem,9vw,8rem)] uppercase leading-[0.85]" data-testid="dashboard-title">
            {user?.name?.split(' ')[0]}'s <span className="text-outline-blaze">escapes.</span>
          </h1>
        </motion.div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-3 gap-px bg-white/10">
          {[
            [bookings ? bookings.length : '—', 'Trips booked'],
            [bookings ? confirmed.length : '—', 'Confirmed'],
            [bookings ? fmt(totalSpent) : '—', 'Invested in life'],
          ].map(([num, label]) => (
            <div key={label} className="bg-ink p-6 text-center md:p-8">
              <div className="font-display text-4xl text-acid md:text-6xl">{num}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">{label}</div>
            </div>
          ))}
        </div>

        {/* Bookings */}
        <div className="mt-12 space-y-6">
          {bookings === null && (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blaze" /></div>
          )}

          {bookings && bookings.length === 0 && (
            <div className="border border-white/10 py-24 text-center" data-testid="dashboard-empty">
              <p className="font-display text-5xl uppercase text-outline md:text-7xl">Your passport is crying.</p>
              <p className="mt-4 font-marker text-xl text-acid">zero trips booked. fix that.</p>
              <Link
                to="/explore"
                className="group mt-8 inline-flex items-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-blaze-hover"
              >
                Explore destinations <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}

          {bookings && bookings.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col overflow-hidden border border-white/15 md:flex-row"
              data-testid={`booking-card-${b.id}`}
            >
              <div className="relative h-44 w-full shrink-0 md:h-auto md:w-56">
                <img src={`${b.image}?auto=format&fit=crop&w=600&q=60`} alt={b.destination_name} className="h-full w-full object-cover" />
                <span className={`absolute left-3 top-3 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${STATUS_STYLES[b.status] || 'bg-white/10'}`} data-testid="booking-status">
                  {b.status === 'pending_payment' ? 'Payment due' : b.status}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
                <div>
                  <h3 className="font-display text-4xl uppercase leading-none">{b.destination_name}</h3>
                  <p className="mt-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                    <MapPin className="h-3.5 w-3.5 text-blaze" /> {b.country} · {b.start_date} → {b.end_date}
                  </p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                    ×{b.travelers} travelers · <span className="text-blaze">{b.tier}</span> tier
                  </p>
                </div>

                <div className="flex items-center gap-6 md:flex-col md:items-end">
                  <span className="font-display text-4xl text-acid">{fmt(b.amount)}</span>
                  {b.status === 'pending_payment' && (
                    <button
                      onClick={() => payNow(b.id)}
                      disabled={payingId === b.id}
                      className="flex items-center gap-2 bg-blaze px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-blaze-hover disabled:opacity-60"
                      data-testid={`pay-now-${b.id}`}
                    >
                      {payingId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete payment'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

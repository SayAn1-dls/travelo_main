import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, PartyPopper } from 'lucide-react';
import api, { getToken } from '@/lib/api';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [state, setState] = useState('checking'); // checking | paid | pending | error
  const [booking, setBooking] = useState(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      setState('error');
      return;
    }
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      attempts.current += 1;
      try {
        const res = await api.paymentStatus(sessionId);
        if (cancelled) return;
        if (res.payment_status === 'paid') {
          setState('paid');
          if (res.booking_id && getToken()) {
            api.booking(res.booking_id).then(setBooking).catch(() => {});
          }
          return;
        }
        if (res.payment_status === 'expired' || res.payment_status === 'failed') {
          setState('error');
          return;
        }
      } catch (e) {
        // keep polling on transient errors
      }
      if (attempts.current >= 12) {
        setState('pending');
        return;
      }
      setTimeout(poll, 2500);
    }
    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink pt-16 text-white">
      <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center">
        {state === 'checking' && (
          <div data-testid="payment-checking">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blaze" />
            <h1 className="mt-8 font-display text-6xl uppercase">Verifying<span className="text-blaze">…</span></h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-white/50">Confirming your payment with Stripe. Hold tight.</p>
          </div>
        )}

        {state === 'paid' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} data-testid="payment-success">
            <PartyPopper className="mx-auto h-12 w-12 text-acid" />
            <h1 className="mt-6 font-display text-[clamp(5rem,15vw,12rem)] uppercase leading-none text-acid">Paid.</h1>
            <p className="font-marker text-2xl text-blaze">pack your bags, legend.</p>

            {booking && (
              <div className="mx-auto mt-10 max-w-md border border-white/15 text-left">
                <div className="flex items-center justify-between bg-blaze px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.25em] text-black">
                  <span>Boarding pass</span>
                  <span>Confirmed ✓</span>
                </div>
                <div className="space-y-3 p-5 font-mono text-sm">
                  <div className="font-display text-4xl uppercase text-white">{booking.destination_name}, {booking.country}</div>
                  <div className="dashed-divider" />
                  <div className="flex justify-between"><span className="text-white/50">DATES</span><span>{booking.start_date} → {booking.end_date}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">SQUAD</span><span>×{booking.travelers}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">TIER</span><span className="uppercase text-blaze">{booking.tier}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">PAID</span><span className="text-acid">{fmt(booking.amount)}</span></div>
                </div>
              </div>
            )}

            <Link
              to="/dashboard"
              className="group mt-10 inline-flex items-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-blaze-hover"
              data-testid="view-my-trips-btn"
            >
              View my trips <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}

        {state === 'pending' && (
          <div data-testid="payment-pending">
            <h1 className="font-display text-6xl uppercase text-outline">Still processing…</h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-white/50">
              Payment is taking longer than usual. Check your trips in a minute.
            </p>
            <Link to="/dashboard" className="mt-8 inline-block border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-[0.25em] text-white hover:border-acid hover:text-acid">
              Go to my trips
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div data-testid="payment-error">
            <h1 className="font-display text-6xl uppercase text-blaze">Something broke.</h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-white/50">We couldn't verify this payment session.</p>
            <Link to="/dashboard" className="mt-8 inline-block border border-white/20 px-8 py-4 font-mono text-xs uppercase tracking-[0.25em] text-white hover:border-acid hover:text-acid">
              Check my trips
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

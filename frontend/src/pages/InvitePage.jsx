import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Users, CalendarDays, Wallet, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const fmtINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    api.inviteInfo(token).then(setInvite).catch(() => setError(true));
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await api.acceptInvite(token);
      toast.success(`You're in! Welcome to the ${res.place} squad.`);
      navigate('/squad');
    } catch (err) {
      toast.error(err.message || 'Could not accept invite');
      setAccepting(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-5 pt-16 text-center text-white">
        <h1 className="font-display text-6xl uppercase text-outline-blaze">Invite expired.</h1>
        <p className="mt-4 font-marker text-xl text-acid">ask your friend to send a fresh one.</p>
        <Link to="/" className="mt-8 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black">
          Explore Travelo
        </Link>
      </div>
    );
  }

  if (!invite || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-blaze" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 pt-16 text-white">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl py-16 text-center" data-testid="invite-page">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">// You've been summoned</p>
        <h1 className="mt-4 font-display uppercase leading-[0.85]">
          <span className="block text-[clamp(2.5rem,8vw,5.5rem)]">Join the</span>
          <span className="block text-[clamp(2.5rem,8vw,5.5rem)] text-blaze">{invite.trip.place}</span>
          <span className="block text-[clamp(2.5rem,8vw,5.5rem)] text-outline">squad.</span>
        </h1>
        <p className="mt-4 font-marker text-lg text-acid">{invite.invited_by_name} wants you on this trip. obviously say yes.</p>

        <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-px border border-white/15 bg-white/10">
          {[
            [CalendarDays, `${invite.trip.start_date}`, 'departure'],
            [Users, `×${invite.trip.member_count}`, 'squad size'],
            [Wallet, fmtINR(invite.trip.budget), 'budget'],
          ].map(([Icon, val, label]) => (
            <div key={label} className="bg-ink p-4">
              <Icon className="mx-auto h-4 w-4 text-blaze" />
              <div className="mt-2 font-display text-lg">{val}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">{label}</div>
            </div>
          ))}
        </div>

        {invite.status === 'accepted' ? (
          <div className="mt-10" data-testid="invite-already-accepted">
            <p className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-acid">
              <CheckCircle2 className="h-4 w-4" /> Invite already accepted
            </p>
            <Link to="/squad" className="mt-6 inline-flex items-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black">
              Open squad chat <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : user ? (
          <button
            onClick={accept}
            disabled={accepting}
            className="group mt-10 inline-flex items-center gap-3 bg-acid px-10 py-5 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black shadow-brutal transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-60"
            data-testid="accept-invite-btn"
          >
            {accepting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>Yes, count me in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
            )}
          </button>
        ) : (
          <div className="mt-10">
            <Link
              to={`/auth?mode=register&next=${encodeURIComponent(`/invite/${token}`)}`}
              className="group inline-flex items-center gap-3 bg-acid px-10 py-5 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black shadow-brutal transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              data-testid="invite-signup-btn"
            >
              Yes — sign in & join <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Takes 20 seconds · you'll land straight in the trip + squad chat
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

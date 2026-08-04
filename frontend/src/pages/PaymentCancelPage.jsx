import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink pt-16 text-white">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="px-5 text-center" data-testid="payment-cancel">
        <h1 className="font-display text-[clamp(4rem,12vw,10rem)] uppercase leading-none">
          You <span className="text-outline-blaze">blinked.</span>
        </h1>
        <p className="mt-4 font-marker text-2xl text-acid">the checkout was cancelled. the wanderlust wasn't.</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-white/50">
          Your booking is saved — finish paying whenever you're ready.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black transition hover:bg-blaze-hover"
            data-testid="cancel-goto-trips"
          >
            Finish payment in my trips <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/explore" className="border border-white/20 px-8 py-4 font-mono text-sm uppercase tracking-[0.25em] text-white transition hover:border-acid hover:text-acid">
            Keep exploring
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

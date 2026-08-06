import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Star } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function DestinationCard({ dest, index = 0 }) {
  return (
    <motion.div
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.1 }}
    >
      <Link
        to={`/destinations/${dest.id}`}
        className="group relative block overflow-hidden border border-white/10 bg-zinc-950"
        data-testid={`destination-card-${dest.id}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={`${dest.image}?auto=format&fit=crop&w=800&q=70`}
            alt={dest.name}
            loading="lazy"
            className="h-full w-full object-cover grayscale-[35%] transition duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          {/* index number */}
          <span className="absolute -right-2 top-2 font-display text-7xl text-outline opacity-40">
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* region chip */}
          <span className="absolute left-4 top-4 border border-white/30 bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur">
            {dest.region}
          </span>

          {/* price chip */}
          <span className="absolute left-4 bottom-[7.5rem] bg-acid px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-black">
            from {fmt(dest.base_price)}
          </span>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h3 className="font-display text-4xl uppercase leading-none text-white md:text-5xl">{dest.name}</h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-white/60">
                  {dest.country} · {dest.duration_days} days · <Star className="inline h-3 w-3 fill-acid text-acid" /> {dest.rating}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-blaze text-black opacity-0 transition duration-300 group-hover:opacity-100">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
        <div className="h-1 origin-left scale-x-0 bg-blaze transition-transform duration-500 group-hover:scale-x-100" />
      </Link>
    </motion.div>
  );
}

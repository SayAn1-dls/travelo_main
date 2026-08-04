import React from 'react';

/**
 * Infinite scrolling marquee strip.
 * variant: 'blaze' | 'acid' | 'ghost'
 */
export default function Marquee({ items, variant = 'blaze', slow = false, className = '' }) {
  const palette = {
    blaze: 'bg-blaze text-black',
    acid: 'bg-acid text-black',
    ghost: 'bg-transparent text-white/20 border-y border-white/10',
  };
  const row = [...items, ...items];
  return (
    <div className={`relative overflow-hidden py-3 select-none ${palette[variant]} ${className}`} data-testid="marquee-strip">
      <div className={`flex w-max items-center gap-8 whitespace-nowrap ${slow ? 'animate-marquee-slow' : 'animate-marquee'}`}>
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8 font-display text-2xl md:text-3xl uppercase tracking-wide">
            {item}
            <span className="text-base">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

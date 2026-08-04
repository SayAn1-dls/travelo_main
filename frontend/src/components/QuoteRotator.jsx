import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const FALLBACK_QUOTES = [
  { text: 'Buy the ticket. Apologize to your savings account later.', author: 'TRAVELO' },
  { text: 'Jobs fill your pocket. Adventures fill your soul.', author: 'Jaime Lyn Beatty' },
  { text: 'The mountains don\u2019t care about your excuses.', author: 'TRAVELO' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
];

export default function QuoteRotator({ interval = 5000, compact = false }) {
  const [quotes, setQuotes] = useState(FALLBACK_QUOTES);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api.quotes()
      .then((q) => { if (Array.isArray(q) && q.length) setQuotes(q.sort(() => Math.random() - 0.5)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % quotes.length), interval);
    return () => clearInterval(t);
  }, [quotes, interval]);

  const quote = quotes[index];

  return (
    <div className={compact ? 'min-h-[120px]' : 'min-h-[220px] md:min-h-[260px]'} data-testid="quote-rotator">
      <AnimatePresence mode="wait">
        <motion.blockquote
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <p className={`font-display uppercase leading-[0.95] text-white ${compact ? 'text-3xl md:text-4xl' : 'text-4xl md:text-6xl lg:text-7xl'}`}>
            “{quote.text}”
          </p>
          <footer className="font-marker text-blaze text-xl md:text-2xl">— {quote.author}</footer>
        </motion.blockquote>
      </AnimatePresence>
    </div>
  );
}

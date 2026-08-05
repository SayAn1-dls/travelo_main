import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ExternalLink, Plane, TrainFront, Car, Lightbulb, UtensilsCrossed, Gem, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

/**
 * THE INTEL — AI destination knowledge dossier (spots, hidden gems, directions, food, tips).
 * Additive section rendered on DestinationPage.
 */
export default function DestinationIntel({ dest }) {
  const [guide, setGuide] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error

  const load = () => {
    setState('loading');
    api.destinationGuide(dest.id)
      .then((g) => { setGuide(g); setState('ready'); })
      .catch(() => setState('error'));
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [dest.id]);

  const mapsUrl = (name) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${dest.name}, ${dest.country}`)}`;

  return (
    <section className="border-t border-white/10" data-testid="intel-section">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">// Know before you go</p>
        <h2 className="mt-3 font-display uppercase leading-[0.85]">
          <span className="text-[clamp(2.5rem,7vw,6rem)] text-white">The </span>
          <span className="text-[clamp(2.5rem,7vw,6rem)] text-outline-blaze">intel.</span>
        </h2>
        <p className="mt-3 font-marker text-lg text-acid">everything about {dest.name} — the spots, the secrets, the directions.</p>

        {state === 'loading' && (
          <div className="mt-12 border border-white/10 py-20 text-center" data-testid="intel-loading">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blaze" />
            <p className="mt-4 font-display text-2xl uppercase text-white/60">Compiling the dossier…</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">first time takes ~30 seconds · instant after that</p>
          </div>
        )}

        {state === 'error' && (
          <div className="mt-12 border border-white/10 py-16 text-center">
            <p className="font-display text-3xl uppercase text-outline">Intel feed glitched.</p>
            <button onClick={load} className="mt-6 inline-flex items-center gap-2 bg-blaze px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.25em] text-black">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {state === 'ready' && guide && (
          <div className="mt-12 space-y-16">
            {/* Overview */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-blaze">// The story</p>
              <p className="mt-4 max-w-4xl text-lg leading-relaxed text-white/80" data-testid="intel-overview">{guide.overview}</p>
            </motion.div>

            {/* Top spots */}
            <div>
              <h3 className="font-display text-4xl uppercase">Where to roam<span className="text-blaze">.</span></h3>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {guide.top_spots.map((s, i) => (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: (i % 3) * 0.08 }}
                    className="group flex flex-col border border-white/15 bg-zinc-950"
                    data-testid={`spot-card-${i}`}
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img src={s.image} alt={s.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <span className="absolute left-3 top-3 bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-acid backdrop-blur">
                        best: {s.best_time}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h4 className="font-display text-2xl uppercase leading-none">{s.name}</h4>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{s.description}</p>
                      <p className="mt-3 font-marker text-sm text-acid">{s.why_go}</p>
                      <a
                        href={mapsUrl(s.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex w-fit items-center gap-1.5 border border-blaze/50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-blaze transition hover:bg-blaze hover:text-black"
                        data-testid={`spot-directions-${i}`}
                      >
                        Directions <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Underrated gems */}
            <div>
              <h3 className="flex items-center gap-3 font-display text-4xl uppercase">
                <Gem className="h-7 w-7 text-acid" /> The underrated<span className="text-acid">.</span>
              </h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">hidden gems the tour buses miss</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {guide.underrated.map((g, i) => (
                  <div key={g.name} className="group border border-acid/30 bg-acid/[0.03]" data-testid={`gem-card-${i}`}>
                    <div className="relative h-36 overflow-hidden">
                      <img src={g.image} alt={g.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <span className="absolute left-3 top-3 bg-acid px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-black">
                        Hidden gem
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-display text-xl uppercase leading-none">{g.name}</h4>
                      <p className="mt-2 text-xs leading-relaxed text-white/60">{g.description}</p>
                      <a
                        href={mapsUrl(g.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-acid hover:text-white"
                      >
                        Directions <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Getting there */}
            <div>
              <h3 className="font-display text-4xl uppercase">Getting there<span className="text-blaze">.</span></h3>
              <div className="mt-6 grid gap-px bg-white/10 md:grid-cols-3">
                {[
                  [Plane, 'By air', guide.getting_there?.by_air],
                  [TrainFront, 'By train', guide.getting_there?.by_train],
                  [Car, 'By road', guide.getting_there?.by_road],
                ].map(([Icon, label, text]) => (
                  <div key={label} className="bg-ink p-6" data-testid={`getting-there-${label.toLowerCase().replace(' ', '-')}`}>
                    <Icon className="h-6 w-6 text-blaze" />
                    <h4 className="mt-3 font-display text-2xl uppercase">{label}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{text}</p>
                  </div>
                ))}
              </div>
              {guide.getting_around && (
                <p className="mt-4 border border-white/10 bg-zinc-950 p-5 text-sm leading-relaxed text-white/60">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-acid">Getting around · </span>
                  {guide.getting_around}
                </p>
              )}
            </div>

            {/* Food + tips */}
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-3 font-display text-4xl uppercase">
                  <UtensilsCrossed className="h-7 w-7 text-blaze" /> Eat like a local<span className="text-blaze">.</span>
                </h3>
                <ul className="mt-6 space-y-3">
                  {guide.food.map((f) => (
                    <li key={f.dish} className="border border-white/10 bg-zinc-950 p-4">
                      <span className="font-display text-xl uppercase text-white">{f.dish}</span>
                      <p className="mt-1 text-sm text-white/60">{f.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-3 font-display text-4xl uppercase">
                  <Lightbulb className="h-7 w-7 text-acid" /> Traveler tips<span className="text-acid">.</span>
                </h3>
                <ul className="mt-6 space-y-3">
                  {guide.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-4 border border-white/10 bg-zinc-950 p-4">
                      <span className="font-display text-3xl text-outline-acid">{String(i + 1).padStart(2, '0')}</span>
                      <p className="pt-1 text-sm leading-relaxed text-white/70">{t}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

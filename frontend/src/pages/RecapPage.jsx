import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { inr } from "@/lib/api";
import BlobImage from "@/components/BlobImage";
import { AirplaneTilt, CaretLeft, CaretRight, Pause, Play, X, Quotes, UsersThree, Wallet, Images } from "@phosphor-icons/react";

export default function RecapPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [recap, setRecap] = useState(null);
  const [error, setError] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    api.get(`/recap/${token}`).then((r) => setRecap(r.data)).catch(() => setError(true));
  }, [token]);

  const slides = useMemo(() => {
    if (!recap) return [];
    return [{ kind: "title" }, ...recap.memories, { kind: "stats" }];
  }, [recap]);

  const next = useCallback(() => setIdx((i) => (i + 1) % Math.max(slides.length, 1)), [slides.length]);
  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [playing, next, slides.length]);

  if (error)
    return (
      <div className="min-h-screen bg-[#0B4F6C] text-white flex items-center justify-center px-6 text-center" data-testid="recap-error">
        <p className="font-display text-2xl">This recap link is invalid or was removed.</p>
      </div>
    );
  if (!recap)
    return (
      <div className="min-h-screen bg-[#0B4F6C] text-white flex items-center justify-center">
        <AirplaneTilt size={36} weight="duotone" className="text-[#F9B384] animate-pulse" />
      </div>
    );

  const slide = slides[idx];
  const topCategory = Object.entries(recap.stats.by_category).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="min-h-screen bg-[#0B4F6C] text-white relative overflow-hidden grain flex flex-col" data-testid="recap-page">
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
        <span className="flex items-center gap-2">
          <AirplaneTilt size={24} weight="duotone" className="text-[#F9B384]" />
          <span className="font-display font-bold text-xl">Travelo recap</span>
        </span>
        <button data-testid="recap-close-btn" onClick={() => navigate("/")} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
          <X size={18} />
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-12 pb-6">
        {slide.kind === "title" && (
          <div className="text-center max-w-2xl" data-testid="recap-slide-title">
            <p className="uppercase tracking-[0.3em] text-xs font-semibold text-[#F9B384]">The story of</p>
            <h1 className="font-display text-4xl sm:text-6xl font-bold mt-4 leading-tight">{recap.name}</h1>
            <p className="text-white/80 mt-4 text-lg">{recap.destination} · {recap.start_date} → {recap.end_date}</p>
            <p className="text-white/60 mt-2 text-sm">with {recap.members.join(" · ")}</p>
          </div>
        )}

        {slide.kind === "photo" && (
          <figure className="text-center max-w-3xl w-full" data-testid="recap-slide-photo">
            <BlobImage path={`/recap/${token}/image/${slide.id}`} alt={slide.caption || "Trip memory"} className="max-h-[58vh] w-auto mx-auto rounded-2xl shadow-2xl object-contain" />
            <figcaption className="mt-5">
              {slide.caption && <p className="font-display text-xl sm:text-2xl">{slide.caption}</p>}
              <p className="text-white/60 text-sm mt-1">captured by {slide.member_name}</p>
            </figcaption>
          </figure>
        )}

        {slide.kind === "note" && (
          <blockquote className="text-center max-w-2xl" data-testid="recap-slide-note">
            <Quotes size={40} weight="duotone" className="text-[#F9B384] mx-auto" />
            <p className="font-display italic text-2xl sm:text-4xl leading-snug mt-5 whitespace-pre-wrap">{slide.note}</p>
            <p className="text-white/60 text-sm mt-5">— {slide.member_name}</p>
          </blockquote>
        )}

        {slide.kind === "stats" && (
          <div className="text-center max-w-2xl w-full" data-testid="recap-slide-stats">
            <p className="uppercase tracking-[0.3em] text-xs font-semibold text-[#F9B384]">The damage</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-4">{inr(recap.stats.total_spent)} well spent.</h2>
            <div className="grid grid-cols-3 gap-4 mt-10">
              <div className="bg-white/10 rounded-2xl p-5">
                <Wallet size={26} weight="duotone" className="text-[#F9B384] mx-auto" />
                <p className="font-display text-xl font-bold mt-2">{recap.stats.budget_total ? `${Math.round((recap.stats.total_spent / recap.stats.budget_total) * 100)}%` : "—"}</p>
                <p className="text-xs text-white/60">of budget used</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-5">
                <UsersThree size={26} weight="duotone" className="text-[#F9B384] mx-auto" />
                <p className="font-display text-xl font-bold mt-2">{recap.members.length}</p>
                <p className="text-xs text-white/60">travellers</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-5">
                <Images size={26} weight="duotone" className="text-[#F9B384] mx-auto" />
                <p className="font-display text-xl font-bold mt-2">{recap.memories.length}</p>
                <p className="text-xs text-white/60">memories</p>
              </div>
            </div>
            {topCategory && <p className="text-white/70 text-sm mt-8">Biggest spend: <b className="capitalize">{topCategory[0]}</b> at {inr(topCategory[1])}</p>}
          </div>
        )}
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-4 pb-8">
        <div className="flex items-center gap-3">
          <button data-testid="recap-prev-btn" onClick={prev} className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"><CaretLeft size={18} /></button>
          <button data-testid="recap-playpause-btn" onClick={() => setPlaying(!playing)} className="h-12 w-12 rounded-full bg-[#E25822] hover:bg-[#C84B1A] flex items-center justify-center transition-colors">
            {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
          </button>
          <button data-testid="recap-next-btn" onClick={next} className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"><CaretRight size={18} /></button>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${i === idx ? "w-6 bg-[#F9B384]" : "w-1.5 bg-white/30"}`} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </footer>
    </div>
  );
}

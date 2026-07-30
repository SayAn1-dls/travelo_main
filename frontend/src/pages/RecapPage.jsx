import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api, { money } from "@/lib/api";
import BlobImage from "@/components/BlobImage";
import { exportImages, exportVideo, downloadBlob } from "@/lib/recapExport";
import { toast } from "sonner";
import { AirplaneTilt, CaretLeft, CaretRight, Pause, Play, X, Quotes, UsersThree, Wallet, Images, MusicNotes, SpeakerSlash, DownloadSimple, FilmSlate, FileZip } from "@phosphor-icons/react";

function createAmbient() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 850;
  filter.connect(master);
  master.connect(ctx.destination);
  const chords = [
    [261.63, 329.63, 392.0, 493.88],
    [220.0, 261.63, 329.63, 415.3],
    [174.61, 220.0, 261.63, 349.23],
    [196.0, 246.94, 293.66, 392.0],
  ];
  let voices = [];
  let chordIdx = 0;
  let interval = null;
  const playChord = () => {
    const now = ctx.currentTime;
    voices.forEach((v) => {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setValueAtTime(v.gain.gain.value, now);
      v.gain.gain.linearRampToValueAtTime(0, now + 2.5);
      v.osc.stop(now + 2.6);
    });
    voices = chords[chordIdx % chords.length].map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 3);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      return { osc, gain };
    });
    chordIdx += 1;
  };
  return {
    start() {
      ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);
      playChord();
      clearInterval(interval);
      interval = setInterval(playChord, 9000);
    },
    stop() {
      clearInterval(interval);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    },
    dispose() {
      clearInterval(interval);
      try { ctx.close(); } catch {}
    },
  };
}

export default function RecapPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [recap, setRecap] = useState(null);
  const [error, setError] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const ambientRef = useRef(null);

  const runExport = async (type) => {
    setDlOpen(false);
    if (exporting) return;
    setExporting({ label: type === "video" ? "Rendering video" : "Rendering images", progress: 0 });
    try {
      const fn = type === "video" ? exportVideo : exportImages;
      const blob = await fn(recap, token, recap.currency, (p) => setExporting((e) => (e ? { ...e, progress: p } : e)));
      downloadBlob(blob, `travelo-recap-${recap.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${type === "video" ? "webm" : "zip"}`);
      toast.success(type === "video" ? "Video downloaded" : "Image set downloaded");
    } catch (e) {
      toast.error(e?.message || "Export failed — please try again");
    }
    setExporting(null);
  };

  const toggleMusic = () => {
    if (!musicOn) {
      if (!ambientRef.current) ambientRef.current = createAmbient();
      ambientRef.current.start();
    } else {
      ambientRef.current?.stop();
    }
    setMusicOn(!musicOn);
  };

  useEffect(() => () => ambientRef.current?.dispose(), []);

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
  }, [playing, next, slides.length, idx]);

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
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.99 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="w-full flex items-center justify-center"
          >
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
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-4">{money(recap.stats.total_spent, recap.currency)} well spent.</h2>
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
            {topCategory && <p className="text-white/70 text-sm mt-8">Biggest spend: <b className="capitalize">{topCategory[0]}</b> at {money(topCategory[1], recap.currency)}</p>}
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-4 pb-8">
        <div className="flex items-center gap-3">
          <button data-testid="recap-prev-btn" onClick={prev} className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"><CaretLeft size={18} /></button>
          <button data-testid="recap-playpause-btn" onClick={() => setPlaying(!playing)} className="h-12 w-12 rounded-full bg-[#E25822] hover:bg-[#C84B1A] flex items-center justify-center transition-colors">
            {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
          </button>
          <button data-testid="recap-next-btn" onClick={next} className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"><CaretRight size={18} /></button>
          <button data-testid="recap-music-btn" onClick={toggleMusic} className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${musicOn ? "bg-[#F9B384] text-[#0B4F6C]" : "bg-white/10 hover:bg-white/25"}`} aria-label="Toggle ambient music">
            {musicOn ? <MusicNotes size={18} weight="fill" /> : <SpeakerSlash size={18} />}
          </button>
          <div className="relative">
            <button data-testid="recap-download-btn" onClick={() => setDlOpen(!dlOpen)} disabled={!!exporting} className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${dlOpen ? "bg-[#F9B384] text-[#0B4F6C]" : "bg-white/10 hover:bg-white/25"} disabled:opacity-50`} aria-label="Download recap">
              <DownloadSimple size={18} />
            </button>
            {dlOpen && (
              <div className="absolute bottom-14 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bg-white text-[#1A1A1A] rounded-2xl shadow-2xl p-2 w-60 z-20" data-testid="recap-download-menu">
                <button data-testid="recap-download-video-btn" onClick={() => runExport("video")} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#FDF3EC] text-left transition-colors">
                  <FilmSlate size={20} weight="duotone" className="text-[#E25822] shrink-0" />
                  <span><span className="block text-sm font-semibold">Video (.webm)</span><span className="block text-xs text-muted-foreground">Animated slideshow</span></span>
                </button>
                <button data-testid="recap-download-images-btn" onClick={() => runExport("images")} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#FDF3EC] text-left transition-colors">
                  <FileZip size={20} weight="duotone" className="text-[#0B4F6C] shrink-0" />
                  <span><span className="block text-sm font-semibold">Image set (.zip)</span><span className="block text-xs text-muted-foreground">One PNG per slide</span></span>
                </button>
              </div>
            )}
          </div>
        </div>
        {exporting && (
          <p data-testid="recap-export-progress" className="text-xs text-[#F9B384] font-semibold tracking-wide">
            {exporting.label}… {exporting.progress}%
          </p>
        )}
        <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${i === idx ? "w-6 bg-[#F9B384]" : "w-1.5 bg-white/30"}`} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </footer>
    </div>
  );
}

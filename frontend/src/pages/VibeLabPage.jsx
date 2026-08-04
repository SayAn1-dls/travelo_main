import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  UploadCloud, X, Sparkles, Loader2, Download, Share2, Copy,
  LayoutGrid, Film, Image as ImageIcon, Wand2,
} from 'lucide-react';
import api from '@/lib/api';

const MAX_PHOTOS = 5;
const W = 1080;
const H = 1920;

const TEMPLATES = [
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'filmstrip', label: 'Filmstrip', icon: Film },
  { id: 'polaroid', label: 'Polaroid', icon: ImageIcon },
];

// ---------- helpers ----------
function readAndDownscale(file, maxDim = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw, sh, sx, sy;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function fitFont(ctx, text, family, maxWidth, startSize) {
  let size = startSize;
  do {
    ctx.font = `${size}px "${family}"`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  } while (size > 24);
  return size;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

function drawFooter(ctx, vibe) {
  const [c1, c2] = [vibe.palette[0] || '#FF4500', vibe.palette[1] || '#EAFF00'];
  // accent bars
  ctx.fillStyle = c1;
  ctx.fillRect(0, 1545, W, 10);
  ctx.fillStyle = c2;
  ctx.fillRect(0, 1555, W * 0.6, 4);
  // title
  ctx.fillStyle = '#ffffff';
  const title = (vibe.vibe_title || 'WANDER MODE ON').toUpperCase();
  const ts = fitFont(ctx, title, 'Bebas Neue', W - 120, 130);
  ctx.font = `${ts}px "Bebas Neue"`;
  ctx.textAlign = 'left';
  ctx.fillText(title, 60, 1560 + ts * 0.95);
  // caption
  ctx.font = '34px "Space Grotesk"';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const lines = wrapText(ctx, `\u201c${vibe.caption}\u201d`, W - 120).slice(0, 2);
  lines.forEach((l, i) => ctx.fillText(l, 62, 1728 + i * 44));
  // hashtags
  ctx.font = '26px "Space Mono"';
  ctx.fillStyle = c2;
  ctx.fillText((vibe.hashtags || []).join(' '), 62, 1836);
  // brand
  ctx.font = '24px "Space Mono"';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('MADE IN THE VIBE LAB \u2726 TRAVELO', 62, 1884);
}

function drawHeader(ctx, vibe) {
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '26px "Space Mono"';
  ctx.textAlign = 'left';
  ctx.fillText('TRAVELO \u2708 TRIP DUMP', 60, 78);
  const mood = `MOOD: ${(vibe.mood || 'epic').toUpperCase()}`;
  ctx.fillStyle = vibe.palette[1] || '#EAFF00';
  const mw = ctx.measureText(mood).width;
  ctx.fillText(mood, W - 60 - mw, 78);
}

function gridRects(n) {
  const top = 120, bottom = 1520, gap = 14;
  const fh = bottom - top;
  if (n === 1) return [[60, top, W - 120, fh]];
  if (n === 2) {
    const h = (fh - gap) / 2;
    return [[60, top, W - 120, h], [60, top + h + gap, W - 120, h]];
  }
  if (n === 3) {
    const h1 = fh * 0.55, h2 = fh - h1 - gap, w2 = (W - 120 - gap) / 2;
    return [[60, top, W - 120, h1], [60, top + h1 + gap, w2, h2], [60 + w2 + gap, top + h1 + gap, w2, h2]];
  }
  if (n === 4) {
    const h = (fh - gap) / 2, w = (W - 120 - gap) / 2;
    return [
      [60, top, w, h], [60 + w + gap, top, w, h],
      [60, top + h + gap, w, h], [60 + w + gap, top + h + gap, w, h],
    ];
  }
  const h1 = fh * 0.5, h2 = (fh - h1 - 2 * gap) / 2, w2 = (W - 120 - gap) / 2;
  return [
    [60, top, W - 120, h1],
    [60, top + h1 + gap, w2, h2], [60 + w2 + gap, top + h1 + gap, w2, h2],
    [60, top + h1 + h2 + 2 * gap, w2, h2], [60 + w2 + gap, top + h1 + h2 + 2 * gap, w2, h2],
  ];
}

async function renderCollage(template, dataUrls, vibe) {
  await Promise.all([
    document.fonts.load('130px "Bebas Neue"'),
    document.fonts.load('34px "Space Grotesk"'),
    document.fonts.load('26px "Space Mono"'),
  ]);
  const imgs = await Promise.all(dataUrls.map(loadImage));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const [c1, c2, c3] = [vibe.palette[0] || '#FF4500', vibe.palette[1] || '#EAFF00', vibe.palette[2] || '#141414'];

  // background
  if (template === 'polaroid') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c3);
    g.addColorStop(0.5, '#0a0a0a');
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = '#0a0a0a';
  }
  ctx.fillRect(0, 0, W, H);

  if (template === 'grid') {
    gridRects(imgs.length).forEach(([x, y, w, h], i) => {
      drawCover(ctx, imgs[i], x, y, w, h);
      ctx.strokeStyle = i % 2 === 0 ? c1 : c2;
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, w, h);
    });
  } else if (template === 'filmstrip') {
    const top = 120, fh = 1400, gap = 10;
    const w = (W - 120 - gap * (imgs.length - 1)) / imgs.length;
    imgs.forEach((img, i) => {
      const x = 60 + i * (w + gap);
      drawCover(ctx, img, x, top, w, fh);
      // sprocket holes
      ctx.fillStyle = '#0a0a0a';
      for (let y = top + 20; y < top + fh; y += 90) {
        ctx.fillRect(x + 6, y, 14, 22);
        ctx.fillRect(x + w - 20, y, 14, 22);
      }
    });
    ctx.fillStyle = c2;
    ctx.fillRect(0, 108, W, 6);
    ctx.fillRect(0, 1526, W, 6);
  } else {
    // polaroid cascade
    const n = imgs.length;
    const cardW = n <= 2 ? 640 : 520;
    const cardH = cardW * 1.18;
    const zone = 1380 - cardH;
    imgs.forEach((img, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const cx = 90 + (W - 180 - cardW) * (i % 2 === 0 ? 0.12 + t * 0.25 : 0.62 - t * 0.2);
      const cy = 140 + zone * t;
      const rot = ((i * 47) % 13 - 6) * (Math.PI / 180);
      ctx.save();
      ctx.translate(cx + cardW / 2, cy + cardH / 2);
      ctx.rotate(rot);
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 40;
      ctx.fillStyle = '#f5f2ea';
      ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
      ctx.shadowBlur = 0;
      drawCover(ctx, img, -cardW / 2 + 24, -cardH / 2 + 24, cardW - 48, cardH - 110);
      ctx.restore();
    });
  }

  drawHeader(ctx, vibe);
  drawFooter(ctx, vibe);
  return canvas;
}

// ---------- page ----------
export default function VibeLabPage() {
  const [photos, setPhotos] = useState([]); // dataURLs
  const [vibe, setVibe] = useState(null);
  const [template, setTemplate] = useState('grid');
  const [collageUrl, setCollageUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  const addFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => /image\/(jpeg|png|webp)/.test(f.type));
    if (!files.length) return toast.error('JPEG, PNG or WEBP photos only.');
    if (photos.length + files.length > MAX_PHOTOS) {
      toast.error(`Max ${MAX_PHOTOS} photos. This is a collage, not an archive.`);
      return;
    }
    try {
      const urls = await Promise.all(files.map((f) => readAndDownscale(f)));
      setPhotos((p) => [...p, ...urls]);
      setVibe(null);
      setCollageUrl(null);
    } catch (e) {
      toast.error('Could not read one of those photos.');
    }
  };

  const removePhoto = (i) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setVibe(null);
    setCollageUrl(null);
  };

  const analyze = async () => {
    if (!photos.length) return toast.error('Upload at least one photo first.');
    setAnalyzing(true);
    try {
      const result = await api.analyzeVibe({ images: photos.map((p) => p.split(',')[1]) });
      setVibe(result);
      toast.success(result.source === 'ai' ? 'Vibe decoded by AI. It has opinions.' : 'Vibe locked in.');
      // auto-render collage
      setRendering(true);
      const canvas = await renderCollage(template, photos, result);
      canvasRef.current = canvas;
      setCollageUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      toast.error(err.message || 'Vibe analysis failed');
    } finally {
      setAnalyzing(false);
      setRendering(false);
    }
  };

  const switchTemplate = async (t) => {
    setTemplate(t);
    if (!vibe || !photos.length) return;
    setRendering(true);
    try {
      const canvas = await renderCollage(t, photos, vibe);
      canvasRef.current = canvas;
      setCollageUrl(canvas.toDataURL('image/png'));
    } finally {
      setRendering(false);
    }
  };

  const download = () => {
    if (!collageUrl) return;
    const a = document.createElement('a');
    a.href = collageUrl;
    a.download = 'travelo-vibe-collage.png';
    a.click();
    toast.success('Collage saved. Story-ready.');
  };

  const shareWhatsApp = async () => {
    if (!canvasRef.current || !vibe) return;
    const text = `${vibe.caption} ${(vibe.hashtags || []).join(' ')} \u2014 made with TRAVELO Vibe Lab`;
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'));
      const file = new File([blob], 'travelo-vibe.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
    // fallback: download + open WhatsApp with caption
    download();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast.info('Collage downloaded — attach it in the WhatsApp chat that just opened.');
  };

  const copyCaption = async () => {
    if (!vibe) return;
    await navigator.clipboard.writeText(`${vibe.caption} ${(vibe.hashtags || []).join(' ')}`);
    toast.success('Caption copied.');
  };

  // pinterest-ish masonry heights
  const spanClass = (i) => ['row-span-2', 'row-span-1', 'row-span-2', 'row-span-1', 'row-span-2'][i % 5];

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">// The memory factory</p>
          <h1 className="mt-3 font-display uppercase leading-[0.85]">
            <span className="block text-[clamp(3rem,9vw,8rem)] text-white">The vibe</span>
            <span className="block text-[clamp(3rem,9vw,8rem)] text-outline-blaze">lab.</span>
          </h1>
          <p className="mt-4 max-w-xl font-marker text-lg text-acid">
            drop up to 5 trip photos. the AI reads the vibe. you get a story-ready collage.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          {/* LEFT: upload + photos + vibe */}
          <div className="space-y-8 lg:col-span-3">
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-14 text-center transition ${
                dragOver ? 'border-acid bg-acid/5' : 'border-white/20 hover:border-blaze'
              }`}
              data-testid="vibe-dropzone"
            >
              <UploadCloud className={`h-10 w-10 ${dragOver ? 'text-acid' : 'text-blaze'}`} />
              <p className="mt-4 font-display text-2xl uppercase">Drop your trip photos here</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
                or click to browse · max {MAX_PHOTOS} · jpeg / png / webp
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                data-testid="vibe-file-input"
              />
            </div>

            {/* Masonry preview */}
            {photos.length > 0 && (
              <div className="grid auto-rows-[120px] grid-cols-2 gap-3 sm:grid-cols-3" data-testid="vibe-photo-grid">
                {photos.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`group relative overflow-hidden border border-white/15 ${spanClass(i)}`}
                  >
                    <img src={p} alt={`upload ${i + 1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-black/70 text-white opacity-0 transition hover:bg-blaze hover:text-black group-hover:opacity-100"
                      data-testid={`vibe-remove-photo-${i}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={analyze}
              disabled={analyzing || rendering || photos.length === 0}
              className="group flex w-full items-center justify-center gap-3 bg-blaze px-8 py-5 font-mono text-sm font-bold uppercase tracking-[0.25em] text-black shadow-brutal-acid transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-40 disabled:shadow-brutal-acid disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              data-testid="vibe-analyze-btn"
            >
              {analyzing ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Reading the vibe…</>
              ) : (
                <><Sparkles className="h-5 w-5" /> Analyze the vibe & build my collage</>
              )}
            </button>

            {/* Vibe result */}
            <AnimatePresence>
              {vibe && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/15 p-6"
                  data-testid="vibe-result"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="bg-acid px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                      Mood: {vibe.mood}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                      {vibe.source === 'ai' ? '\u2726 decoded by AI' : 'house vibe'}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-5xl uppercase leading-none" data-testid="vibe-title">{vibe.vibe_title}</h3>
                  <p className="mt-3 text-white/70">“{vibe.caption}”</p>
                  <div className="mt-4 flex items-center gap-2">
                    {vibe.palette.map((c) => (
                      <span key={c} className="h-8 w-8 border border-white/20" style={{ backgroundColor: c }} title={c} />
                    ))}
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-white/40">extracted palette</span>
                  </div>
                  <p className="mt-4 font-mono text-xs text-acid">{(vibe.hashtags || []).join(' ')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: collage preview + actions */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-3xl uppercase"><Wand2 className="h-6 w-6 text-blaze" /> The collage</h2>
              </div>

              {/* template switch */}
              <div className="mt-4 flex gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => switchTemplate(t.id)}
                    disabled={rendering}
                    className={`flex items-center gap-2 border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50 ${
                      template === t.id ? 'border-blaze bg-blaze text-black' : 'border-white/15 text-white/60 hover:border-white/40'
                    }`}
                    data-testid={`template-${t.id}`}
                  >
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                ))}
              </div>

              {/* preview */}
              <div className="mt-5 flex aspect-[9/16] items-center justify-center border border-white/15 bg-zinc-950" data-testid="collage-preview">
                {rendering ? (
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blaze" />
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Building your masterpiece…</p>
                  </div>
                ) : collageUrl ? (
                  <img src={collageUrl} alt="Vibe collage" className="h-full w-full object-contain" data-testid="collage-image" />
                ) : (
                  <div className="px-8 text-center">
                    <p className="font-display text-3xl uppercase text-outline">Your story-ready collage lands here.</p>
                    <p className="mt-3 font-marker text-acid">upload → analyze → flex.</p>
                  </div>
                )}
              </div>

              {/* actions */}
              {collageUrl && (
                <div className="mt-5 space-y-3">
                  <button
                    onClick={shareWhatsApp}
                    className="flex w-full items-center justify-center gap-2 bg-[#25D366] px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-black transition hover:brightness-110"
                    data-testid="share-whatsapp-btn"
                  >
                    <Share2 className="h-4 w-4" /> Share to WhatsApp
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={download}
                      className="flex items-center justify-center gap-2 bg-blaze px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-blaze-hover"
                      data-testid="download-collage-btn"
                    >
                      <Download className="h-4 w-4" /> Download
                    </button>
                    <button
                      onClick={copyCaption}
                      className="flex items-center justify-center gap-2 border border-white/20 px-4 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:border-acid hover:text-acid"
                      data-testid="copy-caption-btn"
                    >
                      <Copy className="h-4 w-4" /> Copy caption
                    </button>
                  </div>
                  <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                    1080×1920 · perfect for stories & status
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

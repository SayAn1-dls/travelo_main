import JSZip from "jszip";
import api, { money } from "./api";

const W = 1280;
const H = 720;

async function loadImages(recap, token) {
  const out = {};
  await Promise.all(
    recap.memories.filter((m) => m.kind === "photo").map(async (m) => {
      try {
        const r = await api.get(`/recap/${token}/image/${m.id}`, { responseType: "blob" });
        out[m.id] = await createImageBitmap(r.data);
      } catch {}
    })
  );
  return out;
}

function wrap(ctx, text, maxWidth, maxLines = 4) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] += "…";
  }
  return lines;
}

function roundedPath(ctx, x, y, w, h, r) {
  try {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return true;
  } catch {
    return false;
  }
}

function drawSlide(ctx, slide, recap, images, cur) {
  ctx.fillStyle = "#0B4F6C";
  ctx.fillRect(0, 0, W, H);
  if (!slide) return;
  ctx.textAlign = "center";
  const cx = W / 2;

  if (slide.kind === "title") {
    ctx.fillStyle = "#F9B384";
    ctx.font = "600 20px 'DM Sans', sans-serif";
    ctx.fillText("T H E   S T O R Y   O F", cx, 220);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 64px 'Playfair Display', serif";
    const lines = wrap(ctx, recap.name, 1000, 2);
    lines.forEach((l, i) => ctx.fillText(l, cx, 312 + i * 76));
    const base = 312 + lines.length * 76;
    ctx.font = "24px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(`${recap.destination} · ${recap.start_date} → ${recap.end_date}`, cx, base + 16);
    ctx.font = "18px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(wrap(ctx, `with ${recap.members.join(" · ")}`, 1050, 1)[0], cx, base + 54);
  } else if (slide.kind === "photo") {
    const img = images[slide.id];
    if (img) {
      const maxW = 920, maxH = 440;
      const s = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * s, h = img.height * s;
      const x = (W - w) / 2, y = 70 + (maxH - h) / 2;
      ctx.save();
      if (roundedPath(ctx, x, y, w, h, 18)) ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic 30px 'Playfair Display', serif";
    if (slide.caption) ctx.fillText(wrap(ctx, slide.caption, 1000, 1)[0], cx, 596);
    ctx.font = "17px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`captured by ${slide.member_name}`, cx, slide.caption ? 634 : 596);
  } else if (slide.kind === "note") {
    ctx.fillStyle = "#F9B384";
    ctx.font = "bold 110px 'Playfair Display', serif";
    ctx.fillText("\u201C", cx, 210);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic 38px 'Playfair Display', serif";
    const lines = wrap(ctx, slide.note, 940, 5);
    lines.forEach((l, i) => ctx.fillText(l, cx, 296 + i * 54));
    ctx.font = "18px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`— ${slide.member_name}`, cx, 296 + lines.length * 54 + 34);
  } else if (slide.kind === "itinerary") {
    ctx.fillStyle = "#F9B384";
    ctx.font = "600 20px 'DM Sans', sans-serif";
    ctx.fillText("T H E   P L A N", cx, 128);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 54px 'Playfair Display', serif";
    ctx.fillText(`Day ${slide.day}`, cx, 200);
    ctx.font = "20px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(new Date(`${slide.date}T00:00:00`).toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" }), cx, 238);
    const rows = slide.items.slice(0, 5);
    rows.forEach((it, i) => {
      const y = 286 + i * 72;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      if (roundedPath(ctx, cx - 420, y, 840, 60, 16)) ctx.fill();
      ctx.textAlign = "left";
      ctx.fillStyle = "#F9B384";
      ctx.font = "700 20px 'DM Sans', sans-serif";
      ctx.fillText(it.time || "—", cx - 390, y + 37);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 22px 'DM Sans', sans-serif";
      const title = wrap(ctx, it.title, it.place ? 480 : 700, 1)[0];
      ctx.fillText(title, cx - 310, y + 37);
      if (it.place) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "17px 'DM Sans', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(wrap(ctx, it.place, 210, 1)[0], cx + 390, y + 37);
      }
      ctx.textAlign = "center";
    });
    if (slide.items.length > 5) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "17px 'DM Sans', sans-serif";
      ctx.fillText(`+ ${slide.items.length - 5} more plans`, cx, 286 + 5 * 72 + 12);
    }
  } else {
    ctx.fillStyle = "#F9B384";
    ctx.font = "600 20px 'DM Sans', sans-serif";
    ctx.fillText("T H E   D A M A G E", cx, 170);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 56px 'Playfair Display', serif";
    ctx.fillText(`${money(recap.stats.total_spent, cur)} well spent.`, cx, 258);
    const stats = [
      [recap.stats.budget_total ? `${Math.round((recap.stats.total_spent / recap.stats.budget_total) * 100)}%` : "—", "of budget used"],
      [String(recap.members.length), "travellers"],
      [String(recap.memories.length), "memories"],
    ];
    stats.forEach(([v, label], i) => {
      const x = cx + (i - 1) * 300;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      if (roundedPath(ctx, x - 122, 330, 244, 150, 20)) ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 40px 'Playfair Display', serif";
      ctx.fillText(v, x, 402);
      ctx.font = "16px 'DM Sans', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(label, x, 442);
    });
    const top = Object.entries(recap.stats.by_category).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      ctx.font = "19px 'DM Sans', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText(`Biggest spend: ${top[0]} at ${money(top[1], cur)}`, cx, 556);
    }
  }
  ctx.font = "600 15px 'DM Sans', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("Travelo recap", cx, H - 26);
}

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return c;
}

const slidesOf = (recap) => [{ kind: "title" }, ...buildItinerarySlides(recap), ...recap.memories, { kind: "stats" }];

export function buildItinerarySlides(recap) {
  const items = recap.itinerary || [];
  const byDate = {};
  items.forEach((i) => { (byDate[i.date] = byDate[i.date] || []).push(i); });
  return Object.keys(byDate).sort().map((date) => ({
    kind: "itinerary",
    date,
    day: Math.max(1, Math.round((new Date(`${date}T00:00:00`) - new Date(`${recap.start_date}T00:00:00`)) / 86400000) + 1),
    items: byDate[date].slice(0, 6),
  }));
}

export async function exportImages(recap, token, cur, onProgress) {
  await document.fonts.ready;
  const images = await loadImages(recap, token);
  const canvas = makeCanvas();
  const ctx = canvas.getContext("2d");
  const slides = slidesOf(recap);
  const zip = new JSZip();
  for (let i = 0; i < slides.length; i++) {
    drawSlide(ctx, slides[i], recap, images, cur);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    zip.file(`travelo-recap-${String(i + 1).padStart(2, "0")}.png`, blob);
    onProgress?.(Math.round(((i + 1) / slides.length) * 90));
  }
  const out = await zip.generateAsync({ type: "blob" });
  onProgress?.(100);
  return out;
}

export async function exportVideo(recap, token, cur, onProgress) {
  await document.fonts.ready;
  const images = await loadImages(recap, token);
  const canvas = makeCanvas();
  const ctx = canvas.getContext("2d");
  const slides = slidesOf(recap);
  const stream = canvas.captureStream(30);
  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
    .find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error("Video export isn't supported in this browser — try the image set instead");
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((res) => (rec.onstop = res));
  const SLIDE_MS = 3000, FADE_MS = 550;
  const total = slides.length * SLIDE_MS;
  rec.start(200);
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = (now) => {
      const t = now - start;
      if (t >= total) return resolve();
      const i = Math.max(0, Math.min(Math.floor(t / SLIDE_MS), slides.length - 1));
      drawSlide(ctx, slides[i], recap, images, cur);
      const local = t - i * SLIDE_MS;
      if (local < FADE_MS) {
        ctx.fillStyle = `rgba(11,79,108,${(1 - local / FADE_MS).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }
      onProgress?.(Math.min(99, Math.round((t / total) * 100)));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await stopped;
  onProgress?.(100);
  return new Blob(chunks, { type: "video/webm" });
}

export function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

// Canvas helpers + the "aesthetic" (Pinterest-style) poster renderer for the Vibe Lab.
// Posters carry no site branding — only the photos, a title, a caption and a mood.

export const W = 1080;
export const H = 1920;

export function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw, sh, sx, sy;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function fitFont(ctx, text, family, maxWidth, startSize, style = '') {
  let size = startSize;
  do {
    ctx.font = `${style} ${size}px "${family}"`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  } while (size > 24);
  return size;
}

export function wrapText(ctx, text, maxWidth) {
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

export const dateLabel = () =>
  new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();

// ---- colour helpers ----
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return [244, 232, 224];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (rgb, to, t) => rgb.map((c, i) => Math.round(c + (to[i] - c) * t));
const css = (rgb) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

function pathArch(ctx, x, y, w, h) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function pathRound(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// photo with a soft paper border + shadow, clipped to an arch / rounded rectangle
function drawFramed(ctx, img, { x, y, w, h, rot = 0, shape = 'round', border = 14, borderColor = '#fffaf3' }) {
  const path = (px, py, pw, ph, r) => (shape === 'arch' ? pathArch(ctx, px, py, pw, ph) : pathRound(ctx, px, py, pw, ph, r));
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(60,40,30,0.28)';
  ctx.shadowBlur = 38;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = borderColor;
  path(0, 0, w, h, 34);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save();
  path(border, border, w - border * 2, h - border * 2, 26);
  ctx.clip();
  drawCover(ctx, img, border, border, w - border * 2, h - border * 2);
  ctx.restore();
  ctx.restore();
}

function slotsFor(n) {
  const arch = { shape: 'arch' };
  switch (n) {
    case 1: return [{ x: 100, y: 190, w: 880, h: 1160, rot: 0, ...arch }];
    case 2: return [
      { x: 60, y: 170, w: 560, h: 860, rot: -2, ...arch },
      { x: 450, y: 700, w: 570, h: 700, rot: 3 },
    ];
    case 3: return [
      { x: 60, y: 170, w: 520, h: 740, rot: -2, ...arch },
      { x: 520, y: 290, w: 500, h: 600, rot: 3 },
      { x: 220, y: 860, w: 620, h: 540, rot: -1.5 },
    ];
    case 4: return [
      { x: 50, y: 160, w: 480, h: 660, rot: -2, ...arch },
      { x: 560, y: 230, w: 460, h: 520, rot: 3 },
      { x: 80, y: 860, w: 440, h: 520, rot: 2 },
      { x: 560, y: 790, w: 450, h: 590, rot: -2 },
    ];
    default: return [
      { x: 50, y: 150, w: 450, h: 600, rot: -2, ...arch },
      { x: 560, y: 180, w: 450, h: 470, rot: 3 },
      { x: 60, y: 780, w: 380, h: 440, rot: 2 },
      { x: 520, y: 700, w: 480, h: 400, rot: -2 },
      { x: 300, y: 1090, w: 560, h: 330, rot: 1.5 },
    ];
  }
}

export function drawAesthetic(ctx, imgs, vibe) {
  const base = (vibe.palette || []).map(hexToRgb);
  const cream = [250, 243, 234];
  const tintA = mix(base[0] || cream, cream, 0.82);
  const tintB = mix(base[1] || cream, cream, 0.86);
  const ink = mix(base[2] || [60, 45, 42], [43, 33, 31], 0.7);
  const accent = mix(base[0] || [180, 110, 90], [120, 70, 60], 0.35);

  // soft pastel wash
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, css(tintA));
  bg.addColorStop(1, css(tintB));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // faint paper grain dots
  ctx.fillStyle = 'rgba(120,90,70,0.05)';
  for (let i = 0; i < 260; i++) {
    ctx.beginPath();
    ctx.arc((i * 523) % W, (i * 947) % H, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // header — mood + date, lowercase & airy
  ctx.textAlign = 'center';
  ctx.fillStyle = css(ink);
  ctx.globalAlpha = 0.7;
  ctx.font = '500 30px "Space Grotesk"';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '10px';
  ctx.fillText(`${(vibe.mood || 'dreamy').toLowerCase()}  ·  ${dateLabel()}`, W / 2, 92);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.globalAlpha = 1;

  // staggered photos
  const slots = slotsFor(imgs.length);
  imgs.forEach((img, i) => drawFramed(ctx, img, slots[i]));

  // washi tape accents
  const tape = (x, y, rot) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillStyle = css(mix(base[1] || accent, [255, 255, 255], 0.35));
    ctx.globalAlpha = 0.78;
    ctx.fillRect(-90, -24, 180, 48);
    ctx.restore();
  };
  tape(slots[0].x + slots[0].w * 0.5, slots[0].y + 4, -4);
  if (slots[1]) tape(slots[1].x + slots[1].w * 0.78, slots[1].y + 2, 5);

  // title — big italic serif
  const title = (vibe.vibe_title || 'golden hours').toLowerCase();
  const ts = fitFont(ctx, title, 'Playfair Display', W - 160, 150, 'italic 500');
  ctx.font = `italic 500 ${ts}px "Playfair Display"`;
  ctx.fillStyle = css(ink);
  ctx.fillText(title, W / 2, 1548 + ts * 0.5);

  // little divider
  const dy = 1548 + ts * 0.5 + 46;
  ctx.strokeStyle = css(accent);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2 - 150, dy); ctx.lineTo(W / 2 - 28, dy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + 28, dy); ctx.lineTo(W / 2 + 150, dy); ctx.stroke();
  ctx.fillStyle = css(accent);
  ctx.font = '30px "Space Grotesk"';
  ctx.fillText('✦', W / 2, dy + 11);

  // caption — handwritten
  ctx.fillStyle = css(ink);
  ctx.font = '700 58px "Caveat"';
  const lines = wrapText(ctx, vibe.caption || '', W - 220).slice(0, 3);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, dy + 84 + i * 62));

  // hashtags
  ctx.globalAlpha = 0.65;
  ctx.font = '500 26px "Space Grotesk"';
  ctx.fillText((vibe.hashtags || []).slice(0, 4).join('   '), W / 2, 1868);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

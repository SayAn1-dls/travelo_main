// On-device "vibe" reader used when the AI service isn't available:
// samples the photos' colours + light to pick a palette, mood and matching words.

const POOLS = {
  golden: {
    titles: ['golden hours', 'sun-drenched', 'warm light only', 'honey skies'],
    captions: [
      'the kind of light you remember long after.',
      'we chased the sun and it let us catch it.',
      'everything looked like a memory already.',
      'soft light, slow days, no rush.',
    ],
    labels: ['golden hour', 'sun on skin', 'stay a little'],
    tags: ['#goldenhour', '#sunkissed', '#softlight', '#slowdays'],
  },
  blue: {
    titles: ['blue hour', 'salt & sky', 'endless blue', 'quiet waters'],
    captions: [
      'the sky and the sea kept trading secrets.',
      'somewhere between the horizon and the quiet.',
      'cool air, clear head, full heart.',
      'we got lost in all that blue.',
    ],
    labels: ['salt air', 'big sky', 'breathe in'],
    tags: ['#bluehour', '#seaandsky', '#calmvibes', '#horizon'],
  },
  green: {
    titles: ['into the green', 'wild & free', 'moss & mist', 'lost in leaves'],
    captions: [
      'the trail went quiet and so did my mind.',
      'we followed the green and forgot the rest.',
      'nature does the talking here.',
      'fresh air, muddy shoes, zero regrets.',
    ],
    labels: ['wander on', 'touch grass', 'off the map'],
    tags: ['#intothewild', '#naturelover', '#greenescape', '#wildandfree'],
  },
  night: {
    titles: ['after dark', 'midnight stories', 'city glow', 'late night magic'],
    captions: [
      'the best stories start after sunset.',
      'lights low, hearts loud.',
      'we stayed up for the way the night looked.',
      'neon, laughter, and one more round.',
    ],
    labels: ['stay up late', 'night mode', 'one more hour'],
    tags: ['#afterdark', '#citylights', '#nightstories', '#latenights'],
  },
  vivid: {
    titles: ['full colour', 'loud & alive', 'pure joy', 'colour rush'],
    captions: [
      'life was turned all the way up.',
      'every corner felt like a postcard.',
      'we laughed in every colour.',
      'too bright to forget.',
    ],
    labels: ['pure joy', 'so alive', 'say yes'],
    tags: ['#colourful', '#purejoy', '#livingloud', '#goodtimes'],
  },
  soft: {
    titles: ['soft days', 'gentle mornings', 'slow & easy', 'quiet joy'],
    captions: [
      'nothing planned, everything perfect.',
      'small moments, held close.',
      'the calm kind of happy.',
      'we took the long way, on purpose.',
    ],
    labels: ['slow down', 'just us', 'kept for later'],
    tags: ['#softdays', '#slowliving', '#quietmoments', '#simplejoy'],
  },
};

function sample(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 24; c.height = 24;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0, 24, 24);
      const d = x.getImageData(0, 0, 24, 24).data;
      const px = [];
      for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
      resolve(px);
    };
    img.onerror = () => resolve([]);
    img.src = dataUrl;
  });
}

const toHex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

export async function localVibe(dataUrls) {
  const all = (await Promise.all(dataUrls.map(sample))).flat();
  if (!all.length) return null;

  const avg = all.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map((v) => v / all.length);
  const [r, g, b] = avg;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max ? (max - min) / max : 0;

  let key = 'soft';
  if (lum < 70) key = 'night';
  else if (sat > 0.42) key = 'vivid';
  else if (g > r + 6 && g > b) key = 'green';
  else if (b > r + 8 && b >= g) key = 'blue';
  else if (r > b + 18 && lum > 95) key = 'golden';

  // dominant tones: bucket pixels by coarse colour, keep the 3 most common distinct buckets
  const buckets = new Map();
  all.forEach(([pr, pg, pb]) => {
    const k = `${pr >> 6}-${pg >> 6}-${pb >> 6}`;
    const e = buckets.get(k) || { n: 0, s: [0, 0, 0] };
    e.n += 1; e.s = [e.s[0] + pr, e.s[1] + pg, e.s[2] + pb];
    buckets.set(k, e);
  });
  const palette = [...buckets.values()].sort((a, b2) => b2.n - a.n).slice(0, 3).map((e) => toHex(e.s.map((v) => v / e.n)));
  while (palette.length < 3) palette.push(palette[0] || '#c9a58f');

  const pool = POOLS[key];
  const seed = all.length + Math.round(r + g * 3 + b * 7);
  const pick = (arr, off = 0) => arr[(seed + off) % arr.length];
  return {
    vibe_title: pick(pool.titles),
    caption: pick(pool.captions, 1),
    mood: key === 'vivid' ? 'joyful' : key === 'golden' ? 'warm' : key === 'blue' ? 'calm' : key === 'green' ? 'wild' : key === 'night' ? 'electric' : 'dreamy',
    palette,
    hashtags: pool.tags,
    photo_type: 'scenery',
    scrapbook_labels: pool.labels,
    source: 'local',
  };
}

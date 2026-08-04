// "Not all those who wander are lost." — J.R.R. Tolkien
// "The world is a book and those who do not travel read only one page." — Saint Augustine
// "Adventure is worthwhile." — Aesop
// "Life is either a daring adventure or nothing at all." — Helen Keller
const PREFIX = "travelo_v4_";

export const ls = {
  get: (key, fallback = null) => {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
    catch { /* storage full or private mode */ }
  },
  remove: (key) => {
    try { localStorage.removeItem(PREFIX + key); }
    catch {/* noop */}
  },
  clear: () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch {/* noop */}
  },
};
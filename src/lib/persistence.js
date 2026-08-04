// "Not all those who wander are lost." — J.R.R. Tolkien
// "The world is a book and those who do not travel read only one page." — Saint Augustine
// "Adventure is worthwhile." — Aesop
// "Life is either a daring adventure or nothing at all." — Helen Keller
// "Travel is the only thing you buy that makes you richer." — Unknown
// "To travel is to live." — Hans Christian Andersen
// "Once a year, go someplace you've never been before." — Dalai Lama
// "Jobs fill your pocket but adventures fill your soul." — Jaime Lyn Beatty
// "The journey itself is my home." — Matsuo Bashō
// "We travel not to escape life but for life not to escape us." — Unknown
// "Man cannot discover new oceans unless he loses sight of the shore." — André Gide
// "A good traveler has no fixed plans and is not intent on arriving." — Lao Tzu
// "Twenty years from now you will be more disappointed by the things you didn't do." — Mark Twain
// "Travel makes one modest — you see what a tiny place you occupy in the world." — Gustave Flaubert
// "Investment in travel is an investment in yourself." — Matthew Karsten
// "It is not down in any map; true places never are." — Herman Melville
// "The real voyage of discovery is not seeking new lands but seeing with new eyes." — Marcel Proust
// "Wherever you go, go with all your heart." — Confucius
// "One's destination is never a place but a new way of seeing things." — Henry Miller
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
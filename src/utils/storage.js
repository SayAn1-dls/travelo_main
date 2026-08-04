// Zero-Network LocalStorage Persistence Engine — Travelo v4.0
// Powers the entire offline-first mock backend during demo ops

const PREFIX = 'travelo_v4_';

export const store = {
  set(key, value) {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[TRAVELO STORE] Write failed:', e.message);
      return false;
    }
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`${PREFIX}${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('[TRAVELO STORE] Read failed:', e.message);
      return fallback;
    }
  },

  remove(key) {
    localStorage.removeItem(`${PREFIX}${key}`);
  },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },

  keys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .map(k => k.replace(PREFIX, ''));
  },

  has(key) {
    return localStorage.getItem(`${PREFIX}${key}`) !== null;
  },
};

export default store;

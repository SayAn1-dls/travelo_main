// Travelo Local Persistence Engine v3.0
// Zero network errors — full offline-first architecture

const KEYS = {
  TRIPS: 'travelo_trips_v3',
  EXPENSES: (id) => `travelo_exp_${id}`,
  AUTH: 'travelo_auth_v29',
  LEDGER: 'travelo_expenses_v3',
  MEMORIES: 'travelo_memories',
  SQUAD_MAIL: 'travelo_squad_mail',
  PAYMENTS: 'travelo_payments',
};

export const persist = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key) => {
    try { localStorage.removeItem(key); } catch {}
  },
  KEYS,
};

export default persist;
const KEYS = { TRIPS: 'travelo_trips_v3', AUTH: 'travelo_auth_v29', SQUAD_MAIL: 'travelo_squad_mail', PAYMENTS: 'travelo_payments' };
export const persist = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) }½ fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  remove: (k) => { try { localStorage.removeItem(k); } catch {} },
  KEYS,
};
export default persist;

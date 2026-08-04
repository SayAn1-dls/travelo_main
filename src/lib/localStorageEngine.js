// Zero-Network LocalStorage Engine v2.0
// Handles all data persistence without any network calls

const SESSION_KEY = 'travelo_session';
const USERS_KEY = 'travelo_users';
const TRIPS_KEY = 'travelo_trips';
const JOURNAL_KEY = 'travelo_journal';

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const localAuth = {
  register(email, password, displayName) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    const user = { uid: generateToken(), email, displayName, password, createdAt: Date.now() };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const session = { uid: user.uid, email, displayName, token: generateToken() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  login(email, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    const session = { uid: user.uid, email: user.email, displayName: user.displayName, token: generateToken() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  },

  isAuthenticated() {
    return !!this.getSession();
  }
};

export const localTrips = {
  getAll(uid) {
    const all = JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]');
    return all.filter(t => t.uid === uid);
  },
  add(uid, trip) {
    const all = JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]');
    const newTrip = { ...trip, id: generateToken(), uid, createdAt: Date.now() };
    all.push(newTrip);
    localStorage.setItem(TRIPS_KEY, JSON.stringify(all));
    return newTrip;
  },
  update(id, updates) {
    const all = JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]');
    const idx = all.findIndex(t => t.id === id);
    if (idx > -1) { all[idx] = { ...all[idx], ...updates }; localStorage.setItem(TRIPS_KEY, JSON.stringify(all)); }
    return all[idx];
  },
  remove(id) {
    const all = JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]');
    localStorage.setItem(TRIPS_KEY, JSON.stringify(all.filter(t => t.id !== id)));
  }
};

export const localJournal = {
  getAll(uid) {
    const all = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    return all.filter(e => e.uid === uid);
  },
  add(uid, entry) {
    const all = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    const newEntry = { ...entry, id: generateToken(), uid, createdAt: Date.now() };
    all.push(newEntry);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(all));
    return newEntry;
  },
  remove(id) {
    const all = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(all.filter(e => e.id !== id)));
  }
};

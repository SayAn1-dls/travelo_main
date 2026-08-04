// Travelo Zero-Network Mock DB — Full LocalStorage API Layer
// Simulates a real database for zero-network demo mode
import { store } from '../utils/storage';
import { generateMissionId } from '../utils/generateId';

// --- TRIPS ---
export const tripsDB = {
  getAll:    ()           => store.get('trips', []),
  getById:   (id)         => store.get('trips', []).find(t => t.id === id) ?? null,
  create:    (data)       => {
    const trips = store.get('trips', []);
    const trip = { ...data, id: generateMissionId(), createdAt: Date.now() };
    store.set('trips', [...trips, trip]);
    return trip;
  },
  update:    (id, patch)  => {
    const trips = store.get('trips', []).map(t => t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t);
    store.set('trips', trips);
    return trips.find(t => t.id === id);
  },
  remove:    (id)         => store.set('trips', store.get('trips', []).filter(t => t.id !== id)),
  count:     ()           => store.get('trips', []).length,
};

// --- USERS ---
export const usersDB = {
  getCurrent: ()          => store.get('currentUser', null),
  setCurrent: (user)      => store.set('currentUser', { ...user, lastSeen: Date.now() }),
  clear:      ()          => store.remove('currentUser'),
};

// --- SQUAD MAIL ---
export const mailDB = {
  getAll:    ()           => store.get('mail', []),
  send:      (msg)        => {
    const mail = store.get('mail', []);
    const item = { ...msg, id: generateMissionId(), sentAt: Date.now(), read: false };
    store.set('mail', [item, ...mail]);
    return item;
  },
  markRead:  (id)         => {
    store.set('mail', store.get('mail', []).map(m => m.id === id ? { ...m, read: true } : m));
  },
  unreadCount: ()         => store.get('mail', []).filter(m => !m.read).length,
};

export default { tripsDB, usersDB, mailDB };

// Travelo API Layer — Zero-Network Local Persistence Engine
// Exports: default api, named { api, getToken, setToken, clearToken }

const TOKEN_KEY = 'travelo_jwt_v3';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const DEMO_USER = { id: 'u1', name: 'Sayan Das', email: 'demo@travelo.app', avatar: null };
const DESTINATIONS = [
  { id: 'd1', slug: 'goa', name: 'Goa', country: 'India', description: 'Beaches, shacks, and sunsets.', price: 15999, rating: 4.8, reviewCount: 1240, duration: 5, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80', gallery: [], tags: ['Beach', 'Party', 'Budget'], highlights: ['Baga Beach', 'Fort Aguada', 'Dudhsagar Falls'] },
  { id: 'd2', slug: 'manali', name: 'Manali', country: 'India', description: 'Snow peaks and mountain calm.', price: 18500, rating: 4.7, reviewCount: 980, duration: 6, image: 'https://images.unsplash.com/photo-1626621340517-0b7a6ddb7bc0?auto=format&fit=crop&w=800&q=80', gallery: [], tags: ['Mountains', 'Snow', 'Adventure'], highlights: ['Rohtang Pass', 'Solang Valley', 'Old Manali'] },
  { id: 'd3', slug: 'bali', name: 'Bali', country: 'Indonesia', description: 'Temples, rice terraces, culture.', price: 42000, rating: 4.9, reviewCount: 2100, duration: 7, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', gallery: [], tags: ['International', 'Culture', 'Beach'], highlights: ['Ubud', 'Tanah Lot', 'Seminyak'] },
  { id: 'd4', slug: 'rishikesh', name: 'Rishikesh', country: 'India', description: 'Rafting, yoga, and the Ganges.', price: 9999, rating: 4.6, reviewCount: 760, duration: 4, image: 'https://images.unsplash.com/photo-1585016495481-91613a3e3ea4?auto=format&fit=crop&w=800&q=80', gallery: [], tags: ['Adventure', 'Spiritual', 'Budget'], highlights: ['River Rafting', 'Laxman Jhula', 'Neer Garh Waterfall'] },
  { id: 'd5', slug: 'santorini', name: 'Santorini', country: 'Greece', description: 'White domes and Aegean blues.', price: 95000, rating: 4.9, reviewCount: 3200, duration: 8, image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80', gallery: [], tags: ['International', 'Luxury', 'Romantic'], highlights: ['Oia Sunset', 'Fira Town', 'Red Beach'] },
  { id: 'd6', slug: 'ladakh', name: 'Ladakh', country: 'India', description: 'High altitude desert magic.', price: 24000, rating: 4.8, reviewCount: 1450, duration: 8, image: 'https://images.unsplash.com/photo-1589308154395-cd4d3f2ef5f3?auto=format&fit=crop&w=800&q=80', gallery: [], tags: ['Adventure', 'Mountains', 'Offbeat'], highlights: ['Pangong Lake', 'Nubra Valley', 'Magnetic Hill'] },
];

const _bookings = () => JSON.parse(localStorage.getItem('travelo_bookings_v1') || '[]');
const _saveBookings = (b) => localStorage.setItem('travelo_bookings_v1', JSON.stringify(b));
const _trips = () => JSON.parse(localStorage.getItem('travelo_trips_v3') || '[]');
const _saveTrips = (t) => localStorage.setItem('travelo_trips_v3', JSON.stringify(t));

export const api = {
  // Auth
  login: async ({ email, password }) => {
    await new Promise(r => setTimeout(r, 600));
    if ((email === 'demo@travelo.app' && password === 'demo') || email) {
      const token = 'mock-jwt-' + Date.now();
      setToken(token);
      return { token, user: { ...DEMO_USER, email } };
    }
    throw new Error('Invalid credentials');
  },
  register: async ({ name, email, password }) => {
    await new Promise(r => setTimeout(r, 800));
    const token = 'mock-jwt-' + Date.now();
    setToken(token);
    return { token, user: { id: 'u' + Date.now(), name, email, avatar: null } };
  },
  me: async () => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    return DEMO_USER;
  },
  logout: () => clearToken(),

  // Destinations
  destinations: async ({ search = '', tag = '' } = {}) => {
    await new Promise(r => setTimeout(r, 300));
    let list = [...DESTINATIONS];
    if (search) list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.country.toLowerCase().includes(search.toLowerCase()));
    if (tag) list = list.filter(d => d.tags.includes(tag));
    return list;
  },
  destination: async (slugOrId) => {
    await new Promise(r => setTimeout(r, 200));
    return DESTINATIONS.find(d => d.slug === slugOrId || d.id === slugOrId) || DESTINATIONS[0];
  },

  // Bookings
  createBooking: async (payload) => {
    await new Promise(r => setTimeout(r, 500));
    const booking = { id: 'b' + Date.now(), ...payload, status: 'confirmed', createdAt: new Date().toISOString() };
    const all = _bookings(); all.unshift(booking); _saveBookings(all);
    return { booking, checkoutUrl: null };
  },
  bookings: async () => _bookings(),
  booking: async (id) => _bookings().find(b => b.id === id),
  paymentStatus: async (sessionId) => ({ payment_status: 'paid', session_id: sessionId }),

  // Trips
  trips: async () => _trips(),
  createTrip: async (payload) => {
    const trip = { id: 't' + Date.now(), ...payload, createdAt: new Date().toISOString() };
    const all = _trips(); all.unshift(trip); _saveTrips(all);
    return trip;
  },
  updateTrip: async (id, payload) => {
    const all = _trips();
    const idx = all.findIndex(t => t.id === id);
    if (idx > -1) { all[idx] = { ...all[idx], ...payload }; _saveTrips(all); }
    return all[idx];
  },
  deleteTrip: async (id) => {
    const all = _trips().filter(t => t.id !== id); _saveTrips(all);
  },
  trip: async (id) => _trips().find(t => t.id === id),

  // Invite / Squad
  inviteDetails: async (token) => ({
    id: token, tripName: 'Summer Squad Trip', destination: 'Goa', startDate: '2026-12-20', endDate: '2026-12-26',
    organizer: 'Sayan', members: [{ name: 'Sayan', avatar: null }], budget: 15000,
  }),
  acceptInvite: async (token) => ({ success: true }),

  // Contact
  contact: async (payload) => {
    await new Promise(r => setTimeout(r, 400));
    return { success: true };
  },

  // AI / Chat (stub — UI gracefully handles offline)
  chat: async (payload) => ({ reply: 'NOMAD is offline for demo mode.' }),

  // Quotes
  quotes: async () => [
    { text: 'The world is a book, and those who do not travel read only one page.', author: 'Saint Augustine' },
    { text: 'Travel is the only thing you buy that makes you richer.', author: 'Anonymous' },
    { text: 'To travel is to live.', author: 'Hans Christian Andersen' },
  ],
};

export default api;

// TRAVELO API client — single source for all backend calls
const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TOKEN_KEY = 'travelo_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    const err = new Error(typeof msg === 'string' ? msg : 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  destinations: (params = '') => request(`/destinations${params}`, { auth: false }),
  destination: (id) => request(`/destinations/${id}`, { auth: false }),
  quotes: () => request('/quotes', { auth: false }),
  randomQuote: () => request('/quotes/random', { auth: false }),
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  bookings: () => request('/bookings'),
  booking: (id) => request(`/bookings/${id}`),
  checkout: (payload) => request('/payments/checkout', { method: 'POST', body: payload }),
  paymentStatus: (sessionId) => request(`/payments/status/${sessionId}`, { auth: false }),
};

export default api;

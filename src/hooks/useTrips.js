import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_TRIPS = [
  { id: '1', name: 'PROJECT GOA', destination: 'GOA, INDIA', members: ['SAYAN', 'HARSH', 'PRIYA'], budget: 45000, emoji: '🏖️' },
  { id: '2', name: 'SQUAD ZERMATT', destination: 'VALAIS, SWITZERLAND', members: ['SAYAN', 'HARSH', 'RIYA'], budget: 180000, emoji: '🏔️' },
];

export function useTrips() {
  const [trips, setTrips] = useLocalStorage("travelo_trips_v3", DEFAULT_TRIPS);
  const addTrip = (t) => setTrips(p => [t, ...p]);
  const deleteTrip = (id) => setTrips(p => p.filter(t => t.id !== id));
  const updateTrip = (id, data) => setTrips(p => p.map(t => t.id === id ? { ...t, ...data } : t));
  const getTrip = (id) => trips.find(t => t.id === id);
  return { trips, addTrip, deleteTrip, updateTrip, getTrip };
}

import { useState, useEffect, useCallback } from 'react';
import { localTrips } from '../lib/localStorageEngine';

export function useTrips(uid) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setTrips([]); setLoading(false); return; }
    try {
      const data = localTrips.getAll(uid);
      setTrips(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const addTrip = useCallback((tripData) => {
    const newTrip = localTrips.add(uid, tripData);
    setTrips(prev => [newTrip, ...prev]);
    return newTrip;
  }, [uid]);

  const updateTrip = useCallback((id, updates) => {
    localTrips.update(id, updates);
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeTrip = useCallback((id) => {
    localTrips.remove(id);
    setTrips(prev => prev.filter(t => t.id !== id));
  }, []);

  return { trips, loading, addTrip, updateTrip, removeTrip };
}

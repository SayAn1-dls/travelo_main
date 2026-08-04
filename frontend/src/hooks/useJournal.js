import { useState, useEffect, useCallback } from 'react';
import { localJournal } from '../lib/localStorageEngine';

export function useJournal(uid) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setEntries([]); setLoading(false); return; }
    try {
      const data = localJournal.getAll(uid);
      setEntries(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const addEntry = useCallback((entryData) => {
    const newEntry = localJournal.add(uid, entryData);
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, [uid]);

  const removeEntry = useCallback((id) => {
    localJournal.remove(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  return { entries, loading, addEntry, removeEntry };
}

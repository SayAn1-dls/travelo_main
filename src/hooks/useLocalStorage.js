import { useState, useCallback } from 'react';
import { store } from '../utils/storage';

/**
 * useLocalStorage — reactive state backed by the zero-network persistence engine.
 * Drop-in replacement for useState with automatic LS sync.
 */
export function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => store.get(key, initialValue));

  const set = useCallback((value) => {
    const next = typeof value === 'function' ? value(state) : value;
    setState(next);
    store.set(key, next);
  }, [key, state]);

  const remove = useCallback(() => {
    setState(initialValue);
    store.remove(key);
  }, [key, initialValue]);

  return [state, set, remove];
}

export default useLocalStorage;

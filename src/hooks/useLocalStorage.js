import { useState, useEffect, useCallback } from "react";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const toStore = typeof value === "function" ? value(storedValue) : value;
      setStoredValue(toStore);
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to set "${key}":`, err);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.removeItem(key);
    } catch {/* noop */}
  }, [key, initialValue]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === key) {
        try { setStoredValue(e.newValue !== null ? JSON.parse(e.newValue) : initialValue); }
        catch {/* noop */}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

import { useState, useEffect } from 'react';

/**
 * useDebounce — delay rapid state updates for search/filter ops.
 * Eliminates UI flicker during high-frequency input events.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;

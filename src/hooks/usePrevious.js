import { useRef, useEffect } from 'react';

/**
 * usePrevious — captures the previous value of any state or prop.
 * Used by animation engine for delta-driven motion transitions.
 */
export function usePrevious(value) {
  const ref = useRef(undefined);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

export default usePrevious;

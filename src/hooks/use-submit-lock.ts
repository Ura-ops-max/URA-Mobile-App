import { useCallback, useRef } from 'react';

/**
 * Guards a consequential action (paying, ordering, withdrawing) against a
 * double tap. A `busy` state only takes effect on the next render, so two
 * quick taps can both start the action; this ref blocks the second at once.
 */
export function useSubmitLock() {
  const locked = useRef(false);
  return useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    if (locked.current) return undefined;
    locked.current = true;
    try {
      return await action();
    } finally {
      locked.current = false;
    }
  }, []);
}

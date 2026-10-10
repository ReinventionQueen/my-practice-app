"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "prep-storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

// localStorage-backed state that is safe for SSR: the server (and first client
// render) use `initial`, then the saved value takes over without a hydration mismatch.
export function usePersistentState<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );

  const value = useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new Event(EVENT));
      } catch {
        // Storage unavailable (private mode, quota); state just won't persist.
      }
    },
    [key],
  );

  return [value, setValue] as const;
}

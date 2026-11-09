import { useCallback, useState } from "react";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** useState that survives reloads (a UI preference, not app data). */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback));

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage unavailable (private mode): keep it for this session only.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}

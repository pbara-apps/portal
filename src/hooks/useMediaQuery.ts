import { useCallback, useSyncExternalStore } from "react";

/** Breakpoints matching Tailwind's defaults. */
export const MEDIA = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
} as const;

/** Live result of a CSS media query, read synchronously so the first render is correct. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

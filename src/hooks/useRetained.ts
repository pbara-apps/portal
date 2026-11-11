import { useState } from "react";

/**
 * Returns the last non-null value. Lets a drawer keep showing its record
 * while it animates closed after the page clears the selection.
 */
export function useRetained<T>(value: T | null | undefined): T | null {
  const [kept, setKept] = useState<T | null>(value ?? null);
  if (value != null && value !== kept) setKept(value);
  return value ?? kept;
}

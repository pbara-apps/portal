import type { KeyboardEvent } from "react";

/** For search boxes inside a drawer form: Enter shouldn't submit the form. */
export function preventEnterSubmit(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") e.preventDefault();
}

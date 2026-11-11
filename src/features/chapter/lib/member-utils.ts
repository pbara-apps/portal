import type { PortalMember } from "../types";

/**
 * Small helpers shared by the member screens.
 */

/** Members in these statuses can be edited from the chapter portal. */
export const canEditMember = (member: PortalMember) => ["active", "pending", "rejected"].includes(member.status);

/** Shown when a member has no photo. */
export const MEMBER_PLACEHOLDER_PHOTO = "/images/ra-logo.png";

/**
 * Age rules (soft warnings only — nothing is ever blocked):
 * - Everyone must be at least MIN_JOIN_AGE to join; every rank starts there.
 * - A rank may set a maximum age (e.g. 20); older members get a warning.
 *   Ranks without a maximum have no upper limit.
 */
export const MIN_JOIN_AGE = 10;

/** Whole years between a YYYY-MM-DD (or ISO) date and today, or null. */
export function ageFrom(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const birthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!birthdayPassed) age--;
  return age;
}

/**
 * Soft warning for an unusual age, or null when the age looks fine.
 * `rank` is optional: without it only the minimum joining age is checked.
 */
export function ageWarning(
  dateOfBirth?: string | null,
  rank?: { name: string; maxAge: number | null } | null,
): string | null {
  const age = ageFrom(dateOfBirth);
  if (age === null) return null;
  if (age < MIN_JOIN_AGE) {
    return `Age ${age} is under the joining age of ${MIN_JOIN_AGE}. Please double-check the date of birth.`;
  }
  if (rank?.maxAge && age > rank.maxAge) {
    return `Age ${age} is above the usual maximum of ${rank.maxAge} for ${rank.name}. Please double-check.`;
  }
  return null;
}

/** ISO date → "12 Mar 2014". */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** ISO date → "YYYY-MM-DD" for date inputs. */
export function toDateInput(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

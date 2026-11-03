/**
 * Types for the chapter portal (counsellors, presidents, secretaries).
 */

export type PortalRole = "counsellor" | "president" | "secretary";

export const PORTAL_ROLE_LABELS: Record<PortalRole, string> = {
  counsellor: "Counsellor",
  president: "President",
  secretary: "Secretary",
};

export interface PortalChapterRef {
  id: string;
  name: string;
  isDefault?: boolean;
}

/** The signed-in portal user, as returned by /chapter-portal/auth/me. */
export interface PortalProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PortalRole;
  churchId: string;
  chapterId: string | null;
  hasChangedPassword: boolean;
  church: { id: string; name: string } | null;
  /** Chapters this user can see (all church chapters for a counsellor). */
  chapters: PortalChapterRef[];
}

/** One rank a member has reached (date and proof optional). */
export interface RankProgressEntry {
  rank: { id: string; name: string; order: number | null };
  dateReached: string | null;
  proofUrl: string | null;
}

export type MemberStatus = "pending" | "active" | "rejected" | "transferred" | "inactive";

export interface PortalMember {
  id: string;
  memberId: string | null;
  fullName: string;
  dateOfBirth: string | null;
  photo: string | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  rank: { id: string; name: string; order: number | null; maxAge: number | null } | null;
  /** Ranks reached, lowest first. Empty for records created before rank history existed. */
  rankHistory: RankProgressEntry[];
  chapter: { id: string; name: string } | null;
  church: { id: string; name: string } | null;
  status: MemberStatus;
  changesRequested: boolean;
  reviewNote: string | null;
  submittedBy: { id: string; name: string; role: string } | null;
  createdAt: string;
  approvedAt: string | null;
}

/** What the add/edit forms send to the API. */
export interface MemberPayload {
  fullName: string;
  rankId: string;
  dateOfBirth?: string | null;
  photo?: string | null;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
}

export interface PortalDashboard {
  totals: {
    active: number;
    awaitingApproval: number;
    changesRequested: number;
    rejected: number;
  };
  byRank: { rankId: string; name: string; order: number | null; count: number }[];
  birthdays: { id: string; fullName: string; dateOfBirth: string; photo: string | null; memberId: string | null }[];
}

export interface PortalAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PortalRole;
  hasChangedPassword: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface ChapterOfficers {
  chapter: { id: string; name: string };
  president: PortalAccount | null;
  secretary: PortalAccount | null;
}

/** Returned when a one-time password is created. `temporaryPassword` only appears if the email failed. */
export interface CredentialDelivery {
  emailSent: boolean;
  temporaryPassword?: string;
}

export interface PortalRank {
  id: string;
  name: string;
  order: number | null;
  /** Oldest normal age for this rank; null = no upper limit. */
  maxAge: number | null;
}

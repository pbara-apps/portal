/**
 * Types for the association side of the chapter portal:
 * church counsellor logins and the Recruitment Board.
 */
import type { PortalMember } from "@/features/chapter/types";

export interface CounsellorAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasChangedPassword: boolean;
  lastLoginAt: string | null;
}

/** Another record with the same name, found by the duplicate check. */
export interface DuplicateMatch {
  id: string;
  fullName: string;
  memberId: string | null;
  status: PortalMember["status"];
  photo: string | null;
  dateOfBirth: string | null;
  chapterName: string | null;
  churchName: string | null;
  /** strong = same name and date of birth; possible = same name, a date of birth missing. */
  strength: "strong" | "possible";
  sameChapter: boolean;
}

export interface RecruitmentRequest extends PortalMember {
  duplicates: DuplicateMatch[];
}

export interface ReviewResult {
  approved?: number;
  updated?: number;
  skipped: number;
}

/** A row on the association's Chapters page. */
export interface AdminChapterRow {
  id: string;
  name: string;
  isDefault: boolean;
  church: { id: string; name: string } | null;
  activeMembers: number;
  president: string | null;
  secretary: string | null;
}

/** A counsellor's request to open a new chapter. */
export interface ChapterRequest {
  id: string;
  name: string;
  status: "pending" | "rejected";
  church: { id: string; name: string } | null;
  requestedBy: { name: string; email: string } | null;
  reviewNote: string | null;
  createdAt: string;
  churchActiveMembers: number;
  members: { id: string; fullName: string; memberId: string | null; photo: string | null; status: string; chapterName: string | null; rankName: string | null }[];
}

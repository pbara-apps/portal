/**
 * Types for the association side of the chapter portal:
 * church counsellor logins and the Recruitment Board.
 */

export interface CounsellorAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasChangedPassword: boolean;
  lastLoginAt: string | null;
}

export type ExecutiveRole = "super_admin" | "admin" | "editor" | "finance" | "viewer";

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: ExecutiveRole;
  token: string;
  phone?: string;
  image?: string | null;
  title?: string;
  description?: string;
  officeId?: string;
  officeName?: string;
  churchId?: string;
  churchName?: string;
  chapterName?: string;
  rankId?: string | null;
  rankName?: string;
  status?: "active" | "inactive" | "completed";
  startYear?: number;
  endYear?: number | null;
}

export const EXECUTIVE_ROLES: ExecutiveRole[] = [
  "super_admin",
  "admin",
  "editor",
  "finance",
  "viewer",
];

export const ROLE_LABELS: Record<ExecutiveRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  finance: "Finance",
  viewer: "Viewer",
};

/** Creating dues/levies and verifying chapter payments. */
export function canManageFinance(role?: string | null) {
  return role === "super_admin" || role === "admin" || role === "finance";
}

export function isSuperAdmin(role?: string | null) {
  return role === "super_admin";
}

export function canManageDirectorDesk(role?: string | null) {
  return role === "super_admin" || role === "admin";
}

/** Setting a church's counsellor login (chapter portal access). */
export function canManageCounsellors(role?: string | null) {
  return role === "super_admin" || role === "admin";
}

export function canWriteAdminContent(role?: string | null) {
  return role === "super_admin" || role === "admin" || role === "editor";
}

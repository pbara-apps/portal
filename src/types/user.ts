export type ExecutiveRole = "super_admin" | "admin" | "editor" | "viewer";

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: ExecutiveRole;
  token: string;
  phone?: string;
  officeId?: string;
  officeName?: string;
  churchId?: string;
  churchName?: string;
  chapterName?: string;
  status?: "active" | "inactive" | "completed";
  startYear?: number;
  endYear?: number | null;
}

export const EXECUTIVE_ROLES: ExecutiveRole[] = [
  "super_admin",
  "admin",
  "editor",
  "viewer",
];

export const ROLE_LABELS: Record<ExecutiveRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function isSuperAdmin(role?: string | null) {
  return role === "super_admin";
}

export function canManageDirectorDesk(role?: string | null) {
  return role === "super_admin" || role === "admin";
}

export function canWriteAdminContent(role?: string | null) {
  return role === "super_admin" || role === "admin" || role === "editor";
}

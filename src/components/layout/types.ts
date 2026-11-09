import type { IconType } from "react-icons";

export type ShellNavItem = {
  label: string;
  href: string;
  icon: IconType;
  /** Count shown as a pill (e.g. unread messages). Hidden when 0. */
  badge?: number;
};

export type ShellNavGroup = {
  id: string;
  label: string;
  items: ShellNavItem[];
};

/** Links in the account menu and the page search, e.g. Profile. */
export type ShellAccountLink = {
  label: string;
  href: string;
  icon: IconType;
};

export type ShellAccount = {
  name: string;
  email?: string;
  /** Role line under the name, e.g. "Super Admin". */
  role: string;
  image?: string | null;
  /** Extra highlight next to the role, e.g. "Finance". */
  tag?: string;
};

export interface ShellConfig {
  /** Short area name, first breadcrumb (e.g. "Admin"). */
  area: string;
  homeHref: string;
  /** Line under the brand name in the sidebar. */
  workspaceLabel: string;
  groups: ShellNavGroup[];
  isActive: (pathname: string, href: string) => boolean;
  account: ShellAccount;
  accountLinks: ShellAccountLink[];
  onSignOut: () => void;
  /** Remembers the collapsed sidebar per area. */
  storageKey: string;
}

export function initials(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "RA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

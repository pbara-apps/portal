import type { IconType } from "react-icons";
import {
  LuLayoutDashboard,
  LuUsers,
  LuBriefcase,
  LuNetwork,
  LuNewspaper,
  LuCalendar,
  LuImage,
  LuMessageSquare,
  LuSettings,
  LuFileText,
  LuUser,
  LuShield,
  LuAward,
  LuClipboardList,
  LuClipboardCheck,
} from "react-icons/lu";

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  badge?: number;
};

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LuLayoutDashboard },

  { label: "Executives", href: "/admin/executive", icon: LuUsers },
  { label: "Patrons", href: "/admin/patron", icon: LuAward },
  { label: "Offices", href: "/admin/office", icon: LuBriefcase },
  { label: "Chapters", href: "/admin/chapter", icon: LuNetwork },
  { label: "News", href: "/admin/news", icon: LuNewspaper },
  { label: "Events", href: "/admin/event", icon: LuCalendar },
  { label: "Gallery", href: "/admin/gallery", icon: LuImage },
  { label: "Programs", href: "/admin/programs", icon: LuClipboardList },
  {
    label: "Registrations",
    href: "/admin/registrations",
    icon: LuClipboardCheck,
  },
  { label: "Administrative", href: "/admin/administrative", icon: LuShield },
  {
    label: "Messages",
    href: "/admin/messages",
    icon: LuMessageSquare,
  },
];

export const adminFooterNav: NavItem[] = [
  { label: "Profile", href: "/admin/profile", icon: LuUser },
  { label: "Audit Log", href: "/admin/audit", icon: LuFileText },
  { label: "Settings", href: "/admin/settings", icon: LuSettings },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

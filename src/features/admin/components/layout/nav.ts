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
  LuMailPlus,
  LuMedal,
  LuUserCheck,
  LuLayers,
  LuTrophy,
  LuContact,
  LuWallet,
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
  { label: "Churches", href: "/admin/chapter", icon: LuNetwork },
  { label: "Chapters", href: "/admin/chapters", icon: LuLayers },
  { label: "Members", href: "/admin/members", icon: LuContact },
  { label: "Recruitment Board", href: "/admin/recruitment", icon: LuUserCheck },
  { label: "Achievements", href: "/admin/achievements", icon: LuTrophy },
  { label: "Dues & Levies", href: "/admin/dues", icon: LuWallet },
  { label: "Ranks", href: "/admin/ranks", icon: LuMedal },
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
  { label: "Subscribers", href: "/admin/subscribers", icon: LuMailPlus },
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

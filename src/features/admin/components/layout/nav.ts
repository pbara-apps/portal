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
  LuShuffle,
  LuCalendarCheck,
  LuMegaphone,
} from "react-icons/lu";

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  badge?: number;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

/** Sidebar sections. Order here is the order shown. */
export const adminNavGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LuLayoutDashboard }],
  },
  {
    id: "leadership",
    label: "Leadership",
    items: [
      { label: "Executives", href: "/admin/executive", icon: LuUsers },
      { label: "Patrons", href: "/admin/patron", icon: LuAward },
      { label: "Offices", href: "/admin/office", icon: LuBriefcase },
    ],
  },
  {
    id: "network",
    label: "Churches & Members",
    items: [
      { label: "Churches", href: "/admin/chapter", icon: LuNetwork },
      { label: "Chapters", href: "/admin/chapters", icon: LuLayers },
      { label: "Members", href: "/admin/members", icon: LuContact },
      { label: "Recruitment Board", href: "/admin/recruitment", icon: LuUserCheck },
      { label: "Transfers", href: "/admin/transfers", icon: LuShuffle },
      { label: "Ranks", href: "/admin/ranks", icon: LuMedal },
      { label: "Achievements", href: "/admin/achievements", icon: LuTrophy },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [{ label: "Dues & Levies", href: "/admin/dues", icon: LuWallet }],
  },
  {
    id: "programs",
    label: "Programs & Events",
    items: [
      { label: "Programs", href: "/admin/programs", icon: LuClipboardList },
      { label: "Registrations", href: "/admin/registrations", icon: LuClipboardCheck },
      { label: "Events", href: "/admin/event", icon: LuCalendar },
      { label: "Chapter Activity", href: "/admin/activity", icon: LuCalendarCheck },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: LuMegaphone },
      { label: "Messages", href: "/admin/messages", icon: LuMessageSquare },
      { label: "Subscribers", href: "/admin/subscribers", icon: LuMailPlus },
    ],
  },
  {
    id: "content",
    label: "Website Content",
    items: [
      { label: "News", href: "/admin/news", icon: LuNewspaper },
      { label: "Gallery", href: "/admin/gallery", icon: LuImage },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { label: "Administrative", href: "/admin/administrative", icon: LuShield },
      { label: "Audit Log", href: "/admin/audit", icon: LuFileText },
      { label: "Settings", href: "/admin/settings", icon: LuSettings },
    ],
  },
];

export const adminFooterNav: NavItem[] = [
  { label: "Profile", href: "/admin/profile", icon: LuUser },
];

/** Every page in one flat list (used for page titles). */
export const adminNav: NavItem[] = adminNavGroups.flatMap((g) => g.items);

export function isNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

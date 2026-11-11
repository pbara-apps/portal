import { useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LuAward,
  LuClipboardCheck,
  LuClipboardList,
  LuCalendarCheck,
  LuKeyRound,
  LuLayers,
  LuLayoutDashboard,
  LuMegaphone,
  LuShuffle,
  LuUserCog,
  LuUsers,
  LuWallet,
} from "react-icons/lu";
import { AppShell } from "@/components/layout/AppShell";
import type { ShellAccountLink, ShellConfig, ShellNavItem } from "@/components/layout/types";
import { AreaSwitch } from "@/components/shared/AreaSwitch";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { signOutEverywhere } from "@/lib/auth/session";
import { useChapterProfile } from "../api/auth";
import { chapterNotifications } from "../api/notifications";
import { useChapterSession } from "../store/useChapterSession";
import { PORTAL_ROLE_LABELS, type PortalRole } from "../types";
import { ChapterAuthGuard } from "./ChapterAuthGuard";

type ChapterNavItem = ShellNavItem & { roles?: PortalRole[] };

/** Sidebar sections. `roles` limits a link to those roles (default: everyone). */
const NAV_GROUPS: { id: string; label: string; items: ChapterNavItem[] }[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ label: "Dashboard", href: "/chapter", icon: LuLayoutDashboard }],
  },
  {
    id: "members",
    label: "Members",
    items: [
      { label: "Members", href: "/chapter/members", icon: LuUsers },
      { label: "Transfers", href: "/chapter/transfers", icon: LuShuffle },
      { label: "Census", href: "/chapter/census", icon: LuClipboardCheck },
    ],
  },
  {
    id: "activities",
    label: "Activities",
    items: [
      { label: "Programs", href: "/chapter/programs", icon: LuClipboardList },
      { label: "Achievements", href: "/chapter/achievements", icon: LuAward },
      { label: "Meetings", href: "/chapter/meetings", icon: LuCalendarCheck },
      { label: "Announcements", href: "/chapter/announcements", icon: LuMegaphone },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [{ label: "Dues & Levies", href: "/chapter/dues", icon: LuWallet }],
  },
  {
    id: "church",
    label: "Church",
    items: [
      { label: "Chapters", href: "/chapter/chapters", icon: LuLayers, roles: ["counsellor"] },
      { label: "Chapter Officers", href: "/chapter/officers", icon: LuUserCog, roles: ["counsellor"] },
    ],
  },
];

const ACCOUNT_LINKS: ShellAccountLink[] = [
  { label: "Change password", href: "/chapter/change-password", icon: LuKeyRound },
];

/** Which link is active. The dashboard only matches its own path. */
function isActive(pathname: string, href: string) {
  if (href === "/chapter") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Layout for every signed-in chapter portal page. Used as a route element;
 * pages render in the <Outlet />.
 */
export function ChapterShell() {
  return (
    <ChapterAuthGuard>
      <ChapterFrame />
    </ChapterAuthGuard>
  );
}

function ChapterFrame() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useChapterSession((s) => s.profile);

  // Keep the profile (and the counsellor's chapter list) fresh.
  useChapterProfile();

  const config = useMemo<ShellConfig>(() => {
    const role = profile?.role;
    return {
      area: "Chapter",
      homeHref: "/chapter",
      workspaceLabel: profile?.church?.name ?? "Chapter portal",
      storageKey: "pba.chapter.shell",
      isActive,
      groups: NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items
          .filter((item) => !item.roles || (role && item.roles.includes(role)))
          .map(({ roles: _, ...item }) => item),
      })).filter((group) => group.items.length > 0),
      account: {
        name: profile?.name ?? "Chapter user",
        email: profile?.email,
        role: role ? PORTAL_ROLE_LABELS[role] : "Chapter portal",
      },
      accountLinks: ACCOUNT_LINKS,
      onSignOut: () => {
        signOutEverywhere();
        queryClient.clear();
        navigate("/login", { replace: true });
      },
    };
  }, [profile, queryClient, navigate]);

  return (
    <AppShell
      config={config}
      topbarActions={
        <>
          <AreaSwitch to="admin" />
          <NotificationBell hooks={chapterNotifications} />
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}

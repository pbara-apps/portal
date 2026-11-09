import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import type { ShellConfig } from "@/components/layout/types";
import { AreaSwitch } from "@/components/shared/AreaSwitch";
import { NotificationBell } from "@/components/shared/NotificationBell";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useProfile } from "@/lib/api/auth";
import { useRecruitmentPendingCount } from "@/lib/api/chapter-admin";
import { useGetUnreadMessageCount } from "@/lib/api/message";
import { adminNotifications } from "@/lib/api/notification";
import { useGetPendingRegistrationCount } from "@/lib/api/registration";
import { signOutEverywhere } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/types/user";
import { adminAccountLinks, adminNavGroups, isNavActive } from "./nav";

/** Admin area frame: the shared AppShell with admin navigation and counts. */
export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useCurrentUser((s) => s.user);
  const superAdmin = user?.role === "super_admin";
  // Keeps the signed-in user's role and finance access up to date.
  useProfile(true);

  const { data: unread = 0 } = useGetUnreadMessageCount();
  const { data: pendingRegistrations = 0 } = useGetPendingRegistrationCount();
  const { data: pendingRecruitment = 0 } = useRecruitmentPendingCount();

  const config = useMemo<ShellConfig>(() => {
    const badges: Record<string, number> = {
      "/admin/messages": unread,
      "/admin/registrations": pendingRegistrations,
      "/admin/recruitment": pendingRecruitment,
    };
    return {
      area: "Admin",
      homeHref: "/admin",
      workspaceLabel: "Association admin",
      storageKey: "pba.admin.shell",
      isActive: isNavActive,
      groups: adminNavGroups
        .map((group) => ({
          ...group,
          items: group.items
            .filter((item) => !item.superAdminOnly || superAdmin)
            .map(({ superAdminOnly: _, ...item }) => ({ ...item, badge: badges[item.href] })),
        }))
        .filter((group) => group.items.length > 0),
      account: {
        name: user?.name ?? "Admin",
        email: user?.email,
        role: user?.role ? ROLE_LABELS[user.role] : "Admin",
        image: user?.image,
        tag: user?.isFinance ? "Finance" : undefined,
      },
      accountLinks: adminAccountLinks,
      onSignOut: () => {
        signOutEverywhere();
        navigate("/login", { replace: true });
      },
    };
  }, [user, superAdmin, unread, pendingRegistrations, pendingRecruitment, navigate]);

  return (
    <AppShell
      config={config}
      topbarActions={
        <>
          <AreaSwitch to="chapter" />
          <NotificationBell hooks={adminNotifications} />
        </>
      }
    >
      {children}
    </AppShell>
  );
}

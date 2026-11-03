import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  LuKeyRound,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuUserPlus,
  LuUsers,
  LuUserCog,
  LuLayers,
  LuClipboardList,
  LuX,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useChapterProfile } from "../api/auth";
import { chapterNotifications } from "../api/notifications";
import { useChapterSession } from "../store/useChapterSession";
import { PORTAL_ROLE_LABELS, type PortalRole } from "../types";
import { ChapterAuthGuard } from "./ChapterAuthGuard";

type NavItem = { label: string; href: string; icon: IconType; roles?: PortalRole[] };

/** Sidebar links. `roles` limits a link to those roles (default: everyone). */
const NAV: NavItem[] = [
  { label: "Dashboard", href: "/chapter", icon: LuLayoutDashboard },
  { label: "Members", href: "/chapter/members", icon: LuUsers },
  { label: "Add Members", href: "/chapter/members/add", icon: LuUserPlus },
  { label: "Programs", href: "/chapter/programs", icon: LuClipboardList },
  { label: "Chapters", href: "/chapter/chapters", icon: LuLayers, roles: ["counsellor"] },
  { label: "Chapter Officers", href: "/chapter/officers", icon: LuUserCog, roles: ["counsellor"] },
  { label: "Change Password", href: "/chapter/change-password", icon: LuKeyRound },
];

/** Which sidebar link is active. "Members" covers member pages but not "Add Members". */
function isActive(pathname: string, href: string) {
  if (href === "/chapter") return pathname === href;
  if (href === "/chapter/members") {
    return pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/add`));
  }
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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useChapterSession((s) => s.profile);
  const signOut = useChapterSession((s) => s.signOut);
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the profile (and the counsellor's chapter list) fresh.
  useChapterProfile();

  useEffect(() => setMenuOpen(false), [pathname]);

  const mustChangePassword = !profile?.hasChangedPassword;
  const items = NAV.filter((item) => !item.roles || (profile && item.roles.includes(profile.role)));
  const current = items.find((item) => isActive(pathname, item.href));

  const handleSignOut = () => {
    signOut();
    queryClient.removeQueries({ queryKey: ["chapter-portal"] });
    navigate("/chapter/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-text-dark">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-primary/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        aria-label="Chapter portal navigation"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col bg-gradient-to-b from-[#040e3d] to-primary py-6 shadow-2xl transition-transform duration-300",
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 px-5">
          <img src="/images/ra-logo.png" alt="RA logo" className="h-10 w-10 rounded-full object-contain" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">Chapter Portal</p>
            <p className="truncate text-[11px] uppercase tracking-wider text-white/50">
              {profile?.church?.name ?? "Royal Ambassadors"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="ml-auto rounded-md p-2 text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <LuX size={18} />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            // Until the one-time password is changed, only that page is available.
            const disabled = mustChangePassword && item.href !== "/chapter/change-password";
            return (
              <Link
                key={item.href}
                to={disabled ? "#" : item.href}
                aria-disabled={disabled}
                aria-current={active ? "page" : undefined}
                onClick={(e) => disabled && e.preventDefault()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-white/[0.08] text-white" : "text-white/65 hover:bg-white/[0.05] hover:text-white",
                  disabled && "pointer-events-none opacity-40",
                )}
              >
                <Icon size={18} className={active ? "text-gold" : undefined} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 flex items-center gap-3 rounded-xl bg-white/[0.06] p-2.5 ring-1 ring-white/10">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile?.name}</p>
            <p className="truncate text-[11px] text-white/50">
              {profile ? PORTAL_ROLE_LABELS[profile.role] : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LuLogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-[260px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-text-dark/6 bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-text-dark/5 lg:hidden"
            aria-label="Open menu"
          >
            <LuMenu size={20} />
          </button>
          <p className="truncate text-sm font-semibold text-primary">{current?.label ?? "Chapter Portal"}</p>
          <div className="ml-auto">
            {!mustChangePassword && <NotificationBell hooks={chapterNotifications} />}
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

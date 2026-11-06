import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LuChevronDown,
  LuChevronsLeft,
  LuLogOut,
  LuSearch,
  LuX,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetUnreadMessageCount } from "@/lib/api/message";
import { useGetPendingRegistrationCount } from "@/lib/api/registration";
import { useRecruitmentPendingCount } from "@/lib/api/chapter-admin";
import { ROLE_LABELS } from "@/types/user";
import { adminNavGroups, isNavActive, type NavGroup, type NavItem } from "./nav";

const OPEN_GROUPS_KEY = "pba.admin.sidebar.groups";

function getUserInitials(name?: string | null) {
  if (!name?.trim()) return "RA";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function useIsDesktop() {
  const query = "(min-width: 1024px)";
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return matches;
}

/** Which groups the user has opened or closed, remembered between visits. */
function useOpenGroups() {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(OPEN_GROUPS_KEY) ?? "{}");
    } catch {
      return {};
    }
  });
  const toggle = (id: string, current: boolean) =>
    setOpen((prev) => {
      const next = { ...prev, [id]: !current };
      try {
        localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  return { open, toggle };
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
  onToggleCollapse,
}: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, removeCurrentUser } = useCurrentUser();
  const isDesktop = useIsDesktop();
  // The narrow icon rail only exists on desktop; mobile always shows the full menu.
  const compact = collapsed && isDesktop;
  const { open, toggle } = useOpenGroups();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: unreadCount = 0 } = useGetUnreadMessageCount();
  const { data: pendingRegistrationCount = 0 } = useGetPendingRegistrationCount();
  const { data: pendingRecruitmentCount = 0 } = useRecruitmentPendingCount();

  const groups = useMemo<NavGroup[]>(() => {
    const badges: Record<string, number> = {
      "/admin/messages": unreadCount,
      "/admin/registrations": pendingRegistrationCount,
      "/admin/recruitment": pendingRecruitmentCount,
    };
    const q = query.trim().toLowerCase();
    return adminNavGroups
      .map((g) => ({
        ...g,
        items: g.items
          .map((item) => (badges[item.href] > 0 ? { ...item, badge: badges[item.href] } : item))
          .filter(
            (item) => !q || item.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q),
          ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, unreadCount, pendingRegistrationCount, pendingRecruitmentCount]);

  // ⌘K / Ctrl+K jumps to the menu search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (compact) onToggleCollapse();
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compact, onToggleCollapse]);

  const searching = query.trim().length > 0;
  const signOut = () => {
    removeCurrentUser();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        type="button"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={onMobileClose}
        className={cn(
          "focus-ring fixed inset-0 z-40 bg-primary/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Close sidebar"
      />

      <aside
        aria-label="Admin navigation"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden bg-[#0b1238] text-white shadow-2xl",
          "transition-[transform,width] duration-300 ease-out w-[280px]",
          collapsed ? "lg:w-[76px]" : "lg:w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Soft glow behind the content */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
          <div className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
        </div>

        {/* Brand */}
        <div className={cn("relative flex items-center gap-3 px-4 pb-4 pt-5", compact && "justify-center px-0")}>
          <Link
            to="/admin"
            className="focus-ring relative shrink-0 rounded-xl"
            aria-label="PBARA home"
          >
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold/60 to-gold/0 blur-md" aria-hidden />
            <img
              src="/images/ra-logo.png"
              alt="RA logo"
              className="relative h-10 w-10 rounded-xl object-contain"
            />
          </Link>
          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold tracking-tight">PBARA</p>
              <p className="flex items-center gap-1.5 truncate text-[11px] text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400" />
                Association workspace
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onMobileClose}
            className="focus-ring rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Menu search */}
        <div className={cn("relative px-3 pb-3 mt-10", compact && "px-2")}>
          {compact ? (
            <button
              type="button"
              onClick={() => {
                onToggleCollapse();
                requestAnimationFrame(() => searchRef.current?.focus());
              }}
              title="Search menu (⌘K)"
              className="focus-ring flex h-10 w-full items-center justify-center rounded-xl bg-white/[0.05] text-white/60 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Search menu"
            >
              <LuSearch size={17} />
            </button>
          ) : (
            <label className="flex h-10 items-center gap-2 rounded-xl bg-white/[0.05] px-3 ring-1 ring-white/10 transition focus-within:bg-white/[0.08] focus-within:ring-gold/40">
              <LuSearch size={15} className="shrink-0 text-white/45" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQuery("");
                    e.currentTarget.blur();
                  }
                  if (e.key === "Enter" && groups[0]?.items[0]) {
                    navigate(groups[0].items[0].href);
                    setQuery("");
                    onMobileClose();
                  }
                }}
                placeholder="Search menu…"
                aria-label="Search menu"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              />
              {searching ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded p-0.5 text-white/50 hover:text-white"
                  aria-label="Clear search"
                >
                  <LuX size={14} />
                </button>
              ) : (
                <kbd className="hidden rounded-md bg-white/10 px-1.5 py-0.5 font-sans text-[10px] font-medium text-white/50 lg:inline">
                  ⌘K
                </kbd>
              )}
            </label>
          )}
        </div>

        {/* Groups */}
        <nav
          className={cn(
            "relative flex-1 overflow-y-auto overflow-x-hidden pb-4 [scrollbar-color:rgba(255,255,255,0.12)_transparent] [scrollbar-width:thin]",
            compact ? "px-2" : "px-3",
          )}
          aria-label="Primary"
        >
          {groups.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-white/45">No pages match “{query}”.</p>
          )}

          {groups.map((group, index) => {
            const hasActive = group.items.some((i) => isNavActive(pathname, i.href));
            const single = group.items.length === 1 && !searching;
            const isOpen = searching || single || (open[group.id] ?? true) || hasActive;
            const groupBadge = group.items.reduce((n, i) => n + (i.badge ?? 0), 0);

            if (compact) {
              return (
                <div key={group.id} className={cn("space-y-1", index > 0 && "mt-2 border-t border-white/[0.07] pt-2")}>
                  {group.items.map((item) => (
                    <SidebarLink
                      key={item.href}
                      item={item}
                      active={isNavActive(pathname, item.href)}
                      compact
                      onNavigate={onMobileClose}
                    />
                  ))}
                </div>
              );
            }

            return (
              <div key={group.id} className={cn(index > 0 && "mt-3")}>
                {!single && (
                  <button
                    type="button"
                    onClick={() => !searching && toggle(group.id, isOpen)}
                    aria-expanded={isOpen}
                    className="focus-ring group/label flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white/70"
                  >
                    <span className="flex-1 truncate text-left">{group.label}</span>
                    {!isOpen && groupBadge > 0 && (
                      <span className="rounded-full bg-gold px-1.5 text-[10px] font-bold leading-4 tracking-normal text-primary">
                        {groupBadge > 99 ? "99+" : groupBadge}
                      </span>
                    )}
                    <LuChevronDown
                      size={13}
                      className={cn(
                        "shrink-0 transition-[transform,opacity] duration-200 group-hover/label:opacity-100",
                        !isOpen && "-rotate-90 opacity-75",
                      )}
                    />
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-0.5 space-y-0.5">
                        {group.items.map((item) => (
                          <SidebarLink
                            key={item.href}
                            item={item}
                            active={isNavActive(pathname, item.href)}
                            compact={false}
                            onNavigate={() => {
                              setQuery("");
                              onMobileClose();
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Account */}
        <div className={cn("relative border-t border-white/[0.07] p-3", compact && "px-2")}>
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-2xl bg-white/[0.05] p-2 ring-1 ring-white/10",
              compact && "flex-col gap-2 bg-transparent p-0 ring-0",
            )}
          >
            <Link
              to="/admin/profile"
              onClick={onMobileClose}
              title={compact ? `${user?.name ?? "Profile"}` : undefined}
              className="focus-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-xl"
            >
              <span className="relative shrink-0">
                {user?.image ? (
                  <img src={user.image} alt="" className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/20" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-[#E8C96A] text-sm font-bold text-primary">
                    {getUserInitials(user?.name)}
                  </span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b1238]" />
              </span>
              {!compact && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{user?.name}</span>
                  <span className="flex items-center gap-1 truncate text-[11px] text-white/50">
                    {user?.role ? ROLE_LABELS[user.role] : "Admin"}
                    {user?.isFinance && (
                      <span className="rounded bg-emerald-400/15 px-1 text-[10px] font-semibold text-emerald-300">
                        Finance
                      </span>
                    )}
                  </span>
                </span>
              )}
            </Link>
            <LogoutButton onConfirm={signOut} />
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="focus-ring mt-2 hidden h-8 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
          >
            <LuChevronsLeft
              size={15}
              className={cn("transition-transform duration-200", collapsed && "rotate-180")}
            />
            {!compact && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function LogoutButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="focus-ring shrink-0 rounded-lg p-2 text-white/55 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
          aria-label="Sign out"
          title="Sign out"
        >
          <LuLogOut size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-64">
        <p className="text-sm font-semibold text-primary">Sign out?</p>
        <p className="mt-1 text-xs text-text-muted">
          You will need to sign in again to access the admin portal.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <PopoverClose asChild>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button size="sm" variant="destructive" onClick={onConfirm}>
              Sign out
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SidebarLink({
  item,
  active,
  compact,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  compact: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const badge = item.badge ?? 0;

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      title={compact ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring group relative flex items-center rounded-xl text-sm font-medium transition-colors duration-150",
        compact ? "h-10 justify-center" : "gap-3 px-3 py-2",
        active ? "text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/[0.13] to-white/[0.04] ring-1 ring-white/10"
          aria-hidden
        >
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold shadow-[0_0_10px] shadow-gold" />
        </motion.span>
      )}
      <span
        className={cn(
          "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
          active ? "bg-gold/15 text-gold" : "text-white/55 group-hover:text-white",
        )}
      >
        <Icon size={17} />
        {compact && badge > 0 && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gold ring-2 ring-[#0b1238]" aria-label={`${badge} pending`} />
        )}
      </span>
      {!compact && (
        <>
          <span className="relative flex-1 truncate">{item.label}</span>
          {badge > 0 && (
            <span className="relative rounded-full bg-gold px-1.5 text-[10px] font-bold leading-[18px] text-primary">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

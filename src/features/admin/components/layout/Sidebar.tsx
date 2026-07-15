import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuChevronLeft, LuLogOut, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetUnreadMessageCount } from "@/lib/api/message";
import { useGetPendingRegistrationCount } from "@/lib/api/registration";
import { ROLE_LABELS } from "@/types/user";
import { adminFooterNav, adminNav, isNavActive, type NavItem } from "./nav";

function getUserInitials(name?: string | null) {
  if (!name?.trim()) return "RA";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
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
  const userInitials = getUserInitials(user?.name);
  const { data: unreadCount = 0 } = useGetUnreadMessageCount();
  const { data: pendingRegistrationCount = 0 } =
    useGetPendingRegistrationCount();

  const navItems = adminNav.map((item) => {
    if (item.href === "/admin/messages" && unreadCount > 0) {
      return { ...item, badge: unreadCount };
    }
    if (
      item.href === "/admin/registrations" &&
      pendingRegistrationCount > 0
    ) {
      return { ...item, badge: pendingRegistrationCount };
    }
    return item;
  });

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
          "fixed left-0 top-0 z-50 flex h-screen flex-col py-5 shadow-2xl",
          "bg-gradient-to-b from-[#040e3d] to-primary",
          "transition-[transform,width] duration-300 ease-out w-[280px]",
          collapsed ? "lg:w-[76px]" : "lg:w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "mb-6 my-6 flex items-center gap-3 px-5 transition-[padding] duration-200",
            collapsed && "lg:justify-center lg:px-3",
          )}
        >
          <Link to="/admin" className="flex items-center gap-2 shrink-0" aria-label="RAPBA home">
            <img src="/images/ra-logo.png" alt="RA logo" className="h-10 w-10 rounded-full object-contain" />
          </Link>
          <div
            className={cn(
              "min-w-0 transition-[opacity,transform] duration-200",
              collapsed && "lg:pointer-events-none lg:-translate-x-2 lg:opacity-0",
            )}
          >
            <h1 className="truncate text-base font-bold text-white">RAPBA</h1>
            <p className="truncate text-[11px] uppercase tracking-wider text-white/50">
              Organization Admin
            </p>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            className="focus-ring ml-auto rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <LuX size={20} />
          </button>
        </div>

        <nav
          className="mt-8 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]"
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isNavActive(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={onMobileClose}
            />
          ))}

          <div className="mt-4 space-y-0.5 border-t border-white/10 pt-4">
            {adminFooterNav.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isNavActive(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onMobileClose}
              />
            ))}
          </div>
        </nav>

        <div className="mt-3 px-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-white/[0.06] p-2.5 ring-1 ring-white/10 transition-all",
              collapsed && "lg:justify-center lg:p-2",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-[#E8C96A] text-sm font-bold text-primary shadow-inner">
              {userInitials}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 transition-[opacity,width] duration-200",
                collapsed && "lg:pointer-events-none lg:w-0 lg:overflow-hidden lg:opacity-0",
              )}
            >
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-[11px] text-white/50">
                {user?.role ? ROLE_LABELS[user.role] : "Admin"}
              </p>
            </div>
            <LogoutButton
              collapsed={collapsed}
              onConfirm={() => {
                removeCurrentUser();
                navigate("/login", { replace: true });
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="focus-ring mx-3 mt-3 hidden h-8 items-center justify-center gap-2 rounded-lg bg-white/[0.04] text-xs font-medium text-white/60 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
        >
          <LuChevronLeft
            size={14}
            className={cn("transition-transform duration-200", collapsed && "rotate-180")}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </>
  );
}

function LogoutButton({
  collapsed,
  onConfirm,
}: {
  collapsed: boolean;
  onConfirm: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus-ring shrink-0 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white",
            collapsed && "lg:hidden",
          )}
          aria-label="Sign out"
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
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring group relative flex items-center rounded-lg py-2.5 text-sm font-medium outline-none transition-all duration-200 px-3 gap-3",
        collapsed && "lg:justify-center lg:gap-0 lg:px-2",
        active
          ? "bg-white/[0.08] text-white"
          : "text-white/65 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      <Icon
        size={19}
        className={cn(
          "shrink-0 transition-colors",
          active ? "text-gold" : "text-white/65 group-hover:text-white",
        )}
      />
      <span
        className={cn(
          "flex-1 truncate transition-[opacity,width] duration-200",
          collapsed && "lg:pointer-events-none lg:w-0 lg:overflow-hidden lg:opacity-0",
        )}
      >
        {item.label}
      </span>
      {item.badge != null && item.badge > 0 && !collapsed && (
        <span className="ml-auto rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
      {item.badge != null && item.badge > 0 && collapsed && (
        <span
          className="absolute right-2 top-2 hidden h-2 w-2 rounded-full bg-gold lg:block"
          aria-label={`${item.badge} pending`}
        />
      )}
      {active && (
        <span
          className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-gold"
          aria-hidden
        />
      )}
    </Link>
  );
}

import { Link } from "react-router-dom";
import { LuPanelLeftClose, LuPanelLeftOpen, LuX } from "react-icons/lu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./SidebarNav";
import type { ShellConfig } from "./types";

function Brand({ config, compact }: { config: ShellConfig; compact: boolean }) {
  return (
    <Link
      to={config.homeHref}
      aria-label={`PBARA ${config.area} home`}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
        compact && "justify-center",
      )}
    >
      <img src="/images/ra-logo.png" alt="" className="size-9 shrink-0 rounded-lg object-contain" />
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold tracking-tight text-white">PBARA</span>
          <span className="block truncate text-[11.5px] text-white/50">{config.workspaceLabel}</span>
        </span>
      ) : null}
    </Link>
  );
}

/** Subtle depth behind the nav: a faint gold glow at the top, darker at the bottom. */
function SidebarBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 -top-28 size-64 rounded-full bg-gold/[0.09] blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}

interface DesktopSidebarProps {
  config: ShellConfig;
  pathname: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Fixed sidebar for lg and up. Collapses to an icon rail with tooltips. */
export function DesktopSidebar({ config, pathname, collapsed, onToggleCollapsed }: DesktopSidebarProps) {
  const ToggleIcon = collapsed ? LuPanelLeftOpen : LuPanelLeftClose;
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <aside
      aria-label={`${config.area} navigation`}
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.06] bg-sidebar text-white lg:flex",
        "transition-[width] duration-300 ease-brand motion-reduce:transition-none",
        collapsed ? "w-[var(--sidebar-rail)]" : "w-[var(--sidebar-width)]",
      )}
    >
      <SidebarBackdrop />
      <div className={cn("relative flex h-16 shrink-0 items-center", collapsed ? "justify-center px-3" : "px-5")}>
        <Brand config={config} compact={collapsed} />
      </div>
      <div className="relative mt-2 flex min-h-0 flex-1 flex-col">
        <SidebarNav config={config} pathname={pathname} compact={collapsed} layoutScope="desktop" />
      </div>
      <div className="relative border-t border-white/[0.06] p-3">
        <Tooltip content={toggleLabel} placement="end" disabled={!collapsed}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium text-white/50 outline-none transition-colors",
              "hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60",
              collapsed && "justify-center px-0",
            )}
          >
            <ToggleIcon size={17} aria-hidden />
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}

interface MobileSidebarProps {
  config: ShellConfig;
  pathname: string;
  open: boolean;
  onClose: () => void;
}

/** Below lg the same navigation slides in from the left. */
export function MobileSidebar({ config, pathname, open, onClose }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="left"
        hideClose
        aria-label={`${config.area} navigation`}
        className="max-w-[min(19rem,86vw)] border-r border-white/[0.06] bg-sidebar text-white sm:max-w-[19rem]"
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <SidebarBackdrop />
          <div className="relative flex h-16 shrink-0 items-center justify-between gap-3 pl-5 pr-3">
            <Brand config={config} compact={false} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex size-10 items-center justify-center rounded-lg text-white/60 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <LuX size={18} aria-hidden />
            </button>
          </div>
          <div className="relative mt-2 flex min-h-0 flex-1 flex-col">
            <SidebarNav config={config} pathname={pathname} compact={false} layoutScope="mobile" onNavigate={onClose} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

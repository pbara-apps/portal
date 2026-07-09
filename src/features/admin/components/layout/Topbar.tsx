import { useLocation } from "react-router-dom";
import { LuBell, LuChevronRight, LuMenu, LuSearch } from "react-icons/lu";
import { adminFooterNav, adminNav } from "./nav";

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const { pathname } = useLocation();
  const all = [...adminNav, ...adminFooterNav];
  const current =
    all.find(
      (n) => n.href === pathname || (n.href !== "/admin" && pathname.startsWith(n.href + "/")),
    ) ?? all[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b border-text-dark/[0.06] bg-surface/80 px-4 backdrop-blur-md sm:gap-3 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-text-dark transition-colors hover:bg-text-dark/5 lg:hidden"
        aria-label="Open menu"
      >
        <LuMenu size={20} />
      </button>

      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-1 items-center gap-2 text-sm text-text-muted"
      >
        <span className="hidden shrink-0 font-medium sm:inline">RAPBA</span>
        <LuChevronRight size={14} className="hidden shrink-0 sm:inline opacity-50" />
        <span className="truncate font-semibold text-primary">{current.label}</span>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative hidden w-56 md:block lg:w-72 xl:w-80">
          <LuSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            placeholder="Search anything…"
            className="focus-ring w-full rounded-lg border border-text-dark/10 bg-background/70 py-2 pl-9 pr-12 text-sm text-text-dark placeholder:text-text-muted transition-all focus:border-gold/40 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-gold/10"
          />
        </div>

        <button
          type="button"
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-text-dark transition-colors hover:bg-text-dark/5 md:hidden"
          aria-label="Search"
        >
          <LuSearch size={18} />
        </button>

        <button
          type="button"
          className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-full text-text-dark transition-colors hover:bg-text-dark/5"
          aria-label="Notifications"
        >
          <LuBell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold ring-2 ring-surface" />
        </button>
      </div>
    </header>
  );
}

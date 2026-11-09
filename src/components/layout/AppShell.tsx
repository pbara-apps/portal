import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MEDIA, useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { DesktopSidebar, MobileSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { PageSearch } from "./PageSearch";
import type { ShellConfig } from "./types";
import { usePersistentState } from "./usePersistentState";

interface AppShellProps {
  config: ShellConfig;
  /** Area-specific top bar buttons (portal switch, notifications). */
  topbarActions?: ReactNode;
  children: ReactNode;
}

/**
 * Frame for every signed-in page in both the admin and chapter areas:
 * sidebar (icon rail when collapsed, drawer on mobile), top bar with
 * breadcrumbs, page search (⌘K / Ctrl+K) and account menu.
 */
export function AppShell({ config, topbarActions, children }: AppShellProps) {
  const { pathname } = useLocation();
  const isDesktop = useMediaQuery(MEDIA.lg);
  const [collapsed, setCollapsed] = usePersistentState(`${config.storageKey}.collapsed`, false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // The mobile menu never stays open on a new page or after resizing to desktop.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }
  const mobileMenuOpen = menuOpen && !isDesktop;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="min-h-dvh bg-background text-foreground"
      // Current sidebar width, for fixed elements that centre on the content (e.g. the bulk action bar).
      style={{ "--shell-offset": collapsed ? "var(--sidebar-rail)" : "var(--sidebar-width)" } as CSSProperties}
    >
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-sm font-medium shadow-[var(--overlay-shadow)] focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>

      <DesktopSidebar
        config={config}
        pathname={pathname}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />
      <MobileSidebar config={config} pathname={pathname} open={mobileMenuOpen} onClose={() => setMenuOpen(false)} />

      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[padding] duration-300 ease-brand motion-reduce:transition-none",
          collapsed ? "lg:pl-[var(--sidebar-rail)]" : "lg:pl-[var(--sidebar-width)]",
        )}
      >
        <AppTopbar
          config={config}
          pathname={pathname}
          actions={topbarActions}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full min-w-0 max-w-[var(--content-max)] flex-1 px-4 py-6 pb-24 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>

      <PageSearch config={config} open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

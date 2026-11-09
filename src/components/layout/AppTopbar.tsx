import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LuChevronRight, LuMenu, LuSearch } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import type { ShellConfig } from "./types";

interface Crumb {
  label: string;
  href?: string;
}

/** Area › Section › Page for the current path. Single-page sections are skipped. */
function getCrumbs(config: ShellConfig, pathname: string): Crumb[] {
  const root: Crumb = { label: config.area, href: config.homeHref };
  for (const group of config.groups) {
    const item = group.items.find((i) => config.isActive(pathname, i.href));
    if (!item) continue;
    if (item.href === config.homeHref) return [{ label: config.area }, { label: item.label }];
    return group.items.length > 1
      ? [root, { label: group.label }, { label: item.label }]
      : [root, { label: item.label }];
  }
  const accountPage = config.accountLinks.find((l) => config.isActive(pathname, l.href));
  return accountPage ? [root, { label: "Account" }, { label: accountPage.label }] : [{ label: config.area }];
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

interface AppTopbarProps {
  config: ShellConfig;
  pathname: string;
  /** Area-specific buttons, e.g. portal switch and notifications. */
  actions?: ReactNode;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}

export function AppTopbar({ config, pathname, actions, onOpenMenu, onOpenSearch }: AppTopbarProps) {
  const crumbs = getCrumbs(config, pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-[var(--content-max)] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="-ml-1.5 flex size-10 items-center justify-center rounded-lg text-foreground outline-none transition-colors hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-focus lg:hidden"
        >
          <LuMenu size={20} aria-hidden />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li
                  key={`${crumb.label}-${i}`}
                  // Phones show only the page; the middle section appears once there is room.
                  className={cn(
                    "items-center gap-1.5",
                    last ? "flex min-w-0" : "hidden shrink-0 sm:flex",
                    !last && i > 0 && "sm:hidden xl:flex",
                  )}
                >
                  {crumb.href && !last ? (
                    <Link
                      to={crumb.href}
                      className="rounded text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? "page" : undefined}
                      className={cn("truncate", last ? "font-semibold text-foreground" : "text-muted")}
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!last ? <LuChevronRight size={14} aria-hidden className="shrink-0 text-muted/60" /> : null}
                </li>
              );
            })}
          </ol>
        </nav>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search pages"
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
          className={cn(
            "flex size-10 items-center justify-center gap-2 rounded-lg text-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
            "hover:bg-foreground/[0.05] hover:text-foreground",
            "md:h-9 md:w-48 md:justify-start xl:w-64 md:border md:border-border md:bg-surface md:px-3 md:shadow-[var(--field-shadow)] md:hover:border-foreground/15 md:hover:bg-surface",
          )}
        >
          <LuSearch size={16} aria-hidden className="shrink-0" />
          <span className="hidden flex-1 text-left text-sm md:inline">Search pages…</span>
          <kbd className="kbd-hint hidden md:inline-flex">{isMac ? "⌘" : "Ctrl"} K</kbd>
        </button>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">{actions}</div>

        <span aria-hidden className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <AccountMenu account={config.account} links={config.accountLinks} onSignOut={config.onSignOut} />
      </div>
    </header>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LuChevronDown } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ShellConfig, ShellNavItem } from "./types";
import { usePersistentState } from "./usePersistentState";

interface SidebarNavProps {
  config: ShellConfig;
  pathname: string;
  /** Icon-only rail (collapsed desktop sidebar). */
  compact: boolean;
  /** Separate ids keep the desktop and mobile active pills from animating between each other. */
  layoutScope: string;
  onNavigate?: () => void;
}

const formatBadge = (n: number) => (n > 99 ? "99+" : String(n));

/** Grouped page links. Group headings can be folded; the choice is remembered. */
export function SidebarNav({ config, pathname, compact, layoutScope, onNavigate }: SidebarNavProps) {
  const [folded, setFolded] = usePersistentState<Record<string, boolean>>(`${config.storageKey}.folded`, {});

  return (
    <nav aria-label="Main" className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
      {config.groups.map((group, index) => {
        const hasActive = group.items.some((item) => config.isActive(pathname, item.href));
        // Single-link groups (e.g. Dashboard) have no heading to fold.
        const foldable = group.items.length > 1 && !compact;
        const open = !foldable || hasActive || !folded[group.id];
        const hiddenBadges = group.items.reduce((sum, item) => sum + (item.badge ?? 0), 0);
        const listId = `${layoutScope}-group-${group.id}`;

        return (
          <div
            key={group.id}
            className={cn(index > 0 && (compact ? "mt-3 border-t border-white/[0.07] pt-3" : "mt-5"))}
          >
            {foldable ? (
              <button
                type="button"
                onClick={() => !hasActive && setFolded((prev) => ({ ...prev, [group.id]: open }))}
                aria-expanded={open}
                aria-controls={listId}
                className="group/heading mb-1 flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 outline-none transition-colors hover:text-white/75 focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <span className="flex-1 truncate text-left">{group.label}</span>
                {!open && hiddenBadges > 0 ? (
                  <span className="rounded-full bg-gold px-1.5 text-[10px] font-bold leading-4 tracking-normal text-primary">
                    {formatBadge(hiddenBadges)}
                  </span>
                ) : null}
                <LuChevronDown
                  size={13}
                  aria-hidden
                  className={cn(
                    "shrink-0 opacity-0 transition-[transform,opacity] duration-200 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100",
                    !open && "-rotate-90 opacity-100",
                  )}
                />
              </button>
            ) : null}

            <AnimatePresence initial={false}>
              {open ? (
                <motion.ul
                  id={listId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavLink
                        item={item}
                        active={config.isActive(pathname, item.href)}
                        compact={compact}
                        layoutId={`${layoutScope}-active`}
                        onNavigate={onNavigate}
                      />
                    </li>
                  ))}
                </motion.ul>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

interface NavLinkProps {
  item: ShellNavItem;
  active: boolean;
  compact: boolean;
  layoutId: string;
  onNavigate?: () => void;
}

function NavLink({ item, active, compact, layoutId, onNavigate }: NavLinkProps) {
  const Icon = item.icon;
  const badge = item.badge ?? 0;
  const name = badge > 0 ? `${item.label}, ${badge} pending` : item.label;

  return (
    <Tooltip content={name} placement="end" disabled={!compact} delay={150}>
      <Link
        to={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        aria-label={compact ? name : undefined}
        className={cn(
          "group/link relative flex h-9 items-center rounded-lg text-[13.5px] font-medium outline-none transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-gold/60",
          compact ? "justify-center" : "gap-3 px-2.5",
          active ? "text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white",
        )}
      >
        {active ? (
          <motion.span
            layoutId={layoutId}
            transition={{ type: "spring", stiffness: 520, damping: 42 }}
            className="absolute inset-0 rounded-lg bg-white/[0.09] ring-1 ring-inset ring-white/[0.08]"
            aria-hidden
          >
            <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gold" />
          </motion.span>
        ) : null}

        <span className="relative flex shrink-0 items-center justify-center">
          <Icon
            size={17}
            aria-hidden
            className={cn("transition-colors", active ? "text-gold" : "text-white/50 group-hover/link:text-white/85")}
          />
          {compact && badge > 0 ? (
            <span className="absolute -right-1.5 -top-1 size-2 rounded-full bg-gold ring-2 ring-sidebar" aria-hidden />
          ) : null}
        </span>

        {!compact ? (
          <>
            <span className="relative flex-1 truncate">{item.label}</span>
            {badge > 0 ? (
              <span className="relative min-w-5 rounded-full bg-gold px-1.5 text-center text-[10.5px] font-bold leading-[18px] text-primary">
                {formatBadge(badge)}
              </span>
            ) : null}
          </>
        ) : null}
      </Link>
    </Tooltip>
  );
}

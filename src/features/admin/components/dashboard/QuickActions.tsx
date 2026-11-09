import type { IconType } from "react-icons";
import { LuChevronRight } from "react-icons/lu";
import { Link } from "react-router-dom";
import { Panel } from "@/components/shared/Panel";

export interface QuickLink {
  label: string;
  description: string;
  icon: IconType;
  href: string;
}

/** Shortcuts to the pages people use most. */
export function QuickActions({ links }: { links: QuickLink[] }) {
  return (
    <Panel title="Shortcuts" bodyClassName="p-2">
      <ul className="space-y-0.5">
        {links.map(({ label, description, icon: Icon, href }) => (
          <li key={href}>
            <Link
              to={href}
              className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-focus"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors group-hover:border-gold/40 group-hover:text-foreground">
                <Icon size={16} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block truncate text-xs text-muted">{description}</span>
              </span>
              <LuChevronRight
                size={16}
                aria-hidden
                className="shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuInbox } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: IconType;
  /** Usually a single button that resolves the empty state (create, clear filters). */
  action?: ReactNode;
  /** "danger" for load failures. */
  tone?: "default" | "danger";
  className?: string;
}

/** Shown when a list, table or panel has nothing to display. */
export function EmptyState({ title, description, icon: Icon = LuInbox, action, tone = "default", className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div
        className={cn(
          "relative mb-4 flex size-12 items-center justify-center rounded-xl border shadow-[var(--surface-shadow)]",
          tone === "danger" ? "border-danger/20 bg-danger/5 text-danger" : "border-border bg-surface text-muted",
        )}
      >
        <Icon size={20} aria-hidden />
        {tone === "default" ? (
          <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-gold ring-2 ring-surface" aria-hidden />
        ) : null}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

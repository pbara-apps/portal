import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: ReactNode;
  description?: ReactNode;
  /** Usually one small button or link, top right. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Padding is on by default; pass "p-0" for edge-to-edge lists. */
  bodyClassName?: string;
}

/** Titled section card for dashboards, detail pages and settings. */
export function Panel({ title, description, action, children, className, bodyClassName }: PanelProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]", className)}
    >
      <header className="flex items-start justify-between gap-4 border-b border-separator px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[15px] font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
        </div>
        {action ? <div className="-my-1 shrink-0">{action}</div> : null}
      </header>
      <div className={cn("min-w-0 flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

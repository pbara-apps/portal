import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AdminAuditEntry } from "@/types/admin";
import { formatActionPhrase, getAuditBubbleClass, getAuditIcon } from "./auditMeta";

interface AuditTimelineEntryProps {
  log: AdminAuditEntry;
  timeLabel: string;
  isLast: boolean;
  actorActive?: boolean;
  onActorClick?: (actorName: string) => void;
}

export function AuditTimelineEntry({ log, timeLabel, isLast, actorActive, onActorClick }: AuditTimelineEntryProps) {
  const Icon = getAuditIcon(log);

  return (
    <li className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 pb-6 sm:grid-cols-[4.5rem_2rem_minmax(0,1fr)] sm:gap-x-4">
      <time
        dateTime={log.timestamp}
        className="hidden pt-1.5 text-right text-xs tabular-nums text-muted sm:block"
      >
        {timeLabel}
      </time>

      <div className="relative flex justify-center">
        {!isLast ? <span aria-hidden className="absolute top-8 -bottom-6 w-px bg-separator" /> : null}
        <span
          aria-hidden
          className={cn("relative flex size-8 shrink-0 items-center justify-center rounded-lg", getAuditBubbleClass(log))}
        >
          <Icon size={14} />
        </span>
      </div>

      <div className="min-w-0 pt-1">
        <p className="text-sm leading-snug text-foreground">
          <button
            type="button"
            onClick={() => onActorClick?.(log.actorName)}
            aria-pressed={actorActive}
            title={actorActive ? "Show everyone" : `Show only ${log.actorName}`}
            className={cn(
              "rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus",
              actorActive ? "text-focus" : "text-foreground",
            )}
          >
            {log.actorName}
          </button>{" "}
          <span className="text-foreground/80">{formatActionPhrase(log)}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          <span className="sm:hidden">{timeLabel} · </span>
          <span className="capitalize">{log.entityType}</span>
        </p>
        {log.detail ? (
          <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-surface-secondary px-3 py-2 font-mono text-[12px] leading-relaxed text-muted">
            {log.detail}
          </pre>
        ) : null}
      </div>
    </li>
  );
}

export function AuditDateGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</h2>
      <ol className="list-none">{children}</ol>
    </section>
  );
}

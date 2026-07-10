import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AdminAuditEntry } from "@/types/admin";
import {
  formatActionPhrase,
  getAuditBubbleClass,
  getAuditIcon,
} from "./auditMeta";

interface AuditTimelineEntryProps {
  log: AdminAuditEntry;
  timeLabel: string;
  isLast: boolean;
  actorActive?: boolean;
  onActorClick?: (actorName: string) => void;
}

export function AuditTimelineEntry({
  log,
  timeLabel,
  isLast,
  actorActive,
  onActorClick,
}: AuditTimelineEntryProps) {
  const Icon = getAuditIcon(log);

  return (
    <li className="relative grid grid-cols-[4.5rem_1.75rem_minmax(0,1fr)] gap-x-3 pb-8 sm:grid-cols-[5.5rem_1.75rem_minmax(0,1fr)] sm:gap-x-4">
      <time
        dateTime={log.timestamp}
        className="pt-0.5 text-right font-mono text-xs tabular-nums text-text-muted sm:text-sm"
      >
        {timeLabel}
      </time>

      <div className="relative flex justify-center">
        {!isLast ? (
          <span
            aria-hidden
            className="absolute top-7 -bottom-8 w-px bg-text-dark/10"
          />
        ) : null}
        <span
          className={cn(
            "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm ring-4 ring-surface",
            getAuditBubbleClass(log),
          )}
          aria-hidden
        >
          <Icon size={13} strokeWidth={2.25} />
        </span>
      </div>

      <div className="min-w-0 pt-0.5">
        <p className="text-sm leading-snug text-text-dark sm:text-[15px]">
          <button
            type="button"
            onClick={() => onActorClick?.(log.actorName)}
            className={cn(
              "font-medium transition-colors hover:underline",
              actorActive ? "text-gold" : "text-primary",
            )}
          >
            {log.actorName}
          </button>{" "}
          <span className="font-semibold">{formatActionPhrase(log)}</span>
        </p>

        <p className="mt-1 text-xs text-text-muted sm:text-[13px]">
          <span className="capitalize">{log.entityType}</span>
          {log.entityId ? (
            <>
              {" · "}
              <span className="font-mono text-[11px]">{log.entityId}</span>
            </>
          ) : null}
        </p>

        {log.detail ? (
          <pre className="mt-2 max-w-full overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-[12px] leading-relaxed text-text-muted">
            {log.detail}
          </pre>
        ) : null}
      </div>
    </li>
  );
}

interface AuditDateGroupProps {
  label: string;
  children: ReactNode;
}

export function AuditDateGroup({ label, children }: AuditDateGroupProps) {
  return (
    <section className="space-y-6">
      <div className="relative flex items-center justify-center py-1">
        <span
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-text-dark/8"
        />
        <span className="relative rounded-full border border-text-dark/8 bg-surface px-3.5 py-1 text-xs font-medium text-text-muted shadow-sm">
          {label}
        </span>
      </div>
      <ol className="list-none">{children}</ol>
    </section>
  );
}

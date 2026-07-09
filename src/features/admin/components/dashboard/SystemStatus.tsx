export interface SystemStatusProps {
  status?: "optimal" | "degraded" | "down";
  version?: string;
}

const statusMeta = {
  optimal: { label: "System Status: Optimal", dot: "bg-emerald-500" },
  degraded: { label: "System Status: Degraded", dot: "bg-amber-500" },
  down: { label: "System Status: Down", dot: "bg-rose-500" },
} as const;

export function SystemStatus({
  status = "optimal",
  version = "v2.4.0-stable",
}: SystemStatusProps) {
  const s = statusMeta[status];
  return (
    <div className="flex items-center justify-between rounded-2xl border border-text-dark/[0.05] bg-surface px-4 py-3 shadow-[0_1px_2px_rgba(27,36,82,0.04)]">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${s.dot}`}
            aria-hidden
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`}
          />
        </span>
        <span className="text-xs font-medium text-text-dark">{s.label}</span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
        {version}
      </span>
    </div>
  );
}

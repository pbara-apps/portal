import { naira, type Due } from "@/types/finance";

type Summary = NonNullable<Due["summary"]>;

/** Expected / collected / outstanding for a due, with a collection bar. */
export function CollectionMeter({ summary: s, compact = false }: { summary: Summary; compact?: boolean }) {
  const pct = s.expected > 0 ? Math.min(100, Math.round((s.collected / s.expected) * 100)) : 0;
  const payable = s.bills - s.waived;

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Expected", value: s.expected, cx: "text-foreground" },
          { label: "Collected", value: s.collected, cx: "text-success" },
          { label: "Outstanding", value: s.outstanding, cx: s.outstanding > 0 ? "text-danger" : "text-foreground" },
        ].map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className={`mt-0.5 truncate font-semibold tabular-nums ${compact ? "text-sm" : "text-lg"} ${item.cx}`}>
              {naira(item.value)}
            </dd>
          </div>
        ))}
      </dl>
      <div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-default"
          role="progressbar"
          aria-label="Collected"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs tabular-nums text-muted">
          {pct}% collected · {s.paidInFull} of {payable} paid in full
          {s.waived ? ` · ${s.waived} waived` : ""}
        </p>
      </div>
    </div>
  );
}

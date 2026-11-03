import { useState } from "react";
import { Link } from "react-router-dom";
import { MONTHS } from "@/types/achievement";
import { useMembershipOverview } from "@/lib/api/chapter-admin";

/** One headline number with a link to where it can be acted on. */
function Stat({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-text-dark/5 bg-surface p-4 transition-colors hover:border-primary/20">
      <p className="text-2xl font-bold text-primary">{value.toLocaleString()}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </Link>
  );
}

/**
 * New members approved per month (last 12 months). Single series, one
 * colour, thin columns with rounded tops, hover shows the exact value.
 */
function GrowthChart({ data }: { data: { year: number; month: number; newMembers: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.newMembers));
  const latest = data[data.length - 1];

  return (
    <div>
      <div className="relative flex h-40 items-end gap-1.5 border-b border-text-dark/10" role="img" aria-label="New members per month">
        {data.map((d, i) => (
          <div
            key={`${d.year}-${d.month}`}
            className="relative flex h-full flex-1 items-end justify-center"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className="w-full max-w-6 rounded-t-[4px] bg-primary transition-opacity"
              style={{ height: `${(d.newMembers / max) * 100}%`, minHeight: d.newMembers ? 2 : 0, opacity: hover === null || hover === i ? 1 : 0.45 }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full mb-1 whitespace-nowrap rounded-md bg-text-dark px-2 py-1 text-[11px] text-white shadow">
                {MONTHS[d.month - 1].slice(0, 3)} {d.year}: <strong>{d.newMembers}</strong>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d) => (
          <span key={`${d.year}-${d.month}`} className="flex-1 text-center text-[10px] text-text-muted">
            {MONTHS[d.month - 1].slice(0, 1)}
          </span>
        ))}
      </div>
      {latest && (
        <p className="mt-2 text-xs text-text-muted">
          This month: <strong className="text-text-dark">{latest.newMembers}</strong> new member{latest.newMembers === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

/**
 * Membership section of the admin dashboard: totals, items waiting for
 * review, new members per month and members per rank.
 */
export function MembershipOverview() {
  const { data } = useMembershipOverview();
  if (!data) return null;
  const maxRank = Math.max(1, ...data.byRank.map((r) => r.count));

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-primary">Membership</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active members" value={data.activeMembers} to="/admin/members" />
        <Stat label="Members awaiting approval" value={data.pendingApprovals} to="/admin/recruitment" />
        <Stat label="Active chapters" value={data.activeChapters} to="/admin/chapters" />
        <Stat label="Chapter requests" value={data.pendingChapterRequests} to="/admin/chapters?tab=requests" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-text-dark/5 bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary">New members per month</h3>
          <GrowthChart data={data.growth} />
        </div>
        <div className="rounded-2xl border border-text-dark/5 bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary">Active members by rank</h3>
          <ul className="space-y-2">
            {data.byRank.map((r) => (
              <li key={r.name} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3" title={`${r.name}: ${r.count}`}>
                <span className="truncate text-xs text-text-dark">{r.name}</span>
                <span className="h-2 rounded-full bg-background">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(r.count / maxRank) * 100}%` }} />
                </span>
                <span className="text-right text-xs font-semibold text-text-dark">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

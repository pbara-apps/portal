import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuChevronRight, LuCircleAlert, LuCircleCheck, LuPlus, LuRefreshCw, LuWallet } from "react-icons/lu";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollectionMeter } from "@/features/admin/components/finance/CollectionMeter";
import { CreateDueDrawer } from "@/features/admin/components/finance/CreateDueDrawer";
import { DueDrawer } from "@/features/admin/components/finance/DueDrawer";
import { dueSummaryLine } from "@/features/admin/components/finance/due-format";
import { PaymentsQueue } from "@/features/admin/components/finance/PaymentsQueue";
import { StatementView } from "@/features/admin/components/finance/StatementView";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDues } from "@/lib/api/finance";
import { type Due, naira } from "@/types/finance";
import { canApprovePayments, canManageDues } from "@/types/user";

type Tab = "dues" | "payments" | "statements";
const TABS: { id: Tab; label: string }[] = [
  { id: "dues", label: "Dues & levies" },
  { id: "payments", label: "Payments" },
  { id: "statements", label: "Statements" },
];

const frame = "rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]";

/**
 * Dues & Levies (finance). Create dues, follow collection per due, verify
 * payments and view any chapter's or church's statement.
 */
export default function DuesPage() {
  const user = useCurrentUser((s) => s.user);
  const canManage = canManageDues(user);
  const canApprove = canApprovePayments(user);
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get("tab"))?.id ?? "dues";
  const [createOpen, setCreateOpen] = useState(false);
  const [openDue, setOpenDue] = useState<string | null>(null);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Dues & levies"
        description="Bill chapters or churches, track what's collected, and verify their payments."
        actions={
          canManage ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <LuPlus size={16} aria-hidden />
              New due or levy
            </Button>
          ) : null
        }
      />

      <ViewTabs
        aria-label="Finance view"
        tabs={TABS}
        value={tab}
        onChange={(t) => setParams(t === "dues" ? {} : { tab: t }, { replace: true })}
      />

      {tab === "dues" ? <DuesList onOpen={setOpenDue} onCreate={canManage ? () => setCreateOpen(true) : undefined} /> : null}
      {tab === "payments" ? <PaymentsQueue canApprove={canApprove} /> : null}
      {tab === "statements" ? <StatementView /> : null}

      <CreateDueDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <DueDrawer dueId={openDue} canManage={canManage} onClose={() => setOpenDue(null)} />
    </div>
  );
}

function DuesList({ onOpen, onCreate }: { onOpen: (id: string) => void; onCreate?: () => void }) {
  const { data: dues = [], isLoading, isError, refetch, isRefetching } = useDues();
  const [type, setType] = useState<"all" | Due["type"]>("all");
  const list = useClientTable({
    rows: dues.filter((d) => type === "all" || d.type === type),
    searchText: (d) => `${d.title} ${d.period ?? ""}`,
    resetKey: type,
  });
  const filtering = list.query.trim() !== "" || type !== "all";

  const totals = dues.reduce(
    (t, d) => ({
      expected: t.expected + (d.summary?.expected ?? 0),
      collected: t.collected + (d.summary?.collected ?? 0),
      outstanding: t.outstanding + (d.summary?.outstanding ?? 0),
    }),
    { expected: 0, collected: 0, outstanding: 0 },
  );
  const rate = totals.expected > 0 ? Math.round((totals.collected / totals.expected) * 100) : 0;

  return (
    <div className="space-y-5">
      {!isError && !isLoading ? (
        // Phones: one compact summary instead of three tall cards.
        <section aria-label="Collection across all dues" className={`${frame} p-4 sm:hidden`}>
          <dl className="grid grid-cols-3 gap-2">
            {[
              { label: "Expected", value: totals.expected, cx: "text-foreground" },
              { label: "Collected", value: totals.collected, cx: "text-success" },
              { label: "Outstanding", value: totals.outstanding, cx: totals.outstanding > 0 ? "text-danger" : "text-foreground" },
            ].map((t) => (
              <div key={t.label} className="min-w-0">
                <dt className="text-xs text-muted">{t.label}</dt>
                <dd className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${t.cx}`}>{naira(t.value)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-default" aria-hidden>
            <div className="h-full rounded-full bg-success" style={{ width: `${Math.min(rate, 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted">{rate}% collected across {dues.length} dues and levies</p>
        </section>
      ) : null}
      {!isError ? (
        <div className="hidden gap-3 sm:grid sm:grid-cols-3">
          <StatCard label="Expected" value={naira(totals.expected)} icon={LuWallet} loading={isLoading} description={`Across ${dues.length} dues and levies`} />
          <StatCard label="Collected" value={naira(totals.collected)} icon={LuCircleCheck} tone="success" loading={isLoading} description={`${rate}% of expected`} />
          <StatCard
            label="Outstanding"
            value={naira(totals.outstanding)}
            icon={LuCircleAlert}
            tone={totals.outstanding > 0 ? "danger" : "default"}
            loading={isLoading}
          />
        </div>
      ) : null}

      <div className="space-y-3">
        <TableToolbar
          search={{ value: list.query, onChange: list.setQuery, placeholder: "Search title or period…" }}
          filters={
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger aria-label="Type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Dues and levies</SelectItem>
                <SelectItem value="due">Dues</SelectItem>
                <SelectItem value="levy">Levies</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`${frame} space-y-4 p-5`}>
                <Skeleton className="h-5 w-1/2 rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className={frame}>
            <EmptyState
              tone="danger"
              title="We couldn't load dues"
              action={
                <Button type="button" variant="outline" onClick={() => refetch()} loading={isRefetching}>
                  <LuRefreshCw size={15} aria-hidden />
                  Try again
                </Button>
              }
            />
          </div>
        ) : list.total === 0 ? (
          <div className={frame}>
            <EmptyState
              icon={LuWallet}
              title={filtering ? "No dues match your filters" : "No dues or levies yet"}
              description={filtering ? undefined : "Create one to bill every chapter or church at once."}
              action={
                filtering ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      list.setQuery("");
                      setType("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : onCreate ? (
                  <Button type="button" size="sm" onClick={onCreate}>
                    <LuPlus size={14} aria-hidden />
                    New due or levy
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <ul aria-label="Dues and levies" className="grid gap-4 lg:grid-cols-2">
            {list.filteredRows.map((d) => (
              <li key={d.id}>
                <article
                  className={`${frame} group relative h-full p-5 transition-[border-color,box-shadow] duration-200 hover:border-foreground/15 hover:shadow-[var(--overlay-shadow)]`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">
                        <button
                          type="button"
                          onClick={() => onOpen(d.id)}
                          className="text-left outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-focus"
                        >
                          {d.title}
                        </button>
                      </h3>
                      <p className="mt-0.5 text-xs text-muted">{dueSummaryLine(d)}</p>
                    </div>
                    <LuChevronRight
                      size={18}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </div>
                  {d.summary ? (
                    <CollectionMeter summary={d.summary} compact />
                  ) : (
                    <p className="text-sm text-muted">No bills yet.</p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

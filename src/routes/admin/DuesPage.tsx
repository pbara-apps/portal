import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuWallet } from "react-icons/lu";
import { Spinner } from "@/components/ui/spinner";
import { CreateDueDialog } from "@/features/admin/components/finance/CreateDueDialog";
import { DueDetailDialog } from "@/features/admin/components/finance/DueDetailDialog";
import { PaymentsQueue } from "@/features/admin/components/finance/PaymentsQueue";
import { StatementView } from "@/features/admin/components/finance/StatementView";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import { adminPageCx } from "@/features/admin/components/shared/adminLayout";
import { formatDate } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDues } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { naira } from "@/types/finance";
import { canApprovePayments, canManageDues } from "@/types/user";

type Tab = "dues" | "payments" | "statements";
const TABS: { id: Tab; label: string }[] = [
  { id: "dues", label: "Dues & levies" },
  { id: "payments", label: "Payments" },
  { id: "statements", label: "Statements" },
];

/**
 * Dues & Levies (finance). Create dues, follow collection per due, verify
 * payments and view any chapter's or church's statement.
 */
export default function DuesPage() {
  const { user } = useCurrentUser();
  const canManage = canManageDues(user);
  const canApprove = canApprovePayments(user);
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "dues") as Tab;
  const [createOpen, setCreateOpen] = useState(false);
  const [openDue, setOpenDue] = useState<string | null>(null);
  const { data: dues = [], isLoading } = useDues();

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Dues & Levies"
        description="Bill chapters or churches, track what's collected, and verify their payments."
        actionLabel={tab === "dues" ? "New due or levy" : undefined}
        onAction={tab === "dues" ? () => setCreateOpen(true) : undefined}
        actionDisabled={!canManage}
        actionDisabledText="Only the Financial Secretary, Treasurer or a super admin can create dues."
      />

      <div className="flex w-fit gap-1 rounded-xl bg-surface p-1 ring-1 ring-text-dark/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setParams(t.id === "dues" ? {} : { tab: t.id })}
            className={cn("rounded-lg px-4 py-2 text-sm font-medium", tab === t.id ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "payments" && <PaymentsQueue canApprove={canApprove} />}
      {tab === "statements" && <StatementView />}
      {tab === "dues" &&
        (isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : dues.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-text-dark/5 bg-surface py-16 text-center">
            <LuWallet size={20} className="text-primary" />
            <p className="text-sm text-text-muted">No dues or levies yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {dues.map((d) => {
              const s = d.summary;
              const collectedPct = s && s.expected > 0 ? Math.round((s.collected / s.expected) * 100) : 0;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setOpenDue(d.id)}
                    className="w-full rounded-2xl border border-text-dark/5 bg-surface p-5 text-left transition-colors hover:border-primary/20"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-primary">{d.title}</p>
                        <p className="text-xs text-text-muted">
                          {d.type === "levy" ? "Levy" : "Due"}
                          {d.period ? ` · ${d.period}` : ""} · each {d.billTo} ·{" "}
                          {d.chargeBasis === "flat" ? naira(d.amount) : `${naira(d.amount)}/member`} · due {formatDate(d.dueDate)}
                        </p>
                      </div>
                      {s && (
                        <div className="grid grid-cols-3 gap-4 text-right text-xs">
                          <div><p className="text-sm font-bold text-primary">{naira(s.expected)}</p><p className="text-text-muted">expected</p></div>
                          <div><p className="text-sm font-bold text-emerald-700">{naira(s.collected)}</p><p className="text-text-muted">collected</p></div>
                          <div><p className="text-sm font-bold text-rose-700">{naira(s.outstanding)}</p><p className="text-text-muted">outstanding</p></div>
                        </div>
                      )}
                    </div>
                    {s && (
                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-background">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(collectedPct, 100)}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {collectedPct}% collected · {s.paidInFull} of {s.bills - s.waived} paid in full
                          {s.waived ? ` · ${s.waived} waived` : ""}
                        </p>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ))}

      <CreateDueDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <DueDetailDialog dueId={openDue} canManage={canManage} onClose={() => setOpenDue(null)} />
    </div>
  );
}

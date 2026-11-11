import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { LuCircleAlert, LuCircleCheck, LuDownload, LuFileSpreadsheet, LuRefreshCw, LuWallet } from "react-icons/lu";
import * as XLSX from "xlsx";
import { BillStatusPill } from "@/components/shared/BillStatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { useAdminChapters } from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { useStatement } from "@/lib/api/finance";
import { BILL_STATUS_LABELS, type Bill, type PaymentStatus, naira } from "@/types/finance";

type Kind = "chapter" | "church";

const PAYMENT_TONE: Record<PaymentStatus, { label: string; tone: StatusTone }> = {
  verified: { label: "Verified", tone: "success" },
  pending: { label: "To verify", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
};

const frame = "rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]";

function exportStatement(name: string, bills: Bill[]) {
  const rows = bills.flatMap((b) => [
    {
      Date: formatDate(b.dueDate),
      Item: `${b.due?.title ?? ""}${b.due?.period ? ` (${b.due.period})` : ""}`,
      Billed: b.waived ? 0 : b.amountDue,
      Paid: "",
      Status: BILL_STATUS_LABELS[b.status],
    },
    ...b.payments
      .filter((p) => p.status === "verified")
      .map((p) => ({ Date: formatDate(p.paidOn), Item: `Payment ${p.receiptNumber ?? ""}`, Billed: "", Paid: p.amount, Status: "" })),
  ]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Statement");
  XLSX.writeFile(book, `${name.replace(/[^\w]+/g, "-").toLowerCase() || "statement"}-statement.xlsx`);
}

/**
 * Statement for one chapter or one church: every bill and payment, with
 * totals billed, paid and outstanding. Exportable to Excel.
 */
export function StatementView() {
  const { data: chapters = [] } = useAdminChapters();
  const { data: churches = [] } = useGetChapters();
  const [kind, setKind] = useState<Kind>("chapter");
  const [id, setId] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useStatement(
    kind === "chapter" ? { chapterId: id || undefined } : { churchId: id || undefined },
  );

  const options =
    kind === "chapter"
      ? chapters.map((c) => ({ id: c.id, label: c.church?.name ? `${c.name} · ${c.church.name}` : c.name, name: c.name }))
      : churches.map((c) => ({ id: c.id, label: c.name, name: c.name }));
  const selectedName = options.find((o) => o.id === id)?.name ?? "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <ViewTabs
          aria-label="Statement for"
          tabs={[
            { id: "chapter", label: "Chapter" },
            { id: "church", label: "Church" },
          ]}
          value={kind}
          onChange={(k) => {
            setKind(k);
            setId("");
          }}
        />
        <div className="w-full sm:w-80">
          <Select value={id} onValueChange={setId}>
            <SelectTrigger aria-label={kind === "chapter" ? "Chapter" : "Church"}>
              <SelectValue placeholder={kind === "chapter" ? "Choose a chapter" : "Choose a church"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data && data.bills.length > 0 ? (
          <Button type="button" variant="outline" className="sm:ml-auto" onClick={() => exportStatement(selectedName, data.bills)}>
            <LuDownload size={15} aria-hidden />
            Export Excel
          </Button>
        ) : null}
      </div>

      {!id ? (
        <div className={frame}>
          <EmptyState
            icon={LuFileSpreadsheet}
            title={`Choose a ${kind} to see its statement`}
            description="Every bill and payment, with totals billed, paid and outstanding."
          />
        </div>
      ) : isError ? (
        <div className={frame}>
          <EmptyState
            tone="danger"
            title="We couldn't load this statement"
            action={
              <Button type="button" variant="outline" onClick={() => refetch()} loading={isRefetching}>
                <LuRefreshCw size={15} aria-hidden />
                Try again
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Billed" value={data ? naira(data.totals.billed) : null} loading={isLoading} icon={LuWallet} />
            <StatCard label="Paid" value={data ? naira(data.totals.paid) : null} loading={isLoading} icon={LuCircleCheck} tone="success" />
            <StatCard
              label="Outstanding"
              value={data ? naira(data.totals.outstanding) : null}
              loading={isLoading}
              icon={LuCircleAlert}
              tone={data && data.totals.outstanding > 0 ? "danger" : "default"}
            />
          </div>

          {isLoading || !data ? (
            <div className={`${frame} space-y-4 p-5`}>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : data.bills.length === 0 ? (
            <div className={frame}>
              <EmptyState icon={LuWallet} title="No bills yet" description={`Nothing has been billed to this ${kind}.`} />
            </div>
          ) : (
            <ul aria-label={`Statement for ${selectedName}`} className={`${frame} divide-y divide-separator`}>
              {data.bills.map((b) => (
                <li key={b.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {b.due?.title}
                        {b.due?.period ? <span className="text-muted"> · {b.due.period}</span> : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">Due {formatDate(b.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                      <BillStatusPill status={b.status} />
                      <p className="text-xs tabular-nums text-muted">
                        {naira(b.amountPaid)} of {naira(b.amountDue)} ·{" "}
                        <span className={b.balance > 0 && !b.waived ? "font-medium text-foreground" : undefined}>
                          {naira(b.balance)} left
                        </span>
                      </p>
                    </div>
                  </div>
                  {b.payments.length > 0 ? (
                    <ul aria-label="Payments" className="mt-3 space-y-1.5 border-l-2 border-separator pl-4">
                      {b.payments.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="text-muted">{formatDate(p.paidOn)}</span>
                          <span className="font-medium tabular-nums text-foreground">{naira(p.amount)}</span>
                          {p.receiptNumber ? <span className="font-mono text-muted">{p.receiptNumber}</span> : null}
                          <StatusPill {...PAYMENT_TONE[p.status]} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

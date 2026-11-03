import { useState } from "react";
import { LuDownload } from "react-icons/lu";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { useAdminChapters } from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { useStatement } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { BILL_STATUS_CLASSES, BILL_STATUS_LABELS, naira } from "@/types/finance";

/**
 * Statement for one chapter or one church: every bill and payment, with
 * totals billed, paid and outstanding. Exportable to Excel.
 */
export function StatementView() {
  const { data: chapters = [] } = useAdminChapters();
  const { data: churches = [] } = useGetChapters();
  const [target, setTarget] = useState(""); // "chapter:<id>" or "church:<id>"
  const [kind, id] = target.split(":");
  const { data, isLoading } = useStatement(
    kind === "chapter" ? { chapterId: id } : kind === "church" ? { churchId: id } : {},
  );

  const handleExport = () => {
    if (!data) return;
    const rows = data.bills.flatMap((b) => [
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
    XLSX.writeFile(book, "statement.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger className="w-full sm:w-80" aria-label="Chapter or church"><SelectValue placeholder="Choose a chapter or church" /></SelectTrigger>
          <SelectContent>
            {chapters.map((c) => <SelectItem key={c.id} value={`chapter:${c.id}`}>Chapter · {c.name}</SelectItem>)}
            {churches.map((c) => <SelectItem key={c.id} value={`church:${c.id}`}>Church · {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {data && data.bills.length > 0 && (
          <Button variant="outline" onClick={handleExport}><LuDownload size={14} /> Export Excel</Button>
        )}
      </div>

      {!target ? (
        <p className="text-sm text-text-muted">Choose a chapter or church to see its statement.</p>
      ) : isLoading || !data ? (
        <Spinner />
      ) : data.bills.length === 0 ? (
        <p className="rounded-2xl border border-text-dark/5 bg-surface py-12 text-center text-sm text-text-muted">No bills yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Billed", data.totals.billed],
              ["Paid", data.totals.paid],
              ["Outstanding", data.totals.outstanding],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-2xl border border-text-dark/5 bg-surface p-4">
                <p className="text-xl font-bold text-primary">{naira(value as number)}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-3">
            {data.bills.map((b) => (
              <li key={b.id} className="rounded-2xl border border-text-dark/5 bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-primary">{b.due?.title}{b.due?.period ? ` (${b.due.period})` : ""}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", BILL_STATUS_CLASSES[b.status])}>{BILL_STATUS_LABELS[b.status]}</span>
                </div>
                <p className="text-xs text-text-muted">
                  Due {formatDate(b.dueDate)} · {naira(b.amountDue)} · paid {naira(b.amountPaid)} · balance {naira(b.balance)}
                </p>
                {b.payments.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-text-muted">
                    {b.payments.map((p) => (
                      <li key={p.id}>
                        {formatDate(p.paidOn)} · {naira(p.amount)} · {p.status}
                        {p.receiptNumber ? ` · ${p.receiptNumber}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { LuCheck, LuFileText, LuReceipt, LuX } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { RowActions } from "@/components/shared/RowActions";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { usePayments, useRejectPayment, useVerifyPayment } from "@/lib/api/finance";
import { type PaymentStatus, type QueuedPayment, billPlace, naira } from "@/types/finance";

const TABS: { id: PaymentStatus; label: string }[] = [
  { id: "pending", label: "To verify" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
];

const openProof = (p: QueuedPayment) => window.open(p.proofUrl, "_blank", "noopener,noreferrer");

const COLUMNS: DataTableColumn<QueuedPayment>[] = [
  {
    id: "payer",
    header: "Paid by",
    isRowHeader: true,
    cell: (p) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{p.bill ? billPlace(p.bill) : "—"}</p>
        <p className="truncate text-xs text-muted">{p.bill?.due?.title}</p>
      </div>
    ),
  },
  {
    id: "amount",
    header: "Amount",
    align: "end",
    cell: (p) => (
      <div>
        <p className="font-medium tabular-nums text-foreground">{naira(p.amount)}</p>
        {p.bill ? (
          <p className="text-xs tabular-nums text-muted">
            Bill {naira(p.bill.amountDue)} · {naira(p.bill.amountPaid)} paid
          </p>
        ) : null}
      </div>
    ),
  },
  {
    id: "paid",
    header: "Paid on",
    hideBelow: "lg",
    cell: (p) => (
      <div className="text-sm">
        <span className="whitespace-nowrap">{formatDate(p.paidOn)}</span>
        {p.reference ? <span className="block truncate text-xs text-muted">Ref {p.reference}</span> : null}
      </div>
    ),
  },
  {
    id: "by",
    header: "Submitted by",
    hideBelow: "xl",
    cell: (p) => <span className="text-muted">{p.submittedBy?.name ?? "—"}</span>,
  },
  {
    id: "outcome",
    header: "Outcome",
    hideBelow: "lg",
    cell: (p) =>
      p.receiptNumber ? (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-success">
          <LuReceipt size={13} aria-hidden />
          {p.receiptNumber}
        </span>
      ) : p.reviewNote ? (
        <p className="line-clamp-2 max-w-xs text-xs text-danger">{p.reviewNote}</p>
      ) : (
        <span className="text-xs text-muted">Waiting</span>
      ),
  },
];

/**
 * Payments from chapters/churches. Pending ones wait for a finance officer
 * (Financial Secretary / Treasurer) to check the proof against the bank
 * statement, then verify (issues a receipt number and updates the bill) or
 * reject with a reason. Everyone else sees the queue read-only.
 */
export function PaymentsQueue({ canApprove }: { canApprove: boolean }) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const { data: payments = [], isLoading, isError, refetch } = usePayments(status);
  const verify = useVerifyPayment();
  const reject = useRejectPayment();
  const [rejecting, setRejecting] = useState<QueuedPayment | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");

  const handleVerify = async (p: QueuedPayment) => {
    try {
      const result = (await verify.mutateAsync(p.id)) as { receiptNumber: string };
      successToast(`Verified. Receipt ${result.receiptNumber}.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to verify.", "Error");
    }
  };

  const closeReject = () => {
    setRejecting(null);
    setNote("");
    setNoteError("");
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (note.trim().length < 3) {
      setNoteError("Give a reason (at least 3 characters).");
      return;
    }
    try {
      await reject.mutateAsync({ id: rejecting.id, note: note.trim() });
      successToast("Payment rejected.");
      closeReject();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reject.", "Error");
    }
  };

  const reviewing = status === "pending" && canApprove;

  return (
    <div className="space-y-4">
      <ViewTabs aria-label="Payment status" tabs={TABS} value={status} onChange={setStatus} />

      {status === "pending" && !canApprove ? (
        <p className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted">
          Only the Financial Secretary or Treasurer can verify or reject payments. You can view them here.
        </p>
      ) : null}

      <DataTable
        aria-label={`${TABS.find((t) => t.id === status)?.label} payments`}
        columns={COLUMNS}
        rows={payments}
        getRowId={(p) => p.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="We couldn't load payments."
        onRetry={() => refetch()}
        rowActions={(p) => (
          <RowActions
            actions={[
              { label: "View proof of payment", icon: LuFileText, onAction: () => openProof(p) },
              reviewing && {
                label: verify.isPending && verify.variables === p.id ? "Verifying…" : "Verify payment",
                icon: LuCheck,
                tone: "success",
                disabled: verify.isPending,
                onAction: () => handleVerify(p),
              },
              reviewing && { label: "Reject payment", icon: LuX, danger: true, onAction: () => setRejecting(p) },
            ]}
          />
        )}
        renderCard={(p) => (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-medium text-foreground">{p.bill ? billPlace(p.bill) : "—"}</p>
              <span className="font-medium tabular-nums text-foreground">{naira(p.amount)}</span>
            </div>
            <p className="text-xs text-muted">
              {p.bill?.due?.title} · {formatDate(p.paidOn)}
              {p.receiptNumber ? ` · ${p.receiptNumber}` : ""}
            </p>
            {p.reviewNote ? <p className="text-xs text-danger">{p.reviewNote}</p> : null}
          </div>
        )}
        emptyState={
          <EmptyState
            icon={LuReceipt}
            title={status === "pending" ? "No payments waiting" : `No ${status} payments yet`}
            description={status === "pending" ? "Payments chapters submit from their portal appear here to verify." : undefined}
          />
        }
        summary={`${payments.length} payment${payments.length === 1 ? "" : "s"}`}
        minWidth={760}
      />

      <ConfirmDialog
        isOpen={!!rejecting}
        title="Reject payment?"
        message={`${rejecting ? naira(rejecting.amount) : "This payment"} from ${
          rejecting?.bill ? billPlace(rejecting.bill) : "the chapter"
        } won't count toward the bill. They'll see your reason and can submit again.`}
        confirmLabel="Reject payment"
        loading={reject.isPending}
        onClose={closeReject}
        onConfirm={handleReject}
      >
        <Textarea
          label="Reason"
          rows={3}
          value={note}
          error={noteError || undefined}
          placeholder="e.g. Amount not found on the bank statement"
          onChange={(e) => {
            setNote(e.target.value);
            if (noteError) setNoteError("");
          }}
          autoFocus
        />
      </ConfirmDialog>
    </div>
  );
}

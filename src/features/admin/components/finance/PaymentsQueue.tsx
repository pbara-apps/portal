import { useState } from "react";
import { LuCheck, LuFileText, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { usePayments, useRejectPayment, useVerifyPayment } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { type PaymentStatus, type QueuedPayment, billPlace, naira } from "@/types/finance";

/**
 * Payments from chapters/churches. Pending ones wait for a finance officer
 * (Financial Secretary / Treasurer) to check the proof against the bank
 * statement, then verify (issues a receipt number and updates the bill) or
 * reject with a reason. Everyone else sees the queue read-only.
 */
export function PaymentsQueue({ canApprove }: { canApprove: boolean }) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const { data: payments = [], isLoading } = usePayments(status);
  const verify = useVerifyPayment();
  const reject = useRejectPayment();
  const [rejecting, setRejecting] = useState<QueuedPayment | null>(null);
  const [note, setNote] = useState("");

  const handleVerify = async (p: QueuedPayment) => {
    try {
      const result = (await verify.mutateAsync(p.id)) as { receiptNumber: string };
      successToast(`Verified. Receipt ${result.receiptNumber}.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to verify.", "Error");
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (note.trim().length < 3) return errorToast("Give a reason.", "Reason needed");
    try {
      await reject.mutateAsync({ id: rejecting.id, note: note.trim() });
      successToast("Payment rejected.");
      setRejecting(null);
      setNote("");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reject.", "Error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-1 rounded-lg bg-surface p-1 ring-1 ring-text-dark/5">
        {(["pending", "verified", "rejected"] as PaymentStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium", status === s ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
          >
            {s === "pending" ? "To verify" : s === "verified" ? "Verified" : "Rejected"}
          </button>
        ))}
      </div>

      {status === "pending" && !canApprove && (
        <p className="rounded-xl bg-gold/10 px-4 py-3 text-xs text-text-dark ring-1 ring-gold/20">
          Only the Financial Secretary or Treasurer can verify or reject payments. You can view them here.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : payments.length === 0 ? (
        <p className="rounded-2xl border border-text-dark/5 bg-surface py-14 text-center text-sm text-text-muted">
          {status === "pending" ? "No payments waiting." : "Nothing here yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-text-dark/5 bg-surface p-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">
                  {naira(p.amount)} · {p.bill ? billPlace(p.bill) : "—"}
                </p>
                <p className="text-xs text-text-muted">
                  {p.bill?.due?.title} · paid {formatDate(p.paidOn)}
                  {p.reference ? ` · ref ${p.reference}` : ""}
                  {p.submittedBy ? ` · by ${p.submittedBy.name}` : ""}
                </p>
                {p.bill && (
                  <p className="text-xs text-text-muted">
                    Bill {naira(p.bill.amountDue)} · already paid {naira(p.bill.amountPaid)}
                  </p>
                )}
                {p.receiptNumber && <p className="text-xs text-emerald-700">Receipt {p.receiptNumber}</p>}
                {p.reviewNote && <p className="text-xs text-rose-700">Reason: {p.reviewNote}</p>}
              </div>
              <a href={p.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline">
                <LuFileText size={14} /> View proof
              </a>
              {status === "pending" && canApprove && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleVerify(p)} loading={verify.isPending && verify.variables === p.id}>
                    <LuCheck size={14} /> Verify
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setRejecting(p)}>
                    <LuX size={14} /> Reject
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject payment</DialogTitle>
            <DialogDescription>The chapter will see this reason and can submit again.</DialogDescription>
          </DialogHeader>
          <Textarea label="Reason" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Amount not found on the bank statement" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} loading={reject.isPending}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

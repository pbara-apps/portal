import { useEffect, useState } from "react";
import { LuDownload, LuFileText, LuWallet } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { downloadReceipt } from "@/lib/finance/receipt";
import { cn } from "@/lib/utils";
import type { PaymentAccount } from "@/types/admin";
import { BILL_STATUS_CLASSES, BILL_STATUS_LABELS, type Bill, billPlace, naira } from "@/types/finance";
import { useChapterBills, useSubmitPayment } from "../api/dues";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { FileUploadButton } from "../components/FileUploadButton";
import { formatDate } from "../lib/member-utils";
import { useActiveChapterId } from "../store/useChapterSession";

const PAYMENT_STATUS = {
  pending: "text-sky-700",
  verified: "text-emerald-700",
  rejected: "text-rose-700",
};

/**
 * Dues & Levies — what the chapter (or, for a counsellor, the church) owes.
 * Pay into the association account, upload the proof, and download a
 * receipt once finance confirms the payment. Part payments are allowed.
 */
export default function DuesPage() {
  const chapterId = useActiveChapterId();
  const { data, isLoading } = useChapterBills(chapterId);
  const [paying, setPaying] = useState<Bill | null>(null);
  const bills = data?.bills ?? [];
  const outstanding = bills.reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Dues & Levies</h1>
          <p className="mt-1 text-sm text-text-muted">
            Outstanding: <strong className="text-text-dark">{naira(outstanding)}</strong>
          </p>
        </div>
        <ChapterSwitcher />
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-text-dark/5 bg-surface py-16 text-center">
          <LuWallet size={20} className="text-primary" />
          <p className="text-sm text-text-muted">Nothing billed yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {bills.map((bill) => (
            <li key={bill.id} className="rounded-2xl border border-text-dark/5 bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-primary">
                    {bill.due?.title}
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", BILL_STATUS_CLASSES[bill.status])}>
                      {BILL_STATUS_LABELS[bill.status]}
                    </span>
                  </p>
                  <p className="text-xs text-text-muted">
                    {bill.due?.type === "levy" ? "Levy" : "Due"}
                    {bill.due?.period ? ` · ${bill.due.period}` : ""} · {billPlace(bill)}
                    {bill.billTo === "church" ? " (church)" : ""} · due {formatDate(bill.dueDate)}
                    {bill.memberCount != null ? ` · ${bill.memberCount} members` : ""}
                  </p>
                  {bill.adjustmentNote && <p className="mt-1 text-xs text-text-muted">Note: {bill.adjustmentNote}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{naira(bill.balance)}</p>
                  <p className="text-xs text-text-muted">of {naira(bill.amountDue)} · paid {naira(bill.amountPaid)}</p>
                  {bill.balance - bill.pendingAmount > 0 && (
                    <Button size="sm" className="mt-2 bg-primary text-white" onClick={() => setPaying(bill)}>Pay</Button>
                  )}
                </div>
              </div>

              {bill.payments.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-text-dark/5 pt-3 text-xs">
                  {bill.payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold">{naira(p.amount)}</span>
                      <span className="text-text-muted">{formatDate(p.paidOn)}</span>
                      <span className={PAYMENT_STATUS[p.status]}>
                        {p.status === "pending" ? "Being checked" : p.status === "verified" ? `Confirmed · ${p.receiptNumber}` : "Not confirmed"}
                      </span>
                      {p.reviewNote && <span className="text-text-muted">({p.reviewNote})</span>}
                      <a href={p.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                        <LuFileText size={12} /> Proof
                      </a>
                      {p.status === "verified" && (
                        <button type="button" onClick={() => downloadReceipt(bill, p)} className="inline-flex items-center gap-1 text-primary underline">
                          <LuDownload size={12} /> Receipt
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <PayDialog bill={paying} account={data?.paymentAccount ?? null} onClose={() => setPaying(null)} />
    </div>
  );
}

function PayDialog({ bill, account, onClose }: { bill: Bill | null; account: PaymentAccount | null; onClose: () => void }) {
  const submit = useSubmitPayment();
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const payable = bill ? bill.balance - bill.pendingAmount : 0;

  useEffect(() => {
    if (!bill) return;
    setAmount(String(payable));
    setPaidOn(new Date().toISOString().slice(0, 10));
    setReference("");
    setProofUrl(null);
  }, [bill, payable]);

  if (!bill) return null;

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return errorToast("Enter the amount you paid.", "Amount");
    if (value > payable) return errorToast(`The most you can pay now is ${naira(payable)}.`, "Amount");
    if (!proofUrl) return errorToast("Upload the proof of payment.", "Proof needed");
    try {
      await submit.mutateAsync({ billId: bill.id, amount: value, paidOn, reference: reference || null, proofUrl });
      successToast("Payment sent. Finance will confirm it.", "Submitted");
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to submit.", "Error");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay — {bill.due?.title}</DialogTitle>
          <DialogDescription>You can pay part now and the rest later. Each payment is confirmed by finance.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-background p-4 text-sm">
          {account ? (
            <>
              <p className="text-text-muted">Pay into the association account:</p>
              <p className="mt-1 font-semibold">{account.bankName}</p>
              <p>{account.accountName}</p>
              <p className="font-mono text-base">{account.accountNumber}</p>
            </>
          ) : (
            <p className="text-amber-700">The association hasn't set its payment account yet. Please contact the association.</p>
          )}
        </div>
        <div className="space-y-4">
          <Input label={`Amount paid (max ${naira(payable)})`} type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Payment date" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          <Input label="Bank reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
          <div>
            <p className="mb-2 text-sm font-medium">Proof of payment</p>
            <FileUploadButton purpose="payment-proof" value={proofUrl} onChange={setProofUrl} label="Upload proof" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submit.isPending} disabled={!account} className="bg-primary text-white">Submit payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

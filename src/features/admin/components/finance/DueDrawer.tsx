import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { LuBellRing, LuDownload, LuSlidersHorizontal, LuTrash2 } from "react-icons/lu";
import * as XLSX from "xlsx";
import { BillStatusPill } from "@/components/shared/BillStatusPill";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DetailDrawerContent, DetailSection } from "@/components/shared/DetailDrawer";
import { FormDrawerContent } from "@/components/shared/FormDrawer";
import { RowActions } from "@/components/shared/RowActions";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustBill, useDeleteDue, useDueDetail, useRemindDue } from "@/lib/api/finance";
import { BILL_STATUS_LABELS, type Bill, billPlace, naira } from "@/types/finance";
import { CollectionMeter } from "./CollectionMeter";
import { dueSummaryLine } from "./due-format";

function exportBills(title: string, bills: Bill[]) {
  const rows = bills.map((b) => ({
    [b.billTo === "chapter" ? "Chapter" : "Church"]: billPlace(b),
    Church: b.church?.name ?? "",
    Members: b.memberCount ?? "",
    "Amount Due": b.amountDue,
    Paid: b.amountPaid,
    Balance: b.balance,
    Status: BILL_STATUS_LABELS[b.status],
    Note: b.adjustmentNote ?? "",
  }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Bills");
  XLSX.writeFile(book, `${title.replace(/[^\w]+/g, "-").toLowerCase()}-bills.xlsx`);
}

/**
 * One due: every bill with what was paid and what is left. Finance can
 * adjust or waive a bill (with a reason), remind everyone who still owes,
 * export to Excel, or delete the due while nobody has paid.
 */
export function DueDrawer({ dueId, canManage, onClose }: { dueId: string | null; canManage: boolean; onClose: () => void }) {
  const [adjusting, setAdjusting] = useState<Bill | null>(null);
  const close = () => {
    setAdjusting(null);
    onClose();
  };

  return (
    <Sheet open={!!dueId} onOpenChange={(open) => !open && close()}>
      <SheetContent size="lg" aria-label={adjusting ? undefined : "Due details"}>
        {dueId && adjusting ? (
          <AdjustBillForm bill={adjusting} onDone={() => setAdjusting(null)} />
        ) : dueId ? (
          <DueDetail dueId={dueId} canManage={canManage} onAdjust={setAdjusting} onDeleted={close} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DueDetail({
  dueId,
  canManage,
  onAdjust,
  onDeleted,
}: {
  dueId: string;
  canManage: boolean;
  onAdjust: (bill: Bill) => void;
  onDeleted: () => void;
}) {
  const { data, isLoading, isError, refetch } = useDueDetail(dueId);
  const remind = useRemindDue();
  const remove = useDeleteDue();
  const [confirm, setConfirm] = useState<"remind" | "delete" | null>(null);

  if (isLoading || isError || !data) {
    return (
      <div className="space-y-5 p-6">
        {isError ? (
          <div className="space-y-3 text-sm">
            <p className="text-danger">We couldn't load this due.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <Skeleton className="h-6 w-1/2 rounded" />
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </>
        )}
      </div>
    );
  }

  const { due, bills } = data;
  const owing = bills.filter((b) => b.balance > 0 && !b.waived).length;

  const handleRemind = async () => {
    try {
      const result = (await remind.mutateAsync(dueId)) as { reminded: number };
      successToast(`Reminder sent to ${result.reminded} that still owe.`);
      setConfirm(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send.", "Error");
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(dueId);
      successToast("Due deleted.");
      setConfirm(null);
      onDeleted();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to delete.", "Error");
    }
  };

  return (
    <>
      <DetailDrawerContent
        title={due.title}
        description={dueSummaryLine(due)}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
            {canManage ? (
              <Button type="button" variant="ghost" className="text-danger sm:mr-auto" onClick={() => setConfirm("delete")}>
                <LuTrash2 size={15} aria-hidden />
                Delete due
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="sm:ml-auto" onClick={() => exportBills(due.title, bills)}>
              <LuDownload size={15} aria-hidden />
              Export Excel
            </Button>
            {canManage && owing > 0 ? (
              <Button type="button" onClick={() => setConfirm("remind")}>
                <LuBellRing size={15} aria-hidden />
                Remind {owing} that owe
              </Button>
            ) : null}
          </div>
        }
      >
        {due.summary ? <CollectionMeter summary={due.summary} /> : null}
        {due.description ? <p className="text-sm text-foreground/80">{due.description}</p> : null}
        <DetailSection title={`Bills (${bills.length})`}>
          <ul aria-label={`Bills for ${due.title}`} className="divide-y divide-separator rounded-xl border border-border">
            {bills.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{billPlace(b)}</p>
                  <p className="truncate text-xs text-muted">
                    {[b.billTo === "chapter" ? b.church?.name : null, b.memberCount != null ? `${b.memberCount} members` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {b.adjustmentNote ? <p className="truncate text-xs text-muted">Note: {b.adjustmentNote}</p> : null}
                </div>
                <div className="hidden shrink-0 text-right text-xs tabular-nums sm:block">
                  <p className="text-sm font-medium text-foreground">{naira(b.balance)} left</p>
                  <p className="text-muted">
                    {naira(b.amountPaid)} of {naira(b.amountDue)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:w-40 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                  <BillStatusPill status={b.status} />
                  <p className="text-xs tabular-nums text-muted sm:hidden">{naira(b.balance)} left</p>
                </div>
                {canManage ? (
                  <RowActions
                    actions={[
                      { label: `Adjust bill for ${billPlace(b)}`, icon: LuSlidersHorizontal, tone: "accent", onAction: () => onAdjust(b) },
                    ]}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </DetailSection>
      </DetailDrawerContent>

      <ConfirmDialog
        isOpen={confirm === "remind"}
        tone="accent"
        title="Send payment reminders?"
        message={`${owing} ${due.billTo === "chapter" ? (owing === 1 ? "chapter" : "chapters") : owing === 1 ? "church" : "churches"} still owe on “${due.title}”. Each will get a reminder.`}
        confirmLabel="Send reminders"
        loading={remind.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={handleRemind}
      />
      <ConfirmDialog
        isOpen={confirm === "delete"}
        title="Delete due?"
        message={`“${due.title}” and all ${bills.length} of its bills will be removed. This only works while no payments have been made, and can't be undone.`}
        confirmLabel="Delete due"
        loading={remove.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

/** Change a bill's amount, or waive it. The reason is shown to the chapter. */
function AdjustBillForm({ bill, onDone }: { bill: Bill; onDone: () => void }) {
  const adjust = useAdjustBill();
  const [amount, setAmount] = useState(String(bill.amountDue));
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; note?: string }>({});
  const [action, setAction] = useState<"amount" | "waive" | null>(null);

  const submit = async (waive?: boolean) => {
    const found: typeof errors = {};
    const value = Number(amount);
    if (note.trim().length < 3) found.note = "Give a reason (at least 3 characters). The chapter sees it.";
    if (waive === undefined && (!Number.isFinite(value) || value < 0 || amount.trim() === "")) found.amount = "Enter an amount of 0 or more.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setAction(waive === undefined ? "amount" : "waive");
    try {
      await adjust.mutateAsync({ id: bill.id, note: note.trim(), ...(waive !== undefined ? { waived: waive } : { amountDue: value }) });
      successToast(waive === true ? "Bill waived." : waive === false ? "Waiver removed." : "Bill updated.");
      onDone();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to update.", "Error");
    } finally {
      setAction(null);
    }
  };

  return (
    <FormDrawerContent
      title={`Adjust bill · ${billPlace(bill)}`}
      description={`Currently ${naira(bill.amountDue)}, ${naira(bill.amountPaid)} paid. Change the amount or waive the bill.`}
      onSubmit={() => submit()}
      onCancel={onDone}
      cancelLabel="Back"
      submitting={action === "amount"}
      submitDisabled={adjust.isPending}
      submitLabel="Save amount"
      footerStart={
        <Button
          type="button"
          variant="outline"
          disabled={adjust.isPending}
          loading={action === "waive"}
          onClick={() => submit(!bill.waived)}
        >
          {bill.waived ? "Remove waiver" : "Waive bill"}
        </Button>
      }
    >
      <Input
        label="Amount due (₦)"
        type="number"
        inputMode="decimal"
        min={0}
        value={amount}
        error={errors.amount}
        onChange={(e) => {
          setAmount(e.target.value);
          setErrors((x) => ({ ...x, amount: undefined }));
        }}
        autoFocus
      />
      <Textarea
        label="Reason"
        rows={3}
        value={note}
        error={errors.note}
        placeholder="e.g. Chapter merged mid-year"
        onChange={(e) => {
          setNote(e.target.value);
          setErrors((x) => ({ ...x, note: undefined }));
        }}
      />
    </FormDrawerContent>
  );
}

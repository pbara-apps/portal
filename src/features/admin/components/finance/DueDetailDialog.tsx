import { useState } from "react";
import { LuBellRing, LuDownload, LuTrash2 } from "react-icons/lu";
import * as XLSX from "xlsx";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { useAdjustBill, useDeleteDue, useDueDetail, useRemindDue } from "@/lib/api/finance";
import { cn } from "@/lib/utils";
import { BILL_STATUS_CLASSES, BILL_STATUS_LABELS, type Bill, billPlace, naira } from "@/types/finance";

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
 * waive or change a bill (with a reason), remind everyone who still owes,
 * export to Excel, or delete the due if nobody has paid yet.
 */
export function DueDetailDialog({ dueId, canManage, onClose }: { dueId: string | null; canManage: boolean; onClose: () => void }) {
  const { data, isLoading } = useDueDetail(dueId);
  const adjust = useAdjustBill();
  const remind = useRemindDue();
  const remove = useDeleteDue();
  const [editing, setEditing] = useState<Bill | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!dueId) return null;

  const openAdjust = (bill: Bill) => {
    setEditing(bill);
    setNewAmount(String(bill.amountDue));
    setNote("");
  };

  const saveAdjust = async (waive?: boolean) => {
    if (!editing) return;
    if (note.trim().length < 3) return errorToast("Give a reason.", "Reason needed");
    try {
      await adjust.mutateAsync({
        id: editing.id,
        note: note.trim(),
        ...(waive !== undefined ? { waived: waive } : { amountDue: Number(newAmount) }),
      });
      successToast("Bill updated.");
      setEditing(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to update.", "Error");
    }
  };

  const handleRemind = async () => {
    try {
      const result = (await remind.mutateAsync(dueId)) as { reminded: number };
      successToast(`Reminder sent to ${result.reminded} that still owe.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send.", "Error");
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(dueId);
      successToast("Due deleted.");
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to delete.", "Error");
    }
  };

  return (
    <>
      <Dialog open={!editing && !confirmDelete} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {isLoading || !data ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{data.due.title}</DialogTitle>
                <DialogDescription>
                  {data.due.type === "levy" ? "Levy" : "Due"}
                  {data.due.period ? ` · ${data.due.period}` : ""} · billed to each {data.due.billTo} ·{" "}
                  {data.due.chargeBasis === "flat" ? naira(data.due.amount) : `${naira(data.due.amount)} per member`} · due{" "}
                  {formatDate(data.due.dueDate)}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{data.due.billTo === "chapter" ? "CHAPTER" : "CHURCH"}</TableHead>
                      <TableHead className="text-right">DUE</TableHead>
                      <TableHead className="text-right">PAID</TableHead>
                      <TableHead className="text-right">BALANCE</TableHead>
                      <TableHead>STATUS</TableHead>
                      {canManage && <TableHead />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.bills.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{billPlace(b)}</p>
                          <p className="text-xs text-text-muted">
                            {b.billTo === "chapter" ? b.church?.name : ""}
                            {b.memberCount != null ? ` · ${b.memberCount} members` : ""}
                          </p>
                          {b.adjustmentNote && <p className="text-xs text-text-muted">Note: {b.adjustmentNote}</p>}
                        </TableCell>
                        <TableCell className="text-right text-sm">{naira(b.amountDue)}</TableCell>
                        <TableCell className="text-right text-sm">{naira(b.amountPaid)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{naira(b.balance)}</TableCell>
                        <TableCell>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", BILL_STATUS_CLASSES[b.status])}>
                            {BILL_STATUS_LABELS[b.status]}
                          </span>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openAdjust(b)}>Adjust</Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter className="flex-wrap gap-2">
                {canManage && (
                  <Button variant="ghost" className="text-rose-600" onClick={() => setConfirmDelete(true)}>
                    <LuTrash2 size={14} /> Delete due
                  </Button>
                )}
                <Button variant="outline" onClick={() => exportBills(data.due.title, data.bills)}>
                  <LuDownload size={14} /> Export Excel
                </Button>
                {canManage && (
                  <Button variant="outline" onClick={handleRemind} loading={remind.isPending}>
                    {!remind.isPending && <LuBellRing size={14} />} Remind those who owe
                  </Button>
                )}
                <Button onClick={onClose} className="bg-primary text-white">Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust bill — {editing ? billPlace(editing) : ""}</DialogTitle>
            <DialogDescription>Change the amount or waive the bill. The reason is shown to the chapter.</DialogDescription>
          </DialogHeader>
          <Input label="Amount due (₦)" type="number" min={0} value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
          <Textarea label="Reason" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter className="flex-wrap gap-2">
            {editing?.waived ? (
              <Button variant="outline" onClick={() => saveAdjust(false)} loading={adjust.isPending}>Remove waiver</Button>
            ) : (
              <Button variant="outline" onClick={() => saveAdjust(true)} loading={adjust.isPending}>Waive bill</Button>
            )}
            <Button onClick={() => saveAdjust()} loading={adjust.isPending} className="bg-primary text-white">Save amount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete due"
        message="Delete this due and all its bills? This is only possible while no payments have been made."
        loading={remove.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

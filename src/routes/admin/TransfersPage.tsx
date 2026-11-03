import { useState } from "react";
import { LuArrowRight, LuCheck, LuX } from "react-icons/lu";
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
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import { adminPageCx } from "@/features/admin/components/shared/adminLayout";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { formatDate } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useAdminTransfers, useApproveTransfer, useRejectTransfer } from "@/lib/api/chapter-admin";
import { cn } from "@/lib/utils";
import type { Transfer } from "@/types/transfer";
import { isSuperAdmin } from "@/types/user";

type Status = Transfer["status"];

/** Member transfers between chapters. Only a super admin can approve or reject. */
export default function TransfersAdminPage() {
  const { user } = useCurrentUser();
  const canReview = isSuperAdmin(user?.role);
  const [status, setStatus] = useState<Status>("pending");
  const { data: transfers = [], isLoading } = useAdminTransfers(status);
  const approve = useApproveTransfer();
  const reject = useRejectTransfer();
  const [rejecting, setRejecting] = useState<Transfer | null>(null);
  const [note, setNote] = useState("");

  const handleApprove = async (t: Transfer) => {
    try {
      await approve.mutateAsync(t.id);
      successToast(`${t.member?.fullName} moved to ${t.toChapter?.name}.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to approve.", "Error");
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (note.trim().length < 3) return errorToast("Give a reason.", "Reason needed");
    try {
      await reject.mutateAsync({ id: rejecting.id, note: note.trim() });
      successToast("Transfer rejected.");
      setRejecting(null);
      setNote("");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reject.", "Error");
    }
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader title="Transfers" description="Members moving between chapters. They keep their member ID and history." />
      <div className="flex w-fit gap-1 rounded-xl bg-surface p-1 ring-1 ring-text-dark/5">
        {(["pending", "approved", "rejected"] as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn("rounded-lg px-4 py-2 text-sm font-medium capitalize", status === s ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
          >
            {s === "pending" ? "Awaiting approval" : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : transfers.length === 0 ? (
        <p className="rounded-2xl border border-text-dark/5 bg-surface py-16 text-center text-sm text-text-muted">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {transfers.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 rounded-2xl border border-text-dark/5 bg-surface p-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <MemberAvatar photo={t.member?.photo} name={t.member?.fullName ?? ""} size={44} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    {t.member?.fullName} <span className="font-normal text-text-muted">{t.member?.memberId}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-1 text-xs text-text-muted">
                    {t.fromChapter?.name} ({t.fromChapter?.churchName}) <LuArrowRight size={12} /> {t.toChapter?.name} ({t.toChapter?.churchName})
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(t.createdAt)}
                    {t.requestedBy ? ` · by ${t.requestedBy.name}` : ""}
                    {t.reason ? ` · ${t.reason}` : ""}
                    {t.reviewNote ? ` · Reason: ${t.reviewNote}` : ""}
                  </p>
                </div>
              </div>
              {status === "pending" && canReview && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" loading={approve.isPending && approve.variables === t.id} onClick={() => handleApprove(t)}>
                    <LuCheck size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setRejecting(t)}>
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
            <DialogTitle>Reject transfer</DialogTitle>
            <DialogDescription>The chapter will see this reason.</DialogDescription>
          </DialogHeader>
          <Textarea label="Reason" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} loading={reject.isPending}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

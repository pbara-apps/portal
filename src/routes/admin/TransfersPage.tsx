import { useState } from "react";
import { LuArrowRight, LuCheck, LuShuffle, LuX } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { formatDate } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useAdminTransfers, useApproveTransfer, useRejectTransfer } from "@/lib/api/chapter-admin";
import type { Transfer } from "@/types/transfer";
import { isSuperAdmin } from "@/types/user";

type Status = Transfer["status"];

const TABS: { id: Status; label: string }[] = [
  { id: "pending", label: "Awaiting approval" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function TransferMember({ t }: { t: Transfer }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <MemberAvatar photo={t.member?.photo} name={t.member?.fullName ?? ""} size={34} />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{t.member?.fullName}</p>
        <p className="truncate text-xs text-muted">{t.member?.memberId}</p>
      </div>
    </div>
  );
}

function Move({ t }: { t: Transfer }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
      <span className="min-w-0">
        {t.fromChapter?.name}
        <span className="block truncate text-xs text-muted">{t.fromChapter?.churchName}</span>
      </span>
      <LuArrowRight size={14} aria-label="to" className="shrink-0 text-muted" />
      <span className="min-w-0">
        {t.toChapter?.name}
        <span className="block truncate text-xs text-muted">{t.toChapter?.churchName}</span>
      </span>
    </div>
  );
}

const COLUMNS: DataTableColumn<Transfer>[] = [
  { id: "member", header: "Member", isRowHeader: true, cell: (t) => <TransferMember t={t} /> },
  { id: "move", header: "From → to", cell: (t) => <Move t={t} /> },
  {
    id: "requested",
    header: "Requested",
    hideBelow: "lg",
    cell: (t) => (
      <div className="text-sm">
        {formatDate(t.createdAt)}
        {t.requestedBy ? <span className="block text-xs text-muted">by {t.requestedBy.name}</span> : null}
      </div>
    ),
  },
  {
    id: "note",
    header: "Reason",
    hideBelow: "xl",
    cell: (t) => (
      <p className="line-clamp-2 max-w-xs text-sm text-muted">
        {t.reason || "—"}
        {t.reviewNote ? <span className="block text-danger">Rejected: {t.reviewNote}</span> : null}
      </p>
    ),
  },
];

/** Member transfers between chapters. Only a super admin can approve or reject. */
export default function TransfersAdminPage() {
  const canReview = isSuperAdmin(useCurrentUser((s) => s.user)?.role);
  const [status, setStatus] = useState<Status>("pending");
  const { data: transfers = [], isLoading, isError, refetch } = useAdminTransfers(status);
  const approve = useApproveTransfer();
  const reject = useRejectTransfer();
  const [rejecting, setRejecting] = useState<Transfer | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");

  const handleApprove = async (t: Transfer) => {
    try {
      await approve.mutateAsync(t.id);
      successToast(`${t.member?.fullName} moved to ${t.toChapter?.name}.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to approve.", "Error");
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
      setNoteError("Give the chapter a short reason (at least 3 characters).");
      return;
    }
    try {
      await reject.mutateAsync({ id: rejecting.id, note: note.trim() });
      successToast("Transfer rejected.");
      closeReject();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reject.", "Error");
    }
  };

  const reviewing = status === "pending" && canReview;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Transfers" description="Members moving between chapters. They keep their member ID and history." />

      {status === "pending" && !canReview ? (
        <p className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted">
          Only a super admin can approve or reject transfers.
        </p>
      ) : null}

      <ViewTabs aria-label="Transfer status" tabs={TABS} value={status} onChange={setStatus} />

      <DataTable
        aria-label={`${status} transfers`}
        columns={COLUMNS}
        rows={transfers}
        getRowId={(t) => t.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="We couldn't load transfers."
        onRetry={() => refetch()}
        rowActions={
          reviewing
            ? (t) => (
                <RowActions
                  actions={[
                    {
                      label: approve.isPending && approve.variables === t.id ? "Approving…" : "Approve transfer",
                      icon: LuCheck,
                      tone: "success",
                      disabled: approve.isPending,
                      onAction: () => handleApprove(t),
                    },
                    { label: "Reject transfer", icon: LuX, danger: true, onAction: () => setRejecting(t) },
                  ]}
                />
              )
            : undefined
        }
        renderCard={(t) => (
          <div className="space-y-2">
            <TransferMember t={t} />
            <div className="pl-[46px]">
              <Move t={t} />
              <p className="mt-1 text-xs text-muted">{formatDate(t.createdAt)}</p>
            </div>
          </div>
        )}
        emptyState={
          <EmptyState
            icon={LuShuffle}
            title={status === "pending" ? "No transfers waiting" : `No ${status} transfers`}
            description={status === "pending" ? "Transfer requests from chapters appear here." : undefined}
          />
        }
        summary={`${transfers.length} transfer${transfers.length === 1 ? "" : "s"}`}
        minWidth={760}
      />

      <ConfirmDialog
        isOpen={!!rejecting}
        title="Reject transfer?"
        message={`${rejecting?.member?.fullName ?? "The member"} stays in ${rejecting?.fromChapter?.name ?? "their chapter"}. The chapter will see your reason.`}
        confirmLabel="Reject transfer"
        loading={reject.isPending}
        onClose={closeReject}
        onConfirm={handleReject}
      >
        <Textarea
          label="Reason"
          rows={3}
          value={note}
          error={noteError || undefined}
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

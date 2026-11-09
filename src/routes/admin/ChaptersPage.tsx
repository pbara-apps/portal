import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuCheck, LuClipboardList, LuLayers, LuRefreshCw, LuX } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  useAdminChapters,
  useApproveChapterRequest,
  useChapterRequests,
  useRejectChapterRequest,
} from "@/lib/api/chapter-admin";
import type { AdminChapterRow, ChapterRequest } from "@/types/chapter-admin";
import { isSuperAdmin } from "@/types/user";

type Tab = "chapters" | "requests" | "rejected";

const TABS: { id: Tab; label: string }[] = [
  { id: "chapters", label: "All chapters" },
  { id: "requests", label: "New chapter requests" },
  { id: "rejected", label: "Rejected requests" },
];

/**
 * Chapters: every active chapter in the association, plus counsellors'
 * requests to open new ones. Only a super admin can approve or reject.
 */
export default function ChaptersPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get("tab"))?.id ?? "chapters";
  const { data: pending } = useChapterRequests("pending");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Chapters"
        description="Every chapter in the association. Churches open new chapters by request; a super admin approves them."
      />
      <ViewTabs
        aria-label="Chapter views"
        tabs={TABS.map((t) => (t.id === "requests" ? { ...t, count: pending?.length } : t))}
        value={tab}
        onChange={(id) => setParams(id === "chapters" ? {} : { tab: id })}
      />
      {tab === "chapters" ? <ChapterList /> : <RequestList status={tab === "requests" ? "pending" : "rejected"} />}
    </div>
  );
}

const notSet = <span className="text-muted">Not set</span>;

const COLUMNS: DataTableColumn<AdminChapterRow>[] = [
  {
    id: "name",
    header: "Chapter",
    sortable: true,
    isRowHeader: true,
    cell: (c) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{c.name}</span>
        {c.isDefault ? <Badge variant="outline">Default</Badge> : null}
      </div>
    ),
  },
  { id: "church", header: "Church", sortable: true, cell: (c) => c.church?.name ?? "—" },
  {
    id: "members",
    header: "Active members",
    sortable: true,
    align: "end",
    cell: (c) => <span className="font-medium tabular-nums">{c.activeMembers.toLocaleString()}</span>,
  },
  { id: "president", header: "President", hideBelow: "lg", cell: (c) => c.president ?? notSet },
  { id: "secretary", header: "Secretary", hideBelow: "xl", cell: (c) => c.secretary ?? notSet },
];

function ChapterList() {
  const { data: chapters = [], isLoading, isError, refetch } = useAdminChapters();
  const table = useClientTable({
    rows: chapters,
    searchText: (c) => `${c.name} ${c.church?.name ?? ""}`,
    sortValue: (c, column) => (column === "church" ? c.church?.name : column === "members" ? c.activeMembers : c.name),
  });
  const totalMembers = chapters.reduce((sum, c) => sum + c.activeMembers, 0);

  return (
    <div className="space-y-3">
      <TableToolbar search={{ value: table.query, onChange: table.setQuery, placeholder: "Search chapter or church…" }} />
      <DataTable
        aria-label="Chapters"
        columns={COLUMNS}
        rows={table.pageRows}
        getRowId={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="We couldn't load chapters."
        onRetry={() => refetch()}
        sort={table.sort}
        onSortChange={table.setSort}
        renderCard={(c) => (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{c.name}</p>
              {c.isDefault ? <Badge variant="outline">Default</Badge> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {c.church?.name ?? "—"} · {c.activeMembers} active member{c.activeMembers === 1 ? "" : "s"}
            </p>
          </div>
        )}
        emptyState={
          <EmptyState
            icon={LuLayers}
            title={table.query ? "No chapters match your search" : "No chapters yet"}
            action={
              table.query ? (
                <Button type="button" size="sm" variant="outline" onClick={() => table.setQuery("")}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        }
        summary={`${table.total} chapter${table.total === 1 ? "" : "s"} · ${totalMembers.toLocaleString()} active members`}
        pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
        minWidth={720}
      />
    </div>
  );
}

function RequestList({ status }: { status: "pending" | "rejected" }) {
  const canReview = isSuperAdmin(useCurrentUser((s) => s.user)?.role);
  const { data: requests = [], isLoading, isError, refetch, isRefetching } = useChapterRequests(status);
  const approve = useApproveChapterRequest();
  const reject = useRejectChapterRequest();
  const [rejectTarget, setRejectTarget] = useState<ChapterRequest | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");

  const handleApprove = async (r: ChapterRequest) => {
    try {
      await approve.mutateAsync(r.id);
      successToast(`"${r.name}" approved and members moved.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to approve.", "Approval failed");
    }
  };

  const closeReject = () => {
    setRejectTarget(null);
    setNote("");
    setNoteError("");
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (note.trim().length < 3) {
      setNoteError("Give the counsellor a short reason (at least 3 characters).");
      return;
    }
    try {
      await reject.mutateAsync({ id: rejectTarget.id, note: note.trim() });
      successToast(`"${rejectTarget.name}" rejected.`);
      closeReject();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reject.", "Error");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-border bg-surface">
        <EmptyState
          tone="danger"
          title="We couldn't load requests"
          action={
            <Button type="button" variant="outline" onClick={() => refetch()} loading={isRefetching}>
              <LuRefreshCw size={15} aria-hidden />
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface">
        <EmptyState
          icon={LuClipboardList}
          title={status === "pending" ? "No chapter requests waiting" : "No rejected requests"}
          description={status === "pending" ? "Counsellors' requests to open new chapters appear here." : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status === "pending" && !canReview ? (
        <p className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted">
          Only a super admin can approve or reject chapter requests.
        </p>
      ) : null}

      <ul className="space-y-4">
        {requests.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">{r.name}</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {r.church?.name} · requested by {r.requestedBy?.name ?? "the counsellor"} on {formatDate(r.createdAt)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  The church has {r.churchActiveMembers} active members · {r.members.length} would move to this chapter
                </p>
              </div>
              {status === "pending" && canReview ? (
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="ghost" className="text-danger" onClick={() => setRejectTarget(r)}>
                    <LuX size={15} aria-hidden />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    className="bg-success text-white hover:bg-success/90"
                    loading={approve.isPending && approve.variables === r.id}
                    onClick={() => handleApprove(r)}
                  >
                    <LuCheck size={15} aria-hidden />
                    Approve
                  </Button>
                </div>
              ) : null}
            </div>

            {r.reviewNote ? (
              <p className="mx-4 mb-4 rounded-lg bg-danger/[0.06] px-3 py-2 text-sm text-danger sm:mx-5">
                <span className="font-medium">Reason:</span> {r.reviewNote}
              </p>
            ) : null}

            <ul className="grid gap-2 border-t border-separator p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
              {r.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 rounded-lg bg-surface-secondary px-2.5 py-2">
                  <MemberAvatar photo={m.photo} name={m.fullName} size={28} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{m.fullName}</span>
                    <span className="block truncate text-xs text-muted">
                      {[m.rankName, `from ${m.chapterName ?? "unknown chapter"}`].filter(Boolean).join(" · ")}
                      {m.status !== "active" ? ` · ${m.status}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={!!rejectTarget}
        title={`Reject "${rejectTarget?.name ?? ""}"?`}
        message="The counsellor will see your reason. No members are moved."
        confirmLabel="Reject request"
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

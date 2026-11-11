import { Skeleton } from "@heroui/react";
import { useEffect, useState } from "react";
import { LuCheck, LuPencilLine, LuRefreshCw, LuTriangleAlert, LuUserCheck, LuUserPlus, LuX } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { ageFrom, ageWarning, formatDate } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  useApproveMembers,
  useMergeDuplicate,
  useRecruitmentRequests,
  useRejectMembers,
  useRequestMemberChanges,
} from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { cn } from "@/lib/utils";
import type { DuplicateMatch, RecruitmentRequest } from "@/types/chapter-admin";
import { canManageCounsellors, isSuperAdmin } from "@/types/user";
import { AdminAddMembersDrawer } from "@/features/admin/components/members/AdminAddMembersDrawer";

type Tab = "pending" | "rejected";

const PAGE_SIZE = 100;
type NoteAction = { kind: "reject" | "changes"; ids: string[] } | null;
type MergeTarget = { request: RecruitmentRequest; match: DuplicateMatch } | null;

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Awaiting review" },
  { id: "rejected", label: "Rejected" },
];

/**
 * One possible duplicate. For an approved member, a super admin can say
 * "same person": the new entry is dropped and the existing record moves to
 * the submitting chapter (keeping their member ID and history).
 */
function DuplicateLine({ match, onSamePerson }: { match: DuplicateMatch; onSamePerson?: () => void }) {
  const where = match.sameChapter ? "in the same chapter" : [match.chapterName, match.churchName].filter(Boolean).join(", ");
  return (
    <li className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="flex min-w-0 items-center gap-2">
        <MemberAvatar photo={match.photo} name={match.fullName} size={24} />
        <span className="min-w-0">
          <strong className="font-semibold">{match.fullName}</strong>
          {match.memberId ? ` (${match.memberId})` : ""}: {match.strength === "strong" ? "same name and date of birth" : "same name"} · {where} ·{" "}
          {match.status === "active" ? "approved member" : match.status}
        </span>
      </span>
      {onSamePerson && match.status === "active" ? (
        <Button type="button" size="sm" variant="outline" onClick={onSamePerson} className="shrink-0 bg-surface sm:ml-auto">
          Same person: use existing record
        </Button>
      ) : null}
    </li>
  );
}

/**
 * Recruitment Board: the association reviews members added by chapters.
 *
 * Every admin can view it; only a super admin can approve, reject or ask
 * for changes. Each request shows possible duplicates found anywhere in the
 * association so the reviewer can spot double entries and members who moved.
 */
export default function RecruitmentPage() {
  const canReview = isSuperAdmin(useCurrentUser((s) => s.user)?.role);

  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [churchId, setChurchId] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [noteAction, setNoteAction] = useState<NoteAction>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [mergeTarget, setMergeTarget] = useState<MergeTarget>(null);
  const [page, setPage] = useState(1);
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  // Any tab or filter change goes back to page 1.
  const filterKey = [tab, debounced, churchId, duplicatesOnly].join("|");
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const { data: churches = [] } = useGetChapters();
  const { data, isLoading, isError, refetch, isRefetching } = useRecruitmentRequests({
    status: tab,
    search: debounced || undefined,
    churchId: churchId === "all" ? undefined : churchId,
    duplicates: duplicatesOnly ? "only" : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const requests = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Reviewing everything on the last page can leave it empty; step back.
  if (data && page > totalPages) setPage(totalPages);
  const approve = useApproveMembers();
  const reject = useRejectMembers();
  const requestChanges = useRequestMemberChanges();
  const merge = useMergeDuplicate();

  const reviewing = tab === "pending" && canReview;
  // Across all pages, not just the one on screen.
  const duplicateCount = data?.duplicateTotal ?? 0;

  const toggleDuplicatesOnly = () => {
    setDuplicatesOnly((on) => !on);
    setSelected(new Set());
  };
  const allSelected = requests.length > 0 && requests.every((r) => selected.has(r.id));

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleApprove = async (ids: string[]) => {
    try {
      const result = await approve.mutateAsync({ ids });
      successToast(`${result.approved} member${result.approved === 1 ? "" : "s"} approved.`);
      setSelected(new Set());
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to approve.", "Error");
    }
  };

  const closeNote = () => {
    setNoteAction(null);
    setNote("");
    setNoteError("");
  };

  const handleNoteSubmit = async () => {
    if (!noteAction) return;
    if (note.trim().length < 3) {
      setNoteError("Add a short reason so the chapter knows what to do (at least 3 characters).");
      return;
    }
    try {
      const mutation = noteAction.kind === "reject" ? reject : requestChanges;
      const result = await mutation.mutateAsync({ ids: noteAction.ids, note: note.trim() });
      successToast(
        noteAction.kind === "reject"
          ? `${result.updated} member${result.updated === 1 ? "" : "s"} rejected.`
          : `Sent ${result.updated} member${result.updated === 1 ? "" : "s"} back to the chapter for changes.`,
      );
      setSelected(new Set());
      closeNote();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Error");
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget) return;
    try {
      await merge.mutateAsync({ pendingId: mergeTarget.request.id, existingId: mergeTarget.match.id });
      successToast("Merged into the existing member record.");
      setMergeTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to merge.", "Error");
    }
  };

  const renderRequest = (r: RecruitmentRequest) => {
    const age = ageFrom(r.dateOfBirth);
    const warning = ageWarning(r.dateOfBirth, r.rank);
    const strongDuplicate = r.duplicates.some((d) => d.strength === "strong");
    return (
      <li
        key={r.id}
        className={cn(
          "rounded-xl border bg-surface shadow-[var(--surface-shadow)]",
          strongDuplicate ? "border-warning/40" : "border-border",
          selected.has(r.id) && "ring-2 ring-focus/30",
        )}
      >
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {reviewing ? (
              <Checkbox checked={selected.has(r.id)} onCheckedChange={(v) => toggle(r.id, v === true)} aria-label={`Select ${r.fullName}`} />
            ) : null}
            <MemberAvatar photo={r.photo} name={r.fullName} size={48} />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                {r.fullName}
                {r.changesRequested ? <Badge variant="warning">Waiting on chapter</Badge> : null}
              </p>
              <p className="text-sm text-muted">
                {r.rank?.name ?? "No rank"} · {r.dateOfBirth ? `${formatDate(r.dateOfBirth)} (age ${age})` : "No date of birth"}
              </p>
              <p className="text-sm text-muted">
                {r.chapter?.name} · {r.church?.name}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted lg:w-48">
            <p>Submitted {formatDate(r.createdAt)}</p>
            {r.submittedBy ? (
              <p>
                by {r.submittedBy.name} ({r.submittedBy.role})
              </p>
            ) : null}
          </div>

          {reviewing ? (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button type="button" size="sm" className="text-danger bg-red-100" onClick={() => setNoteAction({ kind: "reject", ids: [r.id] })} disabled={approve.isPending || requestChanges.isPending || reject.isPending}>
                <LuX size={14} aria-hidden />
                Reject
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setNoteAction({ kind: "changes", ids: [r.id] })} disabled={approve.isPending || requestChanges.isPending || reject.isPending}>
                <LuPencilLine size={14} aria-hidden />
                Request changes
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-success text-white hover:bg-success/90"
                onClick={() => handleApprove([r.id])}
                loading={approve.isPending && approve.variables?.ids.includes(r.id)}

              >
                <LuCheck size={14} aria-hidden />
                Approve
              </Button>
            </div>
          ) : null}
        </div>

        {warning || r.reviewNote || r.duplicates.length > 0 ? (
          <div className="space-y-3 border-t border-separator px-4 py-3 sm:px-5">
            {warning ? <p className="text-sm text-warning">{warning}</p> : null}
            {r.reviewNote ? (
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">{r.status === "rejected" ? "Rejection reason" : "Changes requested"}:</span>{" "}
                {r.reviewNote}
              </p>
            ) : null}
            {r.duplicates.length > 0 ? (
              <div className="rounded-lg border border-warning/30 bg-warning/[0.06] p-3 text-sm text-foreground">
                <p className="mb-2 flex items-center gap-1.5 font-semibold text-warning">
                  <LuTriangleAlert size={15} aria-hidden />
                  Possible duplicate: check before approving
                </p>
                <ul className="space-y-2">
                  {r.duplicates.map((d) => (
                    <DuplicateLine
                      key={d.id}
                      match={d}
                      onSamePerson={reviewing ? () => setMergeTarget({ request: r, match: d }) : undefined}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </li>
    );
  };

    const canEdit = canManageCounsellors(useCurrentUser((s) => s.user)?.role);

    const [adding, setAdding] = useState(false);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Recruitment board"
        description="Members added by chapters wait here until a super admin approves them. Approved members get a member ID and count in all totals."
        actions={
                  <>
                    {canEdit ? (
                      <Button
                        type="button"
                        className="bg-primary text-white"
                        onClick={() => setAdding(true)}
                      >
                        <LuUserPlus size={16} aria-hidden />
                        Add members
                      </Button>
                    ) : null}
                  </>
                }
      />

      {!canReview ? (
        <p className="rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm text-muted">
          You can view requests. Only a super admin can approve, reject or request changes.
        </p>
      ) : null}
      <ViewTabs
        aria-label="Request status"
        tabs={TABS.map((t) => (t.id === tab && !isLoading ? { ...t, count: total } : t))}
        value={tab}
        onChange={(id) => {
          setTab(id);
          setDuplicatesOnly(false);
          setSelected(new Set());
        }}
      />

      <div className="space-y-3">
        <TableToolbar
          search={{ value: search, onChange: setSearch, placeholder: "Search by name…" }}
          filters={
            <Select value={churchId} onValueChange={setChurchId}>
              <SelectTrigger aria-label="Church">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All churches</SelectItem>
                {churches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          actions={
            <div className="flex items-center gap-3">
              {duplicateCount > 0 || duplicatesOnly ? (
                <button
                  type="button"
                  onClick={toggleDuplicatesOnly}
                  aria-pressed={duplicatesOnly}
                  title={duplicatesOnly ? "Show all requests" : "Show only possible duplicates"}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-warning outline-none transition-colors focus-visible:ring-2 focus-visible:ring-warning/50",
                    duplicatesOnly
                      ? "border-warning/60 bg-warning/20 hover:bg-warning/25"
                      : "border-warning/30 bg-warning/10 hover:bg-warning/20",
                  )}
                >
                  <LuTriangleAlert size={13} aria-hidden />
                  {duplicateCount} with possible duplicates
                  {duplicatesOnly ? <LuX size={13} aria-label="Clear filter" /> : null}
                </button>
              ) : null}
              {reviewing && requests.length > 0 ? (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => setSelected(v === true ? new Set(requests.map((r) => r.id)) : new Set())}
                  label="Select all"
                />
              ) : null}
            </div>
          }
        />

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
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
        ) : requests.length === 0 && duplicatesOnly ? (
          <div className="rounded-xl border border-border bg-surface">
            <EmptyState
              icon={LuCheck}
              title="No possible duplicates left"
              description="Every request with a possible duplicate has been reviewed."
              action={
                <Button type="button" variant="outline" onClick={toggleDuplicatesOnly}>
                  Show all requests
                </Button>
              }
            />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface">
            <EmptyState
              icon={LuUserCheck}
              title={tab === "pending" ? "No members waiting for review" : "No rejected members"}
              description={tab === "pending" ? "Members that chapters add will appear here for approval." : undefined}
            />
          </div>
        ) : (
          <>
            <ul className="space-y-3">{requests.map(renderRequest)}</ul>
            {totalPages > 1 ? (
              <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
                <p className="text-sm text-muted tabular-nums">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(next) => {
                    setPage(next);
                    setSelected(new Set());
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      <BulkActionBar
        count={selected.size}
        entityLabel="Member"
        onClear={() => setSelected(new Set())}
        actions={
          <>
            <button
              type="button"
              onClick={() => handleApprove([...selected])}
              disabled={approve.isPending || requestChanges.isPending || reject.isPending}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-success px-3 font-medium text-white outline-none transition-colors hover:bg-success/90 focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-60"

            >
              <LuCheck size={15} aria-hidden />
              {approve.isPending ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => setNoteAction({ kind: "changes", ids: [...selected] })}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-white/85 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60 bg-white/20"
              disabled={approve.isPending || requestChanges.isPending || reject.isPending}
            >
              <LuPencilLine size={15} aria-hidden />
              <span className="hidden sm:inline">Request changes</span>
              <span className="sm:hidden">Changes</span>
            </button>
            <button
              type="button"
              onClick={() => setNoteAction({ kind: "reject", ids: [...selected] })}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-white/90 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60 bg-red-500"
              disabled={approve.isPending || requestChanges.isPending || reject.isPending}
            >
              <LuX size={15} aria-hidden />
              Reject
            </button>
          </>
        }
      />

      <ConfirmDialog
        isOpen={!!noteAction}
        title={`${noteAction?.kind === "reject" ? "Reject" : "Request changes for"} ${noteAction?.ids.length ?? 0} member${noteAction?.ids.length === 1 ? "" : "s"}?`}
        message={
          noteAction?.kind === "reject"
            ? "The chapter will see your reason."
            : "The member goes back to the chapter to fix. They can edit and resubmit."
        }
        tone={noteAction?.kind === "reject" ? "danger" : "accent"}
        confirmLabel={noteAction?.kind === "reject" ? "Reject" : "Send back"}
        loading={reject.isPending || requestChanges.isPending}
        onClose={closeNote}
        onConfirm={handleNoteSubmit}
      >
        <Textarea
          label={noteAction?.kind === "reject" ? "Reason for rejection" : "What needs to change?"}
          rows={3}
          value={note}
          error={noteError || undefined}
          placeholder={
            noteAction?.kind === "reject" ? "e.g. Already registered in Blessed Chapter" : "e.g. The photo is unclear, please upload a new one"
          }
          onChange={(e) => {
            setNote(e.target.value);
            if (noteError) setNoteError("");
          }}
          autoFocus
        />
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!mergeTarget}
        title="Use the existing record?"
        message={
          mergeTarget
            ? `This new entry is removed${
                mergeTarget.match.sameChapter ? "" : ` and ${mergeTarget.match.fullName} moves to ${mergeTarget.request.chapter?.name}`
              }. They keep member ID ${mergeTarget.match.memberId}.`
            : ""
        }
        tone="accent"
        confirmLabel="Merge records"
        loading={merge.isPending}
        onClose={() => setMergeTarget(null)}
        onConfirm={handleMerge}
      />

 {canEdit ? (
        <AdminAddMembersDrawer
          open={adding}
          defaultChapterId={undefined}
          onClose={() => setAdding(false)}
        />
      ) : null}

    </div>
  );
}

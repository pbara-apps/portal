import { useMemo, useState } from "react";
import { LuCheck, LuPencilLine, LuSearch, LuTriangleAlert, LuUserCheck, LuX } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import { adminFilterBarCx, adminPageCx } from "@/features/admin/components/shared/adminLayout";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { ageFrom, ageWarning, formatDate } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  useApproveMembers,
  useRecruitmentRequests,
  useRejectMembers,
  useRequestMemberChanges,
} from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { cn } from "@/lib/utils";
import type { DuplicateMatch, RecruitmentRequest } from "@/types/chapter-admin";
import { isSuperAdmin } from "@/types/user";

type Tab = "pending" | "rejected";
type NoteAction = { kind: "reject" | "changes"; ids: string[] } | null;

/** One line describing a possible duplicate, e.g. "Same name & date of birth · Antioch Chapter, ANTIOCH BC". */
function DuplicateLine({ match }: { match: DuplicateMatch }) {
  const where = match.sameChapter
    ? "in the same chapter"
    : [match.chapterName, match.churchName].filter(Boolean).join(", ");
  return (
    <li className="flex items-center gap-2">
      <MemberAvatar photo={match.photo} name={match.fullName} size={24} />
      <span>
        <strong>{match.fullName}</strong>
        {match.memberId ? ` (${match.memberId})` : ""} —{" "}
        {match.strength === "strong" ? "same name & date of birth" : "same name"} · {where} ·{" "}
        {match.status === "active" ? "approved member" : match.status}
      </span>
    </li>
  );
}

/**
 * Recruitment Board — the association reviews members added by chapters.
 *
 * Every admin can view it; only a super_admin can approve, reject or ask
 * for changes. Each request shows possible duplicates found anywhere in the
 * association so the reviewer can spot double entries and members who moved.
 */
export default function RecruitmentPage() {
  const { user } = useCurrentUser();
  const canReview = isSuperAdmin(user?.role);

  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [churchId, setChurchId] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [noteAction, setNoteAction] = useState<NoteAction>(null);
  const [note, setNote] = useState("");

  const { data: churches = [] } = useGetChapters();
  const { data: requests = [], isLoading, isError, refetch } = useRecruitmentRequests({
    status: tab,
    search: search.trim() || undefined,
    churchId: churchId === "all" ? undefined : churchId,
  });
  const approve = useApproveMembers();
  const reject = useRejectMembers();
  const requestChanges = useRequestMemberChanges();

  const duplicateCount = useMemo(() => requests.filter((r) => r.duplicates.length > 0).length, [requests]);
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

  const handleNoteSubmit = async () => {
    if (!noteAction) return;
    if (note.trim().length < 3) return errorToast("Please add a short reason.", "Reason needed");
    try {
      const mutation = noteAction.kind === "reject" ? reject : requestChanges;
      const result = await mutation.mutateAsync({ ids: noteAction.ids, note: note.trim() });
      successToast(
        noteAction.kind === "reject"
          ? `${result.updated} member(s) rejected.`
          : `Sent ${result.updated} member(s) back to the chapter for changes.`,
      );
      setSelected(new Set());
      setNoteAction(null);
      setNote("");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Error");
    }
  };

  const renderRow = (r: RecruitmentRequest) => {
    const age = ageFrom(r.dateOfBirth);
    const warning = ageWarning(r.dateOfBirth, r.rank);
    return (
      <li
        key={r.id}
        className={cn(
          "rounded-2xl border bg-surface p-4",
          r.duplicates.some((d) => d.strength === "strong") ? "border-amber-300" : "border-text-dark/5",
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {tab === "pending" && canReview && (
              <Checkbox
                checked={selected.has(r.id)}
                onCheckedChange={(v) => toggle(r.id, v === true)}
                aria-label={`Select ${r.fullName}`}
              />
            )}
            <MemberAvatar photo={r.photo} name={r.fullName} size={52} />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                {r.fullName}
                {r.changesRequested && <Badge className="bg-amber-100 text-amber-800">Waiting on chapter</Badge>}
              </p>
              <p className="text-xs text-text-muted">
                {r.rank?.name ?? "No rank"} · {r.dateOfBirth ? `${formatDate(r.dateOfBirth)} (age ${age})` : "No date of birth"}
              </p>
              <p className="text-xs text-text-muted">
                {r.chapter?.name} · {r.church?.name}
              </p>
            </div>
          </div>

          <div className="text-xs text-text-muted lg:w-48">
            <p>Submitted {formatDate(r.createdAt)}</p>
            {r.submittedBy && <p>by {r.submittedBy.name} ({r.submittedBy.role})</p>}
          </div>

          {tab === "pending" && canReview && (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleApprove([r.id])} loading={approve.isPending && approve.variables?.ids.includes(r.id)}>
                <LuCheck size={14} /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setNoteAction({ kind: "changes", ids: [r.id] })}>
                <LuPencilLine size={14} /> Changes
              </Button>
              <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setNoteAction({ kind: "reject", ids: [r.id] })}>
                <LuX size={14} /> Reject
              </Button>
            </div>
          )}
        </div>

        {warning && <p className="mt-3 text-xs text-amber-700">{warning}</p>}

        {r.reviewNote && (
          <p className="mt-3 rounded-lg bg-background p-2 text-xs text-text-muted">
            <strong>{r.status === "rejected" ? "Rejection reason" : "Changes requested"}:</strong> {r.reviewNote}
          </p>
        )}

        {r.duplicates.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="mb-2 flex items-center gap-1.5 font-semibold">
              <LuTriangleAlert size={14} /> Possible duplicate — check before approving
            </p>
            <ul className="space-y-1.5">
              {r.duplicates.map((d) => <DuplicateLine key={d.id} match={d} />)}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Recruitment Board"
        description="Members added by chapters wait here until a super admin approves them. Approved members get a member ID and count in all totals."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">{requests.length} {tab === "pending" ? "awaiting review" : "rejected"}</Badge>
            {duplicateCount > 0 && (
              <Badge className="bg-amber-100 text-amber-800">{duplicateCount} with possible duplicates</Badge>
            )}
          </>
        }
      />

      {!canReview && (
        <p className="rounded-lg border border-text-dark/5 bg-surface p-3 text-sm text-text-muted">
          You can view requests. Only a super admin can approve, reject or request changes.
        </p>
      )}

      <section className={adminFilterBarCx}>
        <div className="flex gap-1 rounded-lg bg-background p-1">
          {(["pending", "rejected"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setSelected(new Set()); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                tab === t ? "bg-primary text-white" : "text-text-muted hover:text-primary",
              )}
            >
              {t === "pending" ? "Awaiting review" : "Rejected"}
            </button>
          ))}
        </div>
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<LuSearch size={16} />}
            className="w-full sm:max-w-xs"
          />
          <Select value={churchId} onValueChange={setChurchId}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Filter by church"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All churches</SelectItem>
              {churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

        {tab === "pending" && canReview && requests.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-text-muted sm:ml-auto">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(v) => setSelected(v === true ? new Set(requests.map((r) => r.id)) : new Set())}
            />
            Select all
          </label>
        )}
      </section>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner label="Loading requests…" /></div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <p className="text-sm text-rose-600">Unable to load requests.</p>
          <Button size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-text-dark/5 bg-surface py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary">
            <LuUserCheck size={20} />
          </div>
          <p className="text-sm font-semibold">{tab === "pending" ? "No members waiting for review" : "No rejected members"}</p>
        </div>
      ) : (
        <ul className="space-y-3">{requests.map(renderRow)}</ul>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-2xl flex-col gap-2 rounded-2xl bg-primary p-3 text-white shadow-2xl sm:flex-row sm:items-center">
          <p className="flex-1 px-2 text-sm">{selected.size} selected</p>
          <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => handleApprove([...selected])} loading={approve.isPending}>
            <LuCheck size={14} /> Approve all
          </Button>
          <Button size="sm" variant="outline" className="text-primary" onClick={() => setNoteAction({ kind: "changes", ids: [...selected] })}>
            Request changes
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setNoteAction({ kind: "reject", ids: [...selected] })}>
            Reject
          </Button>
        </div>
      )}

      <Dialog open={!!noteAction} onOpenChange={(open) => !open && setNoteAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {noteAction?.kind === "reject" ? "Reject" : "Request changes for"} {noteAction?.ids.length} member
              {noteAction?.ids.length === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              {noteAction?.kind === "reject"
                ? "The chapter will see this reason."
                : "The member goes back to the chapter to fix. They can edit and resubmit."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            label={noteAction?.kind === "reject" ? "Reason for rejection" : "What needs to change?"}
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={noteAction?.kind === "reject" ? "e.g. Already registered in Blessed Chapter" : "e.g. The photo is unclear, please upload a new one"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteAction(null)}>Cancel</Button>
            <Button
              onClick={handleNoteSubmit}
              loading={reject.isPending || requestChanges.isPending}
              variant={noteAction?.kind === "reject" ? "destructive" : "default"}
            >
              {noteAction?.kind === "reject" ? "Reject" : "Send back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

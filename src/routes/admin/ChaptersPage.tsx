import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuCheck, LuLayers, LuSearch, LuX } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
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
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminPageCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { formatDate } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  useAdminChapters,
  useApproveChapterRequest,
  useChapterRequests,
  useRejectChapterRequest,
} from "@/lib/api/chapter-admin";
import { cn } from "@/lib/utils";
import type { ChapterRequest } from "@/types/chapter-admin";
import { isSuperAdmin } from "@/types/user";

type Tab = "chapters" | "requests" | "rejected";

const TABS: { id: Tab; label: string }[] = [
  { id: "chapters", label: "All chapters" },
  { id: "requests", label: "New chapter requests" },
  { id: "rejected", label: "Rejected requests" },
];

/**
 * Chapters — every active chapter in the association, plus counsellors'
 * requests to open new ones. Only a super admin can approve or reject.
 */
export default function ChaptersPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "chapters") as Tab;

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Chapters"
        description="Every chapter in the association. Churches open new chapters by request; a super admin approves them."
      />
      <div className="flex w-fit gap-1 rounded-xl bg-surface p-1 ring-1 ring-text-dark/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setParams(t.id === "chapters" ? {} : { tab: t.id })}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium",
              tab === t.id ? "bg-primary text-white" : "text-text-muted hover:text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "chapters" ? <ChapterList /> : <RequestList status={tab === "requests" ? "pending" : "rejected"} />}
    </div>
  );
}

function ChapterList() {
  const { data: chapters = [], isLoading, isError, refetch } = useAdminChapters();
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.church?.name ?? "").toLowerCase().includes(q),
    );
  }, [chapters, search]);

  const totalMembers = chapters.reduce((sum, c) => sum + c.activeMembers, 0);

  return (
    <>
      <section className={adminFilterBarCx}>
        <Input
          placeholder="Search chapter or church…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<LuSearch size={16} />}
          className="w-full sm:max-w-md"
        />
        <div className="flex gap-2 sm:ml-auto">
          <Badge className="bg-primary/10 text-primary">{chapters.length} chapters</Badge>
          <Badge className="bg-primary/10 text-primary">{totalMembers} active members</Badge>
        </div>
      </section>
      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner label="Loading chapters…" /></div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm text-rose-600">Unable to load chapters.</p>
            <Button size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <div className={adminTableScrollCx}>
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>CHAPTER</TableHead>
                  <TableHead>CHURCH</TableHead>
                  <TableHead className="text-right">ACTIVE MEMBERS</TableHead>
                  <TableHead>PRESIDENT</TableHead>
                  <TableHead>SECRETARY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-text-muted">No chapters found.</TableCell>
                  </TableRow>
                ) : (
                  visible.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <LuLayers size={16} className="text-primary" />
                          <span className="text-sm font-semibold text-primary">{c.name}</span>
                          {c.isDefault && <Badge variant="outline">Default</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.church?.name ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{c.activeMembers}</TableCell>
                      <TableCell className="text-sm">{c.president ?? <span className="text-text-muted">Not set</span>}</TableCell>
                      <TableCell className="text-sm">{c.secretary ?? <span className="text-text-muted">Not set</span>}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}

function RequestList({ status }: { status: "pending" | "rejected" }) {
  const { user } = useCurrentUser();
  const canReview = isSuperAdmin(user?.role);
  const { data: requests = [], isLoading, isError, refetch } = useChapterRequests(status);
  const approve = useApproveChapterRequest();
  const reject = useRejectChapterRequest();
  const [rejectTarget, setRejectTarget] = useState<ChapterRequest | null>(null);
  const [note, setNote] = useState("");

  const handleApprove = async (r: ChapterRequest) => {
    try {
      await approve.mutateAsync(r.id);
      successToast(`"${r.name}" approved and members moved.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to approve.", "Approval failed");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (note.trim().length < 3) return errorToast("Please add a short reason.", "Reason needed");
    try {
      await reject.mutateAsync({ id: rejectTarget.id, note: note.trim() });
      successToast(`"${rejectTarget.name}" rejected.`);
      setRejectTarget(null);
      setNote("");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reject.", "Error");
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner label="Loading requests…" /></div>;
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-rose-600">Unable to load requests.</p>
        <Button size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }
  if (requests.length === 0) {
    return (
      <p className="rounded-2xl border border-text-dark/5 bg-surface py-16 text-center text-sm text-text-muted">
        {status === "pending" ? "No chapter requests waiting." : "No rejected requests."}
      </p>
    );
  }

  return (
    <>
      {status === "pending" && !canReview && (
        <p className="rounded-lg border border-text-dark/5 bg-surface p-3 text-sm text-text-muted">
          Only a super admin can approve or reject chapter requests.
        </p>
      )}
      <ul className="space-y-4">
        {requests.map((r) => (
          <li key={r.id} className="rounded-2xl border border-text-dark/5 bg-surface p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-primary">{r.name}</p>
                <p className="text-xs text-text-muted">
                  {r.church?.name} · requested by {r.requestedBy?.name ?? "counsellor"} on {formatDate(r.createdAt)}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Church has {r.churchActiveMembers} active members · {r.members.length} would move in
                </p>
              </div>
              {status === "pending" && canReview && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" loading={approve.isPending && approve.variables === r.id} onClick={() => handleApprove(r)}>
                    <LuCheck size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setRejectTarget(r)}>
                    <LuX size={14} /> Reject
                  </Button>
                </div>
              )}
            </div>
            {r.reviewNote && <p className="mt-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-800">Reason: {r.reviewNote}</p>}
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {r.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 rounded-lg bg-background/60 p-2">
                  <MemberAvatar photo={m.photo} name={m.fullName} size={28} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{m.fullName}</span>
                    <span className="block truncate text-[11px] text-text-muted">
                      {[m.rankName, `from ${m.chapterName ?? "?"}`].filter(Boolean).join(" · ")}
                      {m.status !== "active" ? ` · ${m.status}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject "{rejectTarget?.name}"</DialogTitle>
            <DialogDescription>The counsellor will see this reason. No members are moved.</DialogDescription>
          </DialogHeader>
          <Textarea label="Reason" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} loading={reject.isPending}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

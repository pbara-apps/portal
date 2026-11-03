import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LuLayers, LuPlus, LuTrash2 } from "react-icons/lu";
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
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { ConfirmDialog } from "@/features/admin/components/shared/ConfirmDialog";
import { useCancelChapterRequest, useChapterOverview, useCreateChapterRequest } from "../api/chapters";
import { useChapterMembers } from "../api/members";
import { MemberPicker } from "../components/MemberPicker";
import { useChapterSession } from "../store/useChapterSession";

const STATUS_BADGE = {
  active: <Badge variant="success">Active</Badge>,
  pending: <Badge className="bg-sky-100 text-sky-800">Awaiting approval</Badge>,
  rejected: <Badge variant="destructive">Not approved</Badge>,
};

/**
 * Counsellor only: the church's chapters, and requests for new ones.
 * A request is allowed once the church has more than the minimum number of
 * active members; the new chapter starts with members moved from existing
 * chapters, and the association approves it.
 */
export default function ChurchChaptersPage() {
  const isCounsellor = useChapterSession((s) => s.profile?.role === "counsellor");
  if (!isCounsellor) return <Navigate to="/chapter" replace />;
  return <ChaptersManager />;
}

function ChaptersManager() {
  const { data, isLoading, isError, refetch } = useChapterOverview();
  const cancel = useCancelChapterRequest();
  const [formOpen, setFormOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancel.mutateAsync(cancelTarget.id);
      successToast("Request withdrawn.");
      setCancelTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to withdraw.", "Error");
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner label="Loading chapters…" /></div>;
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-rose-600">Unable to load chapters.</p>
        <Button size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const { rules } = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Chapters</h1>
          <p className="mt-1 text-sm text-text-muted">
            Your church has <strong>{data.churchActiveMembers}</strong> active members.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} disabled={!data.canRequest} className="bg-primary text-white">
          <LuPlus size={16} /> Request new chapter
        </Button>
      </header>

      {!data.canRequest && (
        <p className="rounded-xl border border-text-dark/5 bg-surface p-4 text-sm text-text-muted">
          A church can open another chapter once it has more than {rules.churchMembersBeforeNewChapter} active
          members. The new chapter must start with at least {rules.minMembersInNewChapter} members.
        </p>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {data.chapters.map((c) => (
          <li key={c.id} className="rounded-2xl border border-text-dark/5 bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LuLayers size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{c.name}</p>
                  <p className="text-xs text-text-muted">
                    {c.status === "active"
                      ? `${c.activeMembers} active member${c.activeMembers === 1 ? "" : "s"}`
                      : `${c.requestedMemberCount} members to move in`}
                    {c.isDefault ? " · Default chapter" : ""}
                  </p>
                </div>
              </div>
              {STATUS_BADGE[c.status]}
            </div>
            {c.status === "rejected" && c.reviewNote && (
              <p className="mt-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-800">Reason: {c.reviewNote}</p>
            )}
            {c.status === "pending" && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-3 text-rose-600"
                onClick={() => setCancelTarget({ id: c.id, name: c.name })}
              >
                <LuTrash2 size={14} /> Withdraw request
              </Button>
            )}
          </li>
        ))}
      </ul>

      <NewChapterDialog
        open={formOpen}
        minMembers={rules.minMembersInNewChapter}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Withdraw request"
        message={`Withdraw the request for "${cancelTarget?.name ?? ""}"? No members will be moved.`}
        loading={cancel.isPending}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </div>
  );
}

/** Form: chapter name + the active members who will move into it. */
function NewChapterDialog({ open, minMembers, onClose }: { open: boolean; minMembers: number; onClose: () => void }) {
  const { data: members = [], isLoading } = useChapterMembers({ view: "active" });
  const create = useCreateChapterRequest();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reset = () => {
    setName("");
    setSelected(new Set());
  };

  const handleSubmit = async () => {
    if (name.trim().length < 3) return errorToast("Enter the new chapter's name.", "Name needed");
    if (selected.size < minMembers) {
      return errorToast(`Pick at least ${minMembers} members to move into the new chapter.`, "Not enough members");
    }
    try {
      await create.mutateAsync({ name: name.trim(), memberIds: [...selected] });
      successToast("Request sent. The association will review it.", "Request sent");
      reset();
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send request.", "Request failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a new chapter</DialogTitle>
          <DialogDescription>
            Pick at least {minMembers} members to move from your existing chapters. They move only after the
            association approves, and no chapter may be left empty.
          </DialogDescription>
        </DialogHeader>
        <Input label="New chapter name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Antioch Youth Chapter" />
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <MemberPicker members={members} selected={selected} onChange={setSelected} showChapter />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={create.isPending} className="bg-primary text-white">
            Send request ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

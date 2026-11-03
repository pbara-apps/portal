import { useState } from "react";
import { LuMegaphone, LuTrash2 } from "react-icons/lu";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import { adminPageCx } from "@/features/admin/components/shared/adminLayout";
import { ConfirmDialog } from "@/features/admin/components/shared/ConfirmDialog";
import { formatDate } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetChapters } from "@/lib/api/church";
import { type AdminAnnouncement, useAdminAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/lib/api/engagement";
import { canWriteAdminContent } from "@/types/user";

/**
 * Announcements to chapter portal users — everyone, or selected churches.
 * Each shows how many recipients have read it.
 */
export default function AnnouncementsAdminPage() {
  const { user } = useCurrentUser();
  const canPublish = canWriteAdminContent(user?.role);
  const { data: items = [], isLoading } = useAdminAnnouncements();
  const remove = useDeleteAnnouncement();
  const [createOpen, setCreateOpen] = useState(false);
  const [readersOf, setReadersOf] = useState<AdminAnnouncement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAnnouncement | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      successToast("Announcement deleted.");
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to delete.", "Error");
    }
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Announcements"
        description="Send circulars to counsellors, presidents and secretaries in the chapter portal."
        actionLabel="New announcement"
        onAction={() => setCreateOpen(true)}
        actionDisabled={!canPublish}
      />
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-text-dark/5 bg-surface py-16 text-center">
          <LuMegaphone size={20} className="text-primary" />
          <p className="text-sm text-text-muted">No announcements yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="rounded-2xl border border-text-dark/5 bg-surface p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-primary">{a.title}</p>
                  <p className="text-xs text-text-muted">
                    {formatDate(a.createdAt)} · {a.audience === "all" ? "All churches" : a.churches.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setReadersOf(a)} className="text-sm font-semibold text-primary underline">
                    Read by {a.readCount} of {a.recipientCount}
                  </button>
                  {canPublish && (
                    <Button size="icon" variant="ghost" className="text-rose-600" aria-label="Delete" onClick={() => setDeleteTarget(a)}>
                      <LuTrash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm">{a.body}</p>
            </li>
          ))}
        </ul>
      )}

      <CreateAnnouncementDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <Dialog open={!!readersOf} onOpenChange={(o) => !o && setReadersOf(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Read by</DialogTitle>
            <DialogDescription>{readersOf?.title}</DialogDescription>
          </DialogHeader>
          {readersOf?.readers.length ? (
            <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
              {readersOf.readers.map((r, i) => <li key={i}>{r.name} <span className="text-xs capitalize text-text-muted">· {r.role}</span></li>)}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">Nobody has opened it yet.</p>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete announcement"
        message={`Delete "${deleteTarget?.title ?? ""}"? Chapters will no longer see it.`}
        loading={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function CreateAnnouncementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateAnnouncement();
  const { data: churches = [] } = useGetChapters();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [everyone, setEveryone] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reset = () => {
    setTitle("");
    setBody("");
    setEveryone(true);
    setSelected(new Set());
  };

  const handleSave = async () => {
    if (title.trim().length < 3 || body.trim().length < 5) return errorToast("Add a title and the message.", "Validation");
    if (!everyone && selected.size === 0) return errorToast("Select at least one church.", "Validation");
    try {
      await create.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        audience: everyone ? "all" : "selected",
        churchIds: everyone ? undefined : [...selected],
      });
      successToast("Announcement published.");
      reset();
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to publish.", "Error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>Recipients also get a notification in their portal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="Message" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={everyone} onCheckedChange={(v) => setEveryone(v === true)} /> Send to all churches
          </label>
          {!everyone && (
            <ul className="max-h-48 overflow-y-auto rounded-xl border border-text-dark/10">
              {churches.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 border-b border-text-dark/5 px-3 py-2 text-sm last:border-0">
                    <Checkbox
                      checked={selected.has(c.id)}
                      onCheckedChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          return next;
                        })
                      }
                    />
                    {c.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={create.isPending} className="bg-primary text-white">Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { LuAward, LuFileText, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
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
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { useRetained } from "@/hooks/useRetained";
import { type Achievement, MONTHS, monthYear } from "@/types/achievement";
import {
  useAchievements,
  useCreateAchievement,
  useDeleteAchievement,
  useUpdateAchievement,
} from "../api/achievements";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { FileUploadButton } from "../components/FileUploadButton";
import { useActiveChapterId, useWorkingChapter } from "../store/useChapterSession";

/**
 * The chapter's achievements. Officers add them with a proof file and the
 * month/year; they show immediately. The association can see them all.
 */
export default function AchievementsPage() {
  const chapterId = useActiveChapterId();
  const { data: achievements = [], isLoading } = useAchievements(chapterId);
  const remove = useDeleteAchievement();
  const [editing, setEditing] = useState<Achievement | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      successToast("Achievement removed.");
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to remove.", "Error");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Achievements</h1>
          <p className="mt-1 text-sm text-text-muted">Record what your chapter has accomplished.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ChapterSwitcher />
          <Button onClick={() => setEditing("new")} className="bg-primary text-white">
            <LuPlus size={16} /> Add achievement
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : achievements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-text-dark/5 bg-surface py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
            <LuAward size={20} />
          </div>
          <p className="text-sm font-semibold">No achievements recorded yet</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {achievements.map((a) => (
            <li key={a.id} className="flex gap-4 rounded-2xl border border-text-dark/5 bg-surface p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <LuAward size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">{a.name}</p>
                <p className="text-xs text-text-muted">
                  {monthYear(a.month, a.year)}
                  {!chapterId && a.chapter ? ` · ${a.chapter.name}` : ""}
                </p>
                {a.description && <p className="mt-2 text-sm text-text-dark">{a.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a href={a.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline">
                    <LuFileText size={12} /> View proof
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(a)}><LuPencil size={14} /> Edit</Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(a)}>
                    <LuTrash2 size={14} /> Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AchievementDrawer editing={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove achievement"
        message={`Remove "${deleteTarget?.name ?? ""}"?`}
        loading={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

type FormState = { name: string; proofUrl: string | null; month: string; year: string; description: string };

function AchievementDrawer({ editing, onClose }: { editing: Achievement | "new" | null; onClose: () => void }) {
  const { chapterId, chapterName } = useWorkingChapter();
  const create = useCreateAchievement();
  const update = useUpdateAchievement();
  const shown = useRetained(editing);
  const [form, setForm] = useState<FormState>({ name: "", proofUrl: null, month: "", year: "", description: "" });
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const today = new Date();
    setShowErrors(false);
    setForm(
      editing === "new"
        ? { name: "", proofUrl: null, month: String(today.getMonth() + 1), year: String(today.getFullYear()), description: "" }
        : {
            name: editing.name,
            proofUrl: editing.proofUrl,
            month: String(editing.month),
            year: String(editing.year),
            description: editing.description ?? "",
          },
    );
  }, [editing]);

  if (!shown) return null;
  const isNew = shown === "new";
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => String(thisYear - i));
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const nameError = showErrors && form.name.trim().length < 3 ? "Describe the achievement (at least 3 characters)" : undefined;

  const handleSave = async () => {
    setShowErrors(true);
    if (form.name.trim().length < 3 || !form.proofUrl) return;
    const body = {
      name: form.name.trim(),
      proofUrl: form.proofUrl,
      month: Number(form.month),
      year: Number(form.year),
      description: form.description.trim() || null,
    };
    try {
      if (isNew) await create.mutateAsync({ ...body, chapterId });
      else await update.mutateAsync({ id: shown.id, body });
      successToast(isNew ? "Achievement added." : "Achievement updated.");
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  return (
    <FormDrawer
      open={editing !== null}
      title={isNew ? "Add achievement" : "Edit achievement"}
      description={`${isNew ? `For ${chapterName}. ` : ""}It shows straight away.`}
      onSubmit={handleSave}
      onCancel={onClose}
      submitting={create.isPending || update.isPending}
      submitLabel={isNew ? "Add achievement" : "Save changes"}
    >
      <Input
        label="Achievement"
        required
        placeholder="e.g. 1st place, Association Bible Quiz"
        value={form.name}
        error={nameError}
        onChange={(e) => set({ name: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Month" value={form.month} onValueChange={(v) => set({ month: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select label="Year" value={form.year} onValueChange={(v) => set({ year: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Proof (certificate, photo or letter)</p>
        <FileUploadButton purpose="achievement-proof" value={form.proofUrl} onChange={(url) => set({ proofUrl: url })} />
        {showErrors && !form.proofUrl ? <p className="mt-1 text-xs text-danger">Upload the proof.</p> : null}
      </div>
      <Textarea label="Description (optional)" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} />
    </FormDrawer>
  );
}

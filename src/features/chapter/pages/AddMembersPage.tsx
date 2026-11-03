import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuDownload, LuFileSpreadsheet, LuPlus, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { cn } from "@/lib/utils";
import { useAddMembers, useRanks } from "../api/members";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { PhotoUploadField } from "../components/PhotoUploadField";
import {
  type DraftMember,
  downloadMemberTemplate,
  draftErrors,
  draftToPayload,
  isBlankDraft,
  MAX_MEMBERS_PER_SUBMIT,
  newDraft,
  readMemberWorkbook,
} from "../lib/member-excel";
import { ageWarning } from "../lib/member-utils";
import { useChapterSession } from "../store/useChapterSession";

/**
 * Add members to a chapter — one or many at once.
 *
 * Three ways in, one form: type rows by hand, add more rows, or import an
 * Excel file (which fills the rows so they can be checked and fixed).
 * Everything submitted is saved as "awaiting approval".
 */
export default function AddMembersPage() {
  const navigate = useNavigate();
  const profile = useChapterSession((s) => s.profile);
  const selectedChapterId = useChapterSession((s) => s.selectedChapterId);
  // Members must go into one specific chapter; "all" falls back to the first.
  const chapterId =
    selectedChapterId !== "all" ? selectedChapterId : (profile?.chapterId ?? profile?.chapters[0]?.id ?? "");
  const chapterName = profile?.chapters.find((c) => c.id === chapterId)?.name ?? "";

  const { data: ranks = [] } = useRanks();
  const addMembers = useAddMembers();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<DraftMember[]>(() => [newDraft()]);
  const [showErrors, setShowErrors] = useState(false);
  const [importing, setImporting] = useState(false);

  /** Editing a row clears the import warnings on it — the user has looked at it. */
  const updateRow = (key: string, patch: Partial<DraftMember>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch, importIssues: [] } : r)));
  const removeRow = (key: string) =>
    setRows((list) => (list.length === 1 ? [newDraft()] : list.filter((r) => r.key !== key)));

  const handleImport = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    try {
      const imported = await readMemberWorkbook(file, ranks);
      // Keep rows the user already typed; drop the empty starter row.
      setRows((list) => [...list.filter((r) => !isBlankDraft(r)), ...imported]);
      const flagged = imported.filter((r) => r.importIssues.length > 0).length;
      successToast(
        `${imported.length} member${imported.length === 1 ? "" : "s"} loaded from the file.` +
          (flagged ? ` ${flagged} need a quick fix (highlighted).` : ""),
        "Import",
      );
    } catch (err) {
      errorToast((err as Error).message || "Unable to read the file.", "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const filledRows = rows.filter((r) => !isBlankDraft(r));
  const invalidCount = filledRows.filter((r) => draftErrors(r).length > 0).length;

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!chapterId) return errorToast("Select a chapter first.", "Chapter");
    if (filledRows.length === 0) return errorToast("Add at least one member.", "Nothing to submit");
    if (invalidCount > 0) return errorToast(`Fix the ${invalidCount} highlighted row(s) first.`, "Check the form");
    if (filledRows.length > MAX_MEMBERS_PER_SUBMIT) {
      return errorToast(`Submit at most ${MAX_MEMBERS_PER_SUBMIT} members at a time.`, "Too many rows");
    }
    try {
      await addMembers.mutateAsync({ chapterId, members: filledRows.map(draftToPayload) });
      successToast(
        `${filledRows.length} member${filledRows.length === 1 ? "" : "s"} sent to the association for approval.`,
        "Submitted",
      );
      navigate("/chapter/members?view=awaiting");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to submit.", "Submit failed");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Add Members</h1>
          <p className="mt-1 text-sm text-text-muted">
            New members wait for the association's approval before they count as members.
            A photo is optional.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {profile?.role === "counsellor" && <ChapterSwitcher allowAll={false} />}
          <Button variant="outline" onClick={() => downloadMemberTemplate(ranks)} disabled={ranks.length === 0}>
            <LuDownload size={16} /> Excel template
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0])}
          />
          <Button variant="outline" loading={importing} onClick={() => fileRef.current?.click()} disabled={ranks.length === 0}>
            {!importing && <LuFileSpreadsheet size={16} />} Import Excel
          </Button>
        </div>
      </header>

      {chapterName && (
        <p className="text-sm text-text-muted">
          Adding to <span className="font-semibold text-primary">{chapterName}</span>
        </p>
      )}

      <section className="space-y-3">
        {rows.map((row, index) => {
          const errors = showErrors && !isBlankDraft(row) ? draftErrors(row) : [];
          const warning = ageWarning(row.dateOfBirth, ranks.find((r) => r.id === row.rankId));
          const flagged = errors.length > 0 || row.importIssues.length > 0;
          return (
            <div
              key={row.key}
              className={cn(
                "rounded-2xl border bg-surface p-4",
                flagged ? "border-rose-300" : "border-text-dark/5",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-primary">Member {index + 1}</p>
                <Button size="icon" variant="ghost" aria-label={`Remove member ${index + 1}`} onClick={() => removeRow(row.key)}>
                  <LuTrash2 size={16} />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Input
                  label="Full name *"
                  value={row.fullName}
                  onChange={(e) => updateRow(row.key, { fullName: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-dark">Rank *</label>
                  <Select value={row.rankId} onValueChange={(v) => updateRow(row.key, { rankId: v })}>
                    <SelectTrigger aria-label={`Rank for member ${index + 1}`}>
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                      {ranks.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    label="Date of birth"
                    type="date"
                    value={row.dateOfBirth}
                    onChange={(e) => updateRow(row.key, { dateOfBirth: e.target.value })}
                  />
                  {warning && <p className="mt-1 text-xs text-amber-700">{warning}</p>}
                </div>
                <Input label="Phone" value={row.phone} onChange={(e) => updateRow(row.key, { phone: e.target.value })} />
                <Input
                  label="Parent / guardian name"
                  value={row.guardianName}
                  onChange={(e) => updateRow(row.key, { guardianName: e.target.value })}
                />
                <Input
                  label="Parent / guardian phone"
                  value={row.guardianPhone}
                  onChange={(e) => updateRow(row.key, { guardianPhone: e.target.value })}
                />
              </div>

              <div className="mt-3">
                <PhotoUploadField
                  value={row.photo}
                  name={row.fullName}
                  onChange={(url) => updateRow(row.key, { photo: url })}
                />
              </div>

              {[...row.importIssues, ...errors].length > 0 && (
                <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-rose-600">
                  {[...row.importIssues, ...errors].map((msg) => <li key={msg}>{msg}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-text-dark/5 bg-surface/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={() => setRows((list) => [...list, newDraft()])}>
          <LuPlus size={16} /> Add another member
        </Button>
        <Button onClick={handleSubmit} loading={addMembers.isPending} className="bg-primary text-white">
          Submit {filledRows.length || ""} for approval
        </Button>
      </div>
    </div>
  );
}

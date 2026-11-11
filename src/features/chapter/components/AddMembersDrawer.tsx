import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";
import {
  LuChevronDown,
  LuCircleAlert,
  LuCircleCheck,
  LuDownload,
  LuFileSpreadsheet,
  LuKeyboard,
  LuPlus,
  LuTrash2,
  LuUpload,
} from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDrawerContent } from "@/components/shared/FormDrawer";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useRanks } from "../api/members";
import {
  type DraftMember,
  downloadMemberTemplate,
  draftErrors,
  draftToPayload,
  isBlankDraft,
} from "../lib/member-excel";
import { ageFrom, ageWarning } from "../lib/member-utils";
import { type MemberDrafts, useMemberDrafts } from "../lib/useMemberDrafts";
import type { MemberPayload, PortalRank } from "../types";
import { MemberAvatar } from "./MemberAvatar";
import { type PhotoUploader, PhotoUploadField } from "./PhotoUploadField";

type Mode = "type" | "import";

const MODES: { id: Mode; label: string }[] = [
  { id: "type", label: "Add Manually" },
  { id: "import", label: "Import from Excel" },
];

const hasOptionalDetails = (row: DraftMember) =>
  Boolean(row.phone || row.guardianName || row.guardianPhone || row.photo);

/**
 * Drawer for adding one or many members to a chapter. Used by the chapter
 * portal and the admin side; each passes its own chapter picker and save call.
 *
 * - Each member is a card; only the one being edited is open, the rest
 *   show a one-line summary with a "Ready" / "Needs…" status.
 * - Enter in a field moves on to the next member (adding one if needed).
 * - New members start with the rank used last.
 * - An Excel import fills the same cards so they can be checked first.
 * - Closing with unsaved members asks before discarding them.
 */
export function AddMembersDrawer({
  open,
  onClose,
  chapter,
  chapterField,
  description,
  submitLabel = "for approval",
  save,
  saving,
  photoUploader,
}: {
  open: boolean;
  onClose: () => void;
  /** Where the members go; null until one is chosen. */
  chapter: { id: string; name: string } | null;
  /** Chapter picker (or the fixed chapter's name) shown at the top. */
  chapterField: ReactNode;
  description: ReactNode;
  /** Ends the submit button: "Submit 3 {submitLabel}". */
  submitLabel?: string;
  /** Saves the members; rejects with an error message on failure. */
  save: (chapterId: string, members: MemberPayload[]) => Promise<unknown>;
  saving: boolean;
  photoUploader?: PhotoUploader;
}) {
  const { data: ranks = [] } = useRanks();
  const drafts = useMemberDrafts(ranks);
  const [mode, setMode] = useState<Mode>("type");
  const [openKey, setOpenKey] = useState<string | null>(() => drafts.rows[0]?.key ?? null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set()); // rows that show their errors
  const [needChapter, setNeedChapter] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const { filledRows, invalidRows } = drafts;
  const readyCount = filledRows.length - invalidRows.length;

  const resetAndClose = () => {
    setOpenKey(drafts.reset());
    setFocusKey(null);
    setMode("type");
    setChecked(new Set());
    setNeedChapter(false);
    setConfirmDiscard(false);
    onClose();
  };

  const requestClose = () => {
    if (saving) return;
    if (filledRows.length > 0) setConfirmDiscard(true);
    else resetAndClose();
  };

  const check = (keys: string[]) => setChecked((prev) => new Set([...prev, ...keys]));

  const addMember = () => {
    const key = drafts.addRow();
    setOpenKey(key);
    setFocusKey(key);
    setMode("type");
  };

  /** Enter in a field: check this member, then open the next one. */
  const goToNext = (row: DraftMember) => {
    check([row.key]);
    if (draftErrors(row).length > 0) return;
    const index = drafts.rows.findIndex((r) => r.key === row.key);
    const next = drafts.rows[index + 1];
    if (next) {
      setOpenKey(next.key);
      setFocusKey(next.key);
    } else {
      addMember();
    }
  };

  const handleImport = async (file: File) => {
    const imported = await drafts.importFile(file);
    if (!imported) return;
    setMode("type");
    const flagged = imported.find((r) => r.importIssues.length > 0);
    setOpenKey(flagged?.key ?? null);
  };

  const handleSubmit = async () => {
    check(filledRows.map((r) => r.key));
    if (!chapter) {
      setNeedChapter(true);
      return errorToast("Choose the chapter these members belong to.", "Chapter");
    }
    const problem = drafts.problem();
    if (problem) {
      if (invalidRows[0]) {
        setMode("type");
        setOpenKey(invalidRows[0].key);
      }
      return errorToast(problem, "Check the form");
    }
    try {
      await save(chapter.id, filledRows.map(draftToPayload));
      successToast(
        `${filledRows.length} member${filledRows.length === 1 ? "" : "s"} added to ${chapter.name} and sent for approval.`,
        "Submitted",
      );
      resetAndClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to add members.", "Submit failed");
    }
  };

  const count = filledRows.length;

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !next && requestClose()}>
        <SheetContent size="xl">
          <FormDrawerContent
            title="Add members"
            description={description}
            onSubmit={handleSubmit}
            onCancel={requestClose}
            submitting={saving}
            submitLabel={count > 0 ? `Submit ${count} ${submitLabel}` : `Submit ${submitLabel}`}
            footerStart={<FooterSummary ready={readyCount} needsWork={invalidRows.length} />}
          >
            <div className="space-y-2">
              {chapterField}
              {needChapter && !chapter ? (
                <p className="text-xs text-danger">Choose the chapter these members belong to.</p>
              ) : null}
            </div>

            <ViewTabs aria-label="How to add members" tabs={MODES} value={mode} onChange={setMode} />

            {mode === "import" ? (
              <ImportPanel ranks={ranks} importing={drafts.importing} onFile={handleImport} />
            ) : (
              <div className="space-y-3">
                <ol className="space-y-2.5" aria-label="Members to add">
                  {drafts.rows.map((row, index) => (
                    <DraftCard
                      key={row.key}
                      row={row}
                      index={index}
                      ranks={ranks}
                      drafts={drafts}
                      isOpen={openKey === row.key}
                      autoFocus={focusKey === row.key}
                      showErrors={checked.has(row.key)}
                      photoUploader={photoUploader}
                      onToggle={() => {
                        if (openKey === row.key) check([row.key]);
                        setOpenKey(openKey === row.key ? null : row.key);
                        setFocusKey(null);
                      }}
                      onNext={() => goToNext(row)}
                    />
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={addMember}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm font-medium text-muted transition-colors hover:border-primary/40 hover:bg-primary/[0.03] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <LuPlus size={16} aria-hidden /> Add another member
                </button>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <LuKeyboard size={14} aria-hidden />
                  Press Enter in any field to move on to the next member.
                </p>
              </div>
            )}
          </FormDrawerContent>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        isOpen={confirmDiscard}
        title="Discard these members?"
        message={`${count} member${count === 1 ? " hasn't" : "s haven't"} been submitted yet. Closing will lose what you've entered.`}
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onClose={() => setConfirmDiscard(false)}
        onConfirm={resetAndClose}
      />
    </>
  );
}

function FooterSummary({ ready, needsWork }: { ready: number; needsWork: number }) {
  if (ready === 0 && needsWork === 0) return <p className="text-sm text-muted">No members added yet</p>;
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" aria-live="polite">
      <span className="inline-flex items-center gap-1.5 text-success">
        <LuCircleCheck size={15} aria-hidden /> {ready} ready
      </span>
      {needsWork > 0 ? (
        <span className="inline-flex items-center gap-1.5 text-warning">
          <LuCircleAlert size={15} aria-hidden /> {needsWork} need{needsWork === 1 ? "s" : ""} attention
        </span>
      ) : null}
    </p>
  );
}

/** Short status for a member card's summary line. */
function rowStatus(row: DraftMember): { label: string; tone: "ready" | "warn" | "empty" } {
  if (isBlankDraft(row)) return { label: "Not started", tone: "empty" };
  const errors = draftErrors(row);
  if (errors.length > 0) {
    const missing = [row.fullName.trim().length < 3 && "name", !row.rankId && "rank"].filter(Boolean);
    return { label: missing.length ? `Needs ${missing.join(" & ")}` : "Check date", tone: "warn" };
  }
  if (row.importIssues.length > 0) return { label: "Check import", tone: "warn" };
  return { label: "Ready", tone: "ready" };
}

const STATUS_CX = {
  ready: "bg-success/10 text-success",
  warn: "bg-warning/15 text-warning",
  empty: "bg-foreground/[0.06] text-muted",
};

function DraftCard({
  row,
  index,
  ranks,
  drafts,
  isOpen,
  autoFocus,
  showErrors,
  photoUploader,
  onToggle,
  onNext,
}: {
  row: DraftMember;
  index: number;
  ranks: PortalRank[];
  drafts: MemberDrafts;
  isOpen: boolean;
  autoFocus: boolean;
  showErrors: boolean;
  photoUploader?: PhotoUploader;
  onToggle: () => void;
  onNext: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(() => hasOptionalDetails(row));
  const rank = ranks.find((r) => r.id === row.rankId);
  const age = ageFrom(row.dateOfBirth);
  const warning = ageWarning(row.dateOfBirth, rank);
  const status = rowStatus(row);
  const set = (patch: Partial<DraftMember>) => drafts.updateRow(row.key, patch);
  const bodyId = `${row.key}-fields`;
  const summary = [rank?.name, age !== null ? `${age} yrs` : null].filter(Boolean).join(" · ");
  const flagged = status.tone === "warn" && (showErrors || row.importIssues.length > 0);

  const nameError = showErrors && row.fullName.trim().length < 3 ? "Enter the full name (at least 3 letters)" : undefined;
  const rankError = showErrors && !row.rankId ? "Choose a rank" : undefined;
  const dateError =
    showErrors && row.dateOfBirth && new Date(row.dateOfBirth) > new Date() ? "This date is in the future" : undefined;

  // Enter moves to the next member instead of submitting the whole drawer.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (e.key !== "Enter" || target.tagName !== "INPUT" || (target as HTMLInputElement).type === "file") return;
    e.preventDefault();
    onNext();
  };

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border bg-surface transition-shadow",
        isOpen ? "border-primary/25 shadow-surface" : "border-border",
        flagged && "border-warning/50",
      )}
    >
      <div className="flex items-center gap-2 pr-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:outline-primary"
        >
          {row.photo ? (
            <MemberAvatar photo={row.photo} name={row.fullName} size={32} />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/[0.07] text-xs font-semibold tabular-nums text-primary">
              {index + 1}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate text-sm font-medium", row.fullName.trim() ? "text-foreground" : "text-muted")}>
              {row.fullName.trim() || `Member ${index + 1}`}
            </span>
            {summary ? <span className="block truncate text-xs text-muted">{summary}</span> : null}
          </span>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_CX[status.tone])}>
            {status.label}
          </span>
          <LuChevronDown
            size={16}
            aria-hidden
            className={cn("shrink-0 text-muted transition-transform", isOpen && "rotate-180")}
          />
        </button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Remove ${row.fullName.trim() || `member ${index + 1}`}`}
          onClick={() => drafts.removeRow(row.key)}
        >
          <LuTrash2 size={15} />
        </Button>
      </div>

      {isOpen ? (
        <div id={bodyId} className="space-y-4 border-t border-separator px-3.5 pb-4 pt-4" onKeyDown={handleKeyDown}>
          {row.importIssues.length > 0 ? (
            <ul className="space-y-0.5 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
              {row.importIssues.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}

          <Input
            label="Full name"
            required
            value={row.fullName}
            placeholder="e.g. Tunde Adeyemi"
            autoComplete="off"
            autoFocus={autoFocus}
            error={nameError}
            onChange={(e) => set({ fullName: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Rank" required value={row.rankId} onValueChange={(v) => set({ rankId: v })} error={rankError}>
              <SelectTrigger aria-label={`Rank for ${row.fullName.trim() || `member ${index + 1}`}`}>
                <SelectValue placeholder="Choose a rank" />
              </SelectTrigger>
              <SelectContent>
                {ranks.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Input
                label="Date of birth"
                type="date"
                value={row.dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                error={dateError}
                onChange={(e) => set({ dateOfBirth: e.target.value })}
              />
              {!dateError && (warning || age !== null) ? (
                <p className={cn("mt-1 text-xs", warning ? "text-warning" : "text-muted")}>{warning ?? `Age ${age}`}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg bg-surface-secondary/60">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span>
                Contact details & photo <span className="font-normal text-muted">· optional</span>
              </span>
              <LuChevronDown size={15} aria-hidden className={cn("text-muted transition-transform", moreOpen && "rotate-180")} />
            </button>
            {moreOpen ? (
              <div className="space-y-4 px-3 pb-3.5 pt-1">
                <Input label="Phone" type="tel" value={row.phone} onChange={(e) => set({ phone: e.target.value })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Parent / guardian name"
                    value={row.guardianName}
                    onChange={(e) => set({ guardianName: e.target.value })}
                  />
                  <Input
                    label="Parent / guardian phone"
                    type="tel"
                    value={row.guardianPhone}
                    onChange={(e) => set({ guardianPhone: e.target.value })}
                  />
                </div>
                <PhotoUploadField
                  value={row.photo}
                  name={row.fullName}
                  onChange={(url) => set({ photo: url })}
                  uploader={photoUploader}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

/** Two steps: get the template, then drop the filled file. */
function ImportPanel({
  ranks,
  importing,
  onFile,
}: {
  ranks: PortalRank[];
  importing: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const noRanks = ranks.length === 0;

  const pick = (file?: File) => {
    if (file) onFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
        <StepNumber n={1} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Download the template</p>
          <p className="text-xs text-muted">It has the columns to fill and a sheet with the exact rank names.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => downloadMemberTemplate(ranks)} disabled={noRanks}>
          <LuDownload size={15} aria-hidden /> Template
        </Button>
      </div>

      <div className="rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <StepNumber n={2} />
          <p className="text-sm font-medium text-foreground">Upload the filled file</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="sr-only"
          id="member-import-file"
          disabled={importing || noRanks}
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <label
          htmlFor="member-import-file"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!importing) pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-9 text-center transition-colors",
            dragging ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/40 hover:bg-primary/[0.02]",
            (importing || noRanks) && "pointer-events-none opacity-60",
          )}
        >
          {importing ? (
            <Spinner label="Reading the file…" />
          ) : (
            <>
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
                {dragging ? <LuUpload size={20} aria-hidden /> : <LuFileSpreadsheet size={20} aria-hidden />}
              </span>
              <span className="text-sm font-medium text-foreground">
                {dragging ? "Drop to import" : "Drag the file here, or click to choose"}
              </span>
              <span className="text-xs text-muted">.xlsx, .xls or .csv</span>
            </>
          )}
        </label>
        <p className="mt-3 text-xs text-muted">
          Every row appears as a member card so you can check and fix it before submitting.
        </p>
      </div>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
      {n}
    </span>
  );
}

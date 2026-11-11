import { useState } from "react";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import type { PortalRank } from "../types";
import {
  type DraftMember,
  draftErrors,
  isBlankDraft,
  MAX_MEMBERS_PER_SUBMIT,
  newDraft,
  readMemberWorkbook,
} from "./member-excel";

/**
 * Draft rows for the "add members" drawer, typed by hand or loaded from an
 * Excel file. Shared by the chapter portal and the admin side.
 */
export function useMemberDrafts(ranks: PortalRank[]) {
  const [rows, setRows] = useState<DraftMember[]>(() => [newDraft()]);
  const [importing, setImporting] = useState(false);

  /** Editing a row clears its import warnings: the user has looked at it. */
  const updateRow = (key: string, patch: Partial<DraftMember>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch, importIssues: [] } : r)));

  const removeRow = (key: string) =>
    setRows((list) => (list.length === 1 ? [newDraft()] : list.filter((r) => r.key !== key)));

  /**
   * Adds an empty row and returns its key. It starts with the rank used
   * last, since members are often added in groups of the same rank.
   */
  const addRow = () => {
    const lastRank = [...rows].reverse().find((r) => r.rankId)?.rankId ?? "";
    const draft = newDraft({ rankId: lastRank });
    setRows((list) => [...list, draft]);
    return draft.key;
  };

  /** Loads rows from a file. Returns the new rows, or null if the file couldn't be read. */
  const importFile = async (file: File) => {
    setImporting(true);
    try {
      const imported = await readMemberWorkbook(file, ranks);
      // Keep rows the user already typed; drop empty ones.
      setRows((list) => [...list.filter((r) => !isBlankDraft(r)), ...imported]);
      const flagged = imported.filter((r) => r.importIssues.length > 0).length;
      successToast(
        `${imported.length} member${imported.length === 1 ? "" : "s"} loaded from the file.` +
          (flagged ? ` ${flagged} need a quick fix.` : ""),
        "Import",
      );
      return imported;
    } catch (err) {
      errorToast((err as Error).message || "Unable to read the file.", "Import failed");
      return null;
    } finally {
      setImporting(false);
    }
  };

  /** Back to one empty row; returns its key. */
  const reset = () => {
    const draft = newDraft();
    setRows([draft]);
    return draft.key;
  };

  const filledRows = rows.filter((r) => !isBlankDraft(r));
  const invalidRows = filledRows.filter((r) => draftErrors(r).length > 0);

  /** Returns a message if the rows can't be submitted yet, or null. */
  const problem = (): string | null => {
    if (filledRows.length === 0) return "Add at least one member.";
    if (invalidRows.length > 0) {
      return `${invalidRows.length} member${invalidRows.length === 1 ? " needs" : "s need"} a name or rank.`;
    }
    if (filledRows.length > MAX_MEMBERS_PER_SUBMIT) {
      return `Submit at most ${MAX_MEMBERS_PER_SUBMIT} members at a time.`;
    }
    return null;
  };

  return { rows, importing, filledRows, invalidRows, updateRow, removeRow, addRow, importFile, reset, problem };
}

export type MemberDrafts = ReturnType<typeof useMemberDrafts>;

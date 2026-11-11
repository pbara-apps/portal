import * as XLSX from "xlsx";
import type { MemberPayload, PortalRank } from "../types";

/**
 * Excel template and import for adding members in bulk.
 *
 * The template has a "Members" sheet with the expected columns and an
 * example row, plus a "Ranks" sheet listing the exact rank names to use.
 * On import each row becomes an editable draft row in the Add Members form,
 * so the officer can fix any problems before submitting.
 */

/** A row in the Add Members form (also what an imported line becomes). */
export interface DraftMember {
  key: string;
  fullName: string;
  rankId: string;
  dateOfBirth: string; // YYYY-MM-DD or ""
  phone: string;
  guardianName: string;
  guardianPhone: string;
  photo: string | null;
  /** Problems found while importing that the user should fix (e.g. unknown rank). */
  importIssues: string[];
}

/** Template columns, in order. Headers marked * are required. */
export const TEMPLATE_COLUMNS = [
  "Full Name*",
  "Rank*",
  "Date of Birth (YYYY-MM-DD)",
  "Phone",
  "Parent/Guardian Name",
  "Parent/Guardian Phone",
] as const;

/** Maximum members per submission (matches the API limit). */
export const MAX_MEMBERS_PER_SUBMIT = 200;

let keyCounter = 0;
export const newDraft = (partial: Partial<DraftMember> = {}): DraftMember => ({
  key: `draft-${Date.now()}-${keyCounter++}`,
  fullName: "",
  rankId: "",
  dateOfBirth: "",
  phone: "",
  guardianName: "",
  guardianPhone: "",
  photo: null,
  importIssues: [],
  ...partial,
});

export function isBlankDraft(d: DraftMember) {
  return !d.fullName.trim() && !d.rankId && !d.dateOfBirth && !d.phone && !d.guardianName && !d.guardianPhone && !d.photo;
}

/** Problems that stop a row from being submitted. */
export function draftErrors(d: DraftMember): string[] {
  const errors: string[] = [];
  if (d.fullName.trim().length < 3) errors.push("Full name is required");
  if (!d.rankId) errors.push("Rank is required");
  if (d.dateOfBirth && new Date(d.dateOfBirth) > new Date()) errors.push("Date of birth is in the future");
  return errors;
}

export function draftToPayload(d: DraftMember): MemberPayload {
  return {
    fullName: d.fullName.trim(),
    rankId: d.rankId,
    dateOfBirth: d.dateOfBirth || null,
    photo: d.photo,
    phone: d.phone.trim() || null,
    guardianName: d.guardianName.trim() || null,
    guardianPhone: d.guardianPhone.trim() || null,
  };
}

/** Builds and downloads the template workbook. */
export function downloadMemberTemplate(ranks: PortalRank[]) {
  const members = XLSX.utils.aoa_to_sheet([
    [...TEMPLATE_COLUMNS],
    ["Tunde Adewale", ranks[0]?.name ?? "Candidate", "2014-03-12", "08012345678", "Mr. Adewale", "08098765432"],
  ]);
  members["!cols"] = TEMPLATE_COLUMNS.map(() => ({ wch: 26 }));

  const rankSheet = XLSX.utils.aoa_to_sheet([
    ["Rank names to use in the Rank column (first rank at the top)"],
    ...ranks.map((r) => [r.name]),
  ]);
  rankSheet["!cols"] = [{ wch: 60 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, members, "Members");
  XLSX.utils.book_append_sheet(book, rankSheet, "Ranks");
  XLSX.writeFile(book, "chapter-members-template.xlsx");
}

/** "Date of Birth (YYYY-MM-DD)" → "dateofbirthyyyymmdd", so headers match loosely. */
const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

/** Which draft field each template header fills. Matched on the start of the header. */
const HEADER_FIELDS: [prefix: string, field: keyof DraftMember][] = [
  ["fullname", "fullName"],
  ["name", "fullName"],
  ["rank", "rankId"],
  ["dateofbirth", "dateOfBirth"],
  ["dob", "dateOfBirth"],
  ["parentguardianname", "guardianName"],
  ["guardianname", "guardianName"],
  ["parentguardianphone", "guardianPhone"],
  ["guardianphone", "guardianPhone"],
  ["phone", "phone"],
];

function fieldForHeader(header: string): keyof DraftMember | null {
  const key = normalizeHeader(header);
  return HEADER_FIELDS.find(([prefix]) => key.startsWith(prefix))?.[1] ?? null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Reads a date cell. Accepts an Excel date number, "YYYY-MM-DD" or "DD/MM/YYYY".
 * Returns "YYYY-MM-DD", "" when empty, or null when it can't be read.
 */
function readDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}` : null;
  }
  const text = String(value).trim();
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return `${match[1]}-${pad(+match[2])}-${pad(+match[3])}`;
  match = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (match) return `${match[3]}-${pad(+match[2])}-${pad(+match[1])}`;
  return null;
}

/**
 * Reads an uploaded workbook (first sheet) into draft rows.
 * Empty lines and the template's example row are skipped. Rank names are
 * matched to official ranks ignoring case; anything unclear is flagged on
 * the row as an import issue instead of failing the whole file.
 */
export async function readMemberWorkbook(file: File, ranks: PortalRank[]): Promise<DraftMember[]> {
  const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) throw new Error("The file has no sheets.");

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
  const rankByName = new Map(ranks.map((r) => [r.name.trim().toLowerCase(), r.id]));

  const drafts: DraftMember[] = [];
  for (const row of rows) {
    const draft = newDraft();
    let rankText = "";
    let dateCell: unknown = "";
    // Some sheets name the column "Participant"; used only when Full Name is empty.
    let participantName = "";

    for (const [header, value] of Object.entries(row)) {
      if (normalizeHeader(header).startsWith("participant")) {
        participantName = String(value).trim();
        continue;
      }
      const field = fieldForHeader(header);
      if (field === "rankId") rankText = String(value).trim();
      else if (field === "dateOfBirth") dateCell = value;
      else if (field) (draft[field] as string) = String(value).trim();
    }
    if (!draft.fullName) draft.fullName = participantName;

    if (rankText) {
      draft.rankId = rankByName.get(rankText.toLowerCase()) ?? "";
      if (!draft.rankId) draft.importIssues.push(`Rank "${rankText}" not recognised — pick one`);
    }
    const date = readDate(dateCell);
    if (date === null) draft.importIssues.push(`Date of birth "${String(dateCell)}" not recognised`);
    else draft.dateOfBirth = date;

    const isExample = draft.fullName === "Tunde Adewale" && draft.phone === "08012345678";
    if (!isBlankDraft(draft) && !isExample) drafts.push(draft);
  }

  if (drafts.length === 0) {
    throw new Error("No members found. Use the template and fill in one member per row.");
  }
  return drafts;
}

import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { AdminProgram, ProgramParticipantRow } from "@/types/admin";

function churchLabel(row: ProgramParticipantRow) {
  if (row.churchChapter && row.churchChapter !== row.churchName) {
    return `${row.churchName} (${row.churchChapter})`;
  }
  return row.churchName;
}

function exportRows(rows: ProgramParticipantRow[]) {
  return rows.map((row, index) => ({
    "#": index + 1,
    Participant: row.participantName,
    Rank: row.rankName,
    Church: churchLabel(row),
    Registrant: row.registrantName,
    Phone: row.registrantPhone,
    Status: row.status,
    Type: row.registrationType,
    Submitted: row.submittedAt
      ? dayjs(row.submittedAt).format("YYYY-MM-DD HH:mm")
      : "—",
  }));
}

function fileSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function exportParticipantsExcel(
  program: AdminProgram,
  rows: ProgramParticipantRow[],
) {
  const data = exportRows(rows);
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Participants");
  const filename = `${fileSlug(program.title) || "participants"}-list.xlsx`;
  XLSX.writeFile(book, filename);
}

export function exportParticipantsPdf(
  program: AdminProgram,
  rows: ProgramParticipantRow[],
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const margin = 36;

  doc.setFontSize(16);
  doc.text(program.title, margin, 40);
  doc.setFontSize(10);
  doc.setTextColor(90);
  const meta = [
    `Category: ${program.category}`,
    program.registrationDeadline
      ? `Deadline: ${dayjs(program.registrationDeadline).format("MMM D, YYYY")}`
      : null,
    `Exported: ${dayjs().format("MMM D, YYYY h:mm A")}`,
    `Participants: ${rows.length}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(meta, margin, 58);
  doc.setTextColor(20);

  autoTable(doc, {
    startY: 72,
    head: [
      [
        "#",
        "Participant",
        "Rank",
        "Church",
        "Registrant",
        "Phone",
        "Status",
        "Submitted",
      ],
    ],
    body: rows.map((row, index) => [
      index + 1,
      row.participantName,
      row.rankName,
      churchLabel(row),
      row.registrantName,
      row.registrantPhone,
      row.status,
      row.submittedAt ? dayjs(row.submittedAt).format("MMM D, YYYY") : "—",
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [27, 36, 82], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  doc.save(`${fileSlug(program.title) || "participants"}-list.pdf`);
}

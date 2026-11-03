import { jsPDF } from "jspdf";
import { MEMBER_PLACEHOLDER_PHOTO } from "@/features/chapter/lib/member-utils";
import type { PortalMember } from "@/features/chapter/types";

/** Loads an image as a data URL for the PDF; returns null if it can't be loaded. */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const imageFormat = (dataUrl: string) => (dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG");

/**
 * Downloads a bank-card-sized (85.6 × 54 mm) membership card:
 * logo + association name, the member's photo (or the logo), name,
 * member ID, rank and chapter.
 */
export async function downloadMembershipCard(member: PortalMember) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54] });
  const primary: [number, number, number] = [30, 58, 138];
  const gold: [number, number, number] = [212, 160, 23];

  // Header band
  doc.setFillColor(...primary);
  doc.rect(0, 0, 85.6, 13, "F");
  doc.setFillColor(...gold);
  doc.rect(0, 13, 85.6, 1, "F");

  const logo = await toDataUrl(MEMBER_PLACEHOLDER_PHOTO);
  if (logo) doc.addImage(logo, imageFormat(logo), 3, 2, 9, 9);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ROYAL AMBASSADORS", 14, 6.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("Pentecost Baptist Association — Membership Card", 14, 10);

  // Photo (falls back to the logo)
  const photo = (member.photo && (await toDataUrl(member.photo))) || logo;
  if (photo) doc.addImage(photo, imageFormat(photo), 4, 17, 22, 26);
  doc.setDrawColor(...gold);
  doc.rect(4, 17, 22, 26);

  // Details
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(member.fullName, 54), 30, 21);
  const rows: [string, string][] = [
    ["Member ID", member.memberId ?? "Pending approval"],
    ["Rank", member.rank?.name ?? "—"],
    ["Chapter", member.chapter?.name ?? "—"],
    ["Church", member.church?.name ?? "—"],
  ];
  let y = 29;
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), 30, y);
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(doc.splitTextToSize(value, 52)[0], 30, y + 3);
    y += 6.5;
  }

  doc.setFillColor(...primary);
  doc.rect(0, 51, 85.6, 3, "F");

  doc.save(`${member.memberId ?? member.fullName.replace(/\s+/g, "-")}-card.pdf`);
}

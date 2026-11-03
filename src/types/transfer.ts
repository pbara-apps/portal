/** A request to move a member to another chapter (both portals). */
export interface Transfer {
  id: string;
  member: { id: string; fullName: string; memberId: string | null; photo: string | null } | null;
  fromChapter: { id: string; name: string; churchName: string } | null;
  toChapter: { id: string; name: string; churchName: string } | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  requestedBy: { name: string; role: string } | null;
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const chapterRef = (c: any) =>
  c && typeof c === "object" ? { id: c._id, name: c.name ?? "", churchName: c.church?.name ?? "" } : null;

export function mapTransfer(raw: any): Transfer {
  return {
    id: raw._id,
    member: raw.member
      ? { id: raw.member._id, fullName: raw.member.fullName, memberId: raw.member.memberId ?? null, photo: raw.member.photo ?? null }
      : null,
    fromChapter: chapterRef(raw.fromChapter),
    toChapter: chapterRef(raw.toChapter),
    reason: raw.reason ?? null,
    status: raw.status,
    reviewNote: raw.reviewNote ?? null,
    requestedBy: raw.requestedBy ? { name: raw.requestedBy.name ?? "", role: raw.requestedBy.role ?? "" } : null,
    createdAt: raw.createdAt,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

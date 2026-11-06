import type { PortalMember } from "../types";

/** Raw shapes from the API (Mongo `_id`, populated references). */
type RawRef =
  | { _id?: string; id?: string; name?: string; order?: number | null; maxAge?: number | null; role?: string }
  | string
  | null
  | undefined;

export type RawMember = {
  _id?: string;
  id?: string;
  memberType?: string;
  memberId?: string | null;
  fullName: string;
  dateOfBirth?: string | null;
  photo?: string | null;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  rank?: RawRef;
  chapter?: RawRef;
  church?: RawRef;
  status: PortalMember["status"];
  changesRequested?: boolean;
  statusReason?: string | null;
  reviewNote?: string | null;
  submittedBy?: RawRef;
  rankHistory?: { rank?: RawRef; dateReached?: string | null; proofUrl?: string | null }[];
  createdAt: string;
  approvedAt?: string | null;
};

const idOf = (raw: { _id?: string; id?: string }) => raw._id ?? raw.id ?? "";

/** A populated reference → { id, name }, or null when missing / not populated. */
function ref(raw: RawRef) {
  if (!raw || typeof raw === "string") return null;
  return { id: idOf(raw), name: raw.name ?? "" };
}

export function mapMember(raw: RawMember): PortalMember {
  const rank = raw.rank && typeof raw.rank !== "string" ? raw.rank : null;
  const submittedBy = raw.submittedBy && typeof raw.submittedBy !== "string" ? raw.submittedBy : null;
  return {
    id: idOf(raw),
    memberType: raw.memberType === "counsellor" ? "counsellor" : "ambassador",
    memberId: raw.memberId ?? null,
    fullName: raw.fullName,
    dateOfBirth: raw.dateOfBirth ?? null,
    photo: raw.photo ?? null,
    phone: raw.phone ?? null,
    guardianName: raw.guardianName ?? null,
    guardianPhone: raw.guardianPhone ?? null,
    rank: rank
      ? { id: idOf(rank), name: rank.name ?? "", order: rank.order ?? null, maxAge: rank.maxAge ?? null }
      : null,
    rankHistory: (raw.rankHistory ?? [])
      .filter((h) => h.rank && typeof h.rank !== "string")
      .map((h) => {
        const r = h.rank as Exclude<RawRef, string | null | undefined>;
        return {
          rank: { id: idOf(r), name: r.name ?? "", order: r.order ?? null },
          dateReached: h.dateReached ?? null,
          proofUrl: h.proofUrl ?? null,
        };
      }),
    chapter: ref(raw.chapter),
    church: ref(raw.church),
    status: raw.status,
    changesRequested: Boolean(raw.changesRequested),
    statusReason: raw.statusReason ?? null,
    reviewNote: raw.reviewNote ?? null,
    submittedBy: submittedBy
      ? { id: idOf(submittedBy), name: submittedBy.name ?? "", role: submittedBy.role ?? "" }
      : null,
    createdAt: raw.createdAt,
    approvedAt: raw.approvedAt ?? null,
  };
}

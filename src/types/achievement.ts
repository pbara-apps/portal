/** A chapter achievement (same shape in both portals). */
export interface Achievement {
  id: string;
  name: string;
  proofUrl: string;
  month: number;
  year: number;
  description: string | null;
  chapter: { id: string; name: string } | null;
  church: { id: string; name: string } | null;
  createdBy: { name: string; role: string } | null;
  createdAt: string;
}

type Ref = { _id?: string; name?: string; role?: string } | null | undefined;

export type RawAchievement = Omit<Achievement, "id" | "chapter" | "church" | "createdBy"> & {
  _id: string;
  chapter?: Ref;
  church?: Ref;
  createdBy?: Ref;
};

const ref = (r: Ref) => (r?._id ? { id: r._id, name: r.name ?? "" } : null);

export function mapAchievement(raw: RawAchievement): Achievement {
  return {
    id: raw._id,
    name: raw.name,
    proofUrl: raw.proofUrl,
    month: raw.month,
    year: raw.year,
    description: raw.description ?? null,
    chapter: ref(raw.chapter),
    church: ref(raw.church),
    createdBy: raw.createdBy ? { name: raw.createdBy.name ?? "", role: raw.createdBy.role ?? "" } : null,
    createdAt: raw.createdAt,
  };
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** 3, 2026 → "March 2026" */
export const monthYear = (month: number, year: number) => `${MONTHS[month - 1]} ${year}`;

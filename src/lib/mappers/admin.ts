import type {
  AdminAuditEntry,
  AdminChapter,
  AdminEvent,
  AdminExecutive,
  AdminGalleryItem,
  AdminMessage,
  AdminNews,
  AdminOffice,
  AdminPatron,
  AdminProgram,
  AdminRank,
  AdminRegistration,
  AdminRegistrationEntry,
  AdminRegistrationProgramRef,
} from "@/types/admin";
import { eventEndTimestamp } from "@/lib/event-date";
import type {
  Chapter,
  EventItem,
  Executive,
  NewsDetail,
  NewsItem,
  Patron,
} from "@/types";

type PopulatedRef = {
  _id?: string;
  name?: string;
  chapter?: string;
};

type RawExecutive = {
  _id?: string;
  id?: string;
  name: string;
  email?: string | null;
  phone?: string;
  office_id?: string;
  church_id?: string;
  rank_id?: string | null;
  office?: PopulatedRef;
  church?: PopulatedRef;
  rank?: PopulatedRef;
  status: AdminExecutive["status"];
  role?: AdminExecutive["role"];
  description?: string;
  image?: string | null;
  start_year: number;
  end_year?: number | null;
};

type RawOffice = {
  _id?: string;
  id?: string;
  name: string;
  description: string;
};

type RawRank = {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  category: string;
  image?: string | null;
};

type RawChapter = {
  _id?: string;
  id?: string;
  name: string;
  chapter: string;
  address?: string;
  counsellor?: string;
  status: AdminChapter["status"];
  image?: string | null;
};

type RawPatron = {
  _id?: string;
  id?: string;
  name: string;
  role: string;
  quote: string;
  description?: string | null;
  image?: string | null;
  status: AdminPatron["status"];
  sort_order?: number;
};

function toId(raw: { _id?: string; id?: string }) {
  return raw._id?.toString() ?? raw.id ?? "";
}

export function mapExecutive(raw: RawExecutive): AdminExecutive {
  return {
    id: toId(raw),
    name: raw.name,
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    officeId: raw.office_id?.toString() ?? raw.office?._id?.toString() ?? "",
    officeName: raw.office?.name ?? "",
    churchId: raw.church_id?.toString() ?? raw.church?._id?.toString() ?? "",
    chapterName: raw.church?.chapter ?? "",
    churchName: raw.church?.name ?? "",
    rankId: raw.rank_id?.toString() ?? raw.rank?._id?.toString() ?? null,
    rankName: raw.rank?.name ?? "",
    status: raw.status,
    role: raw.role ?? "admin",
    description: raw.description ?? "",
    image: raw.image ?? null,
    startYear: raw.start_year,
    endYear: raw.end_year ?? null,
  };
}

export function mapOffice(raw: RawOffice): AdminOffice {
  return {
    id: toId(raw),
    name: raw.name,
    description: raw.description,
  };
}

export function mapRank(raw: RawRank): AdminRank {
  return {
    id: toId(raw),
    name: raw.name,
    description: raw.description,
    category: raw.category,
    image: raw.image ?? null,
  };
}

export function mapChapter(raw: RawChapter): AdminChapter {
  return {
    id: toId(raw),
    name: raw.name,
    chapter: raw.chapter,
    address: raw.address,
    counsellor: raw.counsellor,
    status: raw.status,
    image: raw.image ?? null,
  };
}

export function mapPatron(raw: RawPatron): AdminPatron {
  return {
    id: toId(raw),
    name: raw.name,
    role: raw.role,
    quote: raw.quote,
    description: raw.description ?? null,
    image: raw.image ?? null,
    status: raw.status,
    sortOrder: raw.sort_order ?? 0,
  };
}

export function mapPublicPatron(raw: RawPatron): Patron {
  return {
    id: toId(raw),
    name: raw.name,
    role: raw.role,
    quote: raw.quote,
    description: raw.description ?? undefined,
    image: raw.image ?? undefined,
  };
}

export function mapPublicExecutive(raw: RawExecutive): Executive {
  return {
    id: toId(raw),
    name: raw.name,
    position: raw.office?.name ?? "",
    church: raw.church?.name ?? raw.church?.chapter ?? "",
    image: raw.image ?? null,
    bio: raw.description,
  };
}

export function mapPublicChapter(raw: RawChapter): Chapter {
  return {
    id: toId(raw),
    chapterName: raw.chapter,
    churchName: raw.name,
    commander: raw.counsellor ?? "—",
    unit: "general",
    status: raw.status,
    image: raw.image ?? undefined,
  };
}

type RawNews = {
  _id?: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content?: string;
  image?: string | null;
  author?: string | null;
  read_time?: number;
  status: AdminNews["status"];
  createdAt?: string;
};

type RawEvent = {
  _id?: string;
  title: string;
  category: string;
  date: string;
  endDate?: string | null;
  venue: string;
  description: string;
  image?: string | null;
  status: AdminEvent["status"];
};

type RawGallery = {
  _id?: string;
  title: string;
  alt?: string;
  url: string;
  type: AdminGalleryItem["type"];
  category?: string;
  status: AdminGalleryItem["status"];
  sort_order?: number;
};

type RawAudit = {
  _id?: string;
  action: AdminAuditEntry["action"];
  entity_type: string;
  entity_id?: string | null;
  entity_title: string;
  actor_name?: string;
  detail?: string | null;
  createdAt?: unknown;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isPastEvent(
  date: string,
  status: AdminEvent["status"],
  endDate?: string | null,
) {
  if (status === "completed" || status === "cancelled") return true;
  const endTs = eventEndTimestamp(date, endDate);
  if (endTs == null) return false;
  return endTs < Date.now();
}

export function mapNews(raw: RawNews): AdminNews {
  return {
    id: toId(raw),
    title: raw.title,
    slug: raw.slug,
    category: raw.category,
    excerpt: raw.excerpt,
    content: raw.content ?? "",
    image: raw.image ?? null,
    author: raw.author ?? null,
    readTime: raw.read_time ?? 3,
    status: raw.status,
    date: formatDate(raw.createdAt),
  };
}

export function mapPublicNews(raw: RawNews): NewsItem {
  return {
    id: toId(raw),
    title: raw.title,
    category: raw.category,
    date: formatDate(raw.createdAt),
    excerpt: raw.excerpt,
    image: raw.image ?? undefined,
    readTime: raw.read_time ?? 3,
    author: raw.author ?? undefined,
    slug: raw.slug,
  };
}

export function mapPublicNewsDetail(raw: RawNews): NewsDetail {
  return {
    ...mapPublicNews(raw),
    content: raw.content ?? "",
  };
}

export function mapEvent(raw: RawEvent): AdminEvent {
  return {
    id: toId(raw),
    title: raw.title,
    category: raw.category,
    date: raw.date,
    endDate: raw.endDate ?? null,
    venue: raw.venue,
    description: raw.description,
    image: raw.image ?? null,
    status: raw.status,
    isPast: isPastEvent(raw.date, raw.status, raw.endDate),
  };
}

export function mapPublicEvent(raw: RawEvent): EventItem {
  const isPast = isPastEvent(raw.date, raw.status, raw.endDate);
  return {
    id: toId(raw),
    title: raw.title,
    category: raw.category,
    date: raw.date,
    endDate: raw.endDate ?? null,
    venue: raw.venue,
    description: raw.description,
    image: raw.image ?? undefined,
    status: raw.status,
    isPast,
  };
}

export function mapGallery(raw: RawGallery): AdminGalleryItem {
  return {
    id: toId(raw),
    title: raw.title,
    alt: raw.alt ?? raw.title,
    url: raw.url,
    type: raw.type,
    category: raw.category ?? "General",
    status: raw.status,
    sortOrder: raw.sort_order ?? 0,
  };
}

export function mapAudit(raw: RawAudit): AdminAuditEntry {
  const timestamp =
    raw.createdAt instanceof Date
      ? raw.createdAt.toISOString()
      : typeof raw.createdAt === "string"
        ? raw.createdAt
        : "";
  return {
    id: toId(raw),
    action: raw.action,
    entityType: raw.entity_type,
    entityId: raw.entity_id ?? null,
    entityTitle: raw.entity_title,
    actorName: raw.actor_name ?? "System",
    detail: raw.detail ?? null,
    timestamp,
  };
}

type RawMessage = {
  _id?: string;
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  is_read?: boolean;
  read_at?: string | Date | null;
  createdAt?: string | Date;
};

export function mapMessage(raw: RawMessage): AdminMessage {
  const createdAt =
    raw.createdAt instanceof Date
      ? raw.createdAt.toISOString()
      : typeof raw.createdAt === "string"
        ? raw.createdAt
        : "";
  const readAt =
    raw.read_at instanceof Date
      ? raw.read_at.toISOString()
      : typeof raw.read_at === "string"
        ? raw.read_at
        : null;

  return {
    id: toId(raw),
    firstName: raw.first_name,
    lastName: raw.last_name,
    fullName: `${raw.first_name} ${raw.last_name}`.trim(),
    email: raw.email,
    phone: raw.phone ?? null,
    subject: raw.subject,
    message: raw.message,
    isRead: Boolean(raw.is_read),
    readAt,
    createdAt,
  };
}

type RawBankDetails = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
};

type RawProgram = {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  category: string;
  description?: string | null;
  flyerImageUrl?: string | null;
  amount: number;
  bankDetails?: RawBankDetails;
  registrationMode: AdminProgram["registrationMode"];
  registrationDeadline?: string | Date | null;
  isActive?: boolean;
  termsAndConditions?: string | null;
  createdAt?: string | Date;
};

function toIsoDate(value?: string | Date | null): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toDateInput(value?: string | Date | null): string | null {
  if (!value) return null;
  const iso = toIsoDate(value);
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function mapProgram(raw: RawProgram): AdminProgram {
  return {
    id: toId(raw),
    title: raw.title,
    slug: raw.slug,
    category: raw.category,
    description: raw.description ?? null,
    flyerImageUrl: raw.flyerImageUrl ?? null,
    amount: Number(raw.amount ?? 0),
    bankDetails: {
      bankName: raw.bankDetails?.bankName ?? "",
      accountName: raw.bankDetails?.accountName ?? "",
      accountNumber: raw.bankDetails?.accountNumber ?? "",
    },
    registrationMode: raw.registrationMode,
    registrationDeadline: toDateInput(raw.registrationDeadline),
    isActive: raw.isActive !== false,
    termsAndConditions: raw.termsAndConditions ?? null,
    createdAt: toIsoDate(raw.createdAt),
  };
}

type RawRegistrationEntry = {
  name: string;
  rank?: { _id?: string; id?: string; name?: string } | string;
  church?: {
    _id?: string;
    id?: string;
    name?: string;
    chapter?: string;
  } | string;
};

type RawRegistration = {
  _id?: string;
  id?: string;
  programId?:
    | {
        _id?: string;
        id?: string;
        title?: string;
        slug?: string;
        category?: string;
        amount?: number;
        isActive?: boolean;
      }
    | string;
  registrantName: string;
  registrantPhone: string;
  proofOfPaymentUrl: string;
  registrationType: AdminRegistration["registrationType"];
  entries?: RawRegistrationEntry[];
  status: AdminRegistration["status"];
  adminNote?: string | null;
  createdAt?: string | Date;
};

function mapRegistrationEntry(raw: RawRegistrationEntry): AdminRegistrationEntry {
  const rank =
    typeof raw.rank === "object" && raw.rank !== null ? raw.rank : null;
  const church =
    typeof raw.church === "object" && raw.church !== null ? raw.church : null;

  return {
    name: raw.name,
    rankId:
      typeof raw.rank === "string"
        ? raw.rank
        : rank
          ? toId(rank)
          : "",
    rankName: rank?.name ?? "—",
    churchId:
      typeof raw.church === "string"
        ? raw.church
        : church
          ? toId(church)
          : "",
    churchName: church?.name ?? "—",
    churchChapter: church?.chapter,
  };
}

function mapRegistrationProgramRef(
  programId: RawRegistration["programId"],
): { programId: string; program: AdminRegistrationProgramRef | null } {
  if (!programId) return { programId: "", program: null };
  if (typeof programId === "string") {
    return { programId, program: null };
  }
  const id = toId(programId);
  return {
    programId: id,
    program: {
      id,
      title: programId.title ?? "—",
      slug: programId.slug ?? "",
      category: programId.category ?? "",
      amount: programId.amount,
      isActive: programId.isActive,
    },
  };
}

export function mapRegistration(raw: RawRegistration): AdminRegistration {
  const { programId, program } = mapRegistrationProgramRef(raw.programId);
  return {
    id: toId(raw),
    programId,
    program,
    registrantName: raw.registrantName,
    registrantPhone: raw.registrantPhone,
    proofOfPaymentUrl: raw.proofOfPaymentUrl,
    registrationType: raw.registrationType,
    entries: (raw.entries ?? []).map(mapRegistrationEntry),
    status: raw.status,
    adminNote: raw.adminNote ?? null,
    createdAt: toIsoDate(raw.createdAt),
  };
}

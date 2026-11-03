/**
 * Dues, levies, bills and payments (shared by the admin and chapter portals).
 */

export type BillStatus = "waived" | "paid" | "awaiting_verification" | "part_paid" | "overdue" | "unpaid";
export type PaymentStatus = "pending" | "verified" | "rejected";

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  waived: "Waived",
  paid: "Paid",
  awaiting_verification: "Awaiting verification",
  part_paid: "Part paid",
  overdue: "Overdue",
  unpaid: "Unpaid",
};

export const BILL_STATUS_CLASSES: Record<BillStatus, string> = {
  waived: "bg-slate-100 text-slate-700",
  paid: "bg-emerald-100 text-emerald-700",
  awaiting_verification: "bg-sky-100 text-sky-800",
  part_paid: "bg-amber-100 text-amber-800",
  overdue: "bg-rose-100 text-rose-700",
  unpaid: "bg-background text-text-dark",
};

export interface Payment {
  id: string;
  amount: number;
  paidOn: string;
  reference: string | null;
  proofUrl: string;
  status: PaymentStatus;
  reviewNote: string | null;
  receiptNumber: string | null;
  submittedBy: { name: string; role: string } | null;
  createdAt: string;
}

export interface Bill {
  id: string;
  due: { id: string; title: string; type: "due" | "levy"; period: string | null } | null;
  billTo: "chapter" | "church";
  church: { id: string; name: string } | null;
  chapter: { id: string; name: string } | null;
  memberCount: number | null;
  amountDue: number;
  amountPaid: number;
  balance: number;
  pendingAmount: number;
  dueDate: string;
  waived: boolean;
  adjustmentNote: string | null;
  status: BillStatus;
  payments: Payment[];
}

export interface Due {
  id: string;
  title: string;
  description: string | null;
  type: "due" | "levy";
  billTo: "chapter" | "church";
  chargeBasis: "flat" | "per_member";
  amount: number;
  period: string | null;
  dueDate: string;
  appliesTo: "all" | "selected";
  createdAt: string;
  summary?: { bills: number; expected: number; collected: number; outstanding: number; paidInFull: number; waived: number };
}

/** A payment in the verification queue, with the bill it belongs to. */
export interface QueuedPayment extends Payment {
  bill: Bill | null;
}

// ─── Mapping from raw API objects ──────────────────────────────────────────

type Ref = { _id?: string; name?: string; role?: string } | string | null | undefined;
const ref = (r: Ref) => (r && typeof r === "object" && r._id ? { id: r._id, name: r.name ?? "" } : null);

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapPayment(raw: any): Payment {
  return {
    id: raw._id,
    amount: raw.amount,
    paidOn: raw.paidOn,
    reference: raw.reference ?? null,
    proofUrl: raw.proofUrl,
    status: raw.status,
    reviewNote: raw.reviewNote ?? null,
    receiptNumber: raw.receiptNumber ?? null,
    submittedBy: raw.submittedBy && typeof raw.submittedBy === "object"
      ? { name: raw.submittedBy.name ?? "", role: raw.submittedBy.role ?? "" }
      : null,
    createdAt: raw.createdAt,
  };
}

export function mapBill(raw: any): Bill {
  const due = raw.due && typeof raw.due === "object" ? raw.due : null;
  return {
    id: raw._id,
    due: due ? { id: due._id, title: due.title, type: due.type, period: due.period ?? null } : null,
    billTo: raw.billTo,
    church: ref(raw.church),
    chapter: ref(raw.chapter),
    memberCount: raw.memberCount ?? null,
    amountDue: raw.amountDue,
    amountPaid: raw.amountPaid ?? 0,
    balance: raw.balance ?? Math.max(0, raw.amountDue - (raw.amountPaid ?? 0)),
    pendingAmount: raw.pendingAmount ?? 0,
    dueDate: raw.dueDate,
    waived: Boolean(raw.waived),
    adjustmentNote: raw.adjustmentNote ?? null,
    status: raw.status ?? "unpaid",
    payments: (raw.payments ?? []).map(mapPayment),
  };
}

export function mapDue(raw: any): Due {
  return {
    id: raw._id,
    title: raw.title,
    description: raw.description ?? null,
    type: raw.type,
    billTo: raw.billTo,
    chargeBasis: raw.chargeBasis,
    amount: raw.amount,
    period: raw.period ?? null,
    dueDate: raw.dueDate,
    appliesTo: raw.appliesTo,
    createdAt: raw.createdAt,
    summary: raw.summary,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** 15000 → "₦15,000" */
export const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

/** Where a bill goes: the chapter name, or the church name for church bills. */
export const billPlace = (bill: Bill) => (bill.billTo === "chapter" ? bill.chapter?.name : bill.church?.name) ?? "—";

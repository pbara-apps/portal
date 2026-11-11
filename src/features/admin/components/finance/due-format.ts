import { formatDate } from "@/features/chapter/lib/member-utils";
import { type Due, naira } from "@/types/finance";

/** "Due · 2026 · each chapter · ₦5,000 per member · due 31 Mar 2026" */
export function dueSummaryLine(due: Due) {
  return [
    due.type === "levy" ? "Levy" : "Due",
    due.period,
    `each ${due.billTo}`,
    due.chargeBasis === "flat" ? naira(due.amount) : `${naira(due.amount)} per member`,
    `due ${formatDate(due.dueDate)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

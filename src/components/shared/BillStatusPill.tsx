import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import { BILL_STATUS_LABELS, type BillStatus } from "@/types/finance";

const TONE: Record<BillStatus, StatusTone> = {
  paid: "success",
  awaiting_verification: "warning",
  part_paid: "warning",
  overdue: "danger",
  unpaid: "neutral",
  waived: "neutral",
};

export function BillStatusPill({ status }: { status: BillStatus }) {
  return <StatusPill tone={TONE[status]} label={BILL_STATUS_LABELS[status]} />;
}

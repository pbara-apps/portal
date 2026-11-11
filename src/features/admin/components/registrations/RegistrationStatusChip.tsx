import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import type { RegistrationStatus } from "@/types/admin";

const STATUS: Record<RegistrationStatus, { label: string; tone: StatusTone }> = {
  pending: { label: "Pending", tone: "warning" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function RegistrationStatusChip({ status }: { status: RegistrationStatus }) {
  return <StatusPill {...STATUS[status]} />;
}

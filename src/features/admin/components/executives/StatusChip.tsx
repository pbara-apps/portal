import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import type { ChapterStatus, ExecutiveStatus } from "@/types/admin";

const EXECUTIVE: Record<ExecutiveStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "danger" },
  completed: { label: "Completed", tone: "neutral" },
};

const CHAPTER: Record<ChapterStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
};

export function StatusChip({ status }: { status: ExecutiveStatus }) {
  return <StatusPill {...EXECUTIVE[status]} />;
}

export function ChapterStatusChip({ status }: { status: ChapterStatus }) {
  return <StatusPill {...CHAPTER[status]} />;
}

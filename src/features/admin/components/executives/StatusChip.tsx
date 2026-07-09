import type { ExecutiveStatus, ChapterStatus } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const executiveStatusMap: Record<ExecutiveStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 ring-emerald-200/60" },
  inactive: { label: "Inactive", className: "bg-rose-100 text-rose-700 ring-rose-200/60" },
  completed: {
    label: "Completed",
    className: "bg-text-dark/[0.06] text-text-muted ring-text-dark/[0.08]",
  },
};

const chapterStatusMap: Record<ChapterStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 ring-emerald-200/60" },
  inactive: { label: "Inactive", className: "bg-rose-100 text-rose-700 ring-rose-200/60" },
};

export function StatusChip({ status }: { status: ExecutiveStatus }) {
  const s = executiveStatusMap[status];
  return (
    <Badge className={cn("ring-1 px-2 text-[10px] font-bold uppercase tracking-[0.08em]", s.className)}>
      {s.label}
    </Badge>
  );
}

export function ChapterStatusChip({ status }: { status: ChapterStatus }) {
  const s = chapterStatusMap[status];
  return (
    <Badge className={cn("ring-1 px-2 text-[10px] font-bold uppercase tracking-[0.08em]", s.className)}>
      {s.label}
    </Badge>
  );
}

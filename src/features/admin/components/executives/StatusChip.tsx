import type { ChapterStatus, ExecutiveStatus } from "@/types/admin";
import { cn } from "@/lib/utils";

type Tone = "success" | "danger" | "neutral";

const TONE_CX: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  danger: "bg-danger/[0.08] text-danger",
  neutral: "bg-default text-muted",
};

const DOT_CX: Record<Tone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  neutral: "bg-muted/60",
};

/** Small status pill with a coloured dot (colour is never the only cue: the label is always shown). */
function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", TONE_CX[tone])}>
      <span className={cn("size-1.5 rounded-full", DOT_CX[tone])} aria-hidden />
      {label}
    </span>
  );
}

const EXECUTIVE: Record<ExecutiveStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "danger" },
  completed: { label: "Completed", tone: "neutral" },
};

const CHAPTER: Record<ChapterStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
};

export function StatusChip({ status }: { status: ExecutiveStatus }) {
  return <StatusPill {...EXECUTIVE[status]} />;
}

export function ChapterStatusChip({ status }: { status: ChapterStatus }) {
  return <StatusPill {...CHAPTER[status]} />;
}

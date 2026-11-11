import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

const TONE_CX: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/[0.08] text-danger",
  neutral: "bg-default text-muted",
};

const DOT_CX: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted/60",
};

/** Small status pill with a coloured dot. Colour is never the only cue: the label is always shown. */
export function StatusPill({ tone, label, className }: { tone: StatusTone; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        TONE_CX[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CX[tone])} aria-hidden />
      {label}
    </span>
  );
}

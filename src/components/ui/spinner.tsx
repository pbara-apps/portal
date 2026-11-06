import { Spinner as HeroSpinner } from "@heroui/react";
import { cn } from "@/lib/utils";

/** Centered loading indicator with an optional caption. */
export function Spinner({ className, label = "Loading…" }: { className?: string; label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3">
      <HeroSpinner size="lg" className={cn(className)} aria-label={label || "Loading"} />
      {label ? <p className="text-sm text-muted">{label}</p> : null}
    </div>
  );
}

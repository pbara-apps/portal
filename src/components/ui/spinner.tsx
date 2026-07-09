import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, label = "Loading…" }: { className?: string; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={cn("h-8 w-8 animate-spin text-primary", className)} />
      {label ? <p className="text-sm text-text-muted">{label}</p> : null}
    </div>
  );
}

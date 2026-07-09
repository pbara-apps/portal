import { cn } from "@/lib/utils";
import { LuTrash2 } from "react-icons/lu";

interface BulkActionBarProps {
  count: number;
  entityLabel: string;
  onClear: () => void;
  onDelete: () => void;
  deleting?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export function BulkActionBar({
  count,
  entityLabel,
  onClear,
  onDelete,
  deleting = false,
  disabled = false,
  disabledReason = "You are not allowed to delete records.",
}: BulkActionBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-30 transition-all duration-300 ease-out sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2",
        count > 0 ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
      role="region"
      aria-label="Bulk actions"
      aria-hidden={count === 0}
    >
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-primary px-4 py-3 text-sm text-white shadow-2xl ring-1 ring-white/10 sm:gap-5 sm:rounded-full sm:px-5 sm:py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-primary">
            {count}
          </span>
          <span className="font-semibold">
            {count === 1 ? entityLabel : `${entityLabel}s`} selected
          </span>
        </div>
        <span className="hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
        <button
          type="button"
          disabled={deleting || disabled}
          onClick={onDelete}
          title={disabled ? disabledReason : undefined}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-200 transition-colors hover:text-white disabled:opacity-60"
        >
          <LuTrash2 size={14} />
          {deleting ? "Deleting…" : "Delete"}
        </button>
        <span className="hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-white/70 transition-colors hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

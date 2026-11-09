import type { ReactNode } from "react";
import { LuTrash2, LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  count: number;
  /** Singular noun, e.g. "Office". */
  entityLabel: string;
  /** Plural when adding "s" is wrong, e.g. "Churches". */
  entityPlural?: string;
  onClear: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  /** Other bulk actions shown before Delete. */
  actions?: ReactNode;
}

/** Floating bar shown while table rows are selected. */
export function BulkActionBar({
  count,
  entityLabel,
  entityPlural = `${entityLabel}s`,
  onClear,
  onDelete,
  deleting = false,
  disabled = false,
  disabledReason = "You are not allowed to delete records.",
  actions,
}: BulkActionBarProps) {
  const visible = count > 0;
  const noun = (count === 1 ? entityLabel : entityPlural).toLowerCase();

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      // While hidden, the buttons must not be reachable by keyboard.
      inert={!visible}
      className={cn(
        "fixed inset-x-4 bottom-4 z-30 transition-[opacity,transform] duration-200 ease-brand motion-reduce:transition-none",
        "sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 lg:left-[calc(50%+var(--shell-offset,0px)/2)]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <div className="flex items-center gap-1 whitespace-nowrap rounded-xl bg-sidebar p-1.5 pl-3 text-sm text-white shadow-[var(--overlay-shadow)] ring-1 ring-white/10">
        <p className="flex min-w-0 flex-1 items-center gap-2 pr-2 sm:flex-none" aria-live="polite">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-gold px-1.5 text-xs font-bold tabular-nums text-primary">
            {count}
          </span>
          <span className="truncate font-medium">{noun} selected</span>
        </p>
        {actions}
        {onDelete ? (
          <button
            type="button"
            disabled={deleting || disabled}
            onClick={onDelete}
            title={disabled ? disabledReason : undefined}
            className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-[#ffb4b4] outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60 disabled:pointer-events-none disabled:opacity-50"
          >
            <LuTrash2 size={15} aria-hidden />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="flex size-9 items-center justify-center rounded-lg text-white/60 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <LuX size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}

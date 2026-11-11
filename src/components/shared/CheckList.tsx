import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldMessage } from "@/components/ui/field-message";
import { cn } from "@/lib/utils";

export interface CheckListItem {
  id: string;
  label: ReactNode;
  /** Muted text after the label, e.g. the church a chapter belongs to. */
  hint?: ReactNode;
}

interface CheckListProps {
  "aria-label": string;
  items: CheckListItem[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  error?: string;
}

/** Scrollable list of checkboxes for picking recipients or targets in a form. */
export function CheckList({ items, selected, onChange, error, ...props }: CheckListProps) {
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span className="tabular-nums">
          {selected.size} of {items.length} selected
        </span>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange(allSelected ? new Set() : new Set(items.map((i) => i.id)))}
            className="rounded font-medium text-focus outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        ) : null}
      </div>
      <ul
        aria-label={props["aria-label"]}
        className={cn(
          "max-h-64 divide-y divide-separator overflow-y-auto rounded-xl border",
          error ? "border-danger" : "border-border",
        )}
      >
        {items.map((item) => (
          <li key={item.id} className="px-3 py-2.5 hover:bg-surface-secondary">
            <Checkbox
              checked={selected.has(item.id)}
              onCheckedChange={() => toggle(item.id)}
              label={
                <>
                  {item.label}
                  {item.hint ? <span className="ml-1.5 text-xs text-muted">{item.hint}</span> : null}
                </>
              }
            />
          </li>
        ))}
      </ul>
      <FieldMessage message={error} />
    </div>
  );
}

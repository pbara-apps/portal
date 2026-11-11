import { Skeleton } from "@heroui/react";
import type { ReactNode } from "react";
import { LuRefreshCw } from "react-icons/lu";
import type { DataTablePagination } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";

interface ContentGridProps<T> {
  "aria-label": string;
  /** Items for the current page. */
  items: T[];
  getId: (item: T) => string;
  /** Spread `select` onto the ContentCard; it is undefined when there is no selection. */
  renderCard: (item: T, select?: CardSelection) => ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyState: ReactNode;
  /** e.g. "12 articles". */
  summary?: ReactNode;
  pagination?: DataTablePagination;
  /** Adds a "Select page" checkbox. Omit for read-only users. */
  selection?: { selectedIds: ReadonlySet<string>; onChange: (ids: Set<string>) => void };
}

export interface CardSelection {
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
}

const frame = "rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]";

/** Card grid with the same loading, error, empty and paging states as DataTable. */
export function ContentGrid<T>({
  items,
  getId,
  renderCard,
  isLoading,
  isError,
  errorMessage = "We couldn't load this list.",
  onRetry,
  emptyState,
  summary,
  pagination,
  selection,
  ...props
}: ContentGridProps<T>) {
  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label={`Loading ${props["aria-label"]}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`${frame} overflow-hidden`}>
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-2.5 p-4">
              <Skeleton className="h-3 w-1/3 rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="mt-4 h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={frame}>
        <EmptyState
          tone="danger"
          title={errorMessage}
          description="Check your connection and try again."
          action={
            onRetry ? (
              <Button type="button" variant="outline" onClick={onRetry}>
                <LuRefreshCw size={15} aria-hidden />
                Try again
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (items.length === 0) return <div className={frame}>{emptyState}</div>;

  const pageIds = items.map(getId);
  const pageSelected = selection ? pageIds.filter((id) => selection.selectedIds.has(id)).length : 0;
  const togglePage = (checked: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    for (const id of pageIds) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    selection.onChange(next);
  };
  const selectionFor = (id: string): CardSelection => ({
    selected: selection?.selectedIds.has(id) ?? false,
    onSelectedChange: (checked) => {
      if (!selection) return;
      const next = new Set(selection.selectedIds);
      if (checked) next.add(id);
      else next.delete(id);
      selection.onChange(next);
    },
  });
  const showPagination = !!pagination && pagination.totalPages > 1;

  return (
    <div className="space-y-4">
      {selection || summary != null ? (
        <div className="flex min-h-6 items-center justify-between gap-3 text-xs text-muted">
          {selection ? (
            <Checkbox
              label="Select page"
              checked={pageSelected === 0 ? false : pageSelected === pageIds.length ? true : "indeterminate"}
              onCheckedChange={togglePage}
            />
          ) : (
            <span />
          )}
          <span className="tabular-nums">{summary}</span>
        </div>
      ) : null}
      <ul aria-label={props["aria-label"]} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={getId(item)} className="min-w-0">
            {renderCard(item, selection ? selectionFor(getId(item)) : undefined)}
          </li>
        ))}
      </ul>
      {showPagination ? (
        <div className="flex justify-center pt-1">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={pagination.onPageChange} />
        </div>
      ) : null}
    </div>
  );
}

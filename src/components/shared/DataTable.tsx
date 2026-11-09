import { Checkbox as HeroCheckbox, Skeleton, Table } from "@heroui/react";
import { useMemo, type ReactNode } from "react";
import { LuCircleAlert } from "react-icons/lu";
import type { Selection, SortDescriptor } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { MEDIA, useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "start" | "end";
  /** Hide the column on narrower screens to keep the table readable. */
  hideBelow?: "md" | "lg" | "xl";
  /** The column that names the row for screen readers. Defaults to the first column. */
  isRowHeader?: boolean;
  /** Applied to the header and every cell, e.g. a width. */
  className?: string;
}

export interface TableSort {
  column: string;
  direction: "ascending" | "descending";
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  "aria-label": string;
  columns: DataTableColumn<T>[];
  /** Rows for the current page. */
  rows: T[];
  getRowId: (row: T) => string;
  /** Used to label selection checkboxes in the mobile layout. */
  getRowLabel?: (row: T) => string;

  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyState?: ReactNode;

  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;

  /** Selection survives paging: ids from other pages are kept. */
  selectedIds?: ReadonlySet<string>;
  onSelectionChange?: (ids: Set<string>) => void;

  /** Row click / Enter. Usually opens the record's drawer. */
  onRowAction?: (row: T) => void;
  /** Trailing per-row menu, usually <RowActions>. */
  rowActions?: (row: T) => ReactNode;
  /** Compact card shown instead of the table on phones. Without it the table scrolls sideways. */
  renderCard?: (row: T) => ReactNode;

  /** Left side of the footer, e.g. "24 offices". */
  summary?: ReactNode;
  pagination?: DataTablePagination;
  /** Table min width in px before it scrolls horizontally. */
  minWidth?: number;
  skeletonRows?: number;
  className?: string;
}

const HIDE_CX = { md: "max-md:hidden", lg: "max-lg:hidden", xl: "max-xl:hidden" } as const;

/**
 * Standard record table on HeroUI's Table (React Aria grid): keyboard
 * navigation, sortable headers, row selection and row actions built in.
 * Data fetching, filtering and paging stay with the page (see useClientTable).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  getRowLabel,
  isLoading,
  isError,
  errorMessage = "We couldn't load this list.",
  onRetry,
  emptyState,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  onRowAction,
  rowActions,
  renderCard,
  summary,
  pagination,
  minWidth = 720,
  skeletonRows = 6,
  className,
  ...aria
}: DataTableProps<T>) {
  const isDesktop = useMediaQuery(MEDIA.md);
  const useCards = !!renderCard && !isDesktop;
  const selectable = !!onSelectionChange;

  const pageIds = useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const rowsById = useMemo(() => new Map(rows.map((r) => [getRowId(r), r])), [rows, getRowId]);
  const selectedOnPage = useMemo(
    () => new Set(pageIds.filter((id) => selectedIds?.has(id))),
    [pageIds, selectedIds],
  );

  /** Replace this page's part of the selection, keeping other pages' picks. */
  const applyPageSelection = (picked: Iterable<string>) => {
    const next = new Set(selectedIds);
    pageIds.forEach((id) => next.delete(id));
    for (const id of picked) next.add(id);
    onSelectionChange?.(next);
  };

  const rowHeaderId = columns.find((c) => c.isRowHeader)?.id ?? columns[0]?.id;
  const showPagination = !!pagination && pagination.totalPages > 1;
  const showFooter = !isLoading && !isError && (summary != null || showPagination);

  let content: ReactNode;
  if (isLoading) {
    content = useCards ? <CardSkeleton rows={skeletonRows} /> : <TableSkeleton rows={skeletonRows} columns={columns.length} />;
  } else if (isError) {
    content = (
      <EmptyState
        icon={LuCircleAlert}
        tone="danger"
        title="Something went wrong"
        description={errorMessage}
        action={
          onRetry ? (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          ) : null
        }
      />
    );
  } else if (useCards) {
    content =
      rows.length === 0 ? (
        (emptyState ?? <EmptyState title="Nothing here yet" />)
      ) : (
        <>
          {selectable ? (
            <div className="flex items-center gap-3 border-b border-separator bg-surface-secondary px-4 py-2.5">
              <Checkbox
                checked={
                  selectedOnPage.size === 0 ? false : selectedOnPage.size === pageIds.length ? true : "indeterminate"
                }
                onCheckedChange={(on) => applyPageSelection(on ? pageIds : [])}
                aria-label="Select all on this page"
              />
              <span className="text-xs font-medium text-muted">
                {selectedOnPage.size > 0 ? `${selectedOnPage.size} selected` : "Select all"}
              </span>
            </div>
          ) : null}
          <ul className="divide-y divide-separator">
            {rows.map((row) => {
              const id = getRowId(row);
              const selected = selectedOnPage.has(id);
              return (
                <li key={id} className={cn("flex items-start gap-3 px-4 py-3.5", selected && "bg-primary/[0.03]")}>
                  {selectable ? (
                    <Checkbox
                      className="mt-0.5"
                      checked={selected}
                      onCheckedChange={(on) =>
                        applyPageSelection(on ? [...selectedOnPage, id] : [...selectedOnPage].filter((x) => x !== id))
                      }
                      aria-label={`Select ${getRowLabel?.(row) ?? "row"}`}
                    />
                  ) : null}
                  {onRowAction ? (
                    <button
                      type="button"
                      onClick={() => onRowAction(row)}
                      className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {renderCard!(row)}
                    </button>
                  ) : (
                    <div className="min-w-0 flex-1">{renderCard!(row)}</div>
                  )}
                  {rowActions ? <div className="-mt-0.5 shrink-0">{rowActions(row)}</div> : null}
                </li>
              );
            })}
          </ul>
        </>
      );
  } else {
    content = (
      <Table variant="secondary" className="data-table">
        <Table.ScrollContainer>
          <Table.Content
            {...aria}
            style={{ minWidth }}
            sortDescriptor={sort as SortDescriptor | undefined}
            onSortChange={
              onSortChange
                ? (d) => onSortChange({ column: String(d.column), direction: d.direction })
                : undefined
            }
            selectionMode={selectable ? "multiple" : "none"}
            selectedKeys={selectable ? selectedOnPage : undefined}
            onSelectionChange={
              selectable
                ? (keys: Selection) => applyPageSelection(keys === "all" ? pageIds : [...keys].map(String))
                : undefined
            }
            onRowAction={
              onRowAction
                ? (key) => {
                    const row = rowsById.get(String(key));
                    if (row) onRowAction(row);
                  }
                : undefined
            }
          >
            <Table.Header>
              {selectable ? (
                <Table.Column className="w-12 pe-0">
                  <SelectionCheckbox />
                </Table.Column>
              ) : null}
              {columns.map((col) => (
                <Table.Column
                  key={col.id}
                  id={col.id}
                  allowsSorting={!!col.sortable && !!onSortChange}
                  isRowHeader={col.id === rowHeaderId}
                  className={cn(col.align === "end" && "text-end", col.hideBelow && HIDE_CX[col.hideBelow], col.className)}
                >
                  {({ sortDirection, allowsSorting }) =>
                    allowsSorting ? (
                      <Table.SortableColumnHeader
                        sortDirection={sortDirection}
                        className={cn("gap-1.5", col.align === "end" ? "justify-end" : "justify-start")}
                      >
                        {col.header}
                      </Table.SortableColumnHeader>
                    ) : (
                      col.header
                    )
                  }
                </Table.Column>
              ))}
              {rowActions ? (
                <Table.Column className="w-px whitespace-nowrap">
                  <span className="sr-only">Actions</span>
                </Table.Column>
              ) : null}
            </Table.Header>
            <Table.Body renderEmptyState={() => emptyState ?? <EmptyState title="Nothing here yet" />}>
              {rows.map((row) => (
                <Table.Row key={getRowId(row)} id={getRowId(row)} className={cn(onRowAction && "cursor-pointer")}>
                  {selectable ? (
                    <Table.Cell className="pe-0">
                      <SelectionCheckbox />
                    </Table.Cell>
                  ) : null}
                  {columns.map((col) => (
                    <Table.Cell
                      key={col.id}
                      className={cn(
                        col.align === "end" && "text-end",
                        col.hideBelow && HIDE_CX[col.hideBelow],
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </Table.Cell>
                  ))}
                  {rowActions ? (
                    <Table.Cell className="whitespace-nowrap py-0 text-end">{rowActions(row)}</Table.Cell>
                  ) : null}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );
  }

  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]",
        className,
      )}
      aria-busy={isLoading || undefined}
    >
      {content}
      {showFooter ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-separator px-4 py-3 sm:flex-row">
          <div className="text-xs text-muted tabular-nums">{summary}</div>
          {showPagination ? (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={pagination.onPageChange} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** Wired to the row (or select-all in the header) by React Aria through the "selection" slot. */
function SelectionCheckbox() {
  return (
    <HeroCheckbox slot="selection">
      <HeroCheckbox.Content>
        <HeroCheckbox.Control>
          <HeroCheckbox.Indicator />
        </HeroCheckbox.Control>
      </HeroCheckbox.Content>
    </HeroCheckbox>
  );
}

const SKELETON_WIDTHS = ["w-2/3", "w-1/2", "w-3/4", "w-2/5", "w-1/3"];

function TableSkeleton({ rows, columns }: { rows: number; columns: number }) {
  const cols = Math.min(Math.max(columns, 2), 5);
  return (
    <div role="status" aria-label="Loading">
      <div className="flex h-10 items-center gap-6 border-b border-separator bg-surface-secondary px-4">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-2.5 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex h-14 items-center gap-6 border-b border-separator/60 px-4 last:border-b-0">
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className="flex-1">
              <Skeleton className={cn("h-3 rounded", SKELETON_WIDTHS[(r + c) % SKELETON_WIDTHS.length])} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ rows }: { rows: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-separator">
      {Array.from({ length: Math.min(rows, 5) }, (_, i) => (
        <div key={i} className="space-y-2 px-4 py-4">
          <Skeleton className="h-3.5 w-1/2 rounded" />
          <Skeleton className="h-3 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
}

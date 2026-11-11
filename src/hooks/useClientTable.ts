import { useMemo, useState } from "react";
import type { TableSort } from "@/components/shared/DataTable";

type SortValue = string | number | null | undefined;

interface ClientTableOptions<T> {
  /** All records already fetched (and pre-filtered by any page-level filters). */
  rows: T[];
  pageSize?: number;
  /** Text the search box matches against, e.g. `${r.name} ${r.email}`. */
  searchText?: (row: T) => string;
  /** Value to sort a column by. Return a timestamp for dates. */
  sortValue?: (row: T, column: string) => SortValue;
  initialSort?: TableSort;
  /** Change this (e.g. a JSON of filter values) to jump back to page 1. */
  resetKey?: string;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function compare(a: SortValue, b: SortValue): number {
  if (a == null || a === "") return b == null || b === "" ? 0 : 1;
  if (b == null || b === "") return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

/**
 * Search, sort, paging and selection for lists the API returns in full.
 * Pair with <DataTable> and <TableToolbar>.
 */
export function useClientTable<T>({
  rows,
  pageSize = 15,
  searchText,
  sortValue,
  initialSort,
  resetKey = "",
}: ClientTableOptions<T>) {
  const [query, setQueryState] = useState("");
  const [sort, setSortState] = useState<TableSort | undefined>(initialSort);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  // Filters changed: start from the first page again.
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows;
    if (!sort || !sortValue) return matched;
    const dir = sort.direction === "ascending" ? 1 : -1;
    return [...matched].sort((a, b) => compare(sortValue(a, sort.column), sortValue(b, sort.column)) * dir);
  }, [rows, query, searchText, sort, sortValue]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  // Deleting the last rows of a page shouldn't leave the user on an empty page.
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    query,
    setQuery: (value: string) => {
      setQueryState(value);
      setPage(1);
    },
    sort,
    setSort: (next: TableSort) => {
      setSortState(next);
      setPage(1);
    },
    page: currentPage,
    setPage,
    totalPages,
    pageRows,
    filteredRows,
    total: filteredRows.length,
    selectedIds,
    setSelectedIds,
    clearSelection: () => setSelectedIds(new Set()),
  };
}

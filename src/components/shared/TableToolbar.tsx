import { SearchField } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    "aria-label"?: string;
  };
  /** Filter controls (selects, tabs), placed after the search box. */
  filters?: ReactNode;
  /** Right-aligned secondary actions, such as export. */
  actions?: ReactNode;
  className?: string;
}

/** Search, filters and list actions that sit directly above a DataTable. */
export function TableToolbar({ search, filters, actions, className }: TableToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {search ? (
        <SearchField
          value={search.value}
          onChange={search.onChange}
          aria-label={search["aria-label"] ?? search.placeholder ?? "Search"}
          className="w-full sm:w-72 lg:w-80"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder={search.placeholder ?? "Search…"} />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      ) : null}
      {filters ? (
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center [&>*]:min-w-0 sm:[&>*]:w-44">
          {filters}
        </div>
      ) : null}
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{actions}</div> : null}
    </div>
  );
}

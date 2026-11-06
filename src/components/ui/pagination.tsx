import { Pagination as HeroPagination } from "@heroui/react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

const FULL_ONLY = "hidden sm:inline-flex";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Page numbers to show: first, last, and the current page's neighbours. */
function visiblePages(page: number, totalPages: number) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  if (totalPages <= 7) return pages;
  return pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
}

/** Page controls on HeroUI's Pagination. Hidden when there's a single page. */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const visible = visiblePages(page, totalPages);

  return (
    <HeroPagination size="sm" className={cn("w-auto", className)}>
      <HeroPagination.Content>
        <HeroPagination.Item>
          <HeroPagination.Previous isDisabled={page <= 1} onPress={() => onPageChange(page - 1)}>
            <HeroPagination.PreviousIcon />
            <span className="sr-only sm:not-sr-only">Prev</span>
          </HeroPagination.Previous>
        </HeroPagination.Item>

        {/* Compact indicator on small screens; full page list from sm up. */}
        <HeroPagination.Item className="px-2 text-xs font-medium text-muted tabular-nums sm:hidden">
          {page} / {totalPages}
        </HeroPagination.Item>

        {visible.map((p, idx) => (
          <Fragment key={p}>
            {idx > 0 && p - visible[idx - 1] > 1 ? (
              <HeroPagination.Item className={FULL_ONLY}>
                <HeroPagination.Ellipsis />
              </HeroPagination.Item>
            ) : null}
            <HeroPagination.Item className={FULL_ONLY}>
              <HeroPagination.Link
                isActive={p === page}
                aria-current={p === page ? "page" : undefined}
                onPress={() => onPageChange(p)}
                className="tabular-nums"
              >
                {p}
              </HeroPagination.Link>
            </HeroPagination.Item>
          </Fragment>
        ))}

        <HeroPagination.Item>
          <HeroPagination.Next isDisabled={page >= totalPages} onPress={() => onPageChange(page + 1)}>
            <span className="sr-only sm:not-sr-only">Next</span>
            <HeroPagination.NextIcon />
          </HeroPagination.Next>
        </HeroPagination.Item>
      </HeroPagination.Content>
    </HeroPagination>
  );
}

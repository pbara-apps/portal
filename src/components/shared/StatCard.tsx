import { Skeleton } from "@heroui/react";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuArrowUpRight } from "react-icons/lu";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type StatTone = "default" | "gold" | "success" | "warning" | "danger";

const TONE_CX: Record<StatTone, string> = {
  default: "bg-primary/[0.06] text-primary",
  gold: "bg-gold/15 text-[#8a6d12]",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: IconType;
  /** One line of context under the value, e.g. "12 awaiting approval". */
  description?: ReactNode;
  tone?: StatTone;
  /** Makes the whole card a link to the related page. */
  to?: string;
  loading?: boolean;
  className?: string;
}

/** A single headline number. Only show values the API actually returns. */
export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  tone = "default",
  to,
  loading,
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {Icon ? (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", TONE_CX[tone])}>
            <Icon size={16} aria-hidden />
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          {description !== undefined ? <Skeleton className="h-3.5 w-32 rounded" /> : null}
        </div>
      ) : (
        <>
          <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {description ? <p className="mt-2 text-xs text-muted">{description}</p> : null}
        </>
      )}
      {to ? (
        <LuArrowUpRight
          size={16}
          aria-hidden
          className="absolute bottom-4 right-4 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      ) : null}
    </>
  );

  const cx = cn(
    "group relative flex min-h-[7.5rem] flex-col rounded-xl border border-border bg-surface p-4 shadow-[var(--surface-shadow)] sm:p-5",
    to &&
      "outline-none transition-[border-color,box-shadow] duration-150 hover:border-primary/20 hover:shadow-[var(--overlay-shadow)] focus-visible:ring-2 focus-visible:ring-focus",
    className,
  );

  return to ? (
    <Link to={to} className={cx}>
      {body}
    </Link>
  ) : (
    <div className={cx}>{body}</div>
  );
}

import type { ReactNode } from "react";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionDisabledText?: string;
  stats?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionDisabledText = "You are not allowed to perform this operation.",
  stats,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
        {stats ? <div className="mt-3 flex flex-wrap gap-2">{stats}</div> : null}
      </div>
      {actionLabel && onAction ? (
        <Button
          onClick={onAction}
          disabled={actionDisabled}
          title={actionDisabled ? actionDisabledText : undefined}
          className="w-full sm:w-auto"
        >
          <LuPlus size={18} />
          {actionLabel}
        </Button>
      ) : null}
    </header>
  );
}

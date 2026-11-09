import type { ReactNode } from "react";
import { LuPlus } from "react-icons/lu";
import { PageHeader } from "@/components/shared/PageHeader";
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

/**
 * Admin page title with an optional "Add" action.
 * A shortcut over <PageHeader> for the common single-action case.
 */
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
    <PageHeader
      title={title}
      description={description}
      meta={stats}
      actions={
        actionLabel && onAction ? (
          <Button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            title={actionDisabled ? actionDisabledText : undefined}
          >
            <LuPlus size={16} />
            {actionLabel}
          </Button>
        ) : null
      }
    />
  );
}

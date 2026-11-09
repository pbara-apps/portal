import { Fragment } from "react";
import type { IconType } from "react-icons";
import { LuEllipsis } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Colour of an inline action button. Pick by meaning:
 * neutral = view/open, accent = edit, success = approve/confirm,
 * warning = suspend/reset, danger = delete/remove.
 */
export type RowActionTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface RowAction {
  label: string;
  icon: IconType;
  onAction: () => void;
  tone?: RowActionTone;
  /** Shorthand for tone "danger". Danger actions are listed last. */
  danger?: boolean;
  disabled?: boolean;
}

interface RowActionsProps {
  /** Falsy entries are skipped, so actions can be listed conditionally. */
  actions: (RowAction | false | null | undefined)[];
  /** Accessible name for the "⋯" menu, e.g. "Actions for Jane Doe". */
  label?: string;
}

/** Up to this many actions show as icon buttons; more collapse into a menu. */
const MAX_INLINE = 3;

const TONE_CX: Record<RowActionTone, string> = {
  neutral: "bg-default text-foreground/70 hover:bg-foreground/10 hover:text-foreground",
  accent: "bg-focus/[0.08] text-focus hover:bg-focus/[0.14]",
  success: "bg-success/10 text-success hover:bg-success/[0.16]",
  warning: "bg-warning/10 text-warning hover:bg-warning/[0.16]",
  danger: "bg-danger/[0.08] text-danger hover:bg-danger/[0.14]",
};

const toneOf = (a: RowAction): RowActionTone => (a.danger ? "danger" : (a.tone ?? "neutral"));

/** Actions at the end of a table row or mobile card. */
export function RowActions({ actions, label = "Row actions" }: RowActionsProps) {
  const items = actions.filter((a): a is RowAction => !!a);
  if (items.length === 0) return null;

  if (items.length <= MAX_INLINE) {
    return (
      <div className="inline-flex items-center gap-1.5">
        {items.map((action) => {
          const Icon = action.icon;
          return (
            <Tooltip key={action.label} content={action.label}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={action.label}
                onClick={action.onAction}
                disabled={action.disabled}
                className={cn(
                  "size-8 min-w-8 rounded-lg transition-colors pointer-coarse:size-10",
                  TONE_CX[toneOf(action)],
                )}
              >
                <Icon size={15} aria-hidden />
              </Button>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  const firstDanger = items.findIndex((a) => toneOf(a) === "danger");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} className="size-8 text-muted">
          <LuEllipsis size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((action, i) => {
          const { label: itemLabel, icon: Icon, onAction, disabled } = action;
          const danger = toneOf(action) === "danger";
          return (
            <Fragment key={itemLabel}>
              {i === firstDanger && i > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                onClick={onAction}
                disabled={disabled}
                variant={danger ? "danger" : "default"}
                textValue={itemLabel}
              >
                <Icon aria-hidden />
                {itemLabel}
              </DropdownMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

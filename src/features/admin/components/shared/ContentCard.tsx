import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { RowActions, type RowAction } from "@/components/shared/RowActions";
import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  title: string;
  /** Short text under the title, e.g. an excerpt. Clamped to two lines. */
  description?: ReactNode;
  /** One line above the title, e.g. a date or venue. */
  eyebrow?: ReactNode;
  image?: string | null;
  /** Shown when there is no image. */
  fallbackIcon: IconType;
  /** Small label over the image, e.g. the category. */
  tag?: ReactNode;
  status: { label: string; tone: StatusTone };
  /** Clicking the card (title or image) opens the record. Omit for read-only users. */
  onOpen?: () => void;
  /** Omit for read-only users: the checkbox is then hidden. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  actions?: (RowAction | false | null | undefined)[];
}

/**
 * Image card for website content (news, events, gallery). The title button
 * stretches over the whole card, so the card is one click target; the
 * checkbox and action buttons sit above it.
 */
export function ContentCard({
  title,
  description,
  eyebrow,
  image,
  fallbackIcon: FallbackIcon,
  tag,
  status,
  onOpen,
  selected = false,
  onSelectedChange,
  actions = [],
}: ContentCardProps) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-surface shadow-[var(--surface-shadow)]",
        "transition-[box-shadow,border-color,transform] duration-200 ease-brand motion-reduce:transition-none",
        selected ? "border-focus ring-2 ring-focus/25" : "border-border",
        onOpen && !selected && "hover:-translate-y-0.5 hover:shadow-[var(--overlay-shadow)] motion-reduce:hover:translate-y-0",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-secondary">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-brand group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--color-focus)_10%,transparent),transparent_60%)] text-muted/70">
            <FallbackIcon size={30} aria-hidden />
          </div>
        )}
        {tag ? (
          <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-md bg-sidebar/75 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {tag}
          </span>
        ) : null}
        {onSelectedChange ? (
          <div className="absolute left-3 top-3 z-10 rounded-md bg-surface/90 p-1 shadow-sm backdrop-blur-sm">
            <Checkbox checked={selected} onCheckedChange={onSelectedChange} aria-label={`Select ${title}`} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="mb-1 truncate text-xs text-muted">{eyebrow}</p> : null}
          <h3 className="font-semibold leading-snug text-foreground">
            {onOpen ? (
              <button
                type="button"
                onClick={onOpen}
                className="line-clamp-2 text-left outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-focus"
              >
                {title}
              </button>
            ) : (
              <span className="line-clamp-2">{title}</span>
            )}
          </h3>
          {description ? <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p> : null}
        </div>
        <div className="flex min-h-8 items-center justify-between gap-2">
          <StatusPill {...status} />
          <div className="relative z-10">
            <RowActions actions={actions} label={`Actions for ${title}`} />
          </div>
        </div>
      </div>
    </article>
  );
}

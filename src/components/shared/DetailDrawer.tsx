import type { ReactNode } from "react";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  type SheetSize,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DetailDrawerContentProps {
  title: ReactNode;
  description?: ReactNode;
  /** Avatar, logo or icon shown beside the title. */
  media?: ReactNode;
  /** Status chips under the title. */
  badges?: ReactNode;
  children: ReactNode;
  /** Pinned actions, e.g. Edit / Approve. */
  footer?: ReactNode;
}

/** Read-only record view. Use inside the admin GlobalDrawer, or through <DetailDrawer>. */
export function DetailDrawerContent({ title, description, media, badges, children, footer }: DetailDrawerContentProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SheetHeader className="flex-row items-start gap-4">
        {media ? <div className="shrink-0">{media}</div> : null}
        <div className="min-w-0 flex-1 space-y-1.5">
          <SheetTitle className="break-words">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
          {badges ? <div className="flex flex-wrap gap-1.5 pt-1">{badges}</div> : null}
        </div>
      </SheetHeader>
      <SheetBody className="space-y-8">{children}</SheetBody>
      {footer ? <SheetFooter>{footer}</SheetFooter> : null}
    </div>
  );
}

interface DetailDrawerProps extends DetailDrawerContentProps {
  open: boolean;
  onClose: () => void;
  size?: SheetSize;
}

/** Self-contained detail drawer, controlled by the page. */
export function DetailDrawer({ open, onClose, size = "md", ...props }: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent size={size}>
        <DetailDrawerContent {...props} />
      </SheetContent>
    </Sheet>
  );
}

/** A titled group of fields inside a detail drawer. */
export function DetailSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Label/value grid. Two columns from the small breakpoint up. */
export function DetailList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn("grid gap-x-6 gap-y-4 sm:grid-cols-2", className)}>{children}</dl>;
}

export function DetailItem({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  /** Span both columns (long text, addresses). */
  wide?: boolean;
}) {
  const empty = children == null || children === "";
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className={cn("mt-1 break-words text-sm", empty ? "text-muted" : "text-foreground")}>
        {empty ? "—" : children}
      </dd>
    </div>
  );
}
